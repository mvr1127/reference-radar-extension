import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import webExtension from "@samrum/vite-plugin-web-extension"; // Using the new plugin
import { resolve } from "path";
import manifestJson from "./manifest.json" assert { type: "json" };

export default defineConfig({
  plugins: [
    svelte(),
    webExtension({
      manifest: manifestJson, // Use the imported JSON object
    }),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // target: "esnext", // User had this, can be kept or removed if not strictly needed now
    rollupOptions: {
      input: {
        // Only popup.html should be an explicit input.
        // Background and content scripts will be inferred by the plugin from manifest.json
        popup: resolve(__dirname, "popup.html"),
      },
      output: {
        format: "es",
        inlineDynamicImports: false, // Required for multiple outputs and code splitting
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
