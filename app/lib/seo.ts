import { APP_DESCRIPTION, APP_NAME, SITE_URL } from "./appConfig";

type SeoOptions = {
  title?: string;
  description?: string;
  path?: string;
  noindex?: boolean;
};

export function absoluteUrl(path = "/") {
  return SITE_URL ? new URL(path, SITE_URL).toString() : null;
}

export function seoMeta({
  title,
  description = APP_DESCRIPTION,
  path = "/",
  noindex = false,
}: SeoOptions = {}) {
  const pageTitle = title ? `${title} · ${APP_NAME}` : APP_NAME;
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl("/pwa-512x512.png");

  return [
    { title: pageTitle },
    { name: "description", content: description },
    { name: "robots", content: noindex ? "noindex,follow" : "index,follow" },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: APP_NAME },
    { property: "og:title", content: pageTitle },
    { property: "og:description", content: description },
    ...(url ? [{ property: "og:url", content: url }] : []),
    ...(imageUrl ? [{ property: "og:image", content: imageUrl }] : []),
    { property: "og:image:width", content: "512" },
    { property: "og:image:height", content: "512" },
    { property: "og:image:alt", content: `${APP_NAME} app icon` },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: pageTitle },
    { name: "twitter:description", content: description },
    ...(imageUrl ? [{ name: "twitter:image", content: imageUrl }] : []),
  ];
}

export function seoLinks(path = "/") {
  const url = absoluteUrl(path);
  return url ? [{ rel: "canonical", href: url }] : [];
}
