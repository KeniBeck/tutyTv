import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");

const snippet = source.match(
  / {4}function legacyNormalizeLiveCategories\([\s\S]*?(?= {4}function Ft\()/
)?.[0];

interface Category {
  id: number | string;
  name: string;
  code?: string;
  isAddon?: boolean;
}

interface Addon {
  id?: string;
  name?: string;
  url?: string;
  count?: number;
}

describe("legacy live categories and addons integration", () => {
  it("keeps category normalization and addon mutations connected to Core", () => {
    expect(source).toMatch(/legacyNormalizeLiveCategories\(i && i\.categories\)/);
    expect(source).toMatch(/legacyUpsertM3uAddon\(wt\(\), e, a\.channels\.length\)/);
    expect(source).toMatch(/legacyIsAddonUrl\(i\)/);
    expect(source).toMatch(/legacyFormatLiveCategoryLabel\(i, liveFavFilter, a\)/);
    expect(source).toMatch(/legacyLiveListScrollTop\(Ue\.indexOf\(e\), ae\.scrollTop, ae\.scrollHeight, ae\.clientHeight\)/);
    expect(source).toMatch(/legacyHasAddonUrl\(r, t\.url\)/);
    expect(source).toMatch(/legacyRemoveAddonAt\(r, i\)/);
  });

  it.each([true, false])("normalizes categories and falls back to defaults (core available: %s)", (withCore) => {
    expect(snippet).toBeTruthy();
    const runtime = runInNewContext(
      `${snippet}\n({ legacyNormalizeLiveCategories, legacyUpsertM3uAddon, legacyIsAddonUrl, legacyFormatLiveCategoryLabel, legacyLiveListScrollTop, legacyHasAddonUrl, legacyRemoveAddonAt })`,
      { window: { TutyCore: withCore ? core : undefined } }
    ) as {
      legacyNormalizeLiveCategories(categories: Category[] | null): Category[];
      legacyUpsertM3uAddon(addons: Addon[], entry: Addon, count: number): Addon[];
      legacyIsAddonUrl(value: unknown): boolean;
      legacyFormatLiveCategoryLabel(categoryName: unknown, favoritesOnly: boolean, count: number): string;
      legacyLiveListScrollTop(rowIndex: number, scrollTop: number, scrollHeight: number, clientHeight: number): number;
      legacyHasAddonUrl(addons: Addon[], url: unknown): boolean;
      legacyRemoveAddonAt(addons: Addon[], index: number): Addon[];
    };

    expect(runtime.legacyNormalizeLiveCategories([
      { id: 76182, name: "ChannelList", code: "all" },
      { id: 76206, name: "Deportes" }
    ])).toEqual([
      { id: 76182, name: "Todos", code: "all", isAddon: false },
      { id: 76206, name: "Deportes", code: undefined, isAddon: false },
      { id: "addons", name: "➕ Addons M3U", isAddon: true }
    ]);
    expect(runtime.legacyNormalizeLiveCategories(null)).toHaveLength(7);

    const addons: Addon[] = [{ id: "one", name: "Uno", url: "https://one.test/a.m3u", count: 2 }];
    expect(runtime.legacyUpsertM3uAddon(addons, { url: "https://one.test/a.m3u" }, 8)).toEqual([
      { id: "one", name: "Uno", url: "https://one.test/a.m3u", count: 8 }
    ]);
    expect(runtime.legacyUpsertM3uAddon(addons, { id: "two", name: "Dos", url: "https://two.test/b.m3u" }, 4)).toEqual([
      addons[0],
      { id: "two", name: "Dos", url: "https://two.test/b.m3u", count: 4 }
    ]);
    expect(runtime.legacyIsAddonUrl(" https://example.test/list.m3u ")).toBe(true);
    expect(runtime.legacyIsAddonUrl("ftp://example.test/list.m3u")).toBe(false);
    expect(runtime.legacyFormatLiveCategoryLabel("Deportes", false, 1)).toBe("TV en vivo · Deportes · 1 canal");
    expect(runtime.legacyFormatLiveCategoryLabel("Deportes", true, 0)).toBe("TV en vivo · Favoritos");
    expect(runtime.legacyLiveListScrollTop(2, 500, 2000, 400)).toBe(240);
    expect(runtime.legacyLiveListScrollTop(20, 0, 800, 400)).toBe(400);
    expect(runtime.legacyHasAddonUrl(addons, "https://one.test/a.m3u")).toBe(true);
    expect(runtime.legacyHasAddonUrl(addons, "https://missing.test/c.m3u")).toBe(false);
    const removable: Addon[] = [
      ...addons,
      { id: "two", name: "Dos", url: "https://two.test/b.m3u", count: 4 }
    ];
    expect(runtime.legacyRemoveAddonAt(removable, 0)).toEqual([removable[1]]);
    expect(removable).toHaveLength(2);
  });
});
