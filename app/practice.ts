import type {PracticeItem, PracticeSet, PracticeSettings} from "./types";
import { STORAGE_KEYS } from "~/lib/storageKeys";

export const BUILTIN_SET_ID = "builtin:tongue-twisters";

const TONGUE_TWISTERS: string[] = [
    "She sells seashells by the seashore.",
    "Peter Piper picked a peck of pickled peppers.",
    "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
    "Red leather, yellow leather.",
    "Unique New York.",
    "The sixth sick sheik's sixth sheep's sick.",
    "Fuzzy Wuzzy was a bear.",
    "Toy boat, toy boat, toy boat.",
    "Irish wristwatch, Swiss wristwatch.",
    "Good blood, bad blood.",
];

export function createBuiltInTongueTwisters(): PracticeSet {
    return {
        id: BUILTIN_SET_ID,
        label: "Tongue twisters",
        items: TONGUE_TWISTERS.map((text, i) => ({
            id: `${BUILTIN_SET_ID}:${i}`,
            text,
        })),
        isBuiltIn: true,
        createdAt: 0,
    };
}

export function parsePracticeTextFile(raw: string): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (seen.has(trimmed)) continue;
        seen.add(trimmed);
        result.push(trimmed);
    }
    return result;
}

export function createPracticeId(prefix: string): string {
    return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

export function createSetFromLines(label: string, lines: string[]): PracticeSet {
    const now = Date.now();
    const setId = createPracticeId("set");
    return {
        id: setId,
        label,
        items: lines.map((text, i) => ({
            id: `${setId}:item:${i}`,
            text,
        })),
        createdAt: now,
    };
}

export function replaceSetItems(set: PracticeSet, lines: string[]): PracticeSet {
    return {
        ...set,
        items: lines.map((text, i) => ({
            id: `${set.id}:item:${i}`,
            text,
        })),
    };
}

function shuffle<T>(input: T[]): T[] {
    const arr = input.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function buildOrderedQueue(
    sets: PracticeSet[],
    activeIds: string[],
): PracticeItem[] {
    const activeSet = new Set(activeIds);
    const pool: PracticeItem[] = [];
    for (const set of sets) {
        if (!activeSet.has(set.id)) continue;
        pool.push(...set.items);
    }
    return pool;
}

export function buildShuffledQueue(
    sets: PracticeSet[],
    activeIds: string[],
    avoidFirstId?: string,
): PracticeItem[] {
    const arr = shuffle(buildOrderedQueue(sets, activeIds));
    if (avoidFirstId && arr.length > 1 && arr[0].id === avoidFirstId) {
        const j = 1 + Math.floor(Math.random() * (arr.length - 1));
        [arr[0], arr[j]] = [arr[j], arr[0]];
    }
    return arr;
}

function getDefaultSettings(): PracticeSettings {
    const builtIn = createBuiltInTongueTwisters();
    return {
        sets: [builtIn],
        activeSetIds: [builtIn.id],
        autoAdvanceEnabled: false,
        autoAdvanceSeconds: 8,
        shuffleEnabled: false,
        sentenceFeedbackEnabled: false,
    };
}

export function sanitizeSet(raw: unknown): PracticeSet | null {
    if (!raw || typeof raw !== "object") return null;
    const obj = raw as Record<string, unknown>;
    if (typeof obj.id !== "string" || typeof obj.label !== "string") return null;
    if (!Array.isArray(obj.items)) return null;
    const items: PracticeItem[] = [];
    for (const entry of obj.items) {
        if (!entry || typeof entry !== "object") continue;
        const e = entry as Record<string, unknown>;
        if (typeof e.id !== "string" || typeof e.text !== "string") continue;
        if (!e.text.trim()) continue;
        items.push({id: e.id, text: e.text});
    }
    return {
        id: obj.id,
        label: obj.label,
        items,
        isBuiltIn: obj.isBuiltIn === true,
        createdAt: typeof obj.createdAt === "number" ? obj.createdAt : Date.now(),
    };
}

export function loadPracticeSettings(): PracticeSettings {
    if (typeof window === "undefined") {
        return getDefaultSettings();
    }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.practiceSettings);
        if (!raw) return getDefaultSettings();

        const parsed = JSON.parse(raw) as Partial<PracticeSettings>;
        const sets: PracticeSet[] = [];
        if (Array.isArray(parsed.sets)) {
            for (const entry of parsed.sets) {
                const cleaned = sanitizeSet(entry);
                if (cleaned) sets.push(cleaned);
            }
        }

        if (!sets.some((s) => s.id === BUILTIN_SET_ID)) {
            sets.unshift(createBuiltInTongueTwisters());
        }

        const knownIds = new Set(sets.map((s) => s.id));
        const activeSetIds = Array.isArray(parsed.activeSetIds)
            ? parsed.activeSetIds.filter(
                (id): id is string => knownIds.has(id),
            )
            : [BUILTIN_SET_ID];

        const autoAdvanceEnabled = parsed.autoAdvanceEnabled === true;
        const rawSeconds = Number(parsed.autoAdvanceSeconds);
        const autoAdvanceSeconds =
            Number.isFinite(rawSeconds) && rawSeconds >= 1 && rawSeconds <= 120
                ? Math.round(rawSeconds)
                : 8;
        const shuffleEnabled = parsed.shuffleEnabled === true;
        const sentenceFeedbackEnabled = parsed.sentenceFeedbackEnabled === true;

        return {
            sets,
            activeSetIds,
            autoAdvanceEnabled,
            autoAdvanceSeconds,
            shuffleEnabled,
            sentenceFeedbackEnabled,
        };
    } catch {
        return getDefaultSettings();
    }
}

export function savePracticeSettings(settings: PracticeSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.practiceSettings, JSON.stringify(settings));
}

// Own (non-built-in) practice sets, for the journal archive.
export function buildPracticeArchive(settings: PracticeSettings): PracticeSet[] {
    return settings.sets.filter((set) => !set.isBuiltIn);
}

// Merge imported sets into current settings: add new own sets (by id).
export function mergePracticeSets(
    current: PracticeSettings,
    imported: unknown,
): PracticeSettings {
    if (!Array.isArray(imported)) return current;
    const importedSets: PracticeSet[] = [];
    for (const entry of imported) {
        const cleaned = sanitizeSet(entry);
        if (cleaned && !cleaned.isBuiltIn) importedSets.push(cleaned);
    }
    const existingIds = new Set(current.sets.map((s) => s.id));
    const newSets = importedSets.filter((s) => !existingIds.has(s.id));
    if (newSets.length === 0) return current;
    return {
        ...current,
        sets: [...current.sets, ...newSets],
        activeSetIds: [...current.activeSetIds, ...newSets.map((s) => s.id)],
    };
}
