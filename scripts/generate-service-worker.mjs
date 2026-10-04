import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getManifest } from "workbox-build";

const BASE_PATH = process.env.BASE_PATH ?? "/";
const clientBuildDirectory = resolve("build/client");
// Every route is prerendered; the SPA fallback is the locale-neutral shell
// that hydrates any path, so it backs offline navigation and 404s.
const appShellFile = "__spa-fallback.html";
const appShell = resolve(clientBuildDirectory, appShellFile);
const serviceWorkerPath = resolve(clientBuildDirectory, "sw.js");

if (!existsSync(appShell)) {
  throw new Error(
    `Cannot generate the service worker before build/client/${appShellFile} exists.`,
  );
}

await removeGeneratedWorkboxFiles();

const { count, manifestEntries, size, warnings } = await getManifest({
  globDirectory: clientBuildDirectory,
  globPatterns: [
    appShellFile,
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

await writeFile(
  serviceWorkerPath,
  buildServiceWorker(BASE_PATH, appShellFile, cacheRevision, manifestEntries),
);

// Static hosts without rewrite rules (e.g. GitHub Pages) serve 404.html for
// unknown paths; a copy of the shell keeps deep links working there.
await copyFile(appShell, resolve(clientBuildDirectory, "404.html"));

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

function buildServiceWorker(basePath, appShellFile, cacheRevision, manifestEntries) {
  return `const CACHE_PREFIX = "pitchtrain-precache";
const CACHE_NAME = \`\${CACHE_PREFIX}-${cacheRevision}\`;
const APP_SHELL_URL = new URL("${basePath}${appShellFile}", self.location.origin).href;
const PRECACHE_URLS = ${JSON.stringify(
    manifestEntries.map((entry) => `${basePath}${entry.url}`),
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
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;

  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (data.type === "SKIP_WAITING_WHEN_HIDDEN") {
    event.waitUntil(
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clients) => {
          if (clients.every((client) => client.visibilityState === "hidden")) {
            return self.skipWaiting();
          }
        }),
    );
  }
});

// On flaky connections a navigation fetch can hang for minutes before
// failing; fall back to the cached shell after this long instead.
const NAVIGATION_TIMEOUT_MS = 4000;

async function handleNavigation(request) {
  const networkFetch = fetch(request);
  const timedResponse = await Promise.race([
    networkFetch.catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, NAVIGATION_TIMEOUT_MS, undefined)),
  ]);
  if (timedResponse?.ok) return timedResponse;
  // Timed out, network error, or an error status (static hosts return 404
  // for client-routed paths) — serve the cached shell instead.
  const shell = await caches.match(APP_SHELL_URL, { ignoreSearch: true });
  if (shell) return shell;
  return timedResponse ?? networkFetch;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => cachedResponse ?? fetch(request)),
  );
});
`;
}
