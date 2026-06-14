import type {
  PitchSample,
  RangeStatus,
  ReadingFeedbackSettings,
  ReadingRangeGoal,
  VoiceRange,
} from "./types";
import { CUSTOM_RANGE_ID, midpoint } from "./ranges";

export type ReadingFeedbackDirection = "above" | "below";

export function evaluatePitch(
  frequencyHz: number | null,
  range: VoiceRange,
): Pick<PitchSample, "inRange" | "deviationFromCenter"> & {
  status: RangeStatus;
} {
  if (!frequencyHz) {
    return {
      inRange: false,
      deviationFromCenter: null,
      status: "unvoiced",
    };
  }

  const center = midpoint(range);
  const inRange = frequencyHz >= range.minHz && frequencyHz <= range.maxHz;

  if (inRange) {
    return {
      inRange,
      deviationFromCenter: frequencyHz - center,
      status: "in-range",
    };
  }

  return {
    inRange,
    deviationFromCenter: frequencyHz - center,
    status: frequencyHz < range.minHz ? "below" : "above",
  };
}

export function getSampleAtTime(samples: PitchSample[], timeMs: number) {
  if (samples.length === 0) {
    return null;
  }

  let closest = samples[0];

  for (const sample of samples) {
    if (Math.abs(sample.timeMs - timeMs) < Math.abs(closest.timeMs - timeMs)) {
      closest = sample;
    }
  }

  return closest;
}

export function getStatusFromPitchSample(sample: PitchSample): RangeStatus {
  return sample.status;
}

export function resolveReadingRangeGoal(
  goal: ReadingRangeGoal,
  range: VoiceRange,
): Exclude<ReadingRangeGoal, "auto"> {
  if (goal !== "auto") return goal;
  if (range.id === "male") return "above";
  if (range.id === "female") return "below";
  if (range.id === CUSTOM_RANGE_ID) return "both";
  return "both";
}

function classifyReadingFeedback(
  sample: PitchSample,
  range: VoiceRange,
  settings: ReadingFeedbackSettings,
): ReadingFeedbackDirection | null {
  if (!sample.voiced || sample.frequencyHz == null) return null;

  const goal = resolveReadingRangeGoal(settings.rangeGoal, range);
  const thresholdHz = Math.max(0, settings.thresholdHz);
  const below = sample.frequencyHz < range.minHz - thresholdHz;
  const above = sample.frequencyHz > range.maxHz + thresholdHz;

  if ((goal === "both" || goal === "below") && below) return "below";
  if ((goal === "both" || goal === "above") && above) return "above";
  return null;
}

export function getReadingFeedbackSampleDirection(
  sample: PitchSample | null,
  range: VoiceRange,
  settings: ReadingFeedbackSettings,
): ReadingFeedbackDirection | null {
  return sample ? classifyReadingFeedback(sample, range, settings) : null;
}
