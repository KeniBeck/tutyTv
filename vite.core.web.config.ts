import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    outDir: resolve(__dirname, "dist/web/js"),
    emptyOutDir: false,
    target: "es2019",
    sourcemap: false,
    minify: "esbuild",
    lib: {
      entry: resolve(__dirname, "src/platforms/shared/legacyCoreBridge.ts"),
      name: "TutyCore",
      formats: ["iife"],
      fileName: () => "tuty-core.js"
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
});
