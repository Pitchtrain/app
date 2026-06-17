import { useEffect, useMemo, useRef, useState } from "react";
import type { PracticeItem, PracticeSet, PracticeSettings } from "~/types";
import {
  buildOrderedQueue,
  buildShuffledQueue,
  loadPracticeSettings,
  savePracticeSettings,
} from "~/practice";

function buildPool(
  settings: PracticeSettings,
  avoidFirstId?: string,
): PracticeItem[] {
  return settings.shuffleEnabled
    ? buildShuffledQueue(settings.sets, settings.activeSetIds, avoidFirstId)
    : buildOrderedQueue(settings.sets, settings.activeSetIds);
}

export function usePracticeState() {
  const initialPractice = useMemo(() => loadPracticeSettings(), []);
  const [practiceSettings, setPracticeSettings] =
    useState<PracticeSettings>(initialPractice);
  const [practiceDrawerOpen, setPracticeDrawerOpen] = useState(false);
  const [practiceActiveSheetOpen, setPracticeActiveSheetOpen] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practicePool, setPracticePool] = useState<PracticeItem[]>(() =>
    buildPool(initialPractice),
  );

  // Keep a stable run order; only rebuild on explicit regenerate so that
  // forward/back navigation within a run is deterministic.
  function regenerate(settings: PracticeSettings, avoidFirstId?: string) {
    setPracticePool(buildPool(settings, avoidFirstId));
    setPracticeIndex(0);
  }

  // Skip the very first effect run — the initial pool is already built above.
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    regenerate(practiceSettings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    practiceSettings.sets,
    practiceSettings.activeSetIds,
    practiceSettings.shuffleEnabled,
  ]);

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
    if (practiceIndex + 1 >= practicePool.length) {
      // End of run: ordered mode wraps in place; shuffle mode starts a fresh
      // run, avoiding the just-shown item landing first.
      if (practiceSettings.shuffleEnabled) {
        regenerate(practiceSettings, practicePool[practiceIndex].id);
      } else {
        setPracticeIndex(0);
      }
    } else {
      setPracticeIndex(practiceIndex + 1);
    }
  }

  function prevPrompt() {
    if (practicePool.length === 0) return;
    setPracticeIndex(
      (i) => (i - 1 + practicePool.length) % practicePool.length,
    );
  }

  function setShuffleEnabled(enabled: boolean) {
    // The shuffleEnabled effect regenerates the pool.
    setPracticeSettings((prev) => ({ ...prev, shuffleEnabled: enabled }));
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
