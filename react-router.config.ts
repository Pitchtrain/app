import { readdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Config } from "@react-router/dev/config";
import { allPrerenderPaths, buildSitemap } from "./app/lib/sitePages";

const basename = (process.env.BASE_PATH ?? "/").replace(/\/$/, "") || "/";

export default {
  ssr: false,
  basename,
  prerender: allPrerenderPaths(),
  async buildEnd({ reactRouterConfig }) {
    const clientDirectory = join(reactRouterConfig.buildDirectory, "client");
    await hoistPrerenderedPages(clientDirectory);
    const siteUrl = process.env.VITE_SITE_URL;
    if (siteUrl) {
      await writeFile(join(clientDirectory, "sitemap.xml"), buildSitemap(siteUrl));
    }
  },
} satisfies Config;

// Prerendered pages land under build/client/<basename>/, while assets stay in
// build/client/ — which is what gets served at the basename. Move the pages up
// so both share one root.
async function hoistPrerenderedPages(clientDirectory: string) {
  if (basename === "/") return;
  const nested = join(clientDirectory, basename);
  for (const entry of await readdir(nested)) {
    await rename(join(nested, entry), join(clientDirectory, entry));
  }
  await rm(join(clientDirectory, basename.split("/")[1]), { recursive: true });
}
