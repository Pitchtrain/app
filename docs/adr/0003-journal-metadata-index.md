# 3. Journal list reads a derived metadata index

Date: 2026-10-04

## Status

Accepted

## Context

On startup the app read every Session with `getAll()` on the `sessions` store,
pulling every Recording and Pitch trace into memory. At ~400 MB this
intermittently got the page killed on iOS ("Could not load journal."). The
Journal list only needs metadata. The app is live, so existing Journals must be
migrated in place, with no backup to fall back on.

## Decision

- `DB_VERSION` 2 adds a `sessionMeta` store (name, date, duration, Tags,
  sizes). The `sessions` store and its records stay unchanged.
- After startup, a cursor walks `sessions` one record at a time and fills
  `sessionMeta`. The index is derived: idempotent, resumable, rebuildable.
- Saving or deleting a Session writes both stores in one transaction.
- The Journal list reads `sessionMeta`; opening a Session reads its full
  record from `sessions`.
- Connections close on `versionchange`; a blocked upgrade asks the user to
  close other tabs.

## Alternatives considered

- Split Recordings and Pitch traces into their own stores and move every
  record: every Session would be copied and deleted on live devices, reads
  would need two paths while migrating, and a bug could lose data. Opening a
  Session needs both anyway, so the split buys little.
- Migrate inside `onupgradeneeded`: one transaction over the whole Journal can
  hit the memory limit, abort, and retry on every launch.

## Consequences

- No Recording or Pitch trace data is moved, so the migration cannot lose any.
- `DB_VERSION` cannot be rolled back: older code fails to open a version-2
  database. Fix forward only.
- `sessionMeta` can drift from `sessions` only through a bug; rebuilding it
  from `sessions` is always safe.
