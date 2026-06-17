import type {
  ReadingFeedbackSettings,
  ReadingRangeGoal,
  ReadingSettings,
  ReadingText,
  ReadingTextSource,
} from "./types";
import { STORAGE_KEYS } from "~/lib/storageKeys";
import { READING_LIBRARY_TEXTS } from "./readingSamples";
import type { ReadingArchive } from "./journal/zip";

export const DEFAULT_READING_FEEDBACK: ReadingFeedbackSettings = {
  rangeGoal: "auto",
  thresholdHz: 5,
};

const READING_RANGE_GOALS: ReadingRangeGoal[] = ["auto", "both", "above", "below"];

function createReadingId(prefix: string) {
  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

export function createReadingText(
  title: string,
  body: string,
  source: ReadingTextSource = "user",
): ReadingText {
  const now = Date.now();
  return {
    id: createReadingId("reading"),
    title: title.trim() || "Untitled text",
    body,
    source,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateReadingText(
  text: ReadingText,
  changes: Pick<Partial<ReadingText>, "title" | "body">,
): ReadingText {
  return {
    ...text,
    ...changes,
    title: changes.title != null ? changes.title.trim() || text.title : text.title,
    updatedAt: Date.now(),
  };
}

export function titleFromFileName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").trim() || "Imported text";
}

function getDefaultSettings(): ReadingSettings {
  return {
    texts: [],
    activeTextId: READING_LIBRARY_TEXTS[0]?.id ?? null,
    feedback: { ...DEFAULT_READING_FEEDBACK },
  };
}

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, value));
}

function sanitizeFeedback(raw: unknown): ReadingFeedbackSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_READING_FEEDBACK };
  const obj = raw as Record<string, unknown>;
  const rangeGoal = READING_RANGE_GOALS.includes(obj.rangeGoal as ReadingRangeGoal)
    ? (obj.rangeGoal as ReadingRangeGoal)
    : DEFAULT_READING_FEEDBACK.rangeGoal;

  return {
    rangeGoal,
    thresholdHz: clampNumber(
      obj.thresholdHz,
      DEFAULT_READING_FEEDBACK.thresholdHz,
      0,
      50,
    ),
  };
}

function sanitizeText(raw: unknown): ReadingText | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== "string") return null;
  if (typeof obj.title !== "string") return null;
  if (typeof obj.body !== "string") return null;
  const source =
    obj.source === "import" || obj.source === "module" || obj.source === "user"
      ? obj.source
      : "user";
  return {
    id: obj.id,
    title: obj.title.trim() || "Untitled text",
    body: obj.body,
    source,
    createdAt: typeof obj.createdAt === "number" ? obj.createdAt : Date.now(),
    updatedAt: typeof obj.updatedAt === "number" ? obj.updatedAt : Date.now(),
  };
}

export function loadReadingSettings(): ReadingSettings {
  if (typeof window === "undefined") return getDefaultSettings();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.readingSettings);
    if (!raw) return getDefaultSettings();

    const parsed = JSON.parse(raw) as Partial<ReadingSettings>;
    const texts = Array.isArray(parsed.texts)
      ? parsed.texts
          .map(sanitizeText)
          .filter((text): text is ReadingText => text != null)
      : [];
    const knownIds = new Set([
      ...texts.map((text) => text.id),
      ...READING_LIBRARY_TEXTS.map((text) => text.id),
    ]);
    const activeTextId =
      typeof parsed.activeTextId === "string" && knownIds.has(parsed.activeTextId)
        ? parsed.activeTextId
        : texts[0]?.id ?? READING_LIBRARY_TEXTS[0]?.id ?? null;

    return {
      texts,
      activeTextId,
      feedback: sanitizeFeedback(parsed.feedback),
    };
  } catch {
    return getDefaultSettings();
  }
}

export function saveReadingSettings(settings: ReadingSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.readingSettings, JSON.stringify(settings));
}

// Own (non-module) reading texts plus their settings, for the journal archive.
export function buildReadingArchive(settings: ReadingSettings): ReadingArchive {
  return {
    texts: settings.texts.filter((text) => text.source !== "module"),
    activeTextId: settings.activeTextId,
    feedback: settings.feedback,
  };
}

// Merge an imported archive into current settings: add new own texts (by id),
// restore feedback and active selection when present.
export function mergeReadingArchive(
  current: ReadingSettings,
  archive: unknown,
): ReadingSettings {
  if (!archive || typeof archive !== "object") return current;
  const obj = archive as Record<string, unknown>;

  const importedTexts = Array.isArray(obj.texts)
    ? obj.texts
        .map(sanitizeText)
        .filter((text): text is ReadingText => text != null)
        .filter((text) => text.source !== "module")
    : [];
  const existingIds = new Set(current.texts.map((text) => text.id));
  const texts = [
    ...current.texts,
    ...importedTexts.filter((text) => !existingIds.has(text.id)),
  ];

  const feedback =
    obj.feedback != null ? sanitizeFeedback(obj.feedback) : current.feedback;

  const knownIds = new Set([
    ...texts.map((text) => text.id),
    ...READING_LIBRARY_TEXTS.map((text) => text.id),
  ]);
  const activeTextId =
    typeof obj.activeTextId === "string" && knownIds.has(obj.activeTextId)
      ? obj.activeTextId
      : current.activeTextId;

  return { texts, activeTextId, feedback };
}
