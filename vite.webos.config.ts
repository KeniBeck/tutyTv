import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist/webos",
    emptyOutDir: true,
    target: "chrome53",
    sourcemap: true,
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    lib: {
      entry: resolve(__dirname, "src/platforms/webos/main.ts"),
      name: "TutyWebOSApp",
      formats: ["iife"],
      fileName: () => "app.js"
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        assetFileNames: "assets/[name][extname]"
      }
    }
  }
});
