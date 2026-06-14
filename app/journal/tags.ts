import type {CSSProperties} from "react";
import type {JournalTag, SavedSession} from "~/types";

export const TAG_COLORS = [
    "#3e7c8e",
    "#d77961",
    "#738b5d",
    "#8b5cf6",
    "#c2410c",
    "#0f766e",
    "#be123c",
    "#4f46e5",
];

export const READING_SESSION_TAG_LABEL = "📚";
export const READING_SESSION_TAG_COLOR = "#3e7c8e";

export function createJournalTag(label: string, color: string): JournalTag {
    const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `tag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return {
        id,
        label,
        color,
        createdAt: Date.now(),
    };
}

export function getTagSessionCounts(sessions: SavedSession[]) {
    const counts = new Map<string, number>();
    for (const session of sessions) {
        for (const tagId of session.tagIds) {
            counts.set(tagId, (counts.get(tagId) ?? 0) + 1);
        }
    }
    return counts;
}

export function tagPillStyle(tag: JournalTag, selected = false): CSSProperties {
    return {
        backgroundColor: selected ? tag.color : withAlpha(tag.color, 0.12),
        borderColor: selected ? tag.color : withAlpha(tag.color, 0.35),
        color: selected ? "#ffffff" : tag.color,
    };
}

function withAlpha(hex: string, alpha: number) {
    const normalized = hex.replace("#", "");
    if (normalized.length !== 6) return hex;
    const value = Number.parseInt(normalized, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
