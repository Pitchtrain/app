import { afterEach, describe, expect, it, vi } from "vitest";
import { createMonoRecorder } from "./recording";

type StubDestination = {
  channelCount: number;
  channelCountMode: string;
  channelInterpretation: string;
  stream: MediaStream;
};

function setupAudioContext() {
  const destination: StubDestination = {
    channelCount: 2,
    channelCountMode: "max",
    channelInterpretation: "speakers",
    stream: {} as MediaStream,
  };
  const source = { connect: vi.fn() } as unknown as AudioNode;
  const audioContext = {
    createMediaStreamDestination: () => destination,
  } as unknown as AudioContext;

  const recorderCalls: Array<{
    stream: MediaStream;
    options?: MediaRecorderOptions;
  }> = [];
  const recorderStub = vi.fn().mockImplementation(function (
    stream: MediaStream,
    options?: MediaRecorderOptions,
  ) {
    recorderCalls.push({ stream, options });
    return { stream, options } as unknown as MediaRecorder;
  });
  vi.stubGlobal("MediaRecorder", recorderStub);

  return { audioContext, source, destination, recorderCalls };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createMonoRecorder", () => {
  it("forces a single discrete channel on the destination", () => {
    const { audioContext, source, destination } = setupAudioContext();
    createMonoRecorder(audioContext, source);
    expect(destination.channelCount).toBe(1);
    expect(destination.channelCountMode).toBe("explicit");
    expect(destination.channelInterpretation).toBe("discrete");
  });

  it("connects the source to the destination", () => {
    const { audioContext, source, destination } = setupAudioContext();
    createMonoRecorder(audioContext, source);
    expect(source.connect).toHaveBeenCalledWith(destination);
  });

  it("records the destination stream at the mono bitrate, no forced mimeType", () => {
    const { audioContext, source, destination, recorderCalls } =
      setupAudioContext();
    createMonoRecorder(audioContext, source);
    expect(recorderCalls).toHaveLength(1);
    expect(recorderCalls[0].stream).toBe(destination.stream);
    expect(recorderCalls[0].options).toEqual({ audioBitsPerSecond: 48_000 });
    expect(recorderCalls[0].options).not.toHaveProperty("mimeType");
  });
});
