// Compiles content/<locale>/<kind>/*.md into app/readingSamples.generated.json,
// consumed by app/readingSamples.ts. Run automatically before dev/build/typecheck/test
// via the package.json pre-hooks — see README for the content file format.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "..", "..");
const CONTENT_DIR = path.join(ROOT, "content");
const OUT_FILE = path.join(ROOT, "app", "readingSamples.generated.json");

const LOCALE_ORDER = ["en", "de"];
const KIND_ORDER = ["dialog", "text"];

function rank(list, value) {
  const index = list.indexOf(value);
  return index === -1 ? list.length : index;
}

function parseSample(locale, kind, slug, raw) {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw);
  if (!match) {
    throw new Error(`${locale}/${kind}/${slug}.md is missing frontmatter`);
  }
  const [, frontmatter, body] = match;

  const fields = {};
  for (const line of frontmatter.split("\n")) {
    if (!line.trim()) continue;
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    fields[key] = value;
  }

  if (!fields.title) {
    throw new Error(`${locale}/${kind}/${slug}.md is missing a title`);
  }

  const lines = body
    .trim()
    .split(/\n{2,}/)
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    id: `sample:reading:${locale}:${slug}`,
    title: fields.title,
    locale,
    kind,
    lines,
    ...(fields.license ? { license: fields.license } : {}),
    ...(fields.author ? { author: fields.author } : {}),
    ...(fields.sourceName ? { sourceName: fields.sourceName } : {}),
    ...(fields.sourceUrl ? { sourceUrl: fields.sourceUrl } : {}),
  };
}

function build() {
  const samples = [];

  for (const locale of readdirSync(CONTENT_DIR, { withFileTypes: true })) {
    if (!locale.isDirectory()) continue;
    const localeDir = path.join(CONTENT_DIR, locale.name);

    for (const kind of readdirSync(localeDir, { withFileTypes: true })) {
      if (!kind.isDirectory()) continue;
      const kindDir = path.join(localeDir, kind.name);

      for (const file of readdirSync(kindDir)) {
        if (!file.endsWith(".md")) continue;
        const slug = file.slice(0, -3);
        const raw = readFileSync(path.join(kindDir, file), "utf8");
        samples.push(parseSample(locale.name, kind.name, slug, raw));
      }
    }
  }

  samples.sort((a, b) => {
    const localeDiff = rank(LOCALE_ORDER, a.locale) - rank(LOCALE_ORDER, b.locale);
    if (localeDiff) return localeDiff;
    const kindDiff = rank(KIND_ORDER, a.kind) - rank(KIND_ORDER, b.kind);
    if (kindDiff) return kindDiff;
    return a.id.localeCompare(b.id);
  });

  mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, `${JSON.stringify(samples, null, 2)}\n`);
  console.log(`Built ${samples.length} reading samples -> ${path.relative(ROOT, OUT_FILE)}`);
}

build();
