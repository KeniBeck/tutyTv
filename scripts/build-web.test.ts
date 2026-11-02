import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { prepareWeb } from "./build-web.mjs";

describe("web build staging", () => {
  it.each([true, false])("prepares assets without using a webOS Core bundle (present: %s)", async (hasCore) => {
    const root = await mkdtemp(join(tmpdir(), "tutytv-web-build-"));
    try {
      const sourceApp = join(root, "source");
      const outDir = join(root, "dist");
      const hlsFile = join(root, "hls.min.js");
      await mkdir(join(sourceApp, "js"), { recursive: true });
      await writeFile(join(sourceApp, "index.html"), '<script src="js/tuty-core.js"></script>');
      await writeFile(join(sourceApp, "js/app.js"), "legacy app");
      await writeFile(hlsFile, "hls library");
      if (hasCore) await writeFile(join(sourceApp, "js/tuty-core.js"), "old webOS bundle");

      await prepareWeb({ sourceApp, hlsFile, outDir });

      expect(await readFile(join(outDir, "index.html"), "utf8")).toContain("js/tuty-core.js");
      expect(await readFile(join(outDir, "js/app.js"), "utf8")).toBe("legacy app");
      expect(await readFile(join(outDir, "hls.min.js"), "utf8")).toBe("hls library");
      await expect(readFile(join(outDir, "js/tuty-core.js"))).rejects.toMatchObject({ code: "ENOENT" });
      if (hasCore) expect(await readFile(join(sourceApp, "js/tuty-core.js"), "utf8")).toBe("old webOS bundle");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
