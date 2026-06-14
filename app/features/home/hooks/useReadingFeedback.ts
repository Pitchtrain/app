import { useEffect, useRef, useState } from "react";
import type { PitchSample, ReadingFeedbackSettings, VoiceRange } from "~/types";
import type { ReadingFeedbackDirection } from "~/pitch";
import { getReadingFeedbackSampleDirection } from "~/pitch";

const READING_FEEDBACK_HOLD_MS = 250;

type Args = {
  samples: PitchSample[];
  selectedRange: VoiceRange;
  feedback: ReadingFeedbackSettings;
  active: boolean;
};

export function useReadingFeedback({
  samples,
  selectedRange,
  feedback,
  active,
}: Args) {
  const readingFeedbackHoldRef = useRef<{
    direction: ReadingFeedbackDirection;
    timeMs: number;
  } | null>(null);
  const [visibleReadingFeedbackDirection, setVisibleReadingFeedbackDirection] =
    useState<ReadingFeedbackDirection | null>(null);

  useEffect(() => {
    const latestSample = samples[samples.length - 1] ?? null;
    if (!active) {
      readingFeedbackHoldRef.current = null;
      setVisibleReadingFeedbackDirection(null);
      return;
    }

    if (!latestSample) {
      readingFeedbackHoldRef.current = null;
      setVisibleReadingFeedbackDirection(null);
      return;
    }

    const currentTimeMs = latestSample.timeMs;
    const rawDirection = getReadingFeedbackSampleDirection(
      latestSample,
      selectedRange,
      feedback,
    );

    if (rawDirection) {
      readingFeedbackHoldRef.current = {
        direction: rawDirection,
        timeMs: currentTimeMs,
      };
      setVisibleReadingFeedbackDirection(rawDirection);
      return;
    }

    const held = readingFeedbackHoldRef.current;
    if (held && currentTimeMs - held.timeMs <= READING_FEEDBACK_HOLD_MS) {
      setVisibleReadingFeedbackDirection(held.direction);
      return;
    }

    readingFeedbackHoldRef.current = null;
    setVisibleReadingFeedbackDirection(null);
  }, [active, feedback, samples, selectedRange]);

  return visibleReadingFeedbackDirection;
}
