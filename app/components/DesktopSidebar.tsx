import {SiGithub} from "@icons-pack/react-simple-icons";
import {
    BookMarkedIcon,
    BookOpenTextIcon,
    CaseSensitiveIcon,
    ChevronDownIcon,
    ChevronsRightIcon,
    InfoIcon,
    SettingsIcon,
    SlidersHorizontalIcon,
} from "lucide-react";
import type {ReactNode} from "react";
import {useTranslation} from "react-i18next";
import {Link} from "react-router";
import {useLocale} from "~/hooks/useLocale";
import type {
    DetectorAlgorithm,
    JournalTag,
    PracticeSet,
    ReadingFeedbackSettings,
    ReadingSettings,
    SavedSession,
    VoiceRange,
} from "~/types";
import {CUSTOM_RANGE_ID} from "~/ranges";
import {Button} from "./ui/button";
import {Tooltip, TooltipContent, TooltipTrigger} from "./ui/tooltip";
import {CustomRangeFields, HighlightToggle, VoiceRangesPanel} from "./VoiceRangesPanel";
import {JournalPanel} from "./JournalPanel";
import {AdvancedSettingsPanel, type AdvancedSettingsPanelProps} from "./SettingsDrawer";
import type {FeatureToggles} from "~/featureToggles";
import {PracticeSetsPanel} from "./PracticeSetsDrawer";
import {ReadingOptionsPanel} from "./ReadingOptionsDrawer";
import {ReadingFeedbackControls} from "./ReadingFeedbackControls";

export type DesktopPanel = "range" | "sets" | "journal" | "reading" | "settings" | null;

type Props = {
    panel: DesktopPanel;
    onPanelChange: (panel: DesktopPanel) => void;
    practiceSets: PracticeSet[];
    activeSetIds: string[];
    onPracticeSetsChange: (sets: PracticeSet[], activeSetIds: string[]) => void;
    autoAdvanceEnabled: boolean;
    onAutoAdvanceToggle: (enabled: boolean) => void;
    autoAdvanceSeconds: number;
    onAutoAdvanceSecondsChange: (seconds: number) => void;
    sentenceFeedbackEnabled: boolean;
    onSentenceFeedbackToggle: (enabled: boolean) => void;
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
    detectorAlgorithm: DetectorAlgorithm;
    onDetectorChange: (value: DetectorAlgorithm) => void;
    timelineWindowSeconds: number;
    onWindowChange: (value: number) => void;
    journalSessions: SavedSession[];
    journalTags: JournalTag[];
    activeSessionId?: string | null;
    activeJournalTagId: string | null;
    onLoadSession: (id: string) => void;
    onRenameSession: (id: string, name: string) => void;
    onSessionTagChange: (id: string, tagIds: string[]) => void;
    onCreateJournalTag: (label: string, color: string) => JournalTag | null;
    onUpdateJournalTag: (id: string, label: string, color: string) => void;
    onDeleteJournalTag: (id: string) => void;
    onJournalTagFilterChange: (tagId: string | null) => void;
    onDeleteSession: (id: string) => void;
    onDownloadSession: (id: string) => void;
    onExportJournal: () => void;
    onImportJournal: (file: File) => void;
    canExportJournal?: boolean;
    journalSessionCount: number;
    onClearAllJournal: () => void;
    readingSettings: ReadingSettings;
    onReadingSettingsChange: (settings: ReadingSettings) => void;
    featureToggles: FeatureToggles;
    onFeatureTogglesChange: (toggles: FeatureToggles) => void;
    featureTogglesLocked: boolean;
};

