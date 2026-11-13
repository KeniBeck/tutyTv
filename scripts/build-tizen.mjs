import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import {
  copyFile,
  cp,
  mkdir,
  readFile,
  rm,
  writeFile
} from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const sourceApp = resolve(repoRoot, "src/webos/app");
  const configTemplate = resolve(repoRoot, "src/tizen/config.xml");
  const hlsFile = resolve(repoRoot, "src/web/hls.min.js");
  const portalFile = resolve(repoRoot, "dist/tizen-portal/tuty-portal.js");
  const defaultPackageId = "TutyTV2027";

function readOption(argv, name) {
  const prefix = `--${name}=`;
  const match = argv.find((arg) => arg.indexOf(prefix) === 0);
  if (match) return match.slice(prefix.length);
  const index = argv.indexOf(`--${name}`);
  if (index !== -1 && index + 1 < argv.length) return argv[index + 1];
  return "";
}

function normalizeServiceUrl(value) {
  const url = String(value || "").trim().replace(/\/+$/, "");
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `http://${url}`;
}

async function patchIndex(outDir) {
  const indexPath = resolve(outDir, "index.html");
  let html = await readFile(indexPath, "utf8");
  if (!/hls\.min\.js/.test(html)) {
    html = html.replace(
      '<script src="config/api.js"></script>',
      '<script src="hls.min.js"></script>\n<script src="config/api.js"></script>'
    );
  }
  if (!/\$WEBAPIS\/webapis\/webapis\.js/.test(html)) {
    html = html.replace(
      '<script src="js/webOSTV.js"></script>',
      '<script src="$WEBAPIS/webapis/webapis.js" onerror="this.onerror=null;"></script>\n<script src="js/webOSTV.js"></script>'
    );
  }
  if (!/js\/tuty-portal\.js/.test(html)) {
    html = html.replace(
      '<script src="js/tuty-ui.js"></script>',
      '<script src="js/tuty-portal.js"></script>\n<script src="js/tuty-ui.js"></script>'
    );
  }
  await writeFile(indexPath, html);
}

async function patchApiConfig(outDir, serviceUrl) {
  const apiPath = resolve(outDir, "config/api.js");
  const source = await readFile(apiPath, "utf8");
  const next = source.replace(
    /devServiceUrl:\s*"[^"]*"/,
    `devServiceUrl: ${JSON.stringify(serviceUrl)}`
  );
  if (next === source && source.indexOf(serviceUrl) === -1) {
    throw new Error("No se pudo configurar devServiceUrl en config/api.js.");
  }
  await writeFile(apiPath, next);
}

function validatePackage(outFile) {
  const members = execFileSync("unzip", ["-Z1", outFile], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
  for (const required of [
    "config.xml",
    "index.html",
    "hls.min.js",
    "js/tuty-core.js",
    "js/tuty-ui.js",
    "js/tuty-portal.js",
    "js/app.js"
  ]) {
    if (!members.includes(required)) {
      throw new Error(`El WGT no contiene ${required}.`);
    }
  }
}

export async function buildTizen(options = {}) {
  const outDir = resolve(options.outDir || resolve(repoRoot, "dist/tizen"));
  const appInfo = JSON.parse(
    await readFile(resolve(sourceApp, "appinfo.json"), "utf8")
  );
  const version = options.version || appInfo.version || "0.0.0";
  const packageId = options.packageId || defaultPackageId;
  const applicationId = options.applicationId || `${packageId}.TutyTV`;
  const serviceUrl = normalizeServiceUrl(
    options.serviceUrl
      || process.env.TIZEN_SERVICE_URL
      || process.env.TUTYTV_SERVICE_URL
      || ""
  );
  const outFile = resolve(
    options.outFile || resolve(repoRoot, `dist/TutyTV_${version}.wgt`)
  );

  if (!existsSync(resolve(sourceApp, "index.html"))) {
    throw new Error("No se encontro index.html de la app.");
  }
  if (!existsSync(hlsFile)) {
    throw new Error("No se encontro src/web/hls.min.js.");
  }
  if (!existsSync(portalFile)) {
    execFileSync(process.execPath, [resolve(repoRoot, "scripts/build-portal.mjs")], {
      stdio: "inherit"
    });
  }
  if (!existsSync(portalFile)) {
    throw new Error("No se pudo generar el portal Tizen (tuty-portal.js).");
  }
  try {
    execFileSync("zip", ["-v"], { stdio: "ignore" });
    execFileSync("unzip", ["-v"], { stdio: "ignore" });
  } catch {
    throw new Error("Faltan las herramientas zip/unzip.");
  }

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await cp(sourceApp, outDir, { recursive: true });
  await copyFile(hlsFile, resolve(outDir, "hls.min.js"));
  await copyFile(portalFile, resolve(outDir, "js/tuty-portal.js"));
  await patchIndex(outDir);
  await patchApiConfig(outDir, serviceUrl);

  const configXml = (await readFile(configTemplate, "utf8"))
    .replaceAll("__PACKAGE_ID__", packageId)
    .replaceAll("__APPLICATION_ID__", applicationId)
    .replaceAll("__VERSION__", version);
  await writeFile(resolve(outDir, "config.xml"), configXml);

  await rm(outFile, { force: true });
  execFileSync("zip", ["-qr", outFile, "."], { cwd: outDir });
  validatePackage(outFile);

  return { outDir, outFile, serviceUrl, version, packageId, applicationId };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await buildTizen({
      serviceUrl: readOption(process.argv.slice(2), "service-url"),
      version: readOption(process.argv.slice(2), "version"),
      packageId: readOption(process.argv.slice(2), "package-id"),
      outFile: readOption(process.argv.slice(2), "out")
    });
    console.log(`WGT generado: ${result.outFile}`);
    console.log(`Backend    : ${result.serviceUrl || "portal directo (sin PC)"}`);
    console.log(`Paquete    : ${result.applicationId}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
