import { describe, expect, it } from "vitest";
import { DEFAULT_LIVE_CATEGORIES, formatLiveCategoryLabel, normalizeLiveCategories } from "./liveCategories";

describe("live category normalization", () => {
  it("normalizes portal categories and appends the addon category", () => {
    expect(normalizeLiveCategories([
      { id: 76182, name: "ChannelList", code: "all" },
      { id: 76206, name: "Deportes", code: "sports" }
    ])).toEqual([
      { id: 76182, name: "Todos", code: "all", isAddon: false },
      { id: 76206, name: "Deportes", code: "sports", isAddon: false },
      { id: "addons", name: "➕ Addons M3U", isAddon: true }
    ]);
  });

  it("uses the default categories when the portal list is empty", () => {
    const categories = normalizeLiveCategories([]);

    expect(categories).toHaveLength(DEFAULT_LIVE_CATEGORIES.length + 1);
    expect(categories.slice(0, -1).map((category) => category.name)).toEqual([
      "Todos", "Deportes", "Cine y Series", "Colombia", "España", "México"
    ]);
    expect(categories.at(-1)?.isAddon).toBe(true);
  });
});

describe("live category label", () => {
  it("formats the category, favorites and singular/plural counts", () => {
    expect(formatLiveCategoryLabel("Deportes", false, 1)).toBe("TV en vivo · Deportes · 1 canal");
    expect(formatLiveCategoryLabel("Deportes", false, 8)).toBe("TV en vivo · Deportes · 8 canales");
    expect(formatLiveCategoryLabel("Deportes", true, 2)).toBe("TV en vivo · Favoritos · 2 canales");
    expect(formatLiveCategoryLabel("Deportes", false, 0)).toBe("TV en vivo · Deportes");
    expect(formatLiveCategoryLabel("", false, 0)).toBe("TV en vivo · Todos");
  });
});
