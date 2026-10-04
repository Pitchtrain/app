import { STORAGE_KEYS } from "~/lib/storageKeys";

/** Optional features a user (or their trainer) can hide. Hiding never deletes data. */
export type FeatureToggles = {
  journal: boolean;
  reading: boolean;
  prompts: boolean;
};

export type FeatureName = keyof FeatureToggles;

export const FEATURE_NAMES: FeatureName[] = ["journal", "reading", "prompts"];

export const DEFAULT_FEATURE_TOGGLES: FeatureToggles = {
  journal: true,
  reading: true,
  prompts: true,
};

export function parseFeatureToggles(raw: string | null): FeatureToggles {
  if (!raw) return { ...DEFAULT_FEATURE_TOGGLES };
  try {
    const parsed = JSON.parse(raw) as Partial<Record<FeatureName, unknown>>;
    if (!parsed || typeof parsed !== "object") {
      return { ...DEFAULT_FEATURE_TOGGLES };
    }
    // Anything but an explicit `false` keeps the feature on.
    return {
      journal: parsed.journal !== false,
      reading: parsed.reading !== false,
      prompts: parsed.prompts !== false,
    };
  } catch {
    return { ...DEFAULT_FEATURE_TOGGLES };
  }
}

export function loadFeatureToggles(): FeatureToggles {
  if (typeof window === "undefined") return { ...DEFAULT_FEATURE_TOGGLES };
  try {
    return parseFeatureToggles(
      window.localStorage.getItem(STORAGE_KEYS.featureToggles),
    );
  } catch {
    return { ...DEFAULT_FEATURE_TOGGLES };
  }
}

export function saveFeatureToggles(toggles: FeatureToggles) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEYS.featureToggles,
    JSON.stringify(toggles),
  );
}
