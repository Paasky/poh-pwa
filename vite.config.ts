import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Custom dev-server middleware to serve files from /public (notably /media)
    // with 200 (no 304) and to return an empty 404 when the requested file does not exist.
    {
      name: "dev-serve-public-media-no-cache",
      apply: "serve",
      configureServer(server) {
        const publicDir = path.resolve(server.config.root, "public");
        server.middlewares.use(async (req, res, next) => {
          try {
            const url = req.url || "/";
            // Only take over requests that target the public folder mapping
            // Examples: /media/... (maps to public/media/...) or /public/... (maps to public/...)
            const isMedia = url.startsWith("/media/");
            const isExplicitPublic = url.startsWith("/public/");
            if (!isMedia && !isExplicitPublic) return next();

            // Resolve to a path under /public securely
            const pathname = new URL(url, "http://local").pathname;
            const relativePath = isExplicitPublic
              ? pathname.replace(/^\/public/, "")
              : pathname;
            const target = path.join(publicDir, relativePath);
            const resolved = path.resolve(target);
            if (!resolved.startsWith(publicDir + path.sep)) {
              // Prevent path traversal; treat as not found
              res.statusCode = 404;
              res.end();
              return;
            }

            if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
              // Empty 404 for non-existing media
              res.statusCode = 404;
              res.end();
              return;
            }

            // Determine a simple content type based on extension
            const ext = path.extname(resolved).toLowerCase();
            const types: Record<string, string> = {
              ".jpg": "image/jpeg",
              ".jpeg": "image/jpeg",
              ".png": "image/png",
              ".gif": "image/gif",
              ".webp": "image/webp",
              ".svg": "image/svg+xml",
              ".json": "application/json",
              ".txt": "text/plain; charset=utf-8",
            };
            const type = types[ext] || "application/octet-stream";
            res.setHeader("Content-Type", type);
            // Ensure no caching and avoid conditional 304 responses
            res.setHeader("Cache-Control", "no-store");
            res.statusCode = 200;
            fs.createReadStream(resolved).pipe(res);
            return;
          } catch (e) {
            return next();
          }
        });
      },
    },
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "robots.txt"],
      workbox: {
        // Allow precaching larger bundles (default is 2 MiB)
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
      manifest: {
        name: "Pages of History",
        short_name: "Pages",
        description: "A Vue PWA called Pages of History",
        theme_color: "#d99201",
        background_color: "#1a3f22",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        // In CI or pre-commit, fail the build on any Rollup warning
        if (process.env.FAIL_ON_WARNINGS === "1") {
          const msg = typeof warning === "string" ? warning : warning.message;
          throw new Error(`Rollup warning treated as error: ${msg}`);
        }
        defaultHandler(warning);
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
