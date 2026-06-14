import {useTranslation} from "react-i18next";
import type {VoiceRange} from "~/types";
import {CUSTOM_RANGE_ID} from "~/ranges";
import {Button} from "./ui/button";
import {RANGE_PALETTE} from "./PitchTimelineChart";

type Props = {
    ranges: VoiceRange[];
    selectedRangeId: string;
    onSelectRange: (id: string) => void;
    customRange: VoiceRange;
};

export function VoiceRangesPanel({
                                     ranges,
                                     selectedRangeId,
                                     onSelectRange,
                                     customRange,
                                 }: Props) {
    const {t} = useTranslation();
    const presetRanges = ranges
        .filter((range) => range.id !== CUSTOM_RANGE_ID)
        .slice()
        .reverse();

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("ranges.title")}
                </p>
                <div className="flex flex-col gap-1.5">
                    {presetRanges.map((range) => (
                        <RangeButton
                            key={range.id}
                            range={range}
                            active={range.id === selectedRangeId}
                            onClick={() => onSelectRange(range.id)}
                        />
                    ))}
                    <RangeButton
                        range={customRange}
                        active={customRange.id === selectedRangeId}
                        onClick={() => onSelectRange(CUSTOM_RANGE_ID)}
                    />
                </div>
            </div>
        </div>
    );
}

export function RangeButton({
                                range,
                                active,
                                onClick,
                                readOnly,
                            }: {
    range: VoiceRange;
    active?: boolean;
    onClick?: () => void;
    readOnly?: boolean;
}) {
    const {t} = useTranslation();
    const palette = RANGE_PALETTE[range.id];
    const highlightStyle = palette
        ? {backgroundColor: palette.fill, borderColor: palette.stroke}
        : undefined;
    const label = t(`ranges.${range.id}`, {defaultValue: range.label});
    const common = (
        <>
      <span className="flex items-center gap-2">
        <span
            className="size-2 rounded-full"
            style={{backgroundColor: palette?.solid ?? "#94a3b8"}}
        />
        <span className={active ? "font-semibold" : undefined}>
          {label}
        </span>
      </span>
            <span className="font-mono text-xs tabular-nums text-slate-600">
        {range.minHz}-{range.maxHz} Hz
      </span>
        </>
    );

    if (readOnly) {
        return (
            <div
                style={highlightStyle}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            >
                {common}
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            style={active ? highlightStyle : undefined}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                active
                    ? "font-semibold text-slate-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
        >
            {common}
        </button>
    );
}

export function HighlightToggle({
                                    enabled,
                                    onChange,
                                    className,
                                }: {
    enabled: boolean;
    onChange: (value: boolean) => void;
    className?: string;
}) {
    const {t} = useTranslation();
    return (
        <Button
            type="button"
            size="sm"
            variant={enabled ? "default" : "outline"}
            onClick={() => onChange(!enabled)}
            className={className ?? "h-8 gap-1.5 rounded-full px-3 text-xs"}
        >
            {enabled ? t("common.hide") : t("common.show")}
        </Button>
    );
}

export function CustomRangeFields({
                                      customRange,
                                      customRangeInputs,
                                      onCustomChange,
                                      onCustomBlur,
                                      selected,
                                      onSelect,
                                      highlightEnabled,
                                      onHighlightChange,
                                  }: {
    customRange: VoiceRange;
    customRangeInputs: { minHz: string; maxHz: string };
    onCustomChange: (field: "minHz" | "maxHz", value: string) => void;
    onCustomBlur: (field: "minHz" | "maxHz") => void;
    selected: boolean;
    onSelect: () => void;
    highlightEnabled: boolean;
    onHighlightChange: (value: boolean) => void;
}) {
    const {t} = useTranslation();
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("ranges.customRange")}
                </p>
                <HighlightToggle
                    enabled={highlightEnabled}
                    onChange={onHighlightChange}
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1 text-xs font-medium text-slate-600">
                    {t("onboarding.range.minHz")}
                    <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max="399"
                        value={customRangeInputs.minHz}
                        onChange={(event) =>
                            onCustomChange("minHz", event.currentTarget.value)
                        }
                        onBlur={() => onCustomBlur("minHz")}
                        onFocus={onSelect}
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-sea"
                    />
                </label>
                <label className="space-y-1 text-xs font-medium text-slate-600">
                    {t("onboarding.range.maxHz")}
                    <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max="400"
                        value={customRangeInputs.maxHz}
                        onChange={(event) =>
                            onCustomChange("maxHz", event.currentTarget.value)
                        }
                        onBlur={() => onCustomBlur("maxHz")}
                        onFocus={onSelect}
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-sea"
                    />
                </label>
            </div>
        </div>
    );
}
