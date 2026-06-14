import { useEffect, useState } from "react";
import { PauseIcon, PlayIcon, SaveIcon, Trash2Icon, XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { formatClockMs } from "../lib/format";

type Props = {
  isPlaying: boolean;
  currentTimeMs: number;
  durationMs: number;
  onTogglePlay: () => void;
  onSeek: (timeMs: number) => void;
  onDismiss: () => void;
  onSave: () => void;
  canSave: boolean;
  requiresDiscardConfirm: boolean;
};

export function PlaybackBar({
  isPlaying,
  currentTimeMs,
  durationMs,
  onTogglePlay,
  onSeek,
  onDismiss,
  onSave,
  canSave,
  requiresDiscardConfirm,
}: Props) {
  const { t } = useTranslation();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const max = Math.max(1, durationMs);

  useEffect(() => {
    setConfirmDiscard(false);
  }, [durationMs]);

  function handleDismissClick() {
    if (!requiresDiscardConfirm) {
      onDismiss();
      return;
    }
    if (confirmDiscard) {
      onDismiss();
      return;
    }
    setConfirmDiscard(true);
  }

  function handleTogglePlay() {
    setConfirmDiscard(false);
    onTogglePlay();
  }

  function handleSeek(timeMs: number) {
    setConfirmDiscard(false);
    onSeek(timeMs);
  }

  function handleSave() {
    setConfirmDiscard(false);
    onSave();
  }

  return (
    <div className="flex shrink-0 items-center gap-3 border-t border-slate-200/60 bg-white/80 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
      <Button
        size="icon"
        variant={confirmDiscard ? "destructive" : "ghost"}
        onClick={handleDismissClick}
        aria-label={
          confirmDiscard
            ? t("recording.confirmDiscard")
            : t("recording.dismiss")
        }
        className="h-14 w-14 shrink-0 rounded-full"
      >
        {confirmDiscard ? (
          <Trash2Icon className="size-5" />
        ) : (
          <XIcon className="size-5" />
        )}
      </Button>
      <Button
        size="icon"
        onClick={handleTogglePlay}
        className="h-14 w-14 shrink-0 rounded-full bg-ink text-white hover:bg-ink/90"
        aria-label={isPlaying ? t("recording.pause") : t("recording.play")}
      >
        {isPlaying ? (
          <PauseIcon className="size-5" />
        ) : (
          <PlayIcon className="size-5" />
        )}
      </Button>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Slider
          value={[Math.min(currentTimeMs, max)]}
          min={0}
          max={max}
          step={10}
          onValueChange={(values) => handleSeek(values[0] ?? 0)}
        />
        <div className="flex justify-between font-mono text-[11px] tabular-nums text-slate-500">
          <span>{formatClockMs(currentTimeMs)}</span>
          <span>{formatClockMs(durationMs)}</span>
        </div>
      </div>
      {canSave ? (
        <Button
          size="icon"
          variant="ghost"
          onClick={handleSave}
          aria-label={t("recording.saveToJournal")}
          className="h-14 w-14 shrink-0 rounded-full"
        >
          <SaveIcon className="size-5" />
        </Button>
      ) : null}
    </div>
  );
}
