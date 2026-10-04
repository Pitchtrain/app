# 1. Language lives in the URL

Date: 2026-10-04

## Status

Accepted

## Context

Pitchtrain ships in English and German. Language used to be picked purely
client-side (localStorage, then browser language), so every page had a single
URL. Search engines index one language per URL, and hreflang alternates need
distinct URLs per language — German was effectively invisible to search.

## Decision

- English is served unprefixed (`/app/`, `/app/about/`), German under `/de/`
  (`/app/de/`, `/app/de/about/`). English is the `x-default`.
- The URL language is authoritative for what is rendered. Switching language
  in the app navigates to the other language's URL and stores the choice.
- One exception: the bare English home (`/app/`) redirects client-side to
  `/app/de/` when the stored choice — or, if none is stored, the browser
  language — is German. Bots are never redirected, so crawlers always see the
  English home.
- All routes are prerendered per language so each URL ships its own `<head>`.

## Alternatives considered

- Prefix both languages (`/en/`, `/de/`): breaks every existing URL and
  installed PWA start URL for no gain.
- Keep one URL with client-side detection: no indexable German content.
- Let the stored preference override the URL language: URL and content would
  disagree, which search engines treat as broken hreflang.

## Consequences

- Existing English URLs stay stable.
- Adding a language means adding a prefix, prerendered paths, and hreflang
  entries; renaming the German prefix later would break indexed URLs.
