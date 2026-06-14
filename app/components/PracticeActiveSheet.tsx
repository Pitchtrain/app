import { CheckIcon, ListPlusIcon, MinusIcon, PlusIcon, ShuffleIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PracticeSet } from "~/types";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import { Button } from "./ui/button";
import { PracticeSetChips } from "./PracticeSetChips";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sets: PracticeSet[];
  activeSetIds: string[];
  onToggleSet: (id: string) => void;
  shuffleEnabled: boolean;
  onShuffleToggle: (enabled: boolean) => void;
  autoAdvanceEnabled: boolean;
  onAutoAdvanceToggle: (enabled: boolean) => void;
  autoAdvanceSeconds: number;
  onAutoAdvanceSecondsChange: (seconds: number) => void;
  sentenceFeedbackEnabled: boolean;
  onSentenceFeedbackToggle: (enabled: boolean) => void;
  onOpenManage: () => void;
};

export function PracticeActiveSheet({
  open,
  onOpenChange,
  sets,
  activeSetIds,
  onToggleSet,
  shuffleEnabled,
  onShuffleToggle,
  autoAdvanceEnabled,
  onAutoAdvanceToggle,
  autoAdvanceSeconds,
  onAutoAdvanceSecondsChange,
  sentenceFeedbackEnabled,
  onSentenceFeedbackToggle,
  onOpenManage,
}: Props) {
  const { t } = useTranslation();
  const step = (delta: number) => {
    const next = Math.min(120, Math.max(1, autoAdvanceSeconds + delta));
    onAutoAdvanceSecondsChange(next);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>{t("practice.activeSheetTitle")}</DrawerTitle>
          <DrawerDescription>
            {t("practice.activeSheetDescription")}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-5 px-4 pb-6">
          <section className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {t("practice.activeSets")}
            </p>
            {sets.length === 0 ? (
              <p className="text-sm text-slate-400">
                {t("practice.noSetsCreate")}
              </p>
            ) : (
              <PracticeSetChips
                sets={sets}
                activeSetIds={activeSetIds}
                onToggle={onToggleSet}
              />
            )}
          </section>

          <section className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {t("practice.feedback")}
            </p>
            <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5">
              <span className="text-sm text-ink">{t("practice.sentenceFeedback")}</span>
              <input
                type="checkbox"
                checked={sentenceFeedbackEnabled}
                onChange={(e) => onSentenceFeedbackToggle(e.target.checked)}
                className="size-5 accent-sea"
              />
            </label>
          </section>

          <section className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {t("practice.shuffle")}
            </p>
            <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm text-ink">
                <ShuffleIcon className="size-4" />
                {t("practice.shuffle")}
              </span>
              <input
                type="checkbox"
                checked={shuffleEnabled}
                onChange={(e) => onShuffleToggle(e.target.checked)}
                className="size-5 accent-sea"
              />
            </label>
          </section>

          <section className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {t("practice.autoAdvance")}
            </p>
            <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5">
              <span className="text-sm text-ink">{t("practice.autoAdvanceNext")}</span>
              <input
                type="checkbox"
                checked={autoAdvanceEnabled}
                onChange={(e) => onAutoAdvanceToggle(e.target.checked)}
                className="size-5 accent-sea"
              />
            </label>
            <div
              className={`flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-3 py-2 ${
                autoAdvanceEnabled ? "" : "opacity-50"
              }`}
            >
              <span className="text-sm text-ink">{t("practice.interval")}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => step(-1)}
                  disabled={!autoAdvanceEnabled || autoAdvanceSeconds <= 1}
                  aria-label={t("practice.decreaseSeconds")}
                >
                  <MinusIcon className="size-4" />
                </Button>
                <span className="min-w-12 text-center text-sm tabular-nums text-ink">
                  {autoAdvanceSeconds}s
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => step(+1)}
                  disabled={!autoAdvanceEnabled || autoAdvanceSeconds >= 120}
                  aria-label={t("practice.increaseSeconds")}
                >
                  <PlusIcon className="size-4" />
                </Button>
              </div>
            </div>
          </section>

          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onOpenManage();
            }}
            className="h-10 gap-1.5 rounded-full"
          >
            <ListPlusIcon className="size-4" />
            {t("practice.editSets")}
          </Button>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-11 gap-2 rounded-full bg-ink text-white hover:bg-ink/90"
          >
            <CheckIcon className="size-4" />
            {t("common.done")}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
