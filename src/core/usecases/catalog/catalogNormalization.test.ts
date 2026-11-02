import { describe, expect, it } from "vitest";
import {
  extractCatalogItems,
  isSeriesLike,
  normalizeCatalogItem,
  parseSeriesSeasonTitle,
  resolveCatalogImage
} from "./catalogNormalization";

describe("catalog normalization", () => {
  it("extracts arrays from the portal response wrappers", () => {
    const items = [{ id: "1" }];
    expect(extractCatalogItems(items)).toBe(items);
    expect(extractCatalogItems({ data: { items } })).toBe(items);
    expect(extractCatalogItems({ results: items })).toBe(items);
    expect(extractCatalogItems({ empty: true })).toEqual([]);
    expect(extractCatalogItems(null)).toEqual([]);
  });

  it("detects series from type, kind, category, episodes or volume count", () => {
    expect(isSeriesLike({ type: "teleplay" })).toBe(true);
    expect(isSeriesLike({ type: "series" })).toBe(true);
    expect(isSeriesLike({ kind: "serie" })).toBe(true);
    expect(isSeriesLike({ category: "serie" })).toBe(true);
    expect(isSeriesLike({ episodes: [{}] })).toBe(true);
    expect(isSeriesLike({ seasons: [{}] })).toBe(true);
    expect(isSeriesLike({ volumeCount: "2" })).toBe(true);
    expect(isSeriesLike({ type: "movie", volumeCount: 1 })).toBe(false);
    expect(isSeriesLike(null)).toBe(false);
  });

  it("parses season numbers from series titles", () => {
    expect(parseSeriesSeasonTitle({ type: "series", title: "Serie Temporada 2" }))
      .toEqual({ title: "Serie", number: 2 });
    expect(parseSeriesSeasonTitle({ type: "series", title: "Serie - S03" }))
      .toEqual({ title: "Serie", number: 3 });
    expect(parseSeriesSeasonTitle({ type: "series", title: "Serie T0" })).toBeNull();
    expect(parseSeriesSeasonTitle({ type: "series", title: "Serie T100" })).toBeNull();
    expect(parseSeriesSeasonTitle({ type: "movie", title: "Peli Temporada 2" })).toBeNull();
  });

  it("normalizes portal items and resolves relative artwork", () => {
    const item = normalizeCatalogItem({
      id: "abcdefghijklmnop",
      title: "Peli",
      category: "Acción",
      type: "movie",
      kind: "movie",
      genres: "Drama, Acción",
      duration: 90,
      posterUrl: "/poster.jpg",
      landscapeUrl: "https://cdn.example/wide.jpg",
      moreAudio: false
    }, 7, { imageBaseUrl: "https://img.example/", portalMode: true });

    expect(item).toMatchObject({
      id: "abcdefghijklmnop",
      title: "Peli",
      category: "accion",
      type: "movie",
      kind: "movie",
      genres: ["Drama", " Acción"],
      duration: "1 h 30 min",
      poster: "https://img.example/poster.jpg",
      landscape: "https://cdn.example/wide.jpg",
      moreAudio: false,
      moreSubtitle: 0,
      _portal: true
    });
  });

  it("keeps legacy fallbacks for missing metadata", () => {
    const item = normalizeCatalogItem({}, 3);
    expect(item).toMatchObject({
      id: "api-3",
      title: "Sin título",
      score: "—",
      year: "—",
      duration: "—",
      genres: ["Sin clasificar"],
      director: "—",
      actors: "—",
      synopsis: "Sin sinopsis disponible.",
      kind: "película",
      type: "movie"
    });
    expect(resolveCatalogImage("/x.jpg", "https://img")).toBe("https://img/x.jpg");
    expect(resolveCatalogImage("data:image/png;base64,abc", "https://img")).toBe("data:image/png;base64,abc");
  });
});
