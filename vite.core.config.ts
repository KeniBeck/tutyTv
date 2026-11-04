import { defineConfig } from "vite";
import { resolve } from "node:path";

const legacyJsDir = resolve(
  __dirname,
  "src/webos/app/js"
);

export default defineConfig({
  build: {
    outDir: legacyJsDir,
    emptyOutDir: false,
    target: "chrome53",
    sourcemap: false,
    minify: "esbuild",
    lib: {
      entry: resolve(__dirname, "src/platforms/webos/legacyCoreBridge.ts"),
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
