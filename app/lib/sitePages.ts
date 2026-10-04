// Shared by the app (meta tags) and react-router.config.ts (prerender list,
// sitemap), so keep this module free of browser and Vite-only APIs.

export const SITE_LOCALES = ["en", "de"] as const;
export type SiteLocale = (typeof SITE_LOCALES)[number];

export const SITE_PAGES = {
  home: { path: "/", indexed: true },
  welcome: { path: "/welcome", indexed: false },
  about: { path: "/about", indexed: true },
  imprint: { path: "/imprint", indexed: false },
  privacy: { path: "/privacy", indexed: false },
} as const;

export type SitePage = keyof typeof SITE_PAGES;

/** Router path of a page in a locale, e.g. (`about`, `de`) → `/de/about`. */
export function sitePagePath(page: SitePage, locale: SiteLocale): string {
  const path = SITE_PAGES[page].path;
  if (locale === "en") return path;
  return path === "/" ? `/${locale}/` : `/${locale}${path}`;
}

/**
 * Public URL of a page. Prerendered pages are served as `<path>/index.html`,
 * so the trailing-slash form is the one hosts answer without a redirect.
 */
export function sitePageUrl(siteUrl: string, page: SitePage, locale: SiteLocale): string {
  const relative = sitePagePath(page, locale).replace(/^\//, "").replace(/\/?$/, "/");
  return new URL(relative === "/" ? "" : relative, withTrailingSlash(siteUrl)).toString();
}

export function siteAssetUrl(siteUrl: string, asset: string): string {
  return new URL(asset.replace(/^\//, ""), withTrailingSlash(siteUrl)).toString();
}

export function allPrerenderPaths(): string[] {
  // React Router matches prerender paths without a trailing slash; `/de/`
  // would otherwise be rendered as a bare SPA shell.
  return SITE_LOCALES.flatMap((locale) =>
    (Object.keys(SITE_PAGES) as SitePage[]).map((page) =>
      sitePagePath(page, locale).replace(/(.)\/$/, "$1"),
    ),
  );
}

export function buildSitemap(siteUrl: string): string {
  const pages = (Object.keys(SITE_PAGES) as SitePage[]).filter((page) => SITE_PAGES[page].indexed);
  const urls = pages.flatMap((page) =>
    SITE_LOCALES.map((locale) => {
      const alternates = [
        ...SITE_LOCALES.map((alt) => hreflangLink(alt, sitePageUrl(siteUrl, page, alt))),
        hreflangLink("x-default", sitePageUrl(siteUrl, page, "en")),
      ];
      return [
        "  <url>",
        `    <loc>${sitePageUrl(siteUrl, page, locale)}</loc>`,
        ...alternates.map((line) => `    ${line}`),
        "  </url>",
      ].join("\n");
    }),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

function hreflangLink(hreflang: string, href: string) {
  return `<xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}"/>`;
}

function withTrailingSlash(url: string) {
  return url.endsWith("/") ? url : `${url}/`;
}
