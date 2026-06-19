import {
  BookMarkedIcon,
  BookOpenTextIcon,
  SettingsIcon,
  SquareActivityIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PitchSample, VoiceRange } from "~/types";
import {
  type ChartMode,
  PitchTimelineChart,
} from "~/components/PitchTimelineChart";
import { ChartModeToggle } from "~/components/ChartModeToggle";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import type { Mode } from "../types";

type Props = {
  samples: PitchSample[];
  range: VoiceRange;
  playheadMs: number | null;
  timelineWindowSeconds: number;
  chartMode: ChartMode;
  onChartModeChange: (mode: ChartMode) => void;
  highlightedRanges: VoiceRange[];
  isReadingMode: boolean;
  mode: Mode;
  statusLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onScrub: (timeMs: number) => void;
  onEnterReadingMode: () => void;
  onLeaveReadingMode: () => void;
  onOpenJournal: () => void;
  onOpenSettings: () => void;
};

export function HomeChartPanel({
  samples,
  range,
  playheadMs,
  timelineWindowSeconds,
  chartMode,
  onChartModeChange,
  highlightedRanges,
  isReadingMode,
  mode,
  statusLabel,
  onPrev,
  onNext,
  onScrub,
  onEnterReadingMode,
  onLeaveReadingMode,
  onOpenJournal,
  onOpenSettings,
}: Props) {
  const { t } = useTranslation();

  return (
    <div
      className={
        isReadingMode
          ? "relative h-full min-h-0 bg-canvas"
          : "relative min-h-0 flex-1 bg-canvas"
      }
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <PitchTimelineChart
        samples={samples}
        range={range}
        playheadMs={playheadMs}
        timelineWindowSeconds={timelineWindowSeconds}
        mode={isReadingMode ? "detail" : chartMode}
        highlightedRanges={highlightedRanges}
        variant={isReadingMode ? "reading" : "standard"}
        onPrev={mode === "review" || isReadingMode ? undefined : onPrev}
        onNext={mode === "review" || isReadingMode ? undefined : onNext}
        onScrub={mode === "review" ? onScrub : undefined}
      />
      <div
        className="absolute z-20 flex items-center gap-1.5"
        style={{
          top: "max(0.75rem, env(safe-area-inset-top))",
          right: "max(0.75rem, env(safe-area-inset-right))",
        }}
      >
        <Badge variant="secondary" className="shadow-sm pointer-events-none">
          {statusLabel}
        </Badge>
        <div className="hidden items-center gap-0.5 rounded-full bg-white/85 p-0.5 shadow-sm backdrop-blur-sm lg:flex">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLeaveReadingMode}
            aria-pressed={!isReadingMode}
            className={`h-9 rounded-full px-3 text-xs ${
              !isReadingMode
                ? "bg-gray-100 text-ink hover:bg-gray-100"
                : "text-gray-500"
            }`}
          >
            {t("sidebar.practice")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEnterReadingMode}
            aria-pressed={isReadingMode}
            className={`h-9 rounded-full px-3 text-xs ${
              isReadingMode
                ? "bg-gray-100 text-ink hover:bg-gray-100"
                : "text-gray-500"
            }`}
          >
            {t("sidebar.reading")}
          </Button>
        </div>
        {isReadingMode ? (
          <>
            <div className="flex items-center gap-1 rounded-full bg-white/80 p-0.5 shadow-sm backdrop-blur-sm lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenSettings}
                aria-label={t("common.settings")}
                className="size-11"
              >
                <SettingsIcon className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenJournal}
                aria-label={t("journal.tab")}
                className="size-11"
              >
                <BookMarkedIcon className="size-5" />
              </Button>
            </div>
            <div className="flex items-center gap-0.5 rounded-full bg-white/85 p-0.5 shadow-sm backdrop-blur-sm lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={onLeaveReadingMode}
                aria-label={t("sidebar.practice")}
                aria-pressed={!isReadingMode}
                className="size-11 rounded-full text-gray-500"
              >
                <SquareActivityIcon className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onEnterReadingMode}
                aria-label={t("reading.enter")}
                aria-pressed={isReadingMode}
                className="size-11 rounded-full bg-gray-100 text-ink hover:bg-gray-100"
              >
                <BookOpenTextIcon className="size-5" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <ChartModeToggle value={chartMode} onChange={onChartModeChange} />
            <div className="flex items-center gap-1 rounded-full bg-white/80 p-0.5 shadow-sm backdrop-blur-sm lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenSettings}
                aria-label={t("common.settings")}
                className="size-11"
              >
                <SettingsIcon className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenJournal}
                aria-label={t("journal.tab")}
                className="size-11"
              >
                <BookMarkedIcon className="size-5" />
              </Button>
            </div>
            <div className="flex items-center gap-0.5 rounded-full bg-white/80 p-0.5 shadow-sm backdrop-blur-sm lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={onLeaveReadingMode}
                aria-label={t("sidebar.practice")}
                aria-pressed={!isReadingMode}
                className="size-11 rounded-full bg-gray-100 text-ink hover:bg-gray-100"
              >
                <SquareActivityIcon className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onEnterReadingMode}
                aria-label={t("reading.enter")}
                aria-pressed={isReadingMode}
                className="size-11 rounded-full text-gray-500"
              >
                <BookOpenTextIcon className="size-5" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
