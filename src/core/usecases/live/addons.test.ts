import { describe, expect, it } from "vitest";
import { isM3uAddonUrl, upsertM3uAddon } from "./addons";

describe("M3U addons", () => {
  it("appends a new addon with defaults", () => {
    const addons = [{ id: "one", name: "Uno", url: "https://one.test/a.m3u", count: 2 }];

    expect(upsertM3uAddon(addons, { url: "https://two.test/b.m3u" }, 7, 1000)).toEqual([
      addons[0],
      { id: "addon_1000", name: "Lista M3U", url: "https://two.test/b.m3u", count: 7 }
    ]);
    expect(addons).toHaveLength(1);
  });

  it("updates an existing addon by URL without losing metadata", () => {
    const addons = [
      { id: "one", name: "Uno", url: "https://one.test/a.m3u", count: 2 },
      { id: "two", name: "Dos", url: "https://two.test/b.m3u", count: 3 }
    ];

    expect(upsertM3uAddon(addons, { id: "ignored", name: "Ignored", url: "https://two.test/b.m3u" }, 9, 1000)).toEqual([
      addons[0],
      { id: "two", name: "Dos", url: "https://two.test/b.m3u", count: 9 }
    ]);
  });

  it("accepts only HTTP(S) addon URLs", () => {
    expect(isM3uAddonUrl(" https://example.test/list.m3u ")).toBe(true);
    expect(isM3uAddonUrl("HTTP://example.test/list.m3u")).toBe(true);
    expect(isM3uAddonUrl("ftp://example.test/list.m3u")).toBe(false);
    expect(isM3uAddonUrl("")).toBe(false);
    expect(isM3uAddonUrl(null)).toBe(false);
  });
});
