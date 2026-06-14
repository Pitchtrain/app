import type { RefObject } from "react";
import type { RecordingSession } from "~/types";
import { PlaybackBar } from "~/components/PlaybackBar";
import { RecordingBar } from "~/components/RecordingBar";
import type { Mode } from "../types";

type Props = {
  mode: Mode;
  recordingSession: RecordingSession | null;
  audioRef: RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  replayTimeMs: number;
  durationMs: number;
  elapsedMs: number;
  isReadingMode: boolean;
  canSave: boolean;
  onTogglePlay: () => void;
  onSeek: (timeMs: number) => void;
  onDismiss: () => void;
  onSave: () => void;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
};

export function SessionTransport({
  mode,
  recordingSession,
  audioRef,
  isPlaying,
  replayTimeMs,
  durationMs,
  elapsedMs,
  isReadingMode,
  canSave,
  onTogglePlay,
  onSeek,
  onDismiss,
  onSave,
  onStart,
  onStop,
  onPause,
  onResume,
}: Props) {
  const recordingMode =
    mode === "recording" ? "recording" : mode === "paused" ? "paused" : "idle";

  if (mode === "review" && recordingSession) {
    return (
      <>
        <audio
          ref={audioRef}
          src={recordingSession.audioUrl}
          preload="metadata"
          className="hidden"
        />
        <PlaybackBar
          isPlaying={isPlaying}
          currentTimeMs={replayTimeMs}
          durationMs={durationMs || recordingSession.durationMs}
          onTogglePlay={onTogglePlay}
          onSeek={onSeek}
          onDismiss={onDismiss}
          onSave={onSave}
          canSave={canSave}
          requiresDiscardConfirm={canSave}
        />
      </>
    );
  }

  return (
    <RecordingBar
      mode={recordingMode}
      elapsedMs={elapsedMs}
      onStart={onStart}
      onStop={onStop}
      onTogglePause={mode === "paused" ? onResume : onPause}
      compact={isReadingMode}
    />
  );
}
