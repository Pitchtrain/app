import type { PitchSample, RangeStatus, VoiceRange } from "../types";
import { CUSTOM_RANGE_ID } from "../ranges";

const STATUS_COPY: Record<Exclude<RangeStatus, "no-pitch">, string> = {
  below: "Below range",
  "in-range": "In range",
  above: "Above range",
  unvoiced: "Unvoiced",
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatStatus(status: RangeStatus) {
  if (status === "no-pitch") {
    return "No pitch";
  }
  return STATUS_COPY[status];
}

export function formatDeviation(deviation: number | null) {
  if (deviation == null) {
    return "0.0 Hz";
  }
  const prefix = deviation > 0 ? "+" : "";
  return `${prefix}${deviation.toFixed(1)} Hz`;
}

export function formatFrequency(frequencyHz: number | null) {
  if (frequencyHz == null) {
    return "0.0 Hz";
  }
  return `${frequencyHz.toFixed(1)} Hz`;
}

export function formatClockMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function toneClass(tone: RangeStatus) {
  return tone === "in-range"
    ? "bg-moss/10 text-moss"
    : tone === "above"
      ? "bg-coral/10 text-coral"
      : tone === "below"
        ? "bg-sea/10 text-sea"
        : tone === "unvoiced"
          ? "bg-sand text-slate-600"
          : "bg-slate-100 text-slate-500";
}

export function matchRange(
  hz: number | null,
  customRange: VoiceRange,
  presets: VoiceRange[],
): VoiceRange | null {
  if (hz == null) return null;
  if (
    customRange.minHz > 0 &&
    customRange.maxHz > 0 &&
    hz >= customRange.minHz &&
    hz <= customRange.maxHz
  ) {
    return customRange;
  }
  for (const preset of presets) {
    if (preset.id === CUSTOM_RANGE_ID) continue;
    if (hz >= preset.minHz && hz <= preset.maxHz) {
      return preset;
    }
  }
  return null;
}

export function getLastStableSample(
  samples: PitchSample[],
  upperTimeMs = Number.POSITIVE_INFINITY,
) {
  for (let index = samples.length - 1; index >= 0; index -= 1) {
    const sample = samples[index];
    if (
      sample.timeMs <= upperTimeMs &&
      sample.voiced &&
      sample.frequencyHz != null
    ) {
      return sample;
    }
  }
  return null;
}

export type MetricSnapshot = {
  frequencyHz: number | null;
  status: RangeStatus;
  deviationFromCenter: number | null;
  confidence: number;
  voiced: boolean;
};

export function getDisplayedMetricSample(
  sample: PitchSample | null,
  stableSample: PitchSample | null,
): MetricSnapshot | null {
  if (!sample && !stableSample) {
    return null;
  }
  const displaySample = sample?.voiced ? sample : (stableSample ?? sample);
  if (!displaySample) {
    return null;
  }
  return {
    frequencyHz: displaySample.frequencyHz,
    status: displaySample.status,
    deviationFromCenter: displaySample.deviationFromCenter,
    confidence: displaySample.confidence,
    voiced: displaySample.voiced,
  };
}

export type WindowSummary = {
  medianHz: number | null;
  voicedRatio: number;
  spanHz: number | null;
};

export function emptySummary(): WindowSummary {
  return { medianHz: null, voicedRatio: 0, spanHz: null };
}

function getMedian(values: number[]) {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Number(((sorted[middle - 1] + sorted[middle]) / 2).toFixed(1));
  }
  return Number(sorted[middle].toFixed(1));
}

export function summarizeWindow(
  samples: PitchSample[],
  endMs: number,
  windowMs: number,
): WindowSummary {
  const windowStartMs = Math.max(0, endMs - windowMs);
  const visibleSamples = samples.filter(
    (sample) => sample.timeMs >= windowStartMs && sample.timeMs <= endMs,
  );
  const voicedFrequencies = visibleSamples
    .filter((sample) => sample.voiced && sample.frequencyHz != null)
    .map((sample) => sample.frequencyHz as number);

  if (visibleSamples.length === 0 || voicedFrequencies.length === 0) {
    return emptySummary();
  }

  return {
    medianHz: getMedian(voicedFrequencies),
    voicedRatio: voicedFrequencies.length / visibleSamples.length,
    spanHz: Math.max(...voicedFrequencies) - Math.min(...voicedFrequencies),
  };
}
