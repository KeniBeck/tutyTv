import { defineConfig } from "vite";
import { resolve } from "node:path";

const legacyJsDir = resolve(
  __dirname,
  "source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js"
);

export default defineConfig({
  build: {
    outDir: legacyJsDir,
    emptyOutDir: false,
    target: "chrome53",
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
