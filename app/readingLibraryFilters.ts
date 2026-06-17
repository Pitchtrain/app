import { STORAGE_KEYS } from "~/lib/storageKeys";
import {
  READING_LIBRARY_TEXTS,
  type ReadingLibraryText,
  type ReadingSample,
} from "./readingSamples";

export type LibraryLocaleFilter = "all" | ReadingSample["locale"];
export type LibraryKindFilter = "all" | ReadingSample["kind"];

export type LibraryFilters = {
  locale: LibraryLocaleFilter;
  kind: LibraryKindFilter;
};

export const DEFAULT_LIBRARY_FILTERS: LibraryFilters = {
  locale: "all",
  kind: "all",
};

const LOCALE_VALUES: LibraryLocaleFilter[] = ["all", "en", "de"];
const KIND_VALUES: LibraryKindFilter[] = ["all", "dialog", "text"];

export function loadLibraryFilters(): LibraryFilters {
  if (typeof window === "undefined") return { ...DEFAULT_LIBRARY_FILTERS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.libraryFilters);
    if (!raw) return { ...DEFAULT_LIBRARY_FILTERS };
    const parsed = JSON.parse(raw) as Partial<LibraryFilters>;
    return {
      locale: LOCALE_VALUES.includes(parsed.locale as LibraryLocaleFilter)
        ? (parsed.locale as LibraryLocaleFilter)
        : DEFAULT_LIBRARY_FILTERS.locale,
      kind: KIND_VALUES.includes(parsed.kind as LibraryKindFilter)
        ? (parsed.kind as LibraryKindFilter)
        : DEFAULT_LIBRARY_FILTERS.kind,
    };
  } catch {
    return { ...DEFAULT_LIBRARY_FILTERS };
  }
}

export function saveLibraryFilters(filters: LibraryFilters) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEYS.libraryFilters,
    JSON.stringify(filters),
  );
}

export function filterLibraryTexts(
  filters: LibraryFilters,
): ReadingLibraryText[] {
  return READING_LIBRARY_TEXTS.filter(
    (text) =>
      (filters.locale === "all" || text.locale === filters.locale) &&
      (filters.kind === "all" || text.kind === filters.kind),
  );
}

export function pickRandomLibraryText(
  texts: ReadingLibraryText[],
): ReadingLibraryText | null {
  if (texts.length === 0) return null;
  return texts[Math.floor(Math.random() * texts.length)];
}
