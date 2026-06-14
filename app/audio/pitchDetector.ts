import { AMDF, Macleod, YIN } from "pitchfinder";
import type { DetectorAlgorithm, PitchDetectionResult } from "~/types";

type DetectorConfig = {
  minHz?: number;
  maxHz?: number;
  minRms?: number;
};

type PitchDetector = (data: Float32Array<ArrayBuffer>) => number | null;

export type PitchTrackerState = {
  recentVoiced: number[];
  recentRaw: number[];
  previousSmoothedHz: number | null;
  unvoicedFrames: number;
};

const DEFAULT_MIN_HZ = 50;
const DEFAULT_MAX_HZ = 420;
const DEFAULT_MIN_RMS = 0.003;
const MAX_ZERO_CROSSING_RATE = 0.22;
const MIN_CONFIDENCE = 0.45;
const HOLD_UNVOICED_FRAMES = 2;
const HISTORY_SIZE = 5;
const SMOOTHING_ALPHA = 0.5;
const RAW_HISTORY_SIZE = 3;
const OCTAVE_LEAP_TOLERANCE = 0.12;
const SHIFT_AGREEMENT_RATIO = 0.07;
const MAX_STEP_RATIO = 1.35;
const YIN_THRESHOLD = 0.3;
const YIN_PROBABILITY_THRESHOLD = 0.02;
const MACLEOD_CUTOFF = 0.9;
const AMDF_SENSITIVITY = 0.35;
const AMDF_RATIO = 3;

const detectorCache = new Map<string, PitchDetector>();
const normalizedBufferCache = new Map<number, Float32Array<ArrayBuffer>>();

export function createPitchTrackerState(): PitchTrackerState {
  return {
    recentVoiced: [],
    recentRaw: [],
    previousSmoothedHz: null,
    unvoicedFrames: 0,
  };
}

export function detectPitch(
  data: Float32Array<ArrayBuffer>,
  sampleRate: number,
  algorithm: DetectorAlgorithm,
  state: PitchTrackerState,
  config: DetectorConfig = {},
): PitchDetectionResult {
  const minHz = config.minHz ?? DEFAULT_MIN_HZ;
  const maxHz = config.maxHz ?? DEFAULT_MAX_HZ;
  const minRms = config.minRms ?? DEFAULT_MIN_RMS;
  const normalizedData = normalizeFrame(data);
  const rms = getRms(normalizedData);
  const zeroCrossingRate = getZeroCrossingRate(normalizedData);

  if (rms < minRms) {
    return markUnvoiced(state, rms, zeroCrossingRate);
  }

  const detector = getDetector(
    sampleRate,
    algorithm,
    minHz,
    maxHz,
    normalizedData.length,
  );
  const detectedFrequencyHz = detector(normalizedData);
  const rawFrequencyHz = Number.isFinite(detectedFrequencyHz)
    ? detectedFrequencyHz
    : null;

  if (!rawFrequencyHz || rawFrequencyHz < minHz || rawFrequencyHz > maxHz) {
    return markUnvoiced(state, rms, zeroCrossingRate);
  }

  const rmsConfidence = clamp((rms - minRms) / 0.02);
  const zcrConfidence = clamp(
    1 - Math.max(0, zeroCrossingRate - 0.08) / (MAX_ZERO_CROSSING_RATE - 0.08),
  );
  const historyMedian = median(state.recentVoiced);
  const stabilityConfidence =
    historyMedian == null
      ? 1
      : clamp(1 - Math.abs(Math.log2(rawFrequencyHz / historyMedian)) / 1.35);
  const confidence = clamp(
    rmsConfidence * 0.4 + zcrConfidence * 0.35 + stabilityConfidence * 0.25,
  );
  const voiced =
    zeroCrossingRate <= MAX_ZERO_CROSSING_RATE && confidence >= MIN_CONFIDENCE;

  if (!voiced) {
    return markUnvoiced(
      state,
      rms,
      zeroCrossingRate,
      rawFrequencyHz,
      confidence,
    );
  }

  state.unvoicedFrames = 0;
  pushHistory(state.recentVoiced, rawFrequencyHz, HISTORY_SIZE);
  pushHistory(state.recentRaw, rawFrequencyHz, RAW_HISTORY_SIZE);

  const previousSmoothedHz = state.previousSmoothedHz;
  const alignedHz =
    previousSmoothedHz == null
      ? rawFrequencyHz
      : alignOctave(rawFrequencyHz, previousSmoothedHz, state.recentRaw);
  const shiftSettled = isPersistentShift(state.recentRaw);
  let smoothedFrequencyHz: number;
  if (previousSmoothedHz == null || shiftSettled) {
    smoothedFrequencyHz = alignedHz;
  } else {
    const stepLimitedHz = clampStep(alignedHz, previousSmoothedHz);
    smoothedFrequencyHz =
      previousSmoothedHz +
      (stepLimitedHz - previousSmoothedHz) * SMOOTHING_ALPHA;
  }

  state.previousSmoothedHz = smoothedFrequencyHz;

  return {
    rawFrequencyHz,
    smoothedFrequencyHz,
    voiced: true,
    confidence,
    rms,
    zeroCrossingRate,
  };
}

