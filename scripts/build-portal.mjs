import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const require = createRequire(import.meta.url);

function findEsbuild() {
  if (process.env.ESBUILD_MODULE) return process.env.ESBUILD_MODULE;
  const local = path.join(repoRoot, "node_modules", "esbuild");
  if (fs.existsSync(local)) return local;
  const worker = path.join(repoRoot, "worker", "node_modules", "esbuild");
  if (fs.existsSync(worker)) return worker;
  const pnpm = path.join(repoRoot, "node_modules", ".pnpm");
  if (fs.existsSync(pnpm)) {
    for (const entry of fs.readdirSync(pnpm)) {
      if (!entry.startsWith("esbuild@")) continue;
      const candidate = path.join(pnpm, entry, "node_modules", "esbuild");
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  throw new Error("esbuild no encontrado. Instala esbuild o define ESBUILD_MODULE.");
}

function readOption(argv, name) {
  const prefix = `--${name}=`;
  const match = argv.find((arg) => arg.indexOf(prefix) === 0);
  if (match) return match.slice(prefix.length);
  const index = argv.indexOf(`--${name}`);
  if (index !== -1 && index + 1 < argv.length) return argv[index + 1];
  return "";
}

const esbuild = require(findEsbuild());
const debug = process.argv.includes("--debug");
const shims = path.join(repoRoot, "src", "tizen", "magis-shims");
const outfile = path.resolve(
  readOption(process.argv.slice(2), "out") ||
    path.join(repoRoot, "dist", "tizen-portal", "tuty-portal.js")
);

fs.mkdirSync(path.dirname(outfile), { recursive: true });

await esbuild.build({
  entryPoints: [path.join(repoRoot, "src", "tizen", "portal-entry.js")],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2017",
  minify: !debug,
  sourcemap: false,
  outfile,
  define: {
    global: "globalThis"
  },
  plugins: [
    {
      name: "magis-node-shims",
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

console.log("[portal] listo: " + outfile);
