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
      entry: resolve(__dirname, "src/ui/main.ts"),
      name: "TutyUI",
      formats: ["iife"],
      fileName: () => "tuty-ui.js"
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
});
