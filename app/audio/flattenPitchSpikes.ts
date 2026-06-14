import type { PitchSample, VoiceRange } from "~/types";
import { evaluatePitch } from "~/pitch";

export type SpikeFilterOptions = {
  /** Neighbors to include on each side for the Hampel pass. Default 2 (≈ 5-frame window). */
  windowHalf?: number;
  /** MAD multiplier for the Hampel statistical outlier test. Default 3. */
  nSigma?: number;
  /** Minimum deviation (in semitones) before a point can be touched by Hampel. Default 1.2. */
  floorSemitones?: number;
  /** Neighbors each side for the octave-snap reference median. Default 10. */
  octaveWindowHalf?: number;
  /** How close (in semitones) a deviation must be to a full octave to be snapped. Default 3. */
  octaveToleranceSemitones?: number;
  /** Octave-snap passes (re-runs let the median recover on long excursions). Default 2. */
  octavePasses?: number;
  /** Neighbors each side for the raw running-median anchor. Default 6. */
  rawAnchorWindowHalf?: number;
  /** Minimum raw samples in the anchor window before it is trusted. Default 2. */
  rawAnchorMinCount?: number;
  /** Max raw spread (MAD, in semitones) for the anchor to count as stable. Default 3. */
  rawAnchorMadSemitones?: number;
  /** Smoothed must sit at least this far (semitones) off the raw anchor to realign. Default 6. */
  rawRealignMinSemitones?: number;
  /** …and no further than this (semitones); beyond is not treated as an octave error. Default 24. */
  rawRealignMaxSemitones?: number;
  /** Per-point raw is used as the target only when within this (semitones) of the anchor. Default 4. */
  rawTrustSemitones?: number;
  /**
   * A run is only realigned when at least one of its frames already agrees with its
   * raw anchor to within this (semitones) — proof that raw and smoothed share an
   * octave reference for this utterance, so the off-frames are real excursions and
   * not a sustained raw/smoothed octave disagreement. Default 2.
   */
  rawAgreeSemitones?: number;
  /**
   * Longest contiguous off-anchor excursion that is still treated as an octave
   * error. A genuine error is a brief detachment that snaps back; a longer run off
   * the anchor is a real glide or a sustained disagreement and is left alone.
   * Default 8.
   */
  rawMaxExcursionFrames?: number;
};

const DEFAULT_WINDOW_HALF = 2;
const DEFAULT_N_SIGMA = 3;
const DEFAULT_FLOOR_SEMITONES = 1.2;
const DEFAULT_OCTAVE_WINDOW_HALF = 10;
const DEFAULT_OCTAVE_TOLERANCE_SEMITONES = 3;
const DEFAULT_OCTAVE_PASSES = 2;
const DEFAULT_RAW_ANCHOR_WINDOW_HALF = 6;
const DEFAULT_RAW_ANCHOR_MIN_COUNT = 2;
const DEFAULT_RAW_ANCHOR_MAD_SEMITONES = 3;
const DEFAULT_RAW_REALIGN_MIN_SEMITONES = 6;
const DEFAULT_RAW_REALIGN_MAX_SEMITONES = 24;
const DEFAULT_RAW_TRUST_SEMITONES = 4;
const DEFAULT_RAW_AGREE_SEMITONES = 2;
const DEFAULT_RAW_MAX_EXCURSION_FRAMES = 8;

/** MAD → standard-deviation scale factor for normally distributed data. */
const MAD_TO_SIGMA = 1.4826;
/** Deviation in log2(Hz) units that equals one semitone. */
const SEMITONE_LOG2 = 1 / 12;

