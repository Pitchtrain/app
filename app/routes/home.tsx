import { useState } from "react";
import { redirect } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  filterLibraryTexts,
  loadLibraryFilters,
  pickRandomLibraryText,
} from "~/readingLibraryFilters";
import type { Route } from "./+types/home";
import { isbot } from "isbot";
import { hasCompletedOnboarding } from "~/onboarding";
import {
  DEFAULT_LOCALE,
  localeFromPath,
  localizePath,
  preferredLocale,
  stripBasename,
} from "~/lib/locale";
import { pageMeta } from "~/lib/seo";
import { type ChartMode } from "~/components/PitchTimelineChart";
import { TopBar } from "~/components/TopBar";
import { type DesktopPanel, DesktopSidebar } from "~/components/DesktopSidebar";
import { useRangeSettingsState } from "~/features/home/hooks/useRangeSettingsState";
import { usePracticeState } from "~/features/home/hooks/usePracticeState";
import { useReadingState } from "~/features/home/hooks/useReadingState";
import { usePitchRecording } from "~/features/home/hooks/usePitchRecording";
import { useJournalLibrary } from "~/features/home/hooks/useJournalLibrary";
import { usePitchDisplayModel } from "~/features/home/hooks/usePitchDisplayModel";
import { useReadingFeedback } from "~/features/home/hooks/useReadingFeedback";
import { HomeChartPanel } from "~/features/home/components/HomeChartPanel";
import { PracticePane } from "~/features/home/components/PracticePane";
import { ReadingPane } from "~/features/home/components/ReadingPane";
import { SessionTransport } from "~/features/home/components/SessionTransport";
import { HomeOverlays } from "~/features/home/components/HomeOverlays";

const DEFAULT_TIMELINE_WINDOW_SECONDS = 10;

const HOME_FEATURE_KEYS = [
  "routes.about.feature1",
  "routes.about.feature2",
  "routes.about.feature3",
  "routes.about.feature4",
  "routes.about.feature5",
  "routes.about.feature6",
] as const;

export function meta({ location }: Route.MetaArgs) {
  return pageMeta("home", location);
}

export function clientLoader({ request }: Route.ClientLoaderArgs) {
  // Crawlers have no stored state; send them neither to the onboarding tour
  // nor to another language (docs/adr/0001-locale-urls.md).
  if (isbot(navigator.userAgent)) return null;
  const locale = localeFromPath(stripBasename(new URL(request.url).pathname));
  if (locale === DEFAULT_LOCALE) {
    const preferred = preferredLocale();
    if (preferred !== locale) throw redirect(localizePath("/", preferred));
  }
  if (!hasCompletedOnboarding()) {
    throw redirect(localizePath("/welcome", locale));
  }
  return null;
}

