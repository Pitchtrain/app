const OPUS_BITRATE = 32_000;
const AAC_BITRATE = 56_000;

// Preference order; first supported wins. undefined => let MediaRecorder default.
const CANDIDATE_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
  "audio/mp4;codecs=mp4a.40.2", // Safari AAC-LC
  "audio/mp4",
];

export function pickRecordingMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported)
    return undefined;
  return CANDIDATE_MIME_TYPES.find((m) => MediaRecorder.isTypeSupported(m));
}

export function bitrateForMimeType(mime: string | undefined): number {
  return mime && mime.includes("mp4") ? AAC_BITRATE : OPUS_BITRATE;
}

// Build a 1-channel destination fed by `source`, plus a MediaRecorder on it.
// The Web Audio downmix guarantees true mono regardless of mic/platform.
export function createMonoRecorder(
  audioContext: AudioContext,
  source: AudioNode,
): { destination: MediaStreamAudioDestinationNode; recorder: MediaRecorder } {
  const destination = audioContext.createMediaStreamDestination();
  destination.channelCount = 1;
  destination.channelCountMode = "explicit";
  destination.channelInterpretation = "speakers";
  source.connect(destination); // auto-downmix N -> 1
  const mimeType = pickRecordingMimeType();
  const recorder = new MediaRecorder(destination.stream, {
    ...(mimeType ? { mimeType } : {}),
    audioBitsPerSecond: bitrateForMimeType(mimeType),
  });
  return { destination, recorder };
}
