/**
 * Eval harness for flattenPitchSpikes.
 *
 *   npm run eval:spikes                       # synthetic cases
 *   npm run eval:spikes path/to/samples.csv   # + a real exported recording
 *
 * Prints, for each case, how much the filter changed the series — the key signal
 * is "% voiced points changed": high on dirty input (spikes removed), ~0 on clean
 * input (no overcorrection).
 *
 * For a real CSV it also writes <csv>.html: a self-contained overlay chart (raw
 * scatter, original contour, corrected contour). Open it in any browser.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import type { PitchSample, VoiceRange } from "~/types";
import { evaluatePitch } from "~/pitch";
import { parseSamplesCSV } from "~/journal/csv";
import {
  flattenPitchSpikes,
  type SpikeFilterOptions,
} from "~/audio/flattenPitchSpikes";

const RANGE: VoiceRange = {
  id: "eval",
  label: "Eval",
  minHz: 145,
  maxHz: 275,
  isCustom: false,
};
const FRAME_MS = 16;
const EPSILON_HZ = 0.05;

function sampleAt(timeMs: number, frequencyHz: number | null): PitchSample {
  if (frequencyHz == null) {
    return {
      timeMs,
      rawFrequencyHz: null,
      smoothedFrequencyHz: null,
      frequencyHz: null,
      voiced: false,
      confidence: 0,
      inRange: false,
      deviationFromCenter: null,
      status: "unvoiced",
    };
  }
  const f = Number(frequencyHz.toFixed(1));
  const evaluation = evaluatePitch(f, RANGE);
  return {
    timeMs,
    rawFrequencyHz: f,
    smoothedFrequencyHz: f,
    frequencyHz: f,
    voiced: true,
    confidence: 0.9,
    inRange: evaluation.inRange,
    deviationFromCenter: evaluation.deviationFromCenter,
    status: evaluation.status,
  };
}

function fromHz(values: Array<number | null>): PitchSample[] {
  return values.map((v, i) => sampleAt(i * FRAME_MS, v));
}

function glide(count: number, a: number, b: number): PitchSample[] {
  const la = Math.log2(a);
  const lb = Math.log2(b);
  return fromHz(
    Array.from({ length: count }, (_, i) =>
      2 ** (la + (lb - la) * (i / (count - 1))),
    ),
  );
}

function vibrato(count: number, center: number, depthST: number, rateHz: number) {
  const lc = Math.log2(center);
  return fromHz(
    Array.from({ length: count }, (_, i) => {
      const t = (i * FRAME_MS) / 1000;
      return 2 ** (lc + (depthST / 12) * Math.sin(2 * Math.PI * rateHz * t));
    }),
  );
}

function injectSpike(s: PitchSample[], index: number, st: number): PitchSample[] {
  const next = s.map((x) => ({ ...x }));
  const base = next[index].frequencyHz as number;
  next[index] = sampleAt(next[index].timeMs, base * 2 ** (st / 12));
  return next;
}

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

type Metrics = {
  voiced: number;
  changed: number;
  pctChanged: number;
  maxChangeST: number;
  meanChangeST: number;
  maxJumpBeforeST: number;
  maxJumpAfterST: number;
};

function evaluate(input: PitchSample[], opts?: SpikeFilterOptions): Metrics {
  const out = flattenPitchSpikes(input, RANGE, opts);
  let voiced = 0;
  let changed = 0;
  let maxChangeST = 0;
  let sumChangeST = 0;
  for (let i = 0; i < input.length; i += 1) {
    const a = input[i].frequencyHz;
    const b = out[i].frequencyHz;
    if (a == null || b == null) continue;
    voiced += 1;
    const diffHz = Math.abs(a - b);
    if (diffHz > EPSILON_HZ) {
      changed += 1;
      const st = Math.abs(12 * Math.log2(b / a));
      maxChangeST = Math.max(maxChangeST, st);
      sumChangeST += st;
    }
  }
  return {
    voiced,
    changed,
    pctChanged: voiced ? (100 * changed) / voiced : 0,
    maxChangeST,
    meanChangeST: changed ? sumChangeST / changed : 0,
    maxJumpBeforeST: maxJumpST(input),
    maxJumpAfterST: maxJumpST(out),
  };
}

function row(name: string, m: Metrics): string {
  return [
    name.padEnd(28),
    `voiced=${String(m.voiced).padStart(4)}`,
    `changed=${String(m.changed).padStart(3)}`,
    `(${m.pctChanged.toFixed(1).padStart(5)}%)`,
    `maxΔ=${m.maxChangeST.toFixed(2)}st`,
    `meanΔ=${m.meanChangeST.toFixed(2)}st`,
    `jump ${m.maxJumpBeforeST.toFixed(1)}→${m.maxJumpAfterST.toFixed(1)}st`,
  ].join("  ");
}

console.log("== synthetic cases (want ~0% changed on clean, >0 on dirty) ==");
console.log(row("steady clean", evaluate(fromHz(Array(60).fill(200)))));
console.log(row("glide clean", evaluate(glide(60, 150, 270))));
console.log(row("vibrato ±1st clean", evaluate(vibrato(120, 200, 1, 5))));
console.log(row("vibrato ±2st clean", evaluate(vibrato(120, 200, 2, 5))));
console.log(
  row("steady + 1 spike", evaluate(injectSpike(fromHz(Array(60).fill(200)), 30, 12))),
);
console.log(
  row("glide + 1 spike", evaluate(injectSpike(glide(60, 160, 260), 30, 11))),
);

function renderChart(
  original: PitchSample[],
  corrected: PitchSample[],
  title: string,
): string {
  const W = 1200;
  const H = 480;
  const PAD = 48;
  const minHz = 50;
  const maxHz = 400;
  const times = original.map((s) => s.timeMs);
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const toX = (t: number) =>
    PAD + ((t - tMin) / (tMax - tMin || 1)) * (W - 2 * PAD);
  const toY = (hz: number) => {
    const lo = Math.log2(minHz);
    const hi = Math.log2(maxHz);
    return H - PAD - ((Math.log2(hz) - lo) / (hi - lo)) * (H - 2 * PAD);
  };

  const rawDots = original
    .filter((s) => s.rawFrequencyHz != null)
    .map(
      (s) =>
        `<circle cx="${toX(s.timeMs).toFixed(1)}" cy="${toY(s.rawFrequencyHz as number).toFixed(1)}" r="1.6" fill="#9aa7b4"/>`,
    )
    .join("");

  const polyline = (samples: PitchSample[], color: string, width: number) => {
    let d = "";
    let pen = false;
    for (const s of samples) {
      if (s.frequencyHz == null) {
        pen = false;
        continue;
      }
      const cmd = pen ? "L" : "M";
      d += `${cmd}${toX(s.timeMs).toFixed(1)} ${toY(s.frequencyHz).toFixed(1)} `;
      pen = true;
    }
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`;
  };

  const gridLines = [80, 110, 150, 200, 260, 330]
    .map((hz) => {
      const y = toY(hz).toFixed(1);
      return `<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#e2e6ea"/><text x="6" y="${(Number(y) + 4).toFixed(1)}" font-size="11" fill="#8a96a2">${hz}Hz</text>`;
    })
    .join("");

  return `<section style="margin:0 0 32px">
<h3 style="margin:0 0 4px">${title}</h3>
<p style="margin:0 0 8px;color:#5a6b7a">
  <span style="color:#9aa7b4">●</span> raw &nbsp;
  <span style="color:#d4663a">▬</span> original contour &nbsp;
  <span style="color:#2f7fa8">▬</span> corrected contour
</p>
<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;border:1px solid #e2e6ea;background:#fff">
${gridLines}${rawDots}
${polyline(original, "#d4663a", 1.5)}
${polyline(corrected, "#2f7fa8", 2)}
</svg></section>`;
}

function renderDoc(title: string, bodies: string[]): string {
  return `<!doctype html><meta charset="utf-8"><title>${title}</title>
<body style="font:14px system-ui;margin:24px;color:#1a2733">
<h2 style="margin:0 0 16px">${title}</h2>
${bodies.join("\n")}
</body>`;
}

function listCsvFiles(path: string): string[] {
  if (statSync(path).isDirectory()) {
    return readdirSync(path)
      .filter((name) => /\.csv$/i.test(name))
      .sort()
      .map((name) => join(path, name));
  }
  return [path];
}

function processCsv(csvPath: string): string {
  const samples = parseSamplesCSV(readFileSync(csvPath, "utf8"));
  const corrected = flattenPitchSpikes(samples, RANGE);
  const m = evaluate(samples);
  console.log(
    row(basename(csvPath).slice(0, 28), m) + `  n=${samples.length}`,
  );
  return renderChart(samples, corrected, basename(csvPath));
}

const inputPath = process.argv[2];
if (inputPath) {
  const files = listCsvFiles(inputPath);
  console.log(`\n== ${files.length} recording(s) at ${inputPath} ==`);
  const charts = files.map(processCsv);
  const isDir = statSync(inputPath).isDirectory();
  const outPath = isDir
    ? join(inputPath, "spike-eval-report.html")
    : inputPath.replace(/\.csv$/i, "") + ".html";
  writeFileSync(outPath, renderDoc(`spike eval — ${inputPath}`, charts));
  console.log(`\nwrote ${outPath} — open in a browser`);
}
