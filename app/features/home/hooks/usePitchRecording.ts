import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { TFunction } from "i18next";
import type {
  DetectorAlgorithm,
  PitchSample,
  RecordingSession,
  SavedSession,
  VoiceRange,
} from "~/types";
import type { PitchTrackerState } from "~/audio/pitchDetector";
import { createPitchTrackerState, detectPitch } from "~/audio/pitchDetector";
import { flattenPitchSpikes } from "~/audio/flattenPitchSpikes";
import { createMonoRecorder } from "~/audio/recording";
import { DEFAULT_RANGES } from "~/ranges";
import type { PracticeView } from "../types";
import type { Mode } from "../types";
import { createPitchSample } from "../pitchSample";

const FFT_SIZE = 4096;

type EngineState = {
  audioContext: AudioContext;
  analyser: AnalyserNode;
  source: MediaStreamAudioSourceNode;
  mediaStream: MediaStream;
  destination: MediaStreamAudioDestinationNode | null;
  mediaRecorder: MediaRecorder | null;
  chunks: Blob[];
};

type Args = {
  t: TFunction;
  selectedRange: VoiceRange;
  detectorAlgorithm: DetectorAlgorithm;
  practiceView: PracticeView;
  setPracticeView: (view: PracticeView) => void;
  onActiveSessionChange: (id: string | null) => void;
};