export function DesktopSidebar({
    panel,
    onPanelChange,
    practiceSets,
    activeSetIds,
    onPracticeSetsChange,
    autoAdvanceEnabled,
    onAutoAdvanceToggle,
    autoAdvanceSeconds,
    onAutoAdvanceSecondsChange,
    sentenceFeedbackEnabled,
    onSentenceFeedbackToggle,
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
    detectorAlgorithm,
    onDetectorChange,
    timelineWindowSeconds,
    onWindowChange,
    journalSessions,
    journalTags,
    activeSessionId,
    activeJournalTagId,
    onLoadSession,
    onRenameSession,
    onSessionTagChange,
    onCreateJournalTag,
    onUpdateJournalTag,
    onDeleteJournalTag,
    onJournalTagFilterChange,
    onDeleteSession,
    onDownloadSession,
    onExportJournal,
    canExportJournal,
    onImportJournal,
    journalSessionCount,
    onClearAllJournal,
    readingSettings,
    onReadingSettingsChange,
    featureToggles,
    onFeatureTogglesChange,
    featureTogglesLocked,
}: Props) {
    const {t} = useTranslation();

    return (
        <aside className="hidden min-h-0 border-l border-slate-200/60 bg-white/70 lg:flex">
            {panel ? (
                <div className="flex w-80 min-h-0 flex-col border-r border-slate-200/60">
                    <PanelHeader
                        title={
                            panel === "range"
                                ? t("sidebar.range")
                                : panel === "sets"
                                    ? t("sidebar.sets")
                                    : panel === "journal"
                                        ? t("sidebar.journal")
                                        : panel === "reading"
                                            ? t("sidebar.reading")
                                            : t("settings.title")
                        }
                        onCollapse={() => onPanelChange(null)}
                    />
                    {panel === "range" ? (
                        <RangePanel
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
                        />
                    ) : panel === "sets" ? (
                        <PracticeSetsPanel
                            sets={practiceSets}
                            activeSetIds={activeSetIds}
                            onChange={onPracticeSetsChange}
                            autoAdvanceEnabled={autoAdvanceEnabled}
                            onAutoAdvanceToggle={onAutoAdvanceToggle}
                            autoAdvanceSeconds={autoAdvanceSeconds}
                            onAutoAdvanceSecondsChange={onAutoAdvanceSecondsChange}
                            sentenceFeedbackEnabled={sentenceFeedbackEnabled}
                            onSentenceFeedbackToggle={onSentenceFeedbackToggle}
                            className="flex-1 pt-4"
                        />
                    ) : panel === "journal" ? (
                        <JournalPanel
                            sessions={journalSessions}
                            tags={journalTags}
                            activeSessionId={activeSessionId}
                            activeTagId={activeJournalTagId}
                            totalStorageBytes={journalSessions.reduce((sum, session) => sum + session.audioBlob.size, 0)}
                            onLoad={onLoadSession}
                            onRename={onRenameSession}
                            onTagChange={onSessionTagChange}
                            onCreateTag={onCreateJournalTag}
                            onUpdateTag={onUpdateJournalTag}
                            onDeleteTag={onDeleteJournalTag}
                            onTagFilterChange={onJournalTagFilterChange}
                            onDelete={onDeleteSession}
                            onDownload={onDownloadSession}
                            onExport={onExportJournal}
                            onImport={onImportJournal}
                            canExport={canExportJournal}
                        />
                    ) : panel === "reading" ? (
                        <ReadingOptionsPanel
                            settings={readingSettings}
                            onChange={onReadingSettingsChange}
                            className="flex-1 pt-4"
                        />
                    ) : (
                        <SettingsPanel
                            detectorAlgorithm={detectorAlgorithm}
                            onDetectorChange={onDetectorChange}
                            timelineWindowSeconds={timelineWindowSeconds}
                            onWindowChange={onWindowChange}
                            journalSessionCount={journalSessionCount}
                            onClearAllJournal={onClearAllJournal}
                            featureToggles={featureToggles}
                            onFeatureTogglesChange={onFeatureTogglesChange}
                            featureTogglesLocked={featureTogglesLocked}
                        />
                    )}
                </div>
            ) : null}
            <Rail
                panel={panel}
                onPanelChange={onPanelChange}
                featureToggles={featureToggles}
            />
        </aside>
    );
}

function PanelHeader({
    title,
    onCollapse,
}: {
    title: string;
    onCollapse: () => void;
}) {
    const {t} = useTranslation();

    return (
        <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200/60 px-4">
            <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onCollapse}
                aria-label={t("sidebar.collapse")}
            >
                <ChevronsRightIcon className="size-4"/>
            </Button>
        </div>
    );
}