// Prerendered in place of the app, which needs the browser; gives crawlers
// without JavaScript real content to read.
export function HydrateFallback() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-12 text-ink">
      <h1 className="text-3xl font-semibold tracking-tight">{t("routes.home.heading")}</h1>
      <p className="mt-3 text-slate-700">{t("routes.home.intro")}</p>
      <h2 className="mt-6 text-lg font-semibold">{t("routes.about.featuresTitle")}</h2>
      <ul className="mt-2 space-y-1 text-slate-700">
        {HOME_FEATURE_KEYS.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-slate-500" aria-live="polite">
        {t("routes.home.loading")}
      </p>
    </main>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const [desktopPanel, setDesktopPanel] = useState<DesktopPanel>("range");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [timelineWindowSeconds, setTimelineWindowSeconds] = useState(
    DEFAULT_TIMELINE_WINDOW_SECONDS,
  );
  const [chartMode, setChartMode] = useState<ChartMode>("full");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const range = useRangeSettingsState();
  const practice = usePracticeState();
  const reading = useReadingState({ desktopPanel, setDesktopPanel });
  const recording = usePitchRecording({
    t,
    selectedRange: range.selectedRange,
    detectorAlgorithm: range.detectorAlgorithm,
    practiceView: reading.practiceView,
    setPracticeView: reading.setPracticeView,
    onActiveSessionChange: setActiveSessionId,
  });
  const journal = useJournalLibrary({
    t,
    recordingSession: recording.recordingSession,
    activeSessionId,
    setActiveSessionId,
    loadSavedSession: recording.loadSavedSession,
    readingSettings: reading.readingSettings,
    setReadingSettings: reading.setReadingSettings,
    practiceSettings: practice.practiceSettings,
    setPracticeSettings: practice.setPracticeSettings,
  });
  const display = usePitchDisplayModel({
    t,
    samples: recording.samples,
    recordingSession: recording.recordingSession,
    mode: recording.mode,
    replayTimeMs: recording.replayTimeMs,
    timelineWindowSeconds,
    selectedRange: range.selectedRange,
    customRange: range.customRange,
    highlightedRanges: range.highlightedRanges,
  });

  const isReadingMode =
    reading.practiceView === "reading" && recording.mode !== "review";
  const isSentenceFeedbackActive =
    reading.practiceView === "standard" &&
    recording.mode !== "review" &&
    practice.practiceSettings.sentenceFeedbackEnabled;
  const visibleReadingFeedbackDirection = useReadingFeedback({
    samples: recording.samples,
    selectedRange: range.selectedRange,
    feedback: reading.readingSettings.feedback,
    active: isReadingMode || isSentenceFeedbackActive,
  });
  const totalStorageBytes = journal.journalSessions.reduce(
    (sum, session) => sum + session.audioBlob.size,
    0,
  );

  function showRandomReadingText() {
    const text = pickRandomLibraryText(filterLibraryTexts(loadLibraryFilters()));
    if (!text) return;
    reading.setReadingSettings((prev) => ({ ...prev, activeTextId: text.id }));
    toast.success(t("reading.randomShown", { title: text.title }));
  }

  function handleDesktopReadingSettingsChange(
    next: typeof reading.readingSettings,
  ) {
    if (
      next.activeTextId !== reading.readingSettings.activeTextId &&
      !isReadingMode
    ) {
      reading.enterReadingMode();
    }
    reading.setReadingSettings(next);
  }

  function openPracticeSets() {
    if (hasDesktopSidebar()) {
      setDesktopPanel("sets");
      practice.setPracticeDrawerOpen(false);
      return;
    }
    practice.setPracticeDrawerOpen(true);
  }

  const chartPanel = (
    <HomeChartPanel
      samples={display.chartSamples}
      range={display.displayRange}
      playheadMs={display.playheadMs}
      timelineWindowSeconds={timelineWindowSeconds}
      chartMode={chartMode}
      onChartModeChange={setChartMode}
      highlightedRanges={range.highlightedRanges}
      isReadingMode={isReadingMode}
      mode={recording.mode}
      statusLabel={display.statusLabel}
      onPrev={practice.prevPrompt}
      onNext={practice.nextPrompt}
      onScrub={recording.seek}
      onEnterReadingMode={reading.enterReadingMode}
      onLeaveReadingMode={reading.leaveReadingMode}
      onOpenJournal={() => journal.setJournalDrawerOpen(true)}
      onOpenSettings={() => setSettingsOpen(true)}
    />
  );

  return (
    <main className="flex h-screen-dynamic flex-col text-ink">
      <TopBar />
      <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[1fr_auto]">
        <div className="relative flex min-h-0 flex-col overflow-hidden">
          {isReadingMode ? (
            <ReadingPane
              chartPanel={chartPanel}
              activeReadingText={reading.activeReadingText}
              feedbackDirection={visibleReadingFeedbackDirection}
              onOpenOptions={reading.openReadingOptions}
              onRandomText={showRandomReadingText}
            />
          ) : (
            <PracticePane
              chartPanel={chartPanel}
              metrics={display.metrics}
              sets={practice.practiceSettings.sets}
              activeSetIds={practice.practiceSettings.activeSetIds}
              pool={practice.practicePool}
              index={practice.practiceIndex}
              shuffleEnabled={practice.practiceSettings.shuffleEnabled}
              autoAdvanceEnabled={practice.practiceSettings.autoAdvanceEnabled}
              autoAdvanceSeconds={practice.practiceSettings.autoAdvanceSeconds}
              feedbackDirection={
                isSentenceFeedbackActive
                  ? visibleReadingFeedbackDirection
                  : null
              }
              onPrev={practice.prevPrompt}
              onNext={practice.nextPrompt}
              onToggleSet={practice.togglePracticeSet}
              onOpenManage={openPracticeSets}
              onOpenActiveSheet={() =>
                practice.setPracticeActiveSheetOpen(true)
              }
              onShuffleToggle={practice.setShuffleEnabled}
              onAutoAdvanceToggle={practice.setAutoAdvanceEnabled}
            />
          )}
          <SessionTransport
            mode={recording.mode}
            recordingSession={recording.recordingSession}
            audioRef={recording.audioRef}
            isPlaying={recording.isPlaying}
            replayTimeMs={recording.replayTimeMs}
            durationMs={recording.durationMs}
            elapsedMs={recording.elapsedMs}
            isReadingMode={isReadingMode}
            canSave={activeSessionId == null}
            onTogglePlay={recording.togglePlay}
            onSeek={recording.seek}
            onDismiss={recording.dismiss}
            onSave={() => void journal.handleSave()}
            onStart={() => void recording.start()}
            onStop={recording.stop}
            onPause={recording.pause}
            onResume={recording.resume}
          />
        </div>

        <DesktopSidebar
          panel={desktopPanel}
          onPanelChange={setDesktopPanel}
          practiceSets={practice.practiceSettings.sets}
          activeSetIds={practice.practiceSettings.activeSetIds}
          onPracticeSetsChange={practice.handlePracticeSetsChange}
          autoAdvanceEnabled={practice.practiceSettings.autoAdvanceEnabled}
          onAutoAdvanceToggle={practice.setAutoAdvanceEnabled}
          autoAdvanceSeconds={practice.practiceSettings.autoAdvanceSeconds}
          onAutoAdvanceSecondsChange={practice.setAutoAdvanceSeconds}
          sentenceFeedbackEnabled={
            practice.practiceSettings.sentenceFeedbackEnabled
          }
          onSentenceFeedbackToggle={practice.setSentenceFeedbackEnabled}
          ranges={range.ranges}
          selectedRangeId={range.selectedRangeId}
          onSelectRange={range.setSelectedRangeId}
          customRange={range.customRange}
          customRangeInputs={range.customRangeInputs}
          onCustomChange={range.handleCustomRangeChange}
          onCustomBlur={range.handleCustomRangeBlur}
          customHighlighted={range.customHighlighted}
          onCustomHighlightChange={range.setCustomHighlighted}
          presetsHighlighted={range.presetsHighlighted}
          onPresetsHighlightChange={range.setPresetsHighlighted}
          readingFeedback={reading.readingSettings.feedback}
          onReadingFeedbackChange={(feedback) =>
            reading.setReadingSettings((prev) => ({ ...prev, feedback }))
          }
          detectorAlgorithm={range.detectorAlgorithm}
          onDetectorChange={range.setDetectorAlgorithm}
          timelineWindowSeconds={timelineWindowSeconds}
          onWindowChange={setTimelineWindowSeconds}
          journalSessions={journal.journalSessions}
          journalTags={journal.journalTags}
          activeSessionId={activeSessionId}
          activeJournalTagId={journal.activeJournalTagId}
          onLoadSession={(id) => void journal.handleLoadSession(id)}
          onRenameSession={(id, name) =>
            void journal.handleRenameSession(id, name)
          }
          onSessionTagChange={(id, tagIds) =>
            void journal.handleSessionTagChange(id, tagIds)
          }
          onCreateJournalTag={journal.handleCreateJournalTag}
          onUpdateJournalTag={journal.handleUpdateJournalTag}
          onDeleteJournalTag={(id) => void journal.handleDeleteJournalTag(id)}
          onJournalTagFilterChange={journal.setActiveJournalTagId}
          onDeleteSession={(id) => void journal.handleDeleteSession(id)}
          onDownloadSession={(id) => void journal.handleDownloadSessionById(id)}
          onExportJournal={() => void journal.handleExportJournal()}
          onImportJournal={(file) => void journal.handleImportJournal(file)}
          canExportJournal={journal.canExportJournal}
          journalSessionCount={journal.journalSessions.length}
          onClearAllJournal={() => void journal.handleClearAllSessions()}
          readingSettings={reading.readingSettings}
          onReadingSettingsChange={handleDesktopReadingSettingsChange}
        />
      </div>

      <HomeOverlays
        settingsOpen={settingsOpen}
        onSettingsOpenChange={setSettingsOpen}
        detectorAlgorithm={range.detectorAlgorithm}
        onDetectorChange={range.setDetectorAlgorithm}
        timelineWindowSeconds={timelineWindowSeconds}
        onWindowChange={setTimelineWindowSeconds}
        ranges={range.ranges}
        selectedRangeId={range.selectedRangeId}
        onSelectRange={range.setSelectedRangeId}
        customRange={range.customRange}
        customRangeInputs={range.customRangeInputs}
        onCustomChange={range.handleCustomRangeChange}
        onCustomBlur={range.handleCustomRangeBlur}
        customHighlighted={range.customHighlighted}
        onCustomHighlightChange={range.setCustomHighlighted}
        presetsHighlighted={range.presetsHighlighted}
        onPresetsHighlightChange={range.setPresetsHighlighted}
        readingFeedback={reading.readingSettings.feedback}
        onReadingFeedbackChange={(feedback) =>
          reading.setReadingSettings((prev) => ({ ...prev, feedback }))
        }
        journalSessionCount={journal.journalSessions.length}
        onClearAllJournal={() => void journal.handleClearAllSessions()}
        practiceDrawerOpen={practice.practiceDrawerOpen}
        onPracticeDrawerOpenChange={practice.setPracticeDrawerOpen}
        practiceSets={practice.practiceSettings.sets}
        activeSetIds={practice.practiceSettings.activeSetIds}
        onPracticeSetsChange={practice.handlePracticeSetsChange}
        journalDrawerOpen={journal.journalDrawerOpen}
        onJournalDrawerOpenChange={journal.setJournalDrawerOpen}
        journalSessions={journal.journalSessions}
        journalTags={journal.journalTags}
        activeSessionId={activeSessionId}
        activeJournalTagId={journal.activeJournalTagId}
        totalStorageBytes={totalStorageBytes}
        onLoadSession={(id) => void journal.handleLoadSession(id)}
        onRenameSession={(id, name) =>
          void journal.handleRenameSession(id, name)
        }
        onSessionTagChange={(id, tagIds) =>
          void journal.handleSessionTagChange(id, tagIds)
        }
        onCreateJournalTag={journal.handleCreateJournalTag}
        onUpdateJournalTag={journal.handleUpdateJournalTag}
        onDeleteJournalTag={(id) => void journal.handleDeleteJournalTag(id)}
        onJournalTagFilterChange={journal.setActiveJournalTagId}
        onDeleteSession={(id) => void journal.handleDeleteSession(id)}
        onDownloadSession={(id) => void journal.handleDownloadSessionById(id)}
        onExportJournal={() => void journal.handleExportJournal()}
        onImportJournal={(file) => void journal.handleImportJournal(file)}
        canExportJournal={journal.canExportJournal}
        saveDialogSession={journal.saveDialogSession}
        onSaveDialogClose={() => journal.setSaveDialogSession(null)}
        practiceActiveSheetOpen={practice.practiceActiveSheetOpen}
        onPracticeActiveSheetOpenChange={practice.setPracticeActiveSheetOpen}
        onTogglePracticeSet={practice.togglePracticeSet}
        shuffleEnabled={practice.practiceSettings.shuffleEnabled}
        onShuffleToggle={practice.setShuffleEnabled}
        autoAdvanceEnabled={practice.practiceSettings.autoAdvanceEnabled}
        onAutoAdvanceToggle={practice.setAutoAdvanceEnabled}
        autoAdvanceSeconds={practice.practiceSettings.autoAdvanceSeconds}
        onAutoAdvanceSecondsChange={practice.setAutoAdvanceSeconds}
        sentenceFeedbackEnabled={
          practice.practiceSettings.sentenceFeedbackEnabled
        }
        onSentenceFeedbackToggle={practice.setSentenceFeedbackEnabled}
        onOpenPracticeSets={openPracticeSets}
        readingDrawerOpen={reading.readingDrawerOpen}
        onReadingDrawerOpenChange={reading.setReadingDrawerOpen}
        readingSettings={reading.readingSettings}
        onReadingSettingsChange={reading.setReadingSettings}
      />
    </main>
  );
}

function hasDesktopSidebar() {
  return window.matchMedia("(min-width: 1024px)").matches;
}
