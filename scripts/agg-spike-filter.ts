/**
 * Aggregate acceptance metric for flattenPitchSpikes across a folder of CSVs.
 *
 *   npm run agg:spikes <folder>
 *
 * Reports, across the corpus:
 *   - residual: files still showing a frame-to-frame jump >= JUMP_ST after filtering
 *   - regressed: clean files (before < CLEAN_ST) that got a >= CLEAN_ST jump after
 *   - improved: files whose max jump dropped meaningfully
 *   - maxChangedPct: largest % of voiced points changed in any file (overcorrection canary)
 *
 * Goal: drive `residual` down without any `regressed`.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import type { PitchSample, VoiceRange } from "~/types";
import { parseSamplesCSV } from "~/journal/csv";
import {
  flattenPitchSpikes,
  type SpikeFilterOptions,
} from "~/audio/flattenPitchSpikes";

// Optional option overrides for sweeps: AGG_OPTS='{"rawAnchorMinCount":3}'
const OPTS: SpikeFilterOptions = process.env.AGG_OPTS
  ? JSON.parse(process.env.AGG_OPTS)
  : {};

const RANGE: VoiceRange = {
  id: "eval",
  label: "Eval",
  minHz: 145,
  maxHz: 275,
  isCustom: false,
};
const JUMP_ST = 10; // residual octave-error threshold
const CLEAN_ST = 6; // a file with max jump below this is "clean"
const EPSILON_HZ = 0.05;

function maxJumpST(samples: PitchSample[]): number {
  let max = 0;
  let prev: number | null = null;
  for (const s of samples) {
    if (s.frequencyHz == null) {
      prev = null;
      continue;
    }
    if (prev != null) {
      max = Math.max(max, Math.abs(12 * Math.log2(s.frequencyHz / prev)));
    }
    prev = s.frequencyHz;
  }
  return max;
}

function pctChanged(before: PitchSample[], after: PitchSample[]): number {
  let voiced = 0;
  let changed = 0;
  for (let i = 0; i < before.length; i += 1) {
    const a = before[i].frequencyHz;
    const b = after[i].frequencyHz;
    if (a == null || b == null) continue;
    voiced += 1;
    if (Math.abs(a - b) > EPSILON_HZ) changed += 1;
  }
  return voiced ? (100 * changed) / voiced : 0;
}

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("usage: npm run agg:spikes <folder>");
  process.exit(1);
}
const files = statSync(inputPath).isDirectory()
  ? readdirSync(inputPath)
      .filter((n) => /\.csv$/i.test(n))
      .sort()
      .map((n) => join(inputPath, n))
  : [inputPath];

let residual = 0;
let regressed = 0;
let improved = 0;
let maxChangedPct = 0;
const residualFiles: string[] = [];
const regressedFiles: string[] = [];

for (const file of files) {
  const before = parseSamplesCSV(readFileSync(file, "utf8"));
  const after = flattenPitchSpikes(before, RANGE, OPTS);
  const jb = maxJumpST(before);
  const ja = maxJumpST(after);
  const pct = pctChanged(before, after);
  maxChangedPct = Math.max(maxChangedPct, pct);

  if (ja >= JUMP_ST) {
    residual += 1;
    residualFiles.push(`${basename(file).slice(0, 12)} ${jb.toFixed(1)}→${ja.toFixed(1)}`);
  }
  if (jb < CLEAN_ST && ja >= CLEAN_ST) {
    regressed += 1;
    regressedFiles.push(`${basename(file).slice(0, 12)} ${jb.toFixed(1)}→${ja.toFixed(1)}`);
  }
  if (jb - ja > 1) improved += 1;
}

console.log(`files=${files.length}`);
console.log(`residual (>=${JUMP_ST}st after) = ${residual}`);
console.log(`regressed (clean -> >=${CLEAN_ST}st) = ${regressed}`);
console.log(`improved (jump dropped >1st)   = ${improved}`);
console.log(`maxChangedPct = ${maxChangedPct.toFixed(1)}%`);
if (regressedFiles.length) {
  console.log(`\nREGRESSED:\n  ${regressedFiles.join("\n  ")}`);
}
if (residualFiles.length) {
  console.log(`\nresidual files:\n  ${residualFiles.join("\n  ")}`);
}
