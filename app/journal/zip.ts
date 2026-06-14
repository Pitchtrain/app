import JSZip from "jszip";
import type { JournalTag, SavedSession, VoiceRange } from "../types";
import { parseSamplesCSV, samplesToCSV } from "./csv";

const MANIFEST_VERSION = 1;

type ManifestEntry = {
  id: string;
  name: string;
  createdAt: number;
  durationMs: number;
  audioFile: string;
  csvFile: string;
  audioMimeType: string;
  rangeSnapshot: VoiceRange;
  tagIds?: string[];
};

type Manifest = {
  version: number;
  sessions: ManifestEntry[];
  tags?: JournalTag[];
};

export function extensionForMimeType(mime: string): string {
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  return "webm";
}

export async function exportJournal(
  sessions: SavedSession[],
  tags: JournalTag[] = [],
): Promise<Blob> {
  const zip = new JSZip();
  const audioDir = zip.folder("audio");
  const samplesDir = zip.folder("samples");
  if (!audioDir || !samplesDir) {
    throw new Error("Could not create zip folders.");
  }

  const entries: ManifestEntry[] = [];
  for (const session of sessions) {
    const ext = extensionForMimeType(session.audioMimeType);
    const audioFile = `${session.id}.${ext}`;
    const csvFile = `${session.id}.csv`;
    audioDir.file(audioFile, session.audioBlob);
    samplesDir.file(csvFile, samplesToCSV(session.samples));
    entries.push({
      id: session.id,
      name: session.name,
      createdAt: session.createdAt,
      durationMs: session.durationMs,
      audioFile: `audio/${audioFile}`,
      csvFile: `samples/${csvFile}`,
      audioMimeType: session.audioMimeType,
      rangeSnapshot: session.rangeSnapshot,
      tagIds: session.tagIds,
    });
  }

  const manifest: Manifest = {
    version: MANIFEST_VERSION,
    sessions: entries,
    tags,
  };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  return zip.generateAsync({ type: "blob", mimeType: "application/zip" });
}

export async function importJournal(file: Blob): Promise<{
  sessions: SavedSession[];
  tags: JournalTag[];
}> {
  const zip = await JSZip.loadAsync(file);
  const manifestEntry = zip.file("manifest.json");
  if (!manifestEntry) {
    throw new Error("manifest.json not found in archive.");
  }
  const manifestText = await manifestEntry.async("string");
  const manifest = JSON.parse(manifestText) as Manifest;
  if (!manifest || typeof manifest !== "object" || !Array.isArray(manifest.sessions)) {
    throw new Error("manifest.json is malformed.");
  }

  const sessions: SavedSession[] = [];
  for (const entry of manifest.sessions) {
    const audioEntry = zip.file(entry.audioFile);
    const csvEntry = zip.file(entry.csvFile);
    if (!audioEntry || !csvEntry) {
      throw new Error(`Missing files for session ${entry.id}.`);
    }
    const audioBlob = await audioEntry.async("blob");
    const typedBlob = new Blob([audioBlob], { type: entry.audioMimeType });
    const csvText = await csvEntry.async("string");
    sessions.push({
      id: entry.id,
      name: entry.name,
      createdAt: entry.createdAt,
      durationMs: entry.durationMs,
      audioBlob: typedBlob,
      audioMimeType: entry.audioMimeType,
      samples: parseSamplesCSV(csvText),
      rangeSnapshot: entry.rangeSnapshot,
      tagIds: Array.isArray(entry.tagIds) ? entry.tagIds : [],
    });
  }
  return {
    sessions,
    tags: Array.isArray(manifest.tags) ? manifest.tags : [],
  };
}
