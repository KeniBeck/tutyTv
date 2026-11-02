import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");

const normalize = source.match(/ {4}function o\(e\) \{[\s\S]*?\n {4}\}/)?.[0];
const snippet = source.match(
  / {4}function legacySelectCatalogPage\([\s\S]*?(?= {4}function legacyFormatPlaybackTime\()/
)?.[0];

interface Item {
  id: string;
  category: string;
  kind: string;
}

describe("legacy catalog selection integration", () => {
  it("keeps page, category and episode range helpers connected to Core", () => {
    expect(source).toMatch(/return legacySelectCatalogPage\(l, e, t, i\)/);
    expect(source).toMatch(/return legacyFilterCatalogCategory\(l, e\)/);
    expect(source).toMatch(/return legacyBuildEpisodeRanges\(e\)/);
  });

  it.each([true, false])("preserves page selection and category fallback (core available: %s)", (withCore) => {
    expect(normalize && snippet).toBeTruthy();
    const runtime = runInNewContext(
      `${normalize}\n${snippet}\n({ legacySelectCatalogPage, legacyFilterCatalogCategory, legacyBuildEpisodeRanges })`,
      { window: { TutyCore: withCore ? core : undefined } }
    ) as {
      legacySelectCatalogPage(items: Item[], category: string, limit: number, offset: number): Item[];
      legacyFilterCatalogCategory(items: Item[], category: string): Item[];
      legacyBuildEpisodeRanges(total: number): Array<{ start: number; end: number }>;
    };

    const items: Item[] = [
      { id: "1", category: "pelicula", kind: "destacado" },
      { id: "2", category: "serie", kind: "destacado" },
      { id: "3", category: "serie", kind: "pelicula" },
      { id: "4", category: "anime", kind: "serie" }
    ];

    expect(runtime.legacySelectCatalogPage(items, "serie", 10, 0).map((item) => item.id)).toEqual(["2", "3", "1", "4"]);
    expect(runtime.legacySelectCatalogPage(items, "missing", 3, 1).map((item) => item.id)).toEqual(["2", "3", "4"]);
    expect(runtime.legacyFilterCatalogCategory(items, "serie").map((item) => item.id)).toEqual(["2", "3", "4"]);
    expect(runtime.legacyFilterCatalogCategory(items, "missing")).toEqual(items);
    expect(runtime.legacyBuildEpisodeRanges(45)).toEqual([
      { start: 0, end: 20 }, { start: 20, end: 40 }, { start: 40, end: 45 }
    ]);
  });
});
