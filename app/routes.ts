import { type RouteConfig, index, prefix, route } from "@react-router/dev/routes";

// English is unprefixed, German lives under /de (see docs/adr/0001-locale-urls.md).
function pages(locale: string) {
  return [
    index("routes/home.tsx", { id: `${locale}/home` }),
    route("welcome", "routes/welcome.tsx", { id: `${locale}/welcome` }),
    route("about", "routes/about.tsx", { id: `${locale}/about` }),
    route("imprint", "routes/imprint.tsx", { id: `${locale}/imprint` }),
    route("privacy", "routes/privacy.tsx", { id: `${locale}/privacy` }),
  ];
}

export default [...pages("en"), ...prefix("de", pages("de"))] satisfies RouteConfig;
