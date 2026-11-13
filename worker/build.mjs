import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const require = createRequire(import.meta.url);

function findEsbuild() {
  if (process.env.ESBUILD_MODULE) return process.env.ESBUILD_MODULE;
  const local = path.join(here, "node_modules", "esbuild");
  if (fs.existsSync(local)) return local;
  const direct = path.join(root, "node_modules", "esbuild");
  if (fs.existsSync(direct)) return direct;
  const pnpm = path.join(root, "node_modules", ".pnpm");
  if (fs.existsSync(pnpm)) {
    for (const entry of fs.readdirSync(pnpm)) {
      if (!entry.startsWith("esbuild@")) continue;
      const candidate = path.join(pnpm, entry, "node_modules", "esbuild");
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  throw new Error("esbuild no encontrado. Instala esbuild o define ESBUILD_MODULE.");
}

const esbuild = require(findEsbuild());
const debug = process.argv.includes("--debug");
const shims = path.join(here, "src", "magis-shims");

await esbuild.build({
  entryPoints: [path.join(here, "src", "index.mjs")],
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2022",
  minify: !debug,
  sourcemap: false,
  outfile: path.join(here, "dist", debug ? "worker.debug.js" : "worker.js"),
  external: ["node:buffer"],
  banner: {
    js: 'import { Buffer as __NodeBuffer } from "node:buffer";\nif (typeof globalThis.Buffer === "undefined") globalThis.Buffer = __NodeBuffer;'
  },
  nodePaths: process.env.NODE_PATH ? process.env.NODE_PATH.split(path.delimiter) : [],
  plugins: [
    {
      name: "node-shims",
      setup(build) {
        build.onResolve({ filter: /^(https|http|crypto|url)$/ }, (args) => {
          if (args.path === "crypto" && /[\\/]crypto-js[\\/]/.test(args.importer)) {
            return { path: path.join(shims, "crypto-dummy.js") };
          }
          return { path: path.join(shims, args.path + ".js") };
        });
      }
    }
  ],
  logLevel: "info"
});

console.log("[worker] listo: " + path.join(here, "dist", debug ? "worker.debug.js" : "worker.js"));
