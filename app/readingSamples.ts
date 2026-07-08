import type { ReadingText } from "./types";
import generatedSamples from "./readingSamples.generated.json";

export type ReadingLibraryTextKind = "dialog" | "text";

// Origin / licensing axis. AI = generated for this app; the rest are sourced
// works recorded for traceability (see SOURCES.md). Public-domain and CC0 need
// no legal attribution, but we keep author + source URL so provenance is
// auditable and can be surfaced in the UI.
export type ReadingLicense = "ai" | "public-domain" | "cc0";

export type ReadingSample = {
  id: string;
  title: string;
  locale: "en" | "de";
  kind: ReadingLibraryTextKind;
  lines: string[];
  // Defaults to "ai" when omitted (see createSampleReadingTexts).
  license?: ReadingLicense;
  author?: string;
  sourceName?: string;
  sourceUrl?: string;
};

// Compiled from content/<locale>/<kind>/*.md by scripts/build-reading-samples.mjs.
const SAMPLE_READING_TEXTS = generatedSamples as ReadingSample[];

export type ReadingLibraryText = ReadingText & {
  locale: ReadingSample["locale"];
  kind: ReadingLibraryTextKind;
  license: ReadingLicense;
  author?: string;
  sourceName?: string;
  sourceUrl?: string;
};

export function createSampleReadingTexts(): ReadingLibraryText[] {
  return SAMPLE_READING_TEXTS.map((sample, index) => ({
    id: sample.id,
    title: sample.title,
    body: sample.lines.join("\n\n"),
    source: "module",
    locale: sample.locale,
    kind: sample.kind,
    license: sample.license ?? "ai",
    author: sample.author,
    sourceName: sample.sourceName,
    sourceUrl: sample.sourceUrl,
    createdAt: index,
    updatedAt: index,
  }));
}

export const READING_LIBRARY_TEXTS = createSampleReadingTexts();
