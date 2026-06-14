import type {VoiceRange} from "./types";

export const DEFAULT_RANGES: VoiceRange[] = [
    {
        id: "male",
        label: "Male",
        minHz: 85,
        maxHz: 145,
        isCustom: false,
    },
    {
        id: "androgynous",
        label: "Androgynous",
        minHz: 145,
        maxHz: 175,
        isCustom: false,
    },
    {
        id: "female",
        label: "Female",
        minHz: 175,
        maxHz: 275,
        isCustom: false,
    },
];

export const CUSTOM_RANGE_ID = "custom";

export function clampRangeValue(value: number, fallback: number) {
    if (!Number.isFinite(value)) {
        return fallback;
    }

    return Math.max(50, Math.min(500, value));
}

export function midpoint(range: VoiceRange) {
    return (range.minHz + range.maxHz) / 2;
}
