import { describe, expect, it } from "vitest";
import { mergeCatalogDetail, toggleCatalogFavorite } from "./catalogDetail";

describe("catalog detail merge", () => {
  it("merges useful detail fields and preserves group identity", () => {
    const item: Record<string, unknown> = {
      id: "group-1",
      title: "Grupo",
      _seriesGroup: true,
      _seriesTitle: "Serie",
      _catalogSeasons: [{ id: "s1" }],
      alias: "Grupo"
    };
    const merged = mergeCatalogDetail(item, {
      title: "Título detalle",
      synopsis: "Sinopsis",
      posterList: [{ fileUrl: "poster.jpg" }]
    });

    expect(merged).toBe(item);
    expect(item.id).toBe("group-1");
    expect(item.title).toBe("Serie");
    expect(item.alias).toBe("Serie");
    expect(item.seasons).toEqual([{ id: "s1" }]);
    expect(item.synopsis).toBe("Sinopsis");
  });

  it("skips placeholder values", () => {
    const item: Record<string, unknown> = { id: "1", synopsis: "Original" };
    mergeCatalogDetail(item, { synopsis: "Sin sinopsis disponible.", title: "Nuevo" });
    expect(item.synopsis).toBe("Original");
    expect(item.title).toBe("Nuevo");
  });
});

describe("catalog favorites", () => {
  it("toggles an id without mutating the source map", () => {
    const original = {};
    const added = toggleCatalogFavorite(original, 7);
    expect(added).toEqual({ favorites: { "7": true }, active: true });
    expect(original).toEqual({});

    const removed = toggleCatalogFavorite(added.favorites, "7");
    expect(removed).toEqual({ favorites: {}, active: false });
    expect(added.favorites).toEqual({ "7": true });
  });

  it("ignores missing ids", () => {
    const favorites = { "1": true };
    expect(toggleCatalogFavorite(favorites, null)).toEqual({ favorites, active: false });
    expect(toggleCatalogFavorite(favorites, "")).toEqual({ favorites, active: false });
  });
});
