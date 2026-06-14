import {MicIcon, PauseIcon, PlayIcon, SquareIcon} from "lucide-react";
import {useTranslation} from "react-i18next";
import {Button} from "./ui/button";
import {Badge} from "./ui/badge";
import {formatClockMs} from "~/lib/format";

type Props = {
    mode: "idle" | "recording" | "paused";
    elapsedMs: number;
    onStart: () => void;
    onStop: () => void;
    onTogglePause: () => void;
    compact?: boolean;
};

export function RecordingBar({
                                 mode,
                                 elapsedMs,
                                 onStart,
                                 onStop,
                                 onTogglePause,
                                 compact = false,
                             }: Props) {
    const {t} = useTranslation();
    if (compact) {
        return (
            <div
                className="pointer-events-none absolute right-[max(0.75rem,env(safe-area-inset-right))] bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 flex items-center gap-2">
                <div
                    className={`pointer-events-auto flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/90 py-1.5 pr-1.5 shadow-sm backdrop-blur-sm ${
                        mode === "idle" ? "pl-1.5" : "pl-2.5"
                    }`}
                >
                    {mode === "idle" ? (
                        <Button
                            size="icon"
                            onClick={onStart}
                            aria-label={t("recording.record")}
                            className="size-14 rounded-full border-0 bg-coral/15 text-coral shadow-none hover:bg-coral/25"
                        >
                            <MicIcon className="size-5"/>
                        </Button>
                    ) : (
                        <>
                            <Badge
                                className={
                                    mode === "paused"
                                        ? "gap-2 bg-slate-400 px-3 py-1.5 text-white"
                                        : "gap-2 bg-coral px-3 py-1.5 text-white"
                                }
                            >
                <span
                    className={
                        mode === "paused"
                            ? "size-2.5 rounded-full bg-white"
                            : "size-2.5 animate-pulse rounded-full bg-white"
                    }
                />
                                <span className="font-mono text-xs tabular-nums">
                  {formatClockMs(elapsedMs)}
                </span>
                            </Badge>
                            <Button
                                size="icon"
                                onClick={onTogglePause}
                                aria-label={
                                    mode === "paused" ? t("recording.continue") : t("recording.pause")
                                }
                                className="size-14 rounded-full bg-ink/90 text-white hover:bg-ink"
                            >
                                {mode === "paused" ? (
                                    <PlayIcon className="size-5"/>
                                ) : (
                                    <PauseIcon className="size-5"/>
                                )}
                            </Button>
                            <Button
                                size="icon"
                                onClick={onStop}
                                aria-label={t("recording.stop")}
                                className="size-14 rounded-full bg-ink text-white hover:bg-ink/90"
                            >
                                <SquareIcon className="size-4 fill-white"/>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    if (mode === "idle") {
        return (
            <div
                className="flex shrink-0 items-center border-t border-slate-200/60 bg-white/80 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
                <Button
                    size="lg"
                    onClick={onStart}
                    className="h-14 w-full gap-3 rounded-full border-0 bg-coral/15 text-base font-semibold text-coral shadow-none hover:bg-coral/25"
                >
                    <MicIcon className="size-5"/>
                    {t("recording.record")}
                </Button>
            </div>
        );
    }

    const isPaused = mode === "paused";

    return (
        <div
            className="flex shrink-0 items-center gap-3 border-t border-slate-200/60 bg-white/80 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <Badge
                    className={
                        isPaused
                            ? "gap-1.5 bg-slate-400 px-2.5 py-1 text-white"
                            : "gap-1.5 bg-coral px-2.5 py-1 text-white"
                    }
                >
          <span
              className={
                  isPaused
                      ? "size-2 rounded-full bg-white"
                      : "size-2 animate-pulse rounded-full bg-white"
              }
          />
                    {isPaused ? t("recording.pauseBadge") : t("recording.recBadge")}
                </Badge>
                <span className="font-mono text-sm tabular-nums text-slate-600">
          {formatClockMs(elapsedMs)}
        </span>
            </div>
            {isPaused ? (
                <Button
                    size="lg"
                    onClick={onTogglePause}
                    aria-label={t("recording.continue")}
                    className="h-14 flex-1 gap-2 rounded-full bg-ink/90 text-base font-semibold text-white hover:bg-ink"
                >
                    <PlayIcon className="size-5"/>
                    {t("recording.continue")}
                </Button>
            ) : (
                <Button
                    size="icon"
                    onClick={onTogglePause}
                    aria-label={t("recording.pause")}
                    className="h-14 w-14 shrink-0 rounded-full bg-ink/90 text-white hover:bg-ink"
                >
                    <PauseIcon className="size-5"/>
                </Button>
            )}
            <Button
                size={isPaused ? "icon" : "lg"}
                onClick={onStop}
                aria-label={t("recording.stop")}
                className={
                    isPaused
                        ? "h-14 w-14 shrink-0 rounded-full bg-ink text-white hover:bg-ink/90"
                        : "h-14 flex-1 gap-2 rounded-full bg-ink text-base font-semibold text-white hover:bg-ink/90"
                }
            >
                <SquareIcon className="size-4 fill-white"/>
                {!isPaused && t("recording.stop")}
            </Button>
        </div>
    );
}
