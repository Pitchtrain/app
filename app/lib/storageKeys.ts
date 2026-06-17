const CURRENT_NAMESPACE = "pitchtrain";

function buildKey(namespace: string, suffix: string) {
  return `${namespace}:${suffix}`;
}

export const STORAGE_KEYS = {
  language: buildKey(CURRENT_NAMESPACE, "language"),
  libraryFilters: buildKey(CURRENT_NAMESPACE, "library-filters"),
  onboardingCompleted: buildKey(CURRENT_NAMESPACE, "onboarding-completed"),
  practiceSettings: buildKey(CURRENT_NAMESPACE, "practice-settings"),
  rangeSettings: buildKey(CURRENT_NAMESPACE, "range-settings"),
  readingSettings: buildKey(CURRENT_NAMESPACE, "reading-settings"),
} as const;

export const JOURNAL_DB_NAME = buildKey(CURRENT_NAMESPACE, "journal");
