import { useEffect, useMemo, useState } from "react";
import type { PracticeSet, PracticeSettings } from "~/types";
import {
  buildOrderedQueue,
  buildShuffledQueue,
  loadPracticeSettings,
  savePracticeSettings,
} from "~/practice";

export function usePracticeState() {
  const initialPractice = useMemo(() => loadPracticeSettings(), []);
  const [practiceSettings, setPracticeSettings] =
    useState<PracticeSettings>(initialPractice);
  const [practiceDrawerOpen, setPracticeDrawerOpen] = useState(false);
  const [practiceActiveSheetOpen, setPracticeActiveSheetOpen] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceShuffleKey, setPracticeShuffleKey] = useState(0);

  const practicePool = useMemo(
    () =>
      practiceSettings.shuffleEnabled
        ? buildShuffledQueue(
            practiceSettings.sets,
            practiceSettings.activeSetIds,
          )
        : buildOrderedQueue(
            practiceSettings.sets,
            practiceSettings.activeSetIds,
          ),
    // re-shuffle when active set ids change, items change, shuffle flag flips, or user triggers reshuffle
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      practiceSettings.sets,
      practiceSettings.activeSetIds,
      practiceSettings.shuffleEnabled,
      practiceShuffleKey,
    ],
  );

  useEffect(() => {
    setPracticeIndex(0);
  }, [practicePool]);

  useEffect(() => {
    savePracticeSettings(practiceSettings);
  }, [practiceSettings]);

  function togglePracticeSet(id: string) {
    setPracticeSettings((prev) => {
      const isActive = prev.activeSetIds.includes(id);
      return {
        ...prev,
        activeSetIds: isActive
          ? prev.activeSetIds.filter((x) => x !== id)
          : [...prev.activeSetIds, id],
      };
    });
  }

  function handlePracticeSetsChange(
    sets: PracticeSet[],
    activeSetIds: string[],
  ) {
    setPracticeSettings((prev) => ({ ...prev, sets, activeSetIds }));
  }

  function nextPrompt() {
    if (practicePool.length === 0) return;
    setPracticeIndex((i) => {
      const next = i + 1;
      if (next >= practicePool.length) {
        if (practiceSettings.shuffleEnabled) {
          setPracticeShuffleKey((k) => k + 1);
        }
        return 0;
      }
      return next;
    });
  }

  function prevPrompt() {
    if (practicePool.length === 0) return;
    setPracticeIndex(
      (i) => (i - 1 + practicePool.length) % practicePool.length,
    );
  }

  function setShuffleEnabled(enabled: boolean) {
    setPracticeSettings((prev) => ({ ...prev, shuffleEnabled: enabled }));
    if (enabled) {
      setPracticeShuffleKey((k) => k + 1);
    }
  }

  function setAutoAdvanceSeconds(seconds: number) {
    setPracticeSettings((prev) => ({
      ...prev,
      autoAdvanceSeconds: Math.min(120, Math.max(1, Math.round(seconds))),
    }));
  }

  function setAutoAdvanceEnabled(enabled: boolean) {
    setPracticeSettings((prev) => ({ ...prev, autoAdvanceEnabled: enabled }));
  }

  function setSentenceFeedbackEnabled(enabled: boolean) {
    setPracticeSettings((prev) => ({
      ...prev,
      sentenceFeedbackEnabled: enabled,
    }));
  }

  return {
    practiceSettings,
    setPracticeSettings,
    practiceDrawerOpen,
    setPracticeDrawerOpen,
    practiceActiveSheetOpen,
    setPracticeActiveSheetOpen,
    practiceIndex,
    practicePool,
    togglePracticeSet,
    handlePracticeSetsChange,
    nextPrompt,
    prevPrompt,
    setShuffleEnabled,
    setAutoAdvanceSeconds,
    setAutoAdvanceEnabled,
    setSentenceFeedbackEnabled,
  };
}
