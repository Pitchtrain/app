import { describe, expect, it } from "vitest";
import { localeFromPath, localizePath, stripBasename, stripLocale } from "./locale";
import { allPrerenderPaths, sitePageUrl } from "./sitePages";

const SITE = "https://pitchtrain.github.io/app/";

describe("locale paths", () => {
  it("reads the locale from the path prefix", () => {
    expect(localeFromPath("/")).toBe("en");
    expect(localeFromPath("/about")).toBe("en");
    expect(localeFromPath("/de")).toBe("de");
    expect(localeFromPath("/de/about")).toBe("de");
    expect(localeFromPath("/deutsch")).toBe("en");
  });

  it("maps a page between locales", () => {
    expect(localizePath("/about", "de")).toBe("/de/about");
    expect(localizePath("/", "de")).toBe("/de/");
    expect(localizePath("/de/about", "en")).toBe("/about");
    expect(localizePath("/de", "en")).toBe("/");
    expect(stripLocale("/de/")).toBe("/");
  });

  it("strips the deploy basename only at a segment boundary", () => {
    expect(stripBasename("/app/de/about", "/app/")).toBe("/de/about");
    expect(stripBasename("/app", "/app/")).toBe("/");
    expect(stripBasename("/application", "/app/")).toBe("/application");
    expect(stripBasename("/de/", "/")).toBe("/de/");
  });
});

describe("site pages", () => {
  it("builds trailing-slash public URLs under the base path", () => {
    expect(sitePageUrl(SITE, "home", "en")).toBe("https://pitchtrain.github.io/app/");
    expect(sitePageUrl(SITE, "home", "de")).toBe("https://pitchtrain.github.io/app/de/");
    expect(sitePageUrl(SITE, "about", "de")).toBe("https://pitchtrain.github.io/app/de/about/");
    expect(sitePageUrl("https://example.org", "about", "en")).toBe("https://example.org/about/");
  });

  it("prerenders every page in every locale without trailing slashes", () => {
    const paths = allPrerenderPaths();
    expect(paths).toContain("/");
    expect(paths).toContain("/de");
    expect(paths).toContain("/de/about");
    expect(paths.filter((path) => path !== "/" && path.endsWith("/"))).toEqual([]);
  });
});
