import type { ComponentProps, ReactNode } from "react";
import type { ReadingFeedbackDirection } from "~/pitch";
import type { PracticeItem, PracticeSet } from "~/types";
import { MetricRow } from "~/components/MetricRow";
import { PracticePrompt } from "~/components/PracticePrompt";

type Props = {
  chartPanel: ReactNode;
  metrics: ComponentProps<typeof MetricRow>["metrics"];
  sets: PracticeSet[];
  activeSetIds: string[];
  pool: PracticeItem[];
  index: number;
  shuffleEnabled: boolean;
  autoAdvanceEnabled: boolean;
  autoAdvanceSeconds: number;
  feedbackDirection: ReadingFeedbackDirection | null;
  promptsEnabled: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleSet: (id: string) => void;
  onOpenManage: () => void;
  onOpenActiveSheet: () => void;
  onShuffleToggle: (enabled: boolean) => void;
  onAutoAdvanceToggle: (enabled: boolean) => void;
};

export function PracticePane({
  chartPanel,
  metrics,
  sets,
  activeSetIds,
  pool,
  index,
  shuffleEnabled,
  autoAdvanceEnabled,
  autoAdvanceSeconds,
  feedbackDirection,
  promptsEnabled,
  onPrev,
  onNext,
  onToggleSet,
  onOpenManage,
  onOpenActiveSheet,
  onShuffleToggle,
  onAutoAdvanceToggle,
}: Props) {
  return (
    <>
      {chartPanel}
      <MetricRow metrics={metrics} />
      {promptsEnabled ? (
        <PracticePrompt
          sets={sets}
          activeSetIds={activeSetIds}
          pool={pool}
          index={index}
          onPrev={onPrev}
          onNext={onNext}
          onToggleSet={onToggleSet}
          onOpenManage={onOpenManage}
          onOpenActiveSheet={onOpenActiveSheet}
          shuffleEnabled={shuffleEnabled}
          onShuffleToggle={onShuffleToggle}
          autoAdvanceEnabled={autoAdvanceEnabled}
          autoAdvanceSeconds={autoAdvanceSeconds}
          onAutoAdvanceToggle={onAutoAdvanceToggle}
          feedbackDirection={feedbackDirection}
        />
      ) : null}
    </>
  );
}