function Rail({
    panel,
    onPanelChange,
    featureToggles,
}: {
    panel: DesktopPanel;
    onPanelChange: (panel: DesktopPanel) => void;
    featureToggles: FeatureToggles;
}) {
    const {t} = useTranslation();
    const {localePath} = useLocale();

    return (
        <div className="flex shrink-0 flex-col items-center gap-2 px-2 py-3">
            <RailButton
                label={t("sidebar.range")}
                active={panel === "range"}
                onClick={() => onPanelChange(panel === "range" ? null : "range")}
                icon={<SlidersHorizontalIcon className="size-5"/>}
            />
            {featureToggles.prompts ? (
                <RailButton
                    label={t("sidebar.sets")}
                    active={panel === "sets"}
                    onClick={() => onPanelChange(panel === "sets" ? null : "sets")}
                    icon={<CaseSensitiveIcon className="size-5"/>}
                />
            ) : null}
            {featureToggles.journal ? (
                <RailButton
                    label={t("sidebar.journal")}
                    active={panel === "journal"}
                    onClick={() => onPanelChange(panel === "journal" ? null : "journal")}
                    icon={<BookMarkedIcon className="size-5"/>}
                />
            ) : null}
            {featureToggles.reading ? (
                <RailButton
                    label={t("sidebar.reading")}
                    active={panel === "reading"}
                    onClick={() => onPanelChange(panel === "reading" ? null : "reading")}
                    icon={<BookOpenTextIcon className="size-5"/>}
                />
            ) : null}
            <div className="mt-auto flex flex-col items-center gap-2">
                <RailLink
                    label="GitHub"
                    to="https://github.com/Pitchtrain/app"
                    external
                    icon={<SiGithub className="size-5"/>}
                />
                <RailLink
                    label={t("common.about")}
                    to={localePath("/about")}
                    icon={<InfoIcon className="size-5"/>}
                />
                <RailButton
                    label={t("settings.title")}
                    active={panel === "settings"}
                    onClick={() => onPanelChange(panel === "settings" ? null : "settings")}
                    icon={<SettingsIcon className="size-5"/>}
                />
            </div>
        </div>
    );
}

function RailLink({
    label,
    to,
    icon,
    external,
}: {
    label: string;
    to: string;
    icon: ReactNode;
    external?: boolean;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    asChild
                    variant="ghost"
                    size="icon-lg"
                    aria-label={label}
                    className="text-slate-500 hover:text-ink"
                >
                    <Link to={to} {...(external ? {target: "_blank", rel: "noopener noreferrer"} : {})}>{icon}</Link>
                </Button>
            </TooltipTrigger>
            <TooltipContent side="left">{label}</TooltipContent>
        </Tooltip>
    );
}

function RailButton({
    label,
    active,
    onClick,
    icon,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
    icon: ReactNode;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant={active ? "secondary" : "ghost"}
                    size="icon-lg"
                    onClick={onClick}
                    aria-label={label}
                    aria-pressed={active}
                    className={active ? "bg-sea/15 text-ink hover:bg-sea/20" : "text-slate-500 hover:text-ink"}
                >
                    {icon}
                </Button>
            </TooltipTrigger>
            <TooltipContent side="left">{label}</TooltipContent>
        </Tooltip>
    );
}

function RangePanel({
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
}: {
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
}) {
    const {t} = useTranslation();
    const customSelected = selectedRangeId === CUSTOM_RANGE_ID;

    return (
        <div className="min-h-0 flex-1 overflow-y-auto">
            <VoiceRangesPanel
                ranges={ranges}
                selectedRangeId={selectedRangeId}
                onSelectRange={onSelectRange}
                customRange={customRange}
            />
            <section className="space-y-3 px-4 pb-4">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t("settings.defaultRanges")}
                    </p>
                    <HighlightToggle
                        enabled={presetsHighlighted}
                        onChange={onPresetsHighlightChange}
                    />
                </div>
            </section>

            <section className="px-4 pb-4">
                {customSelected ? (
                    <CustomRangeFields
                        customRange={customRange}
                        customRangeInputs={customRangeInputs}
                        onCustomChange={onCustomChange}
                        onCustomBlur={onCustomBlur}
                        selected
                        onSelect={() => onSelectRange(CUSTOM_RANGE_ID)}
                        highlightEnabled={customHighlighted}
                        onHighlightChange={onCustomHighlightChange}
                    />
                ) : (
                    <details className="group rounded-lg border border-slate-200 bg-white">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium text-ink">
                            {t("ranges.customRange")}
                            <ChevronDownIcon className="size-4 text-slate-400 transition-transform group-open:rotate-180"/>
                        </summary>
                        <div className="border-t border-slate-200 p-3">
                            <CustomRangeFields
                                customRange={customRange}
                                customRangeInputs={customRangeInputs}
                                onCustomChange={onCustomChange}
                                onCustomBlur={onCustomBlur}
                                selected={false}
                                onSelect={() => onSelectRange(CUSTOM_RANGE_ID)}
                                highlightEnabled={customHighlighted}
                                onHighlightChange={onCustomHighlightChange}
                            />
                        </div>
                    </details>
                )}
            </section>

            <section className="px-4 pb-4">
                <ReadingFeedbackControls
                    feedback={readingFeedback}
                    onChange={onReadingFeedbackChange}
                    className="border-t border-slate-200/70 pt-4"
                />
            </section>
        </div>
    );
}

function SettingsPanel(props: AdvancedSettingsPanelProps) {
    return (
        <div className="min-h-0 flex-1 overflow-y-auto">
            <AdvancedSettingsPanel {...props}/>
        </div>
    );
}
