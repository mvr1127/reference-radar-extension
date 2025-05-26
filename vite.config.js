import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import webExtension from "vite-plugin-web-extension";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    svelte(),
    webExtension({
      manifest: "./manifest.json",
      format: "es", // ✅ Prevents IIFE crash in background/content scripts
      htmlViteConfig: {
        build: {
          rollupOptions: {
            output: {
              format: "es",
            },
          },
        },
      },
      scriptViteConfig: {
        build: {
          rollupOptions: {
            output: {
              format: "es",
            },
          },
        },
      },
    }),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
        background: resolve(__dirname, "src/background.ts"),
        content: resolve(__dirname, "src/content.ts"),
      },
      output: {
        inlineDynamicImports: false, // ✅ Allows multi-entry points
        entryFileNames: "[name].js", // 🧼 Ensures clean output filenames
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
  format: "es",
      },
    },
  },
});
