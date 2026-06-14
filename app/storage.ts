import { CUSTOM_RANGE_ID, DEFAULT_RANGES, clampRangeValue } from "./ranges";
import type { DetectorAlgorithm, VoiceRange } from "./types";
import { STORAGE_KEYS } from "~/lib/storageKeys";
const DEFAULT_DETECTOR_ALGORITHM: DetectorAlgorithm = "macleod";

type StoredSettings = {
  selectedRangeId: string;
  customRange: VoiceRange;
  detectorAlgorithm: DetectorAlgorithm;
};

export function loadRangeSettings() {
  if (typeof window === "undefined") {
    return getDefaultSettings();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.rangeSettings);
    if (!raw) {
      return getDefaultSettings();
    }

    const parsed = JSON.parse(raw) as Partial<StoredSettings>;
    const selectedRangeId =
      typeof parsed.selectedRangeId === "string"
        ? parsed.selectedRangeId
        : DEFAULT_RANGES[1].id;
    const detectorAlgorithm =
      parsed.detectorAlgorithm === "amdf" ||
      parsed.detectorAlgorithm === "macleod"
        ? parsed.detectorAlgorithm
        : DEFAULT_DETECTOR_ALGORITHM;
    const custom = parsed.customRange;
    const rawMinHz = Number(custom?.minHz);
    const rawMaxHz = Number(custom?.maxHz);
    const hasCustomMinHz = Number.isFinite(rawMinHz) && rawMinHz > 0;
    const hasCustomMaxHz = Number.isFinite(rawMaxHz) && rawMaxHz > 0;
    const customRange: VoiceRange = {
      id: CUSTOM_RANGE_ID,
      label: "Custom",
      minHz: hasCustomMinHz ? clampRangeValue(rawMinHz, 0) : 0,
      maxHz: hasCustomMaxHz ? clampRangeValue(rawMaxHz, 0) : 0,
      isCustom: true,
    };

    if (
      customRange.minHz > 0 &&
      customRange.maxHz > 0 &&
      customRange.maxHz <= customRange.minHz
    ) {
      customRange.maxHz = customRange.minHz + 1;
    }

    return { selectedRangeId, customRange, detectorAlgorithm };
  } catch {
    return getDefaultSettings();
  }
}

export function saveRangeSettings(settings: StoredSettings) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.rangeSettings, JSON.stringify(settings));
}

function getDefaultSettings() {
  return {
    selectedRangeId: DEFAULT_RANGES[1].id,
    detectorAlgorithm: DEFAULT_DETECTOR_ALGORITHM,
    customRange: {
      id: CUSTOM_RANGE_ID,
      label: "Custom",
      minHz: 0,
      maxHz: 0,
      isCustom: true,
    },
  };
}
