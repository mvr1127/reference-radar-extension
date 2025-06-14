import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import webExtension from "@samrum/vite-plugin-web-extension";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    svelte(),
    webExtension({
      manifest: {
        // Instead of a path, define it inline or import it
        name: "Reference Radar Capture",
        version: "0.1",
        manifest_version: 3,
        description: "Save references to your Reference Radar account.",
        action: {
          default_popup: "popup.html",
        },
        permissions: ["tabs", "storage", "activeTab"],
        host_permissions: ["<all_urls>"],
        background: {
          service_worker: "src/background.ts", // Changed from "background.js"
          type: "module",
        },
      },
    }),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "esnext",
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
        background: resolve(__dirname, "src/background.ts"),
      },
      output: {
        format: "es", // ✅ Use ES modules for code splitting
        inlineDynamicImports: false,
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
