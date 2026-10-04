import { SITE_LOCALES, type SiteLocale } from "./sitePages";
import { STORAGE_KEYS } from "./storageKeys";

export const LOCALES = SITE_LOCALES;
export type Locale = SiteLocale;
export const DEFAULT_LOCALE: Locale = "en";

const PREFIXED_LOCALE = /^\/(de)(?=\/|$)/;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Locale of an app path (router path, without basename). */
export function localeFromPath(pathname: string): Locale {
  const match = PREFIXED_LOCALE.exec(pathname);
  return match && isLocale(match[1]) ? match[1] : DEFAULT_LOCALE;
}

/** Strips the locale prefix: `/de/about` → `/about`, `/de` → `/`. */
export function stripLocale(pathname: string): string {
  return pathname.replace(PREFIXED_LOCALE, "") || "/";
}

/** Path of the same page in another locale: (`/about`, `de`) → `/de/about`. */
export function localizePath(path: string, locale: Locale): string {
  const bare = stripLocale(path);
  if (locale === DEFAULT_LOCALE) return bare;
  return bare === "/" ? `/${locale}/` : `/${locale}${bare}`;
}

/** Strips the deploy basename (e.g. `/app/`) from a browser pathname. */
export function stripBasename(pathname: string, basename = import.meta.env.BASE_URL): string {
  const base = basename.replace(/\/$/, "");
  if (base && (pathname === base || pathname.startsWith(`${base}/`))) {
    return pathname.slice(base.length) || "/";
  }
  return pathname;
}

export function loadStoredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.language);
    return stored ? matchLocale(stored) : null;
  } catch {
    return null;
  }
}

export function storeLocale(locale: Locale) {
  try {
    window.localStorage.setItem(STORAGE_KEYS.language, locale);
  } catch {
    // Storage unavailable (private mode); the URL still carries the locale.
  }
}

/** Stored choice, else the first supported browser language, else default. */
export function preferredLocale(): Locale {
  const stored = loadStoredLocale();
  if (stored) return stored;
  for (const language of navigator.languages ?? [navigator.language]) {
    const match = matchLocale(language);
    if (match) return match;
  }
  return DEFAULT_LOCALE;
}

function matchLocale(language: string): Locale | null {
  const base = language.toLowerCase().split("-")[0];
  return isLocale(base) ? base : null;
}
