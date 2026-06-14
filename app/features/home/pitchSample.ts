import type { PitchDetectionResult, PitchSample, VoiceRange } from "~/types";
import { evaluatePitch } from "~/pitch";

const MAX_DISPLAY_HZ = 400;

export function createPitchSample(
  detection: PitchDetectionResult,
  range: VoiceRange,
  timeMs: number,
): PitchSample {
  const rawFrequencyHz = clampDisplayFrequency(detection.rawFrequencyHz);
  const smoothedFrequencyHz = clampDisplayFrequency(
    detection.smoothedFrequencyHz,
  );
  const evaluation = evaluatePitch(
    detection.voiced ? smoothedFrequencyHz : null,
    range,
  );

  return {
    timeMs,
    rawFrequencyHz,
    smoothedFrequencyHz,
    frequencyHz: detection.voiced ? smoothedFrequencyHz : null,
    voiced: detection.voiced && smoothedFrequencyHz != null,
    confidence: detection.confidence,
    inRange: evaluation.inRange,
    deviationFromCenter: evaluation.deviationFromCenter,
    status:
      detection.voiced && smoothedFrequencyHz != null
        ? evaluation.status
        : ("unvoiced" as const),
  };
}

function clampDisplayFrequency(frequencyHz: number | null) {
  if (!frequencyHz || frequencyHz < 50 || frequencyHz > MAX_DISPLAY_HZ) {
    return null;
  }
  return Number(frequencyHz.toFixed(1));
}
