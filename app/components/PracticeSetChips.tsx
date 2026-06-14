import { useTranslation } from "react-i18next";
import type { PracticeSet } from "../types";
import { Toggle } from "./ui/toggle";

type Props = {
  sets: PracticeSet[];
  activeSetIds: string[];
  onToggle: (id: string) => void;
};

export function PracticeSetChips({ sets, activeSetIds, onToggle }: Props) {
  const { t } = useTranslation();
  const active = new Set(activeSetIds);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {sets.map((set) => {
        const isActive = active.has(set.id);
        return (
          <Toggle
            key={set.id}
            pressed={isActive}
            onPressedChange={() => onToggle(set.id)}
            size="sm"
            variant="outline"
            className={
              isActive
                ? "h-7 rounded-full border-sea/40 bg-sea/10 px-3 text-xs text-ink aria-pressed:bg-sea/20"
                : "h-7 rounded-full border-slate-200 bg-white/70 px-3 text-xs text-slate-600"
            }
            aria-label={t("practice.toggleSet", { label: set.label, defaultValue: `Toggle ${set.label}` })}
          >
            <span className="truncate max-w-[10rem]">{set.label}</span>
            <span className="ml-1 text-[10px] tabular-nums opacity-60">
              {set.items.length}
            </span>
          </Toggle>
        );
      })}
    </div>
  );
}