/**
 * Non-causal post-processing pass that flattens sudden, unnatural jumps in a
 * recorded pitch series — octave errors and transient pops/glitches that the live
 * (causal) detector cannot see past.
 *
 * Three stages, all restricted to contiguous voiced runs (silence is never bridged):
 *   0. Raw-anchored realign — the live SMOOTHER (not the raw detector) intermittently
 *      detaches by ~an octave: it lags an octave jump, or glides through the
 *      "between-octaves" values (e.g. 348→303 while raw sits at 121). Those are
 *      invisible to a smoothed-median snap — the smoothed contour is internally
 *      self-consistent and the off-values aren't a clean octave from their neighbours.
 *      Here the trustworthy reference is the *raw* detection: a running MEDIAN of raw
 *      (robust to single-frame raw octave blips, which is what makes a naïve per-point
 *      raw anchor over-fire) gives a stable fundamental. Where a stable raw anchor is
 *      available and the smoothed point sits ≥ half an octave off it, the smoothed
 *      point is snapped back to raw. Falls back to a no-op when raw is missing or
 *      unstable, so recordings without reliable raw still pass through safely.
 *   1. Octave snap — the dominant artifact when raw is *also* wrong. The detector
 *      locks onto half/double the true fundamental for several frames. A generic
 *      median can't fix these (it doesn't know the correction is ×2), so points
 *      sitting ~1 octave off the local median are folded by an octave. Run a few
 *      times so the median recovers on long excursions.
 *   2. Hampel filter (sliding median + MAD, in log-Hz) — cleans residual non-octave
 *      spikes. A point is replaced by its window median only when it is both a
 *      statistical outlier and musically large, so genuine voice movement (vibrato,
 *      glides) passes through untouched.
 *
 * Pure: returns new samples, never mutates the input. `rawFrequencyHz` is preserved
 * so the raw scatter and before/after comparisons stay intact.
 */
export function flattenPitchSpikes(
  samples: PitchSample[],
  range: VoiceRange,
  options: SpikeFilterOptions = {},
): PitchSample[] {
  const windowHalf = options.windowHalf ?? DEFAULT_WINDOW_HALF;
  const nSigma = options.nSigma ?? DEFAULT_N_SIGMA;
  const floorLog2 = (options.floorSemitones ?? DEFAULT_FLOOR_SEMITONES) *
    SEMITONE_LOG2;
  const octaveWindowHalf = options.octaveWindowHalf ?? DEFAULT_OCTAVE_WINDOW_HALF;
  const octaveTolerance =
    (options.octaveToleranceSemitones ?? DEFAULT_OCTAVE_TOLERANCE_SEMITONES) *
    SEMITONE_LOG2;
  const octavePasses = options.octavePasses ?? DEFAULT_OCTAVE_PASSES;
  const rawAnchor: RawRealignConfig = {
    windowHalf: options.rawAnchorWindowHalf ?? DEFAULT_RAW_ANCHOR_WINDOW_HALF,
    minCount: options.rawAnchorMinCount ?? DEFAULT_RAW_ANCHOR_MIN_COUNT,
    madLog2:
      (options.rawAnchorMadSemitones ?? DEFAULT_RAW_ANCHOR_MAD_SEMITONES) *
      SEMITONE_LOG2,
    minLog2:
      (options.rawRealignMinSemitones ?? DEFAULT_RAW_REALIGN_MIN_SEMITONES) *
      SEMITONE_LOG2,
    maxLog2:
      (options.rawRealignMaxSemitones ?? DEFAULT_RAW_REALIGN_MAX_SEMITONES) *
      SEMITONE_LOG2,
    trustLog2:
      (options.rawTrustSemitones ?? DEFAULT_RAW_TRUST_SEMITONES) * SEMITONE_LOG2,
    agreeLog2:
      (options.rawAgreeSemitones ?? DEFAULT_RAW_AGREE_SEMITONES) * SEMITONE_LOG2,
    maxExcursionFrames:
      options.rawMaxExcursionFrames ?? DEFAULT_RAW_MAX_EXCURSION_FRAMES,
  };

  const result = samples.map((sample) => ({ ...sample }));

  forEachVoicedRun(result, (start, end) =>
    realignToRawInRun(result, start, end, rawAnchor, range),
  );

  for (let pass = 0; pass < octavePasses; pass += 1) {
    forEachVoicedRun(result, (start, end) =>
      snapOctavesInRun(result, start, end, octaveWindowHalf, octaveTolerance, range),
    );
  }
  forEachVoicedRun(result, (start, end) =>
    hampelRun(result, start, end, windowHalf, nSigma, floorLog2, range),
  );

  return result;
}

