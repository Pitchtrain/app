import { afterEach, describe, expect, it, vi } from "vitest";
import { bitrateForMimeType, pickRecordingMimeType } from "./recording";

function mockMediaRecorder(supported: string[]) {
  const stub = {
    isTypeSupported: (mime: string) => supported.includes(mime),
  } as unknown as typeof MediaRecorder;
  vi.stubGlobal("MediaRecorder", stub);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pickRecordingMimeType", () => {
  it("prefers webm/opus when supported", () => {
    mockMediaRecorder([
      "audio/webm;codecs=opus",
      "audio/mp4;codecs=mp4a.40.2",
    ]);
    expect(pickRecordingMimeType()).toBe("audio/webm;codecs=opus");
  });

  it("falls back to mp4/AAC on Safari", () => {
    mockMediaRecorder(["audio/mp4;codecs=mp4a.40.2", "audio/mp4"]);
    expect(pickRecordingMimeType()).toBe("audio/mp4;codecs=mp4a.40.2");
  });

  it("returns undefined when none supported", () => {
    mockMediaRecorder([]);
    expect(pickRecordingMimeType()).toBeUndefined();
  });

  it("returns undefined when MediaRecorder is unavailable", () => {
    vi.stubGlobal("MediaRecorder", undefined);
    expect(pickRecordingMimeType()).toBeUndefined();
  });
});

describe("bitrateForMimeType", () => {
  it("uses 32k for opus", () => {
    expect(bitrateForMimeType("audio/webm;codecs=opus")).toBe(32_000);
    expect(bitrateForMimeType("audio/ogg;codecs=opus")).toBe(32_000);
  });

  it("uses 56k for mp4/AAC", () => {
    expect(bitrateForMimeType("audio/mp4;codecs=mp4a.40.2")).toBe(56_000);
    expect(bitrateForMimeType("audio/mp4")).toBe(56_000);
  });

  it("defaults to 32k when mime is undefined", () => {
    expect(bitrateForMimeType(undefined)).toBe(32_000);
  });
});
