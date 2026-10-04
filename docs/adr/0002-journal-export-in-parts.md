# 2. Journal export in Parts via the share sheet

Date: 2026-10-04

## Status

Accepted

## Context

A Journal of ~400 MB could no longer be exported on an iPhone 16. Export built
one ZIP of every Session in memory (JSZip `generateAsync` into a Blob). WebKit
holds Blobs in memory, and iOS kills the page's WebContent process on memory
pressure with no JS error; reported ceilings are ~1.5–3 GB per device and are
undocumented. Reading, zipping and blobbing multiplies the data 2–3×.

## Decision

- When the Journal exceeds ~100 MB, export is split into Parts of ~100 MB,
  grouped by Session date (oldest first) and listed in a dialog. Smaller
  Journals keep a single one-tap export.
- Each Part is a self-contained ZIP: its Sessions plus the full manifest
  (Tags, reading texts and settings, practice Sets), so any Part imports on
  its own. Tags merge by label, so importing Parts in any order gives one set
  of Tags.
- Each Part is delivered with `navigator.share({ files })` when
  `navigator.canShare` accepts it, otherwise via `<a download>` with a delayed
  URL revoke. One tap per Part, because iOS needs a user gesture for each share.

## Alternatives considered

- Stream one large ZIP to disk through the service worker
  (`Content-Disposition: attachment`): no full Blob in memory, but more
  complex, and field reports show large streamed downloads killed on iOS 18.
- Keep one ZIP of everything: the failure that prompted this.

## Consequences

- Peak export memory is bounded by the Part size, not the Journal size.
- Restoring a large Journal means importing several files.
- Every Part repeats the manifest, which is small.