function isVoiced(sample: PitchSample): boolean {
  return sample.voiced && sample.frequencyHz != null;
}

function forEachVoicedRun(
  samples: PitchSample[],
  fn: (start: number, end: number) => void,
) {
  let start = 0;
  while (start < samples.length) {
    if (!isVoiced(samples[start])) {
      start += 1;
      continue;
    }
    let end = start;
    while (end + 1 < samples.length && isVoiced(samples[end + 1])) {
      end += 1;
    }
    fn(start, end);
    start = end + 1;
  }
}

type RawRealignConfig = {
  windowHalf: number;
  minCount: number;
  madLog2: number;
  minLog2: number;
  maxLog2: number;
  trustLog2: number;
  agreeLog2: number;
  maxExcursionFrames: number;
};

// Stage 0: realign smoothed points that have detached ~an octave from a stable
// running-median of the raw detection. See the module doc comment for the why.
function realignToRawInRun(
  samples: PitchSample[],
  start: number,
  end: number,
  config: RawRealignConfig,
  range: VoiceRange,
) {
  const smoothedLog = readRunLogs(samples, start, end);
  const rawLog: Array<number | null> = [];
  for (let i = start; i <= end; i += 1) {
    const raw = samples[i].rawFrequencyHz;
    rawLog.push(raw != null && raw > 0 ? Math.log2(raw) : null);
  }

  // Per-frame stable raw anchor, plus classification against it:
  //   on       — smoothed already matches the anchor (shared octave reference)
  //   eligible — smoothed sits ~an octave off a stable anchor (candidate error)
  const anchors: Array<{ median: number; mad: number } | null> = [];
  const onFrame: boolean[] = [];
  const eligible: boolean[] = [];
  for (let offset = 0; offset < smoothedLog.length; offset += 1) {
    const anchor = rawAnchorAt(rawLog, offset, config.windowHalf, config.minCount);
    anchors.push(anchor);
    const stable = anchor != null && anchor.mad <= config.madLog2;
    const deviation = stable
      ? Math.abs(smoothedLog[offset] - anchor!.median)
      : Infinity;
    onFrame.push(stable && deviation <= config.agreeLog2);
    eligible.push(
      stable && deviation >= config.minLog2 && deviation <= config.maxLog2,
    );
  }

  // Decide every correction against the frozen input, then apply, so a snapped
  // point never feeds back into a later anchor in the same pass.
  const targets: Array<number | null> = new Array(smoothedLog.length).fill(null);
  let offset = 0;
  while (offset < eligible.length) {
    if (!eligible[offset]) {
      offset += 1;
      continue;
    }
    let groupEnd = offset;
    while (groupEnd + 1 < eligible.length && eligible[groupEnd + 1]) {
      groupEnd += 1;
    }
    // A genuine octave error is a brief detachment bracketed by frames that agree
    // with the anchor — a clean pop away and back. Requiring an adjacent on-frame
    // rejects gradual glides away from raw and sustained raw/smoothed disagreement,
    // and avoids leaving a half-corrected step at a fuzzy excursion boundary.
    const bracketed =
      (offset > 0 && onFrame[offset - 1]) ||
      (groupEnd + 1 < onFrame.length && onFrame[groupEnd + 1]);
    if (bracketed && groupEnd - offset + 1 <= config.maxExcursionFrames) {
      for (let i = offset; i <= groupEnd; i += 1) {
        const anchor = anchors[i] as { median: number; mad: number };
        const raw = rawLog[i];
        // Prefer the actual raw value here (best contour), but fall back to the
        // robust anchor when raw here is itself an outlier (transient blip).
        targets[i] =
          raw != null && Math.abs(raw - anchor.median) <= config.trustLog2
            ? raw
            : anchor.median;
      }
    }
    offset = groupEnd + 1;
  }

  for (let i = 0; i < targets.length; i += 1) {
    const target = targets[i];
    if (target != null) {
      applyCorrection(samples[start + i], 2 ** target, range);
    }
  }
}

