import type { PitchSample, RangeStatus } from "../types";

const HEADERS = [
  "timeMs",
  "rawFrequencyHz",
  "smoothedFrequencyHz",
  "frequencyHz",
  "voiced",
  "confidence",
  "inRange",
  "deviationFromCenter",
  "status",
] as const;

const VALID_STATUSES: RangeStatus[] = [
  "below",
  "in-range",
  "above",
  "no-pitch",
  "unvoiced",
];

function numOrEmpty(value: number | null): string {
  return value == null ? "" : String(value);
}

export function samplesToCSV(samples: PitchSample[]): string {
  const lines: string[] = [HEADERS.join(",")];
  for (const s of samples) {
    lines.push(
      [
        s.timeMs,
        numOrEmpty(s.rawFrequencyHz),
        numOrEmpty(s.smoothedFrequencyHz),
        numOrEmpty(s.frequencyHz),
        s.voiced ? "true" : "false",
        s.confidence,
        s.inRange ? "true" : "false",
        numOrEmpty(s.deviationFromCenter),
        s.status,
      ].join(","),
    );
  }
  return lines.join("\n");
}

function parseNullableNumber(raw: string): number | null {
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseStatus(raw: string): RangeStatus {
  return (VALID_STATUSES as string[]).includes(raw)
    ? (raw as RangeStatus)
    : "no-pitch";
}

export function parseSamplesCSV(text: string): PitchSample[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n").filter((l) => l.length);
  if (lines.length === 0) return [];
  const header = lines[0].split(",");
  const indexOf = (name: string) => header.indexOf(name);
  const iTime = indexOf("timeMs");
  const iRaw = indexOf("rawFrequencyHz");
  const iSmoothed = indexOf("smoothedFrequencyHz");
  const iFreq = indexOf("frequencyHz");
  const iVoiced = indexOf("voiced");
  const iConf = indexOf("confidence");
  const iInRange = indexOf("inRange");
  const iDev = indexOf("deviationFromCenter");
  const iStatus = indexOf("status");

  const out: PitchSample[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    out.push({
      timeMs: Number(cols[iTime]) || 0,
      rawFrequencyHz: parseNullableNumber(cols[iRaw] ?? ""),
      smoothedFrequencyHz: parseNullableNumber(cols[iSmoothed] ?? ""),
      frequencyHz: parseNullableNumber(cols[iFreq] ?? ""),
      voiced: cols[iVoiced] === "true",
      confidence: Number(cols[iConf]) || 0,
      inRange: cols[iInRange] === "true",
      deviationFromCenter: parseNullableNumber(cols[iDev] ?? ""),
      status: parseStatus(cols[iStatus] ?? ""),
    });
  }
  return out;
}
