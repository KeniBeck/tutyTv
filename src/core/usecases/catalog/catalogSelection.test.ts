import { describe, expect, it } from "vitest";
import { buildEpisodeRanges, filterCatalogCategory, selectCatalogPage } from "./catalogSelection";

describe("catalog selection", () => {
  const items = [
    { id: "1", category: "pelicula", kind: "destacado" },
    { id: "2", category: "serie", kind: "destacado" },
    { id: "3", category: "serie", kind: "pelicula" },
    { id: "4", category: "anime", kind: "serie" }
  ];

  it("selects a category, preserves order and fills to the limit", () => {
    expect(selectCatalogPage(items, "serie", 10, 0).map((item) => item.id)).toEqual(["2", "3", "1", "4"]);
  });

  it("falls back to the requested page and fills unique items", () => {
    expect(selectCatalogPage(items, "missing", 3, 1).map((item) => item.id)).toEqual(["2", "3", "4"]);
    expect(selectCatalogPage(items, "", 3, 3).map((item) => item.id)).toEqual(["4", "1", "2"]);
  });

  it("handles an empty catalog and zero limit", () => {
    expect(selectCatalogPage([], "serie", 3, 0)).toEqual([]);
    expect(selectCatalogPage(items, "", 0, 0)).toEqual([]);
    expect(selectCatalogPage(items, "serie", 0, 0).map((item) => item.id)).toEqual(["2", "3"]);
  });

  it("filters by category or kind and falls back to the full catalog", () => {
    expect(filterCatalogCategory(items, "serie").map((item) => item.id)).toEqual(["2", "3", "4"]);
    expect(filterCatalogCategory(items, "destacado").map((item) => item.id)).toEqual(["1", "2"]);
    expect(filterCatalogCategory(items, "missing")).toEqual(items);
    expect(filterCatalogCategory(items, "")).toEqual(items);
  });

  it("builds 20-item episode ranges", () => {
    expect(buildEpisodeRanges(45)).toEqual([
      { start: 0, end: 20 },
      { start: 20, end: 40 },
      { start: 40, end: 45 }
    ]);
    expect(buildEpisodeRanges(0)).toEqual([]);
  });
});
