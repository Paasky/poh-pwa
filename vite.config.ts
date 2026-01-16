import { fileURLToPath, URL } from "node:url";
import path from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(async ({ command }) => {
  const plugins = [
    vue(),
    // Vuetify Vite plugin with recommended defaults
    vuetify({
      autoImport: true,
      // Use Vuetify's Sass config to override framework variables (typography, fonts, etc.)
      styles: { configFile: "src/styles/settings.scss" },
    }),
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
        // Match Vuetify dark theme
        theme_color: "#f59e0b", // amber 500 (primary)
        background_color: "#0f172a", // slate 900 (background)
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
  ];

  // Add Vue DevTools only during development (dev server). Keeps production build clean.
  if (command === "serve") {
    const { default: VueDevTools } = await import("vite-plugin-vue-devtools");
    // @ts-ignore
    plugins.unshift(
      // DevTools first so it can hook into Vue plugin if needed
      VueDevTools() as any,
    );

    // Data Forge Watcher
    plugins.push({
      name: "watch-static-data",
      configureServer(server) {
        server.watcher.add(path.resolve(process.cwd(), "data"));
      },
      async handleHotUpdate({ file, server }) {
        if (file.includes("/data/") && file.endsWith(".json")) {
          console.log(`\n⚒ Data changed: ${path.relative(process.cwd(), file)}. Reforging...`);
          try {
            // We import child_process dynamically to keep it out of the global scope
            const { execSync } = await import("node:child_process");

            // Execute the existing bake script.
            // { stdio: "inherit" } ensures you see the compiler's output in your terminal.
            execSync("pnpm data:bake", { stdio: "inherit" });

            server.ws.send({ type: "full-reload" });
          } catch (err) {
            // The error is already logged to the terminal by the inherited stdio
          }
        }
      },
    });
  }

  // noinspection JSUnusedGlobalSymbols
  const hmrHost = process.env.VITE_HMR_HOST;

  return {
    plugins,
    // Ensure the dev server is reachable from Docker port-forwarding
    // Bind explicitly to all interfaces on IPv4, and keep a fixed port.
    // This avoids cases where Vite defaults to ::1 (IPv6 loopback) inside containers.
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
      // HMR configuration:
      // - For localhost, default Vite behavior is fine without forcing host
      // - For LAN testing, either leave unset (Vite will use page origin), or
      //   set VITE_HMR_HOST=<your-lan-ip> to force a specific host.
      ...(hmrHost ? { hmr: { host: hmrHost, clientPort: 5173 } } : {}),
    },
    build: {
      // Increase the chunk size warning limit to 10 MB (default is 500 kB)
      // The value is in kB, so 10 MB = 10 * 1024 = 10240
      chunkSizeWarningLimit: 10240,
      rollupOptions: {
        // Keep this to optionally fail CI on warnings via FAIL_ON_WARNINGS=1
        // Used by the "build:dev" script. Otherwise, delegate to default handler.
        onwarn(warning: { message: any }, defaultHandler: (arg0: any) => void) {
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
    test: {
      environment: "happy-dom",
      setupFiles: ["./tests/_setup/vitest-canvas-mock.ts"],
    },
  };
});
