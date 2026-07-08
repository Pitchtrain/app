import { STORAGE_KEYS } from "~/lib/storageKeys";
import {
  READING_LIBRARY_TEXTS,
  type ReadingLibraryText,
  type ReadingLicense,
  type ReadingSample,
} from "./readingSamples";

export type LibraryLocaleFilter = "all" | ReadingSample["locale"];
export type LibraryKindFilter = "all" | ReadingSample["kind"];
// Origin / licensing axis. "all" plus every license value present in the library.
export type LibraryOriginFilter = "all" | ReadingLicense;

export type LibraryFilters = {
  locale: LibraryLocaleFilter;
  kind: LibraryKindFilter;
  origin: LibraryOriginFilter;
};

export const DEFAULT_LIBRARY_FILTERS: LibraryFilters = {
  locale: "all",
  kind: "all",
  origin: "all",
};

const LOCALE_VALUES: LibraryLocaleFilter[] = ["all", "en", "de"];
const KIND_VALUES: LibraryKindFilter[] = ["all", "dialog", "text"];
const ORIGIN_VALUES: LibraryOriginFilter[] = [
  "all",
  "ai",
  "public-domain",
  "cc0",
];

export function sanitizeLibraryFilters(raw: unknown): LibraryFilters {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_LIBRARY_FILTERS };
  const parsed = raw as Partial<LibraryFilters>;
  return {
    locale: LOCALE_VALUES.includes(parsed.locale as LibraryLocaleFilter)
      ? (parsed.locale as LibraryLocaleFilter)
      : DEFAULT_LIBRARY_FILTERS.locale,
    kind: KIND_VALUES.includes(parsed.kind as LibraryKindFilter)
      ? (parsed.kind as LibraryKindFilter)
      : DEFAULT_LIBRARY_FILTERS.kind,
    origin: ORIGIN_VALUES.includes(parsed.origin as LibraryOriginFilter)
      ? (parsed.origin as LibraryOriginFilter)
      : DEFAULT_LIBRARY_FILTERS.origin,
  };
}

export function loadLibraryFilters(): LibraryFilters {
  if (typeof window === "undefined") return { ...DEFAULT_LIBRARY_FILTERS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.libraryFilters);
    if (!raw) return { ...DEFAULT_LIBRARY_FILTERS };
    return sanitizeLibraryFilters(JSON.parse(raw));
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
      (filters.kind === "all" || text.kind === filters.kind) &&
      (filters.origin === "all" || text.license === filters.origin),
  );
}

// Distinct license values present in the library, in a stable display order.
// Lets the UI show only the origin filters that actually match something.
export function availableLibraryOrigins(): ReadingLicense[] {
  const present = new Set(READING_LIBRARY_TEXTS.map((text) => text.license));
  return (["ai", "public-domain", "cc0"] as ReadingLicense[]).filter((value) =>
    present.has(value),
  );
}

export function pickRandomLibraryText(
  texts: ReadingLibraryText[],
): ReadingLibraryText | null {
  if (texts.length === 0) return null;
  return texts[Math.floor(Math.random() * texts.length)];
}
