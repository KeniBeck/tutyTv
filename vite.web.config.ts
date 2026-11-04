import { defineConfig } from "vite";
import { resolve } from "node:path";
import { legacyWebPlugin } from "./scripts/vite-legacy-web-plugin";

const repoRoot = __dirname;
const legacyAppDir = resolve(
  repoRoot,
  "src/webos/app"
);

export default defineConfig({
  root: legacyAppDir,
  base: "/",
  resolve: {
    alias: {
      "@tuty/core-bridge": resolve(repoRoot, "src/platforms/shared/legacyCoreBridge.ts")
    }
  },
  server: {
    host: "127.0.0.1",
    port: 8910,
    strictPort: false,
    open: false,
    fs: {
      allow: [repoRoot]
    }
  },
  plugins: [
    legacyWebPlugin({
      repoRoot,
      hlsFile: resolve(repoRoot, "src/web/hls.min.js"),
      devCoreFile: resolve(repoRoot, "src/platforms/web/legacyCoreDev.ts"),
      devUiFile: resolve(repoRoot, "src/ui/dev.ts")
    })
  ],
  build: {
    outDir: resolve(repoRoot, "dist/web-vite"),
    emptyOutDir: true,
    target: "es2019"
  }
});