function getDetector(
  sampleRate: number,
  algorithm: DetectorAlgorithm,
  minHz: number,
  maxHz: number,
  bufferSize: number,
) {
  const cacheKey = `${algorithm}:${sampleRate}:${minHz}:${maxHz}:${bufferSize}`;
  const cachedDetector = detectorCache.get(cacheKey);
  if (cachedDetector) {
    return cachedDetector;
  }

  const detector =
    algorithm === "amdf"
      ? AMDF({
          sampleRate,
          minFrequency: minHz,
          maxFrequency: maxHz,
          sensitivity: AMDF_SENSITIVITY,
          ratio: AMDF_RATIO,
        })
      : algorithm === "macleod"
        ? createMacleodDetector(sampleRate, bufferSize)
        : YIN({
            sampleRate,
            threshold: YIN_THRESHOLD,
            probabilityThreshold: YIN_PROBABILITY_THRESHOLD,
          });

  detectorCache.set(cacheKey, detector);
  return detector;
}

function createMacleodDetector(
  sampleRate: number,
  bufferSize: number,
): PitchDetector {
  const detector = Macleod({
    sampleRate,
    bufferSize,
    cutoff: MACLEOD_CUTOFF,
  });

  return (data) => {
    const result = detector(data);
    const frequency = result.freq;

    return Number.isFinite(frequency) && frequency > 0 ? frequency : null;
  };
}

function markUnvoiced(
  state: PitchTrackerState,
  rms: number,
  zeroCrossingRate: number,
  rawFrequencyHz: number | null = null,
  confidence = 0,
): PitchDetectionResult {
  state.unvoicedFrames += 1;
  const shouldHold =
    state.previousSmoothedHz != null &&
    state.unvoicedFrames <= HOLD_UNVOICED_FRAMES;

  if (!shouldHold) {
    state.previousSmoothedHz = null;
    state.recentVoiced.length = 0;
    state.recentRaw.length = 0;
  }

  return {
    rawFrequencyHz,
    smoothedFrequencyHz: shouldHold ? state.previousSmoothedHz : null,
    voiced: false,
    confidence,
    rms,
    zeroCrossingRate,
  };
}

function getRms(data: Float32Array<ArrayBuffer>) {
  let rms = 0;

  for (let index = 0; index < data.length; index += 1) {
    const value = data[index];
    rms += value * value;
  }

  return Math.sqrt(rms / data.length);
}

function getZeroCrossingRate(data: Float32Array<ArrayBuffer>) {
  if (data.length < 2) {
    return 0;
  }

  let crossings = 0;
  let previousPositive = data[0] >= 0;
  for (let index = 1; index < data.length; index += 1) {
    const currentPositive = data[index] >= 0;
    if (currentPositive !== previousPositive) {
      crossings += 1;
      previousPositive = currentPositive;
    }
  }

  return crossings / (data.length - 1);
}

function normalizeFrame(data: Float32Array<ArrayBuffer>) {
  let buffer = normalizedBufferCache.get(data.length);
  if (!buffer) {
    buffer = new Float32Array(data.length);
    normalizedBufferCache.set(data.length, buffer);
  }

  let mean = 0;
  for (let index = 0; index < data.length; index += 1) {
    mean += data[index];
  }
  mean /= data.length;

  let peak = 0;
  for (let index = 0; index < data.length; index += 1) {
    const centered = data[index] - mean;
    buffer[index] = centered;
    const magnitude = Math.abs(centered);
    if (magnitude > peak) {
      peak = magnitude;
    }
  }

  if (peak > 0) {
    const scale = 1 / peak;
    for (let index = 0; index < buffer.length; index += 1) {
      buffer[index] *= scale;
    }
  }

  return buffer;
}

function clampStep(nextHz: number, previousHz: number) {
  const maxHz = previousHz * MAX_STEP_RATIO;
  const minHz = previousHz / MAX_STEP_RATIO;
  if (nextHz > maxHz) return maxHz;
  if (nextHz < minHz) return minHz;
  return nextHz;
}

function isPersistentShift(recentRaw: number[]) {
  if (recentRaw.length < RAW_HISTORY_SIZE) return false;
  let min = Infinity;
  let max = 0;
  for (const value of recentRaw) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (min <= 0) return false;
  return max / min - 1 <= SHIFT_AGREEMENT_RATIO;
}

function alignOctave(nextHz: number, previousHz: number, recentRaw: number[]) {
  if (isPersistentOctaveLeap(recentRaw, previousHz)) {
    return nextHz;
  }

  const doubledError = Math.abs(nextHz * 2 - previousHz);
  const halvedError = Math.abs(nextHz / 2 - previousHz);
  const directError = Math.abs(nextHz - previousHz);

  if (doubledError < directError && nextHz * 2 <= DEFAULT_MAX_HZ) {
    return nextHz * 2;
  }
  if (halvedError < directError && nextHz / 2 >= DEFAULT_MIN_HZ) {
    return nextHz / 2;
  }
  return nextHz;
}

function isPersistentOctaveLeap(recentRaw: number[], previousHz: number) {
  if (recentRaw.length < RAW_HISTORY_SIZE) return false;
  for (const raw of recentRaw) {
    const doubleRatio = Math.abs(raw / previousHz - 2);
    const halfRatio = Math.abs(raw / previousHz - 0.5);
    if (
      doubleRatio > OCTAVE_LEAP_TOLERANCE &&
      halfRatio > OCTAVE_LEAP_TOLERANCE
    ) {
      return false;
    }
  }
  return true;
}

function pushHistory(history: number[], value: number, size: number) {
  history.push(value);
  if (history.length > size) {
    history.splice(0, history.length - size);
  }
}

function median(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}
