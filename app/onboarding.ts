import { STORAGE_KEYS } from "~/lib/storageKeys";

export function hasCompletedOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEYS.onboardingCompleted) === "1";
  } catch {
    return true;
  }
}

export function markOnboardingCompleted() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.onboardingCompleted, "1");
  } catch {
    /* no-op */
  }
}

export function resetOnboarding() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.onboardingCompleted);
  } catch {
    /* no-op */
  }
}
