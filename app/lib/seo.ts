import type { MetaDescriptor } from "react-router";
import i18n from "./i18n";
import { APP_NAME, REPOSITORY_URL, SITE_URL } from "./appConfig";
import { type Locale, LOCALES, localeFromPath } from "./locale";
import { SITE_PAGES, type SitePage, siteAssetUrl, sitePageUrl } from "./sitePages";

const OG_LOCALES: Record<Locale, string> = { en: "en_US", de: "de_DE" };
const OG_IMAGE = { path: "og-image.png", width: 1200, height: 630 };

/** Meta tags for a page, in the language of the current URL. */
export function pageMeta(page: SitePage, location: { pathname: string }): MetaDescriptor[] {
  const locale = localeFromPath(location.pathname);
  const t = i18n.getFixedT(locale);
  const title = t(`routes.${page}.title`);
  const description = t(`routes.${page}.description`);
  const { indexed } = SITE_PAGES[page];
  const url = SITE_URL ? sitePageUrl(SITE_URL, page, locale) : null;
  const imageUrl = SITE_URL ? siteAssetUrl(SITE_URL, OG_IMAGE.path) : null;

  return [
    { title },
    { name: "description", content: description },
    { name: "robots", content: indexed ? "index,follow" : "noindex,follow" },
    ...(url ? [{ tagName: "link", rel: "canonical", href: url }] : []),
    ...(SITE_URL && indexed ? hreflangLinks(SITE_URL, page) : []),
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: APP_NAME },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:locale", content: OG_LOCALES[locale] },
    ...LOCALES.filter((other) => other !== locale).map((other) => ({
      property: "og:locale:alternate",
      content: OG_LOCALES[other],
    })),
    ...(url ? [{ property: "og:url", content: url }] : []),
    ...(imageUrl
      ? [
          { property: "og:image", content: imageUrl },
          { property: "og:image:width", content: String(OG_IMAGE.width) },
          { property: "og:image:height", content: String(OG_IMAGE.height) },
          { property: "og:image:alt", content: t("app.ogImageAlt") },
          { name: "twitter:image", content: imageUrl },
        ]
      : []),
    { name: "twitter:card", content: imageUrl ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    ...(page === "home" ? [webApplicationJsonLd(locale, description, url)] : []),
  ];
}

function hreflangLinks(siteUrl: string, page: SitePage): MetaDescriptor[] {
  return [
    ...LOCALES.map((locale) => ({
      tagName: "link",
      rel: "alternate",
      hrefLang: locale,
      href: sitePageUrl(siteUrl, page, locale),
    })),
    { tagName: "link", rel: "alternate", hrefLang: "x-default", href: sitePageUrl(siteUrl, page, "en") },
  ];
}

function webApplicationJsonLd(locale: Locale, description: string, url: string | null): MetaDescriptor {
  return {
    "script:ld+json": {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: APP_NAME,
      description,
      ...(url ? { url } : {}),
      inLanguage: locale,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires a modern browser with microphone access.",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      license: "https://www.gnu.org/licenses/gpl-3.0.html",
      sameAs: REPOSITORY_URL,
    },
  };
}
