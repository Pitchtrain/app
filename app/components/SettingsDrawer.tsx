import {Link, useNavigate} from "react-router";
import {useLocale} from "~/hooks/useLocale";
import {isLocale} from "~/lib/locale";
import {BookOpenIcon, RotateCcwIcon, ShieldIcon, Trash2Icon} from "lucide-react";
import {SiGithub} from "@icons-pack/react-simple-icons";
import {useTranslation} from "react-i18next";
import type {DetectorAlgorithm, ReadingFeedbackSettings, VoiceRange} from "~/types";
import {Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle,} from "./ui/drawer";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "./ui/select";
import {CustomRangeFields, HighlightToggle} from "./VoiceRangesPanel";
import {CUSTOM_RANGE_ID} from "~/ranges";
import {Separator} from "./ui/separator";
import {resetOnboarding} from "~/onboarding";
import {Button} from "./ui/button";
import {ReadingFeedbackControls} from "./ReadingFeedbackControls";

const DETECTOR_OPTIONS: Array<{ value: DetectorAlgorithm; label: string }> = [
    {value: "macleod", label: "Macleod"},
    {value: "yin", label: "YIN"},
    {value: "amdf", label: "AMDF"},
];

const WINDOW_OPTIONS = [5, 10, 15, 20, 30];

const LANGUAGE_OPTIONS = [
    {value: "en", labelKey: "common.english"},
    {value: "de", labelKey: "common.german"},
] as const;

export type SettingsPanelProps = {
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
};

