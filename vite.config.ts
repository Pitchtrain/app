import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import type { Plugin } from "vite";
import { defineConfig } from "vite";

function swDevStub(): Plugin {
  return {
    name: "sw-dev-stub",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.endsWith("/sw.js")) {
          res.writeHead(200, { "Content-Type": "application/javascript" });
          res.end("// dev stub — service worker not active in dev");
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [tailwindcss(), swDevStub(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
});
