import { describe, expect, it } from "vitest";
import { DEFAULT_FEATURE_TOGGLES, parseFeatureToggles } from "./featureToggles";

describe("parseFeatureToggles", () => {
  it("enables every feature when nothing is stored", () => {
    expect(parseFeatureToggles(null)).toEqual(DEFAULT_FEATURE_TOGGLES);
    expect(DEFAULT_FEATURE_TOGGLES).toEqual({
      journal: true,
      reading: true,
      prompts: true,
    });
  });

  it("reads explicitly disabled features", () => {
    expect(
      parseFeatureToggles(JSON.stringify({ journal: false, prompts: false })),
    ).toEqual({ journal: false, reading: true, prompts: false });
  });

  it("only an explicit false disables a feature", () => {
    expect(
      parseFeatureToggles(JSON.stringify({ journal: 0, reading: "no" })),
    ).toEqual(DEFAULT_FEATURE_TOGGLES);
  });

  it("falls back to defaults on malformed data", () => {
    expect(parseFeatureToggles("{not json")).toEqual(DEFAULT_FEATURE_TOGGLES);
    expect(parseFeatureToggles("null")).toEqual(DEFAULT_FEATURE_TOGGLES);
    expect(parseFeatureToggles("[]")).toEqual(DEFAULT_FEATURE_TOGGLES);
  });
});
