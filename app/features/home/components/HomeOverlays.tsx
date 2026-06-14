import type {
  DetectorAlgorithm,
  JournalTag,
  PracticeSet,
  ReadingFeedbackSettings,
  ReadingSettings,
  SavedSession,
  VoiceRange,
} from "~/types";
import { SettingsDrawer } from "~/components/SettingsDrawer";
import { PracticeSetsDrawer } from "~/components/PracticeSetsDrawer";
import { JournalDrawer } from "~/components/JournalDrawer";
import { JournalSaveDialog } from "~/components/JournalSaveDialog";
import { PracticeActiveSheet } from "~/components/PracticeActiveSheet";
import { ReadingOptionsDrawer } from "~/components/ReadingOptionsDrawer";

type Props = {
  settingsOpen: boolean;
  onSettingsOpenChange: (open: boolean) => void;
  detectorAlgorithm: DetectorAlgorithm;
  onDetectorChange: (value: DetectorAlgorithm) => void;
  timelineWindowSeconds: number;
  onWindowChange: (value: number) => void;
  ranges: VoiceRange[];
  selectedRangeId: string;
  onSelectRange: (id: string) => void;
  customRange: VoiceRange;
  customRangeInputs: { minHz: string; maxHz: string };
  onCustomChange: (field: "minHz" | "maxHz", value: string) => void;
  onCustomBlur: (field: "minHz" | "maxHz") => void;
  customHighlighted: boolean;
  onCustomHighlightChange: (value: boolean) => void;
  presetsHighlighted: boolean;
  onPresetsHighlightChange: (value: boolean) => void;
  readingFeedback: ReadingFeedbackSettings;
  onReadingFeedbackChange: (settings: ReadingFeedbackSettings) => void;
  journalSessionCount: number;
  onClearAllJournal: () => void;
  practiceDrawerOpen: boolean;
  onPracticeDrawerOpenChange: (open: boolean) => void;
  practiceSets: PracticeSet[];
  activeSetIds: string[];
  onPracticeSetsChange: (sets: PracticeSet[], activeSetIds: string[]) => void;
  journalDrawerOpen: boolean;
  onJournalDrawerOpenChange: (open: boolean) => void;
  journalSessions: SavedSession[];
  journalTags: JournalTag[];
  activeSessionId: string | null;
  activeJournalTagId: string | null;
  totalStorageBytes: number;
  onLoadSession: (id: string) => void;
  onRenameSession: (id: string, name: string) => void;
  onSessionTagChange: (id: string, tagIds: string[]) => void;
  onCreateJournalTag: (label: string, color: string) => JournalTag | null;
  onJournalTagFilterChange: (tagId: string | null) => void;
  onDeleteSession: (id: string) => void;
  onDownloadSession: (id: string) => void;
  onExportJournal: () => void;
  onImportJournal: (file: File) => void;
  saveDialogSession: SavedSession | null;
  onSaveDialogClose: () => void;
  practiceActiveSheetOpen: boolean;
  onPracticeActiveSheetOpenChange: (open: boolean) => void;
  onTogglePracticeSet: (id: string) => void;
  shuffleEnabled: boolean;
  onShuffleToggle: (enabled: boolean) => void;
  autoAdvanceEnabled: boolean;
  onAutoAdvanceToggle: (enabled: boolean) => void;
  autoAdvanceSeconds: number;
  onAutoAdvanceSecondsChange: (seconds: number) => void;
  sentenceFeedbackEnabled: boolean;
  onSentenceFeedbackToggle: (enabled: boolean) => void;
  onOpenPracticeSets: () => void;
  readingDrawerOpen: boolean;
  onReadingDrawerOpenChange: (open: boolean) => void;
  readingSettings: ReadingSettings;
  onReadingSettingsChange: (settings: ReadingSettings) => void;
};