function rawAnchorAt(
  rawLog: Array<number | null>,
  offset: number,
  windowHalf: number,
  minCount: number,
): { median: number; mad: number } | null {
  const windowStart = Math.max(0, offset - windowHalf);
  const windowEnd = Math.min(rawLog.length - 1, offset + windowHalf);
  const values: number[] = [];
  for (let i = windowStart; i <= windowEnd; i += 1) {
    const value = rawLog[i];
    if (value != null) values.push(value);
  }
  if (values.length < minCount) return null;
  const med = median(values);
  const mad = median(values.map((value) => Math.abs(value - med)));
  return { median: med, mad };
}

function snapOctavesInRun(
  samples: PitchSample[],
  start: number,
  end: number,
  windowHalf: number,
  toleranceLog2: number,
  range: VoiceRange,
) {
  const logValues = readRunLogs(samples, start, end);

  for (let offset = 0; offset < logValues.length; offset += 1) {
    const ref = windowMedian(logValues, offset, windowHalf);
    const deviation = logValues[offset] - ref;
    // snap up if the point sits ~1 octave below the local median, down if above
    if (Math.abs(deviation + 1) < toleranceLog2) {
      applyCorrection(samples[start + offset], 2 ** (logValues[offset] + 1), range);
    } else if (Math.abs(deviation - 1) < toleranceLog2) {
      applyCorrection(samples[start + offset], 2 ** (logValues[offset] - 1), range);
    }
  }
}

function hampelRun(
  samples: PitchSample[],
  start: number,
  end: number,
  windowHalf: number,
  nSigma: number,
  floorLog2: number,
  range: VoiceRange,
) {
  const logValues = readRunLogs(samples, start, end);

  for (let offset = 0; offset < logValues.length; offset += 1) {
    const windowStart = Math.max(0, offset - windowHalf);
    const windowEnd = Math.min(logValues.length - 1, offset + windowHalf);
    const window = logValues.slice(windowStart, windowEnd + 1);

    const med = median(window);
    const deviation = Math.abs(logValues[offset] - med);
    if (deviation <= floorLog2) continue;

    const mad = median(window.map((value) => Math.abs(value - med)));
    if (deviation <= nSigma * MAD_TO_SIGMA * mad) continue;

    applyCorrection(samples[start + offset], 2 ** med, range);
  }
}

// Frozen snapshot of a run's log-frequencies, so corrections made within a pass
// don't feed back into that same pass's later windows.
function readRunLogs(
  samples: PitchSample[],
  start: number,
  end: number,
): number[] {
  const logs: number[] = [];
  for (let i = start; i <= end; i += 1) {
    logs.push(Math.log2(samples[i].frequencyHz as number));
  }
  return logs;
}

function windowMedian(
  values: number[],
  offset: number,
  windowHalf: number,
): number {
  const windowStart = Math.max(0, offset - windowHalf);
  const windowEnd = Math.min(values.length - 1, offset + windowHalf);
  return median(values.slice(windowStart, windowEnd + 1));
}

function applyCorrection(
  sample: PitchSample,
  frequencyHz: number,
  range: VoiceRange,
) {
  const corrected = Number(frequencyHz.toFixed(1));
  const evaluation = evaluatePitch(corrected, range);
  sample.frequencyHz = corrected;
  sample.smoothedFrequencyHz = corrected;
  sample.inRange = evaluation.inRange;
  sample.deviationFromCenter = evaluation.deviationFromCenter;
  sample.status = evaluation.status;
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}
