import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getManifest } from "workbox-build";

const clientBuildDirectory = resolve("build/client");
const appShell = resolve(clientBuildDirectory, "index.html");
const serviceWorkerPath = resolve(clientBuildDirectory, "sw.js");

if (!existsSync(appShell)) {
  throw new Error(
    "Cannot generate the service worker before build/client/index.html exists.",
  );
}

await removeGeneratedWorkboxFiles();

const { count, manifestEntries, size, warnings } = await getManifest({
  globDirectory: clientBuildDirectory,
  globPatterns: [
    "index.html",
    "manifest.webmanifest",
    "*.{png,ico,svg}",
    "assets/**/*.{js,css,woff,woff2}",
  ],
  globIgnores: ["sw.js", "workbox-*.js", ".vite/**"],
});

const cacheRevision = createHash("sha256")
  .update(JSON.stringify(manifestEntries))
  .digest("hex")
  .slice(0, 16);

await writeFile(serviceWorkerPath, buildServiceWorker(cacheRevision, manifestEntries));

for (const warning of warnings) {
  console.warn(warning);
}

console.log(
  `Generated build/client/sw.js with ${count} precached files (${size} bytes).`,
);

async function removeGeneratedWorkboxFiles() {
  const files = await readdir(clientBuildDirectory);
  await Promise.all(
    files
      .filter((file) => /^workbox-.*\.js(\.map)?$/.test(file) || file === "sw.js.map")
      .map((file) => rm(resolve(clientBuildDirectory, file), { force: true })),
  );
}

function buildServiceWorker(cacheRevision, manifestEntries) {
  return `const CACHE_PREFIX = "pitchtrain-precache";
const CACHE_NAME = \`\${CACHE_PREFIX}-${cacheRevision}\`;
const APP_SHELL_URL = new URL("/index.html", self.location.origin).href;
const PRECACHE_URLS = ${JSON.stringify(
    manifestEntries.map((entry) => `/${entry.url}`),
    null,
    2,
  )}.map((url) => new URL(url, self.location.origin).href);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(
        PRECACHE_URLS.map(
          (url) => new Request(url, { cache: "reload", credentials: "same-origin" }),
        ),
      ),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX))
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      ),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(APP_SHELL_URL, { ignoreSearch: true })),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => cachedResponse ?? fetch(request)),
  );
});
`;
}
