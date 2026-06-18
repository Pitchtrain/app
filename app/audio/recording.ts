const MONO_BITRATE = 48_000;

// Mono downmix via Web Audio, fed to a MediaRecorder.
// Safari ignores getUserMedia channelCount:1 when echoCancellation is off, so
// we force mono here instead. `discrete` interpretation drops the silent R
// channel and keeps L at full gain (speakers downmix would halve it to -6dB).
// No explicit mimeType — that produced muddy output on Safari; let the browser
// pick its default codec (mp4/AAC on Safari, webm/opus on Chrome/Firefox).
export function createMonoRecorder(
    audioContext: AudioContext,
    source: AudioNode,
): { destination: MediaStreamAudioDestinationNode; recorder: MediaRecorder } {
    const destination = audioContext.createMediaStreamDestination();
    destination.channelCount = 1;
    destination.channelCountMode = "explicit";
    destination.channelInterpretation = "discrete";
    source.connect(destination);
    const recorder = new MediaRecorder(destination.stream, {
        audioBitsPerSecond: MONO_BITRATE,
    });
    return {destination, recorder};
}
