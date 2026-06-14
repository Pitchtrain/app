import {useEffect, useRef} from "react";
import {ChevronLeftIcon, ChevronRightIcon, LayersIcon, ListPlusIcon, ShuffleIcon,} from "lucide-react";
import {useTranslation} from "react-i18next";
import type {PracticeItem, PracticeSet} from "~/types";
import {Button} from "./ui/button";
import {Toggle} from "./ui/toggle";
import {PracticeSetChips} from "./PracticeSetChips";
import type {ReadingFeedbackDirection} from "~/pitch";

type Props = {
    sets: PracticeSet[];
    activeSetIds: string[];
    pool: PracticeItem[];
    index: number;
    onPrev: () => void;
    onNext: () => void;
    onToggleSet: (id: string) => void;
    onOpenManage: () => void;
    onOpenActiveSheet: () => void;
    shuffleEnabled: boolean;
    onShuffleToggle: (enabled: boolean) => void;
    autoAdvanceEnabled: boolean;
    autoAdvanceSeconds: number;
    onAutoAdvanceToggle: (enabled: boolean) => void;
    feedbackDirection: ReadingFeedbackDirection | null;
};

export function PracticePrompt({
                                   sets,
                                   activeSetIds,
                                   pool,
                                   index,
                                   onPrev,
                                   onNext,
                                   onToggleSet,
                                   onOpenManage,
                                   onOpenActiveSheet,
                                   shuffleEnabled,
                                   onShuffleToggle,
                                   autoAdvanceEnabled,
                                   autoAdvanceSeconds,
                                   onAutoAdvanceToggle,
                                   feedbackDirection,
                               }: Props) {
    const {t} = useTranslation();
    const hasPool = pool.length > 0;
    const current = hasPool ? pool[index % pool.length] : null;

    const onNextRef = useRef(onNext);
    useEffect(() => {
        onNextRef.current = onNext;
    });

    useEffect(() => {
        if (!hasPool) return;

        function isEditable(el: EventTarget | null): boolean {
            if (!(el instanceof HTMLElement)) return false;
            const tag = el.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
            return el.isContentEditable;
        }

        function onKey(e: KeyboardEvent) {
            if (isEditable(e.target)) return;
            if (e.key === "ArrowRight") {
                e.preventDefault();
                onNext();
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                onPrev();
            }
        }

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [hasPool, onNext, onPrev]);

    useEffect(() => {
        if (!autoAdvanceEnabled || !hasPool) return;
        const ms = Math.max(1000, autoAdvanceSeconds * 1000);
        const id = window.setInterval(() => onNextRef.current(), ms);
        return () => window.clearInterval(id);
    }, [autoAdvanceEnabled, autoAdvanceSeconds, hasPool]);

    const activeCount = activeSetIds.length;
    const feedbackColor =
        feedbackDirection === "above"
            ? "rgba(215, 121, 97, 0.58)"
            : feedbackDirection === "below"
                ? "rgba(62, 124, 142, 0.52)"
                : "transparent";
    const feedbackFadeColor =
        feedbackDirection === "above"
            ? "rgba(215, 121, 97, 0.22)"
            : feedbackDirection === "below"
                ? "rgba(62, 124, 142, 0.2)"
                : "transparent";

    return (
        <div className="relative isolate flex flex-col gap-2 overflow-hidden border-t border-slate-200/60 bg-white/70 px-3 py-3">
            <div
                aria-hidden
                className={`pointer-events-none absolute inset-0 z-0 transition-opacity duration-500 ease-in-out ${
                    feedbackDirection ? "opacity-100" : "opacity-0"
                }`}
                style={{
                    boxShadow: [
                        `inset 0 0 12px 8px ${feedbackColor}`,
                        `inset 0 0 24px 12px ${feedbackFadeColor}`,
                    ].join(", "),
                }}
            />
            <div className="relative z-10 flex items-center gap-2 md:gap-3">
                <Button
                    variant="outline"
                    onClick={onPrev}
                    disabled={!hasPool}
                    aria-label={t("practice.previousPrompt")}
                    className="relative z-10 size-12 shrink-0 rounded-full md:size-10"
                >
                    <ChevronLeftIcon className="size-6 md:size-5"/>
                </Button>

                <div className="relative z-10 flex min-h-16 flex-1 select-none items-center justify-center px-2 text-center">
                    {current ? (
                        <p className="relative z-10 text-balance text-xl font-medium leading-snug text-ink md:text-2xl">
                            {current.text}
                        </p>
                    ) : (
                        <p className="relative z-10 text-sm text-slate-400">
                            {sets.length === 0
                                ? t("practice.addSetToStart")
                                : t("practice.pickSetToStart")}
                        </p>
                    )}
                    {hasPool && (
                        <>
                            <button
                                className="absolute inset-y-0 left-0 w-1/2"
                                onClick={onPrev}
                                aria-label={t("practice.previousPrompt")}
                            />
                            <button
                                className="absolute inset-y-0 right-0 w-1/2"
                                onClick={onNext}
                                aria-label={t("practice.nextPrompt")}
                            />
                        </>
                    )}
                </div>

                <Button
                    variant="outline"
                    onClick={onNext}
                    disabled={!hasPool}
                    aria-label={t("practice.nextPrompt")}
                    className="relative z-10 size-12 shrink-0 rounded-full md:size-10"
                >
                    <ChevronRightIcon className="size-6 md:size-5"/>
                </Button>
            </div>

            {/* Mobile controls: single pill + toggles + manage */}
            <div className="relative z-10 flex flex-wrap items-center gap-1.5 md:hidden justify-between">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenActiveSheet}
                    className="h-8 gap-1.5 rounded-full text-xs"
                >
                    <LayersIcon className="size-3.5"/>
                    {t("practice.customize")}
                    <span className="rounded-full bg-sea/20 px-1.5 text-[10px] tabular-nums text-ink">
            {activeCount}
          </span>
                </Button>
                <div className="flex gap-1.5">
                    <Toggle
                        pressed={shuffleEnabled}
                        onPressedChange={onShuffleToggle}
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 rounded-full px-3 text-xs aria-pressed:bg-sea/20"
                        aria-label={t("practice.toggleShuffle")}
                    >
                        <ShuffleIcon className="size-3.5"/>
                        {t("practice.shuffle")}
                    </Toggle>
                    <Toggle
                        pressed={autoAdvanceEnabled}
                        onPressedChange={onAutoAdvanceToggle}
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 rounded-full px-3 text-xs aria-pressed:bg-sea/20"
                        aria-label={t("practice.toggleAutoAdvance")}
                    >
                        {t("practice.auto")}
                        <span className="tabular-nums opacity-60">{autoAdvanceSeconds}s</span>
                    </Toggle>
                </div>
            </div>

            {/* Desktop controls: chips + toggles + manage inline */}
            <div className="relative z-10 hidden flex-wrap items-center justify-between gap-2 md:flex">
                <div className="min-w-0 flex-1">
                    <PracticeSetChips
                        sets={sets}
                        activeSetIds={activeSetIds}
                        onToggle={onToggleSet}
                    />
                </div>

                <div className="flex items-center gap-1.5">
                    <Toggle
                        pressed={shuffleEnabled}
                        onPressedChange={onShuffleToggle}
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 rounded-full px-3 text-xs aria-pressed:bg-sea/20"
                        aria-label={t("practice.toggleShuffle")}
                    >
                        <ShuffleIcon className="size-3.5"/>
                        {t("practice.shuffle")}
                    </Toggle>
                    <Toggle
                        pressed={autoAdvanceEnabled}
                        onPressedChange={onAutoAdvanceToggle}
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 rounded-full px-3 text-xs aria-pressed:bg-sea/20"
                        aria-label={t("practice.toggleAutoAdvance")}
                    >
                        {t("practice.auto")}
                        <span className="tabular-nums opacity-60">
              {autoAdvanceSeconds}s
            </span>
                    </Toggle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onOpenManage}
                        className="h-8 gap-1.5 rounded-full text-xs"
                    >
                        <ListPlusIcon className="size-3.5"/>
                        {t("practice.editSets")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