export function SettingsPanel({
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
                              }: SettingsPanelProps) {
    const {t} = useTranslation();
    const orderedRanges = [
        ...ranges
            .filter((range) => range.id !== CUSTOM_RANGE_ID)
            .slice()
            .reverse(),
        ...ranges.filter((range) => range.id === CUSTOM_RANGE_ID),
    ];

    return (
        <>
            <div className="space-y-5 p-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t("settings.selectedRange")}
                    </label>
                    <Select value={selectedRangeId} onValueChange={onSelectRange}>
                        <SelectTrigger className="w-full">
                            <SelectValue/>
                        </SelectTrigger>
                        <SelectContent>
                            {orderedRanges.map((range) => (
                                <SelectItem key={range.id} value={range.id}>
                                    {t("settings.rangeWithHz", {
                                        label: t(`ranges.${range.id}`, {defaultValue: range.label}),
                                        minHz: range.minHz,
                                        maxHz: range.maxHz,
                                    })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-between gap-3">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t("settings.defaultRanges")}
                    </label>
                    <HighlightToggle
                        enabled={presetsHighlighted}
                        onChange={onPresetsHighlightChange}
                    />
                </div>

                <CustomRangeFields
                    customRange={customRange}
                    customRangeInputs={customRangeInputs}
                    onCustomChange={onCustomChange}
                    onCustomBlur={onCustomBlur}
                    selected={selectedRangeId === CUSTOM_RANGE_ID}
                    onSelect={() => onSelectRange(CUSTOM_RANGE_ID)}
                    highlightEnabled={customHighlighted}
                    onHighlightChange={onCustomHighlightChange}
                />

                <ReadingFeedbackControls
                    feedback={readingFeedback}
                    onChange={onReadingFeedbackChange}
                    className="border-t border-slate-200/70 pt-4"
                />
            </div>

            <Separator className="my-1"/>

            <AdvancedSettingsPanel
                detectorAlgorithm={detectorAlgorithm}
                onDetectorChange={onDetectorChange}
                timelineWindowSeconds={timelineWindowSeconds}
                onWindowChange={onWindowChange}
                journalSessionCount={journalSessionCount}
                onClearAllJournal={onClearAllJournal}
            />
        </>
    );
}

export function AdvancedSettingsPanel({
    detectorAlgorithm,
    onDetectorChange,
    timelineWindowSeconds,
    onWindowChange,
    journalSessionCount,
    onClearAllJournal,
}: Pick<
    SettingsPanelProps,
    | "detectorAlgorithm"
    | "onDetectorChange"
    | "timelineWindowSeconds"
    | "onWindowChange"
    | "journalSessionCount"
    | "onClearAllJournal"
>) {
    const {t} = useTranslation();
    const {locale, switchLocale} = useLocale();

    return (
        <>
            <div className="space-y-5 p-4">
                <Field label={t("settings.algorithm")}>
                    <Select
                        value={detectorAlgorithm}
                        onValueChange={(value) =>
                            onDetectorChange(value as DetectorAlgorithm)
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue/>
                        </SelectTrigger>
                        <SelectContent>
                            {DETECTOR_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

                <Field label={t("settings.timeWindow")}>
                    <Select
                        value={String(timelineWindowSeconds)}
                        onValueChange={(value) => onWindowChange(Number(value))}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue/>
                        </SelectTrigger>
                        <SelectContent>
                            {WINDOW_OPTIONS.map((seconds) => (
                                <SelectItem key={seconds} value={String(seconds)}>
                                    {seconds}s
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

                <Field label={t("settings.language")}>
                    <Select
                        value={locale}
                        onValueChange={(value) => {
                            if (isLocale(value)) switchLocale(value);
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue/>
                        </SelectTrigger>
                        <SelectContent>
                            {LANGUAGE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {t(option.labelKey)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
            </div>

            <JournalDataSection
                sessionCount={journalSessionCount}
                onClearAll={onClearAllJournal}
            />

            <Separator className="my-1"/>

            <AboutSection/>
        </>
    );
}

function JournalDataSection({
    sessionCount,
    onClearAll,
}: {
    sessionCount: number;
    onClearAll: () => void;
}) {
    const {t} = useTranslation();

    return (
        <div className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
                <p className="text-sm font-medium text-ink">
                    {t("settings.clearData")}
                </p>
                <p className="text-xs text-slate-500">
                    {t("journal.sessions", {count: sessionCount})}
                </p>
            </div>
            <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onClearAll}
                disabled={sessionCount === 0}
                className="shrink-0"
            >
                <Trash2Icon className="size-3.5"/>
                {t("settings.clearDataAction")}
            </Button>
        </div>
    );
}

function AboutSection() {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const {localePath} = useLocale();

    function restartTour() {
        resetOnboarding();
        void navigate(localePath("/welcome"));
    }

    return (
        <div className="space-y-3 p-4">
            <button
                type="button"
                onClick={restartTour}
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:border-sea hover:bg-sea/5 cursor-pointer"
            >
                <RotateCcwIcon className="size-4 shrink-0 text-sea"/>
                <span className="flex-1">
                    <span className="font-medium">{t("settings.restartTour")}</span>
                </span>
            </button>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <AboutTile to={localePath("/about")} icon={<BookOpenIcon className="size-4"/>} label={t("common.about")}/>
                <AboutTile to={localePath("/privacy")} icon={<ShieldIcon className="size-4"/>} label={t("common.privacy")}/>
                <AboutTile to="https://github.com/Pitchtrain/app" icon={<SiGithub className="size-4"/>} label="GitHub" external/>
            </div>
        </div>
    );
}

function AboutTile({to, icon, label, external}: { to: string; icon: React.ReactNode; label: string; external?: boolean }) {
    return (
        <Link
            to={to}
            {...(external ? {target: "_blank", rel: "noopener noreferrer"} : {})}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
            <span className="text-slate-500">{icon}</span>
            <span>{label}</span>
        </Link>
    );
}

type DrawerProps = SettingsPanelProps & {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function SettingsDrawer({open, onOpenChange, ...panelProps}: DrawerProps) {
    const {t} = useTranslation();
    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[92dvh]">
                <DrawerHeader className="text-left">
                    <DrawerTitle>{t("settings.title")}</DrawerTitle>
                    <DrawerDescription>
                        {t("settings.description")}
                    </DrawerDescription>
                </DrawerHeader>
                <div className="min-h-0 flex-1 overflow-y-auto px-0 pb-4">
                    <SettingsPanel {...panelProps} />
                </div>
            </DrawerContent>
        </Drawer>
    );
}

function Field({label, children}: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </label>
            {children}
        </div>
    );
}
