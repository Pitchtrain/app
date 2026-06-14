import { describe, expect, it } from "vitest";
import type { PitchSample, VoiceRange } from "~/types";
import { evaluatePitch } from "~/pitch";
import { flattenPitchSpikes } from "./flattenPitchSpikes";

const RANGE: VoiceRange = {
  id: "test",
  label: "Test",
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

function fromHzSeries(values: Array<number | null>): PitchSample[] {
  return values.map((value, index) => sampleAt(index * FRAME_MS, value));
}

function steady(count: number, hz: number): PitchSample[] {
  return fromHzSeries(Array.from({ length: count }, () => hz));
}

function glide(count: number, startHz: number, endHz: number): PitchSample[] {
  const startLog = Math.log2(startHz);
  const endLog = Math.log2(endHz);
  return fromHzSeries(
    Array.from({ length: count }, (_, i) => {
      const t = count === 1 ? 0 : i / (count - 1);
      return 2 ** (startLog + (endLog - startLog) * t);
    }),
  );
}

function vibrato(
  count: number,
  centerHz: number,
  depthSemitones: number,
  rateHz: number,
): PitchSample[] {
  const centerLog = Math.log2(centerHz);
  const depthLog = depthSemitones / 12;
  return fromHzSeries(
    Array.from({ length: count }, (_, i) => {
      const t = (i * FRAME_MS) / 1000;
      return 2 ** (centerLog + depthLog * Math.sin(2 * Math.PI * rateHz * t));
    }),
  );
}

function injectSpike(
  samples: PitchSample[],
  index: number,
  semitones: number,
): PitchSample[] {
  const next = samples.map((s) => ({ ...s }));
  const base = next[index].frequencyHz as number;
  next[index] = sampleAt(next[index].timeMs, base * 2 ** (semitones / 12));
  return next;
}

/**
 * Builds one contiguous voiced run with independently-specified raw and smoothed
 * series (the live smoother can disagree with the raw detection), padded with
 * silence on both sides so it forms a clean run.
 */
function runFromRawSmoothed(
  rawHz: number[],
  smoothedHz: number[],
): PitchSample[] {
  const run = rawHz.map((raw, i) => {
    const smoothed = Number(smoothedHz[i].toFixed(1));
    const evaluation = evaluatePitch(smoothed, RANGE);
    return {
      timeMs: (i + 2) * FRAME_MS,
      rawFrequencyHz: Number(raw.toFixed(1)),
      smoothedFrequencyHz: smoothed,
      frequencyHz: smoothed,
      voiced: true,
      confidence: 0.9,
      inRange: evaluation.inRange,
      deviationFromCenter: evaluation.deviationFromCenter,
      status: evaluation.status,
    } satisfies PitchSample;
  });
  return [...fromHzSeries([null, null]), ...run, ...fromHzSeries([null, null])];
}

function maxJumpSemitones(samples: PitchSample[]): number {
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

function maxFreqDriftHz(before: PitchSample[], after: PitchSample[]): number {
  let max = 0;
  for (let i = 0; i < before.length; i += 1) {
    const a = before[i].frequencyHz;
    const b = after[i].frequencyHz;
    if (a == null || b == null) continue;
    max = Math.max(max, Math.abs(a - b));
  }
  return max;
}

function countChanged(
  before: PitchSample[],
  after: PitchSample[],
  skip: Set<number>,
): number {
  let changed = 0;
  for (let i = 0; i < before.length; i += 1) {
    if (skip.has(i)) continue;
    const a = before[i].frequencyHz;
    const b = after[i].frequencyHz;
    if (a == null || b == null) continue;
    if (Math.abs(a - b) > EPSILON_HZ) changed += 1;
  }
  return changed;
}

describe("flattenPitchSpikes — removal", () => {
  it("removes a single-frame upward octave spike", () => {
    const clean = steady(40, 200);
    const dirty = injectSpike(clean, 20, 12);
    const out = flattenPitchSpikes(dirty, RANGE);
    expect(out[20].frequencyHz).toBeCloseTo(200, 0);
  });

  it("removes a single-frame downward spike", () => {
    const clean = steady(40, 200);
    const dirty = injectSpike(clean, 15, -10);
    const out = flattenPitchSpikes(dirty, RANGE);
    expect(out[15].frequencyHz).toBeCloseTo(200, 0);
  });

  it("removes a spike riding on a glide without disturbing the slope", () => {
    const clean = glide(40, 160, 260);
    const dirty = injectSpike(clean, 25, 11);
    const out = flattenPitchSpikes(dirty, RANGE);
    // pulled back onto the glide (window median lands on an adjacent glide
    // sample, so allow up to ~1 semitone vs the exact value at this index)
    const corrected = out[25].frequencyHz as number;
    const expected = clean[25].frequencyHz as number;
    expect(Math.abs(12 * Math.log2(corrected / expected))).toBeLessThan(1.5);
  });

  it("removes a 2-frame spike", () => {
    const clean = steady(40, 200);
    let dirty = injectSpike(clean, 20, 12);
    dirty = injectSpike(dirty, 21, 12);
    const out = flattenPitchSpikes(dirty, RANGE);
    expect(out[20].frequencyHz).toBeCloseTo(200, 0);
    expect(out[21].frequencyHz).toBeCloseTo(200, 0);
  });

  it("removes a multi-frame (4-frame) octave-down error", () => {
    const clean = steady(60, 200);
    let dirty = clean;
    for (let i = 28; i < 32; i += 1) dirty = injectSpike(dirty, i, -12);
    const out = flattenPitchSpikes(dirty, RANGE);
    for (let i = 28; i < 32; i += 1) {
      expect(out[i].frequencyHz).toBeCloseTo(200, 0);
    }
  });

  it("removes a wide (10-frame) octave-down error", () => {
    const clean = steady(80, 200);
    let dirty = clean;
    for (let i = 35; i < 45; i += 1) dirty = injectSpike(dirty, i, -12);
    const out = flattenPitchSpikes(dirty, RANGE);
    for (let i = 35; i < 45; i += 1) {
      expect(out[i].frequencyHz).toBeCloseTo(200, 0);
    }
  });

  it("removes an octave-up error on a glide", () => {
    const clean = glide(60, 160, 260);
    let dirty = clean;
    for (let i = 25; i < 29; i += 1) dirty = injectSpike(dirty, i, 12);
    const out = flattenPitchSpikes(dirty, RANGE);
    for (let i = 25; i < 29; i += 1) {
      const corrected = out[i].frequencyHz as number;
      const expected = clean[i].frequencyHz as number;
      expect(Math.abs(12 * Math.log2(corrected / expected))).toBeLessThan(1.5);
    }
  });

  it("recomputes range fields for a corrected point", () => {
    const clean = steady(40, 200);
    const dirty = injectSpike(clean, 20, 12); // 400Hz, above range
    expect(dirty[20].status).toBe("above");
    const out = flattenPitchSpikes(dirty, RANGE);
    expect(out[20].status).toBe("in-range");
    expect(out[20].inRange).toBe(true);
  });
});

describe("flattenPitchSpikes — no overcorrection", () => {
  it("leaves a steady tone untouched", () => {
    const clean = steady(60, 200);
    const out = flattenPitchSpikes(clean, RANGE);
    expect(countChanged(clean, out, new Set())).toBe(0);
  });

  it("leaves a linear glide untouched", () => {
    const clean = glide(60, 150, 270);
    const out = flattenPitchSpikes(clean, RANGE);
    expect(countChanged(clean, out, new Set())).toBe(0);
  });

  it("preserves vibrato amplitude", () => {
    const clean = vibrato(120, 200, 1, 5);
    const out = flattenPitchSpikes(clean, RANGE);
    expect(maxFreqDriftHz(clean, out)).toBeLessThan(EPSILON_HZ);
  });

  it("only touches the injected spike, nothing else", () => {
    const clean = glide(60, 160, 260);
    const dirty = injectSpike(clean, 30, 12);
    const out = flattenPitchSpikes(dirty, RANGE);
    expect(countChanged(dirty, out, new Set([30]))).toBe(0);
  });
});

describe("flattenPitchSpikes — boundaries", () => {
  it("never bridges unvoiced gaps", () => {
    const series = [
      ...steady(10, 200),
      ...fromHzSeries([null, null, null]),
      ...steady(10, 200),
    ];
    const out = flattenPitchSpikes(series, RANGE);
    for (let i = 10; i < 13; i += 1) {
      expect(out[i].frequencyHz).toBeNull();
      expect(out[i].voiced).toBe(false);
    }
  });

  it("does not flag a real step change across a silence boundary", () => {
    // 150Hz run, gap, 260Hz run — the jump is separated by silence, not a spike
    const series = [
      ...steady(8, 150),
      ...fromHzSeries([null]),
      ...steady(8, 260),
    ];
    const out = flattenPitchSpikes(series, RANGE);
    expect(maxFreqDriftHz(series, out)).toBeLessThan(EPSILON_HZ);
  });

  it("passes short runs through safely", () => {
    const series = fromHzSeries([200, 205, 198]);
    const out = flattenPitchSpikes(series, RANGE);
    expect(maxFreqDriftHz(series, out)).toBeLessThan(EPSILON_HZ);
  });

  it("leaves rawFrequencyHz identical", () => {
    const clean = steady(40, 200);
    const dirty = injectSpike(clean, 20, 12);
    const out = flattenPitchSpikes(dirty, RANGE);
    for (let i = 0; i < dirty.length; i += 1) {
      expect(out[i].rawFrequencyHz).toBe(dirty[i].rawFrequencyHz);
    }
  });

  it("does not mutate the input array", () => {
    const clean = steady(40, 200);
    const dirty = injectSpike(clean, 20, 12);
    const before = dirty[20].frequencyHz;
    flattenPitchSpikes(dirty, RANGE);
    expect(dirty[20].frequencyHz).toBe(before);
  });
});

describe("flattenPitchSpikes — raw-anchored octave realign", () => {
  // Failure mode A: a SHORT voiced run that the live smoother dragged an octave
  // low for ≥ half its length, while the raw detection stayed correct. The local
  // smoothed-median lands between octaves, so the octave-snap stage can't see it;
  // the stable raw anchor can. (Modelled on real file e62c3fdc-*.csv.)
  it("A: snaps a short smoothed octave-low run back onto the stable raw anchor", () => {
    const raw = [210, 212, 214, 214, 216, 215];
    const smoothed = [105, 106, 107, 214, 216, 215]; // first half octave-low
    const series = runFromRawSmoothed(raw, smoothed);
    const before = maxJumpSemitones(series);
    expect(before).toBeGreaterThan(10); // the uncorrected octave jump

    const out = flattenPitchSpikes(series, RANGE);
    // the three octave-low frames are pulled up into the raw's octave…
    for (let i = 2; i <= 4; i += 1) {
      const corrected = out[i].frequencyHz as number;
      expect(corrected).toBeGreaterThan(180);
      expect(
        Math.abs(12 * Math.log2(corrected / (raw[i - 2] as number))),
      ).toBeLessThan(2);
    }
    // …and the run is now smooth.
    expect(maxJumpSemitones(out)).toBeLessThan(4);
  });

  it("A: rejects a transient single-frame raw octave blip (no overcorrection)", () => {
    // raw pops an octave high for one frame while smoothed stays correct; the
    // running-median anchor must ignore the blip and leave smoothed alone.
    const raw = [200, 200, 400, 200, 200, 200];
    const smoothed = [200, 200, 200, 200, 200, 200];
    const series = runFromRawSmoothed(raw, smoothed);
    const out = flattenPitchSpikes(series, RANGE);
    expect(maxFreqDriftHz(series, out)).toBeLessThan(EPSILON_HZ);
  });

  // Failure mode B: a LONG stretch where the smoothed contour sits a NON-integer
  // octave off raw (≈2.08×) and is shaped differently. Naïve round-to-one-octave
  // snapping fires erratically at the boundaries and corrects only part of the
  // stretch, INTRODUCING a jump. The filter must instead leave it intact.
  // (Modelled on real file 017520ad-*.csv.)
  it("B: does not partially correct a long non-integer-octave stretch", () => {
    const correctHead = [200, 203, 205, 204];
    const correctTail = [252, 250, 249, 251];
    // 12-frame off stretch: raw ≈ 2.08× the smoothed, both rising, different shapes.
    // Each frame is a candidate octave error, but the excursion is far longer than a
    // real one, so the realign must leave the whole stretch alone rather than fire
    // erratically and half-correct it (which would introduce a jump).
    const offRaw = [197, 201, 208, 215, 224, 231, 235, 240, 246, 250, 252, 251];
    const offSmoothed = [95, 98, 101, 104, 107, 110, 113, 116, 118, 121, 124, 126];
    const raw = [...correctHead, ...offRaw, ...correctTail];
    const smoothed = [...correctHead, ...offSmoothed, ...correctTail];
    const series = runFromRawSmoothed(raw, smoothed);
    // Isolate the realign stage so the assertion is about it, not the octave-snap /
    // Hampel stages (which legitimately reshape a run this lopsided).
    const realignOnly = { octavePasses: 0, floorSemitones: 999 };

    const out = flattenPitchSpikes(series, RANGE, realignOnly);

    // Nothing is changed: a long excursion is not a brief octave error.
    expect(maxFreqDriftHz(series, out)).toBeLessThan(EPSILON_HZ);
  });

  it("safely passes through recordings with no raw data (graceful fallback)", () => {
    const raw = [105, 106, 107, 214, 216, 215];
    const smoothed = [105, 106, 107, 214, 216, 215];
    const series = runFromRawSmoothed(raw, smoothed).map((s) => ({
      ...s,
      rawFrequencyHz: null, // legacy export / no raw column
    }));
    const out = flattenPitchSpikes(series, RANGE);
    expect(maxFreqDriftHz(series, out)).toBeLessThan(EPSILON_HZ);
  });
});

describe("flattenPitchSpikes — idempotence", () => {
  it("running twice equals running once", () => {
    const clean = glide(60, 160, 260);
    let dirty = injectSpike(clean, 20, 12);
    dirty = injectSpike(dirty, 40, -11);
    const once = flattenPitchSpikes(dirty, RANGE);
    const twice = flattenPitchSpikes(once, RANGE);
    expect(maxFreqDriftHz(once, twice)).toBeLessThan(EPSILON_HZ);
  });
});
