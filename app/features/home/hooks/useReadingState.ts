import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { DesktopPanel } from "~/components/DesktopSidebar";
import type { ReadingSettings } from "~/types";
import { loadReadingSettings, saveReadingSettings } from "~/reading";
import { READING_LIBRARY_TEXTS } from "~/readingSamples";
import type { PracticeView } from "../types";

type Args = {
  desktopPanel: DesktopPanel;
  setDesktopPanel: Dispatch<SetStateAction<DesktopPanel>>;
};

export function useReadingState({ desktopPanel, setDesktopPanel }: Args) {
  const initialReading = useMemo(() => loadReadingSettings(), []);
  const [readingSettings, setReadingSettings] =
    useState<ReadingSettings>(initialReading);
  const [readingDrawerOpen, setReadingDrawerOpen] = useState(false);
  const [practiceView, setPracticeView] = useState<PracticeView>("standard");

  useEffect(() => {
    saveReadingSettings(readingSettings);
  }, [readingSettings]);

  const activeReadingText =
    readingSettings.texts.find(
      (text) => text.id === readingSettings.activeTextId,
    ) ??
    READING_LIBRARY_TEXTS.find(
      (text) => text.id === readingSettings.activeTextId,
    ) ??
    readingSettings.texts[0] ??
    READING_LIBRARY_TEXTS[0] ??
    null;

  function enterReadingMode() {
    setPracticeView("reading");
    if (hasDesktopSidebar()) {
      setDesktopPanel("reading");
    }
  }

  function leaveReadingMode() {
    setPracticeView("standard");
    if (desktopPanel === "reading") {
      setDesktopPanel("range");
    }
  }

  function openReadingOptions() {
    if (hasDesktopSidebar()) {
      setDesktopPanel("reading");
      setReadingDrawerOpen(false);
      return;
    }
    setReadingDrawerOpen(true);
  }

  return {
    readingSettings,
    setReadingSettings,
    readingDrawerOpen,
    setReadingDrawerOpen,
    practiceView,
    setPracticeView,
    activeReadingText,
    enterReadingMode,
    leaveReadingMode,
    openReadingOptions,
  };
}

function hasDesktopSidebar() {
  return window.matchMedia("(min-width: 1024px)").matches;
}