export function usePitchRecording({
  t,
  selectedRange,
  detectorAlgorithm,
  practiceView,
  setPracticeView,
  onActiveSessionChange,
}: Args) {
  const [samples, setSamples] = useState<PitchSample[]>([]);
  const [mode, setMode] = useState<Mode>("idle");
  const [recordingSession, setRecordingSession] =
    useState<RecordingSession | null>(null);
  const [replayTimeMs, setReplayTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const engineRef = useRef<EngineState | null>(null);
  const trackerRef = useRef<PitchTrackerState>(createPitchTrackerState());
  const frameRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const sampleBufferRef = useRef<Float32Array<ArrayBuffer>>(
    new Float32Array(FFT_SIZE) as Float32Array<ArrayBuffer>,
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const selectedRangeRef = useRef<VoiceRange>(DEFAULT_RANGES[1]);
  const detectorAlgorithmRef = useRef<DetectorAlgorithm>(detectorAlgorithm);
  const samplesRef = useRef<PitchSample[]>([]);
  const recordingSessionRef = useRef<RecordingSession | null>(null);
  const readingModeDuringRecordingRef = useRef(false);
  const elapsedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    selectedRangeRef.current = selectedRange;
  }, [selectedRange]);

  useEffect(() => {
    detectorAlgorithmRef.current = detectorAlgorithm;
  }, [detectorAlgorithm]);

  useEffect(() => {
    samplesRef.current = samples;
  }, [samples]);

  useEffect(() => {
    recordingSessionRef.current = recordingSession;
  }, [recordingSession]);

  useEffect(() => {
    if (
      practiceView === "reading" &&
      (mode === "recording" || mode === "paused")
    ) {
      readingModeDuringRecordingRef.current = true;
    }
  }, [mode, practiceView]);

  useEffect(() => {
    return () => {
      teardownEngine();
      if (recordingSessionRef.current) {
        URL.revokeObjectURL(recordingSessionRef.current.audioUrl);
      }
      if (elapsedTimerRef.current) {
        window.clearInterval(elapsedTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !recordingSession) return;

    const onLoadedMetadata = () => {
      const d = Number.isFinite(audio.duration)
        ? audio.duration * 1000
        : recordingSession.durationMs;
      setDurationMs(d);
    };
    const onTimeUpdate = () => {
      setReplayTimeMs(audio.currentTime * 1000);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setReplayTimeMs(audio.duration * 1000 || 0);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    setDurationMs(recordingSession.durationMs);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [recordingSession]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) return;
    let raf = 0;
    const tick = () => {
      setReplayTimeMs(audio.currentTime * 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error(t("recording.noMicSupport"));
      return;
    }
    readingModeDuringRecordingRef.current = practiceView === "reading";

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      const AudioContextClass = window.AudioContext;
      if (!AudioContextClass) {
        toast.error(t("recording.noWebAudio"));
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }

      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0;
      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(analyser);

      let mediaRecorder: MediaRecorder | null = null;
      let destination: MediaStreamAudioDestinationNode | null = null;
      if (typeof MediaRecorder !== "undefined") {
        const mono = createMonoRecorder(audioContext, source);
        destination = mono.destination;
        mediaRecorder = mono.recorder;
      }

      const engine: EngineState = {
        audioContext,
        analyser,
        source,
        mediaStream,
        destination,
        mediaRecorder,
        chunks: [],
      };
      engineRef.current = engine;

      trackerRef.current = createPitchTrackerState();
      setSamples([]);
      setReplayTimeMs(0);
      setElapsedMs(0);
      onActiveSessionChange(null);
      startedAtRef.current = performance.now();

      if (mediaRecorder) {
        engine.chunks = [];
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            engine.chunks.push(event.data);
          }
        };
        mediaRecorder.onstop = () => {
          if (engine.chunks.length === 0) return;
          const audioBlob = new Blob(engine.chunks, {
            type: mediaRecorder?.mimeType || "audio/webm",
          });
          const audioUrl = URL.createObjectURL(audioBlob);
          const recordedSamples = flattenPitchSpikes(
            samplesRef.current,
            selectedRangeRef.current,
          );
          setRecordingSession({
            audioBlob,
            audioUrl,
            durationMs: recordedSamples.length
              ? recordedSamples[recordedSamples.length - 1].timeMs
              : 0,
            samples: recordedSamples,
            rangeSnapshot: { ...selectedRangeRef.current },
            createdAt: Date.now(),
            readingMode: readingModeDuringRecordingRef.current,
          });
          setPracticeView("standard");
          setMode("review");
        };
        mediaRecorder.start();
      }

      setMode("recording");
      tickAnalysis();
      startElapsedTimer();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("recording.micBlocked"),
      );
    }
  }

  function startElapsedTimer() {
    if (elapsedTimerRef.current) {
      window.clearInterval(elapsedTimerRef.current);
    }
    elapsedTimerRef.current = window.setInterval(() => {
      setElapsedMs(performance.now() - startedAtRef.current);
    }, 100);
  }

  function pause() {
    const engine = engineRef.current;
    if (!engine || mode !== "recording") return;

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (elapsedTimerRef.current) {
      window.clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    if (engine.mediaRecorder && engine.mediaRecorder.state === "recording") {
      engine.mediaRecorder.pause();
    }
    setElapsedMs(performance.now() - startedAtRef.current);
    setMode("paused");
  }

  function resume() {
    const engine = engineRef.current;
    if (!engine || mode !== "paused") return;

    if (engine.mediaRecorder && engine.mediaRecorder.state === "paused") {
      engine.mediaRecorder.resume();
    }
    startedAtRef.current = performance.now() - elapsedMs;
    setMode("recording");
    tickAnalysis();
    startElapsedTimer();
  }

  function stop() {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (elapsedTimerRef.current) {
      window.clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }

    const engine = engineRef.current;
    if (!engine) {
      setMode("idle");
      return;
    }

    if (engine.mediaRecorder && engine.mediaRecorder.state !== "inactive") {
      engine.mediaRecorder.stop();
    } else {
      setMode("idle");
    }

    engine.source.disconnect();
    engine.destination?.disconnect();
    engine.mediaStream.getTracks().forEach((track) => track.stop());
    void engine.audioContext.close();
    engineRef.current = null;
  }

  function teardownEngine() {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    const engine = engineRef.current;
    if (!engine) return;
    try {
      engine.source.disconnect();
      engine.destination?.disconnect();
      engine.mediaStream.getTracks().forEach((track) => track.stop());
      void engine.audioContext.close();
    } catch {
      /* no-op */
    }
    engineRef.current = null;
  }

  function dismiss() {
    if (recordingSession) {
      URL.revokeObjectURL(recordingSession.audioUrl);
    }
    setRecordingSession(null);
    setSamples([]);
    setReplayTimeMs(0);
    setDurationMs(0);
    setElapsedMs(0);
    setIsPlaying(false);
    onActiveSessionChange(null);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setMode("idle");
  }

  function loadSavedSession(saved: SavedSession) {
    if (recordingSession) {
      URL.revokeObjectURL(recordingSession.audioUrl);
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audioUrl = URL.createObjectURL(saved.audioBlob);
    setRecordingSession({
      audioBlob: saved.audioBlob,
      audioUrl,
      durationMs: saved.durationMs,
      samples: saved.samples,
      rangeSnapshot: saved.rangeSnapshot,
      createdAt: saved.createdAt,
      readingMode: false,
    });
    setSamples([]);
    setReplayTimeMs(0);
    setDurationMs(saved.durationMs);
    setElapsedMs(0);
    setIsPlaying(false);
    setPracticeView("standard");
    setMode("review");
    onActiveSessionChange(saved.id);
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  }

  function seek(timeMs: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = timeMs / 1000;
    setReplayTimeMs(timeMs);
  }

  function tickAnalysis() {
    const engine = engineRef.current;
    if (!engine) return;

    engine.analyser.getFloatTimeDomainData(sampleBufferRef.current);
    const detection = detectPitch(
      sampleBufferRef.current,
      engine.audioContext.sampleRate,
      detectorAlgorithmRef.current,
      trackerRef.current,
    );
    const timeMs = performance.now() - startedAtRef.current;
    const sample = createPitchSample(
      detection,
      selectedRangeRef.current,
      timeMs,
    );

    setSamples((previous) => [...previous, sample]);

    frameRef.current = requestAnimationFrame(() => tickAnalysis());
  }

  return {
    samples,
    mode,
    recordingSession,
    replayTimeMs,
    isPlaying,
    durationMs,
    elapsedMs,
    audioRef,
    start,
    pause,
    resume,
    stop,
    dismiss,
    loadSavedSession,
    togglePlay,
    seek,
  };
}
