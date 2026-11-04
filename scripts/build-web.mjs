import { existsSync } from "node:fs";
import { copyFile, cp, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceApp = resolve(repoRoot, "src/webos/app");
const hlsFile = resolve(repoRoot, "src/web/hls.min.js");
const outDir = resolve(repoRoot, "dist/web");

export async function prepareWeb({ sourceApp, hlsFile, outDir }) {
  if (!existsSync(resolve(sourceApp, "index.html"))) {
    throw new Error("No se encontro index.html de la app webOS.");
  }

  const coreFile = resolve(sourceApp, "js/tuty-core.js");
  const uiFile = resolve(sourceApp, "js/tuty-ui.js");
  await rm(outDir, { recursive: true, force: true });
  await cp(sourceApp, outDir, {
    recursive: true,
    filter: (path) => path !== coreFile && path !== uiFile
  });
  await copyFile(hlsFile, resolve(outDir, "hls.min.js"));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await prepareWeb({ sourceApp, hlsFile, outDir });
    console.log("Archivos web preparados en dist/web");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
