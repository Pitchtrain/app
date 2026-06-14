import { useMemo } from "react";
import type { TFunction } from "i18next";
import type {
  PitchSample,
  RangeStatus,
  RecordingSession,
  VoiceRange,
} from "~/types";
import { DEFAULT_RANGES } from "~/ranges";
import { getSampleAtTime } from "~/pitch";
import {
  emptySummary,
  formatFrequency,
  getDisplayedMetricSample,
  getLastStableSample,
  matchRange,
  summarizeWindow,
} from "~/lib/format";
import { RANGE_PALETTE } from "~/components/PitchTimelineChart";
import type { Mode } from "../types";

type Args = {
  t: TFunction;
  samples: PitchSample[];
  recordingSession: RecordingSession | null;
  mode: Mode;
  replayTimeMs: number;
  timelineWindowSeconds: number;
  selectedRange: VoiceRange;
  customRange: VoiceRange;
  highlightedRanges: VoiceRange[];
};

export function usePitchDisplayModel({
  t,
  samples,
  recordingSession,
  mode,
  replayTimeMs,
  timelineWindowSeconds,
  selectedRange,
  customRange,
  highlightedRanges,
}: Args) {
  const lastStableLiveSample = useMemo(
    () => getLastStableSample(samples),
    [samples],
  );
  const replaySample = useMemo(() => {
    if (!recordingSession) return null;
    return getSampleAtTime(recordingSession.samples, replayTimeMs);
  }, [recordingSession, replayTimeMs]);
  const replayStableSample = useMemo(() => {
    if (!recordingSession) return null;
    return getLastStableSample(recordingSession.samples, replayTimeMs);
  }, [recordingSession, replayTimeMs]);

  const chartSamples =
    recordingSession && mode === "review" ? recordingSession.samples : samples;
  const displayRange =
    recordingSession && mode === "review"
      ? recordingSession.rangeSnapshot
      : selectedRange;
  const playheadMs =
    recordingSession && mode === "review" ? replayTimeMs : null;

  const currentLiveSample = samples.length ? samples[samples.length - 1] : null;
  const liveMetricSample = getDisplayedMetricSample(
    currentLiveSample,
    lastStableLiveSample,
  );
  const replayMetricSample = getDisplayedMetricSample(
    replaySample,
    replayStableSample,
  );
  const displayedMetric =
    mode === "review" ? replayMetricSample : liveMetricSample;

  const liveSummary = useMemo(() => {
    const windowMs = timelineWindowSeconds * 1000;
    const endMs = samples.length
      ? samples[samples.length - 1].timeMs
      : windowMs;
    return summarizeWindow(samples, endMs, windowMs);
  }, [samples, timelineWindowSeconds]);
  const replaySummary = useMemo(() => {
    if (!recordingSession) return emptySummary();
    return summarizeWindow(
      recordingSession.samples,
      replayTimeMs || recordingSession.durationMs,
      timelineWindowSeconds * 1000,
    );
  }, [recordingSession, replayTimeMs, timelineWindowSeconds]);
  const summary = mode === "review" ? replaySummary : liveSummary;

  const pitchMatch = matchRange(
    displayedMetric?.frequencyHz ?? null,
    customRange,
    DEFAULT_RANGES,
  );
  const medianMatch = matchRange(summary.medianHz, customRange, DEFAULT_RANGES);

  const metrics = [
    {
      label: t("metrics.pitch"),
      value:
        displayedMetric?.frequencyHz != null
          ? `${displayedMetric.frequencyHz.toFixed(1)} Hz`
          : "—",
      tone: "no-pitch" as RangeStatus,
      palette:
        pitchMatch && highlightedRanges.some((r) => r.id === pitchMatch.id)
          ? RANGE_PALETTE[pitchMatch.id]
          : null,
    },
    {
      label: t("metrics.median"),
      value: formatFrequency(summary.medianHz),
      tone: "no-pitch" as RangeStatus,
      palette:
        medianMatch && highlightedRanges.some((r) => r.id === medianMatch.id)
          ? RANGE_PALETTE[medianMatch.id]
          : null,
    },
    {
      label: t("metrics.span"),
      value: formatFrequency(summary.spanHz),
      tone: "no-pitch" as RangeStatus,
      palette: null,
    },
  ];

  const statusLabel =
    mode === "recording"
      ? t("status.recording")
      : mode === "paused"
        ? t("status.paused")
        : mode === "review"
          ? t("status.review")
          : t("status.ready");

  return {
    chartSamples,
    displayRange,
    playheadMs,
    metrics,
    statusLabel,
  };
}