export function HomeOverlays({
  settingsOpen,
  onSettingsOpenChange,
  detectorAlgorithm,
  onDetectorChange,
  timelineWindowSeconds,
  onWindowChange,
  ranges,
  selectedRangeId,
  onSelectRange,
  customRange,
  customRangeInputs,
  onCustomChange,
  onCustomBlur,
  customHighlighted,
  onCustomHighlightChange,
  presetsHighlighted,
  onPresetsHighlightChange,
  readingFeedback,
  onReadingFeedbackChange,
  journalSessionCount,
  onClearAllJournal,
  practiceDrawerOpen,
  onPracticeDrawerOpenChange,
  practiceSets,
  activeSetIds,
  onPracticeSetsChange,
  journalDrawerOpen,
  onJournalDrawerOpenChange,
  journalSessions,
  journalTags,
  activeSessionId,
  activeJournalTagId,
  totalStorageBytes,
  onLoadSession,
  onRenameSession,
  onSessionTagChange,
  onCreateJournalTag,
  onJournalTagFilterChange,
  onDeleteSession,
  onDownloadSession,
  onExportJournal,
  onImportJournal,
  saveDialogSession,
  onSaveDialogClose,
  practiceActiveSheetOpen,
  onPracticeActiveSheetOpenChange,
  onTogglePracticeSet,
  shuffleEnabled,
  onShuffleToggle,
  autoAdvanceEnabled,
  onAutoAdvanceToggle,
  autoAdvanceSeconds,
  onAutoAdvanceSecondsChange,
  sentenceFeedbackEnabled,
  onSentenceFeedbackToggle,
  onOpenPracticeSets,
  readingDrawerOpen,
  onReadingDrawerOpenChange,
  readingSettings,
  onReadingSettingsChange,
}: Props) {
  return (
    <>
      <SettingsDrawer
        open={settingsOpen}
        onOpenChange={onSettingsOpenChange}
        detectorAlgorithm={detectorAlgorithm}
        onDetectorChange={onDetectorChange}
        timelineWindowSeconds={timelineWindowSeconds}
        onWindowChange={onWindowChange}
        ranges={ranges}
        selectedRangeId={selectedRangeId}
        onSelectRange={onSelectRange}
        customRange={customRange}
        customRangeInputs={customRangeInputs}
        onCustomChange={onCustomChange}
        onCustomBlur={onCustomBlur}
        customHighlighted={customHighlighted}
        onCustomHighlightChange={onCustomHighlightChange}
        presetsHighlighted={presetsHighlighted}
        onPresetsHighlightChange={onPresetsHighlightChange}
        readingFeedback={readingFeedback}
        onReadingFeedbackChange={onReadingFeedbackChange}
        journalSessionCount={journalSessionCount}
        onClearAllJournal={onClearAllJournal}
      />
      <PracticeSetsDrawer
        open={practiceDrawerOpen}
        onOpenChange={onPracticeDrawerOpenChange}
        sets={practiceSets}
        activeSetIds={activeSetIds}
        onChange={onPracticeSetsChange}
      />
      <JournalDrawer
        open={journalDrawerOpen}
        onOpenChange={onJournalDrawerOpenChange}
        sessions={journalSessions}
        tags={journalTags}
        activeSessionId={activeSessionId}
        activeTagId={activeJournalTagId}
        totalStorageBytes={totalStorageBytes}
        onLoad={onLoadSession}
        onRename={onRenameSession}
        onTagChange={onSessionTagChange}
        onCreateTag={onCreateJournalTag}
        onTagFilterChange={onJournalTagFilterChange}
        onDelete={onDeleteSession}
        onDownload={onDownloadSession}
        onExport={onExportJournal}
        onImport={onImportJournal}
      />
      <JournalSaveDialog
        session={saveDialogSession}
        tags={journalTags}
        onClose={onSaveDialogClose}
        onRename={onRenameSession}
        onDownload={onDownloadSession}
        onTagChange={onSessionTagChange}
        onCreateTag={onCreateJournalTag}
      />
      <PracticeActiveSheet
        open={practiceActiveSheetOpen}
        onOpenChange={onPracticeActiveSheetOpenChange}
        sets={practiceSets}
        activeSetIds={activeSetIds}
        onToggleSet={onTogglePracticeSet}
        shuffleEnabled={shuffleEnabled}
        onShuffleToggle={onShuffleToggle}
        autoAdvanceEnabled={autoAdvanceEnabled}
        onAutoAdvanceToggle={onAutoAdvanceToggle}
        autoAdvanceSeconds={autoAdvanceSeconds}
        onAutoAdvanceSecondsChange={onAutoAdvanceSecondsChange}
        sentenceFeedbackEnabled={sentenceFeedbackEnabled}
        onSentenceFeedbackToggle={onSentenceFeedbackToggle}
        onOpenManage={onOpenPracticeSets}
      />
      <ReadingOptionsDrawer
        open={readingDrawerOpen}
        onOpenChange={onReadingDrawerOpenChange}
        settings={readingSettings}
        onChange={onReadingSettingsChange}
      />
    </>
  );
}
