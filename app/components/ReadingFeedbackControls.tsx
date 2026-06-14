import { useTranslation } from "react-i18next";
import type { ReadingFeedbackSettings, ReadingRangeGoal } from "~/types";
import { DEFAULT_READING_FEEDBACK } from "~/reading";
import { Slider } from "./ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const READING_GOAL_OPTIONS: ReadingRangeGoal[] = ["auto", "both", "above", "below"];

export function ReadingFeedbackControls({
  feedback,
  onChange,
  className,
}: {
  feedback: ReadingFeedbackSettings;
  onChange: (feedback: ReadingFeedbackSettings) => void;
  className?: string;
}) {
  const { t } = useTranslation();

  function updateFeedback(changes: Partial<ReadingFeedbackSettings>) {
    onChange({ ...feedback, ...changes });
  }

  function setThresholdHz(value: number) {
    updateFeedback({
      thresholdHz: Math.max(0, Math.min(50, Math.round(value))),
    });
  }

  return (
    <section className={`space-y-4 ${className ?? ""}`}>
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t("reading.feedbackGoal")}
        </label>
        <Select
          value={feedback.rangeGoal}
          onValueChange={(value) =>
            updateFeedback({ rangeGoal: value as ReadingRangeGoal })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {READING_GOAL_OPTIONS.map((goal) => (
              <SelectItem key={goal} value={goal}>
                {t(`reading.feedbackGoals.${goal}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("reading.feedbackThreshold")}
          </label>
          <input
            type="number"
            min={0}
            max={50}
            step={1}
            value={feedback.thresholdHz}
            onChange={(event) => setThresholdHz(Number(event.target.value))}
            className="h-8 w-20 rounded-md border border-slate-200 bg-white px-2 text-right text-sm text-ink outline-none focus:border-sea"
            aria-label={t("reading.feedbackThreshold")}
          />
        </div>
        <Slider
          value={[feedback.thresholdHz]}
          min={0}
          max={50}
          step={1}
          onValueChange={([value]) =>
            setThresholdHz(value ?? DEFAULT_READING_FEEDBACK.thresholdHz)
          }
        />
      </div>
    </section>
  );
}
