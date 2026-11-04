import { describe, expect, it, vi } from "vitest";
import { clampLiveChannelIndex, prepareAddonChannels, selectInitialAddons } from "./liveLoading";

describe("live loading", () => {
  it("uses stored addons or persists the first preset", () => {
    const presets = [{ id: "one", url: "https://one" }, { id: "two", url: "https://two" }];
    expect(selectInitialAddons([], presets)).toEqual({ addons: [presets[0]], persist: true });
    expect(selectInitialAddons(null, presets)).toEqual({ addons: [presets[0]], persist: true });
    expect(selectInitialAddons([presets[1]], presets)).toEqual({ addons: [presets[1]], persist: false });
    expect(selectInitialAddons({}, [])).toEqual({ addons: [], persist: true });
  });

  it("numbers addon channels and marks favorites without mutating the inputs", () => {
    const channels = [{ name: "A" }, { name: "B" }];
    const isFavorite = vi.fn((channel: { name: string }) => channel.name === "B");
    const prepared = prepareAddonChannels(channels, isFavorite);

    expect(prepared).toEqual([
      { name: "A", index: 1, fav: false },
      { name: "B", index: 2, fav: true }
    ]);
    expect(channels).toEqual([{ name: "A" }, { name: "B" }]);
    expect(isFavorite).toHaveBeenCalledTimes(2);
  });

  it("clamps live channel indexes like the legacy code", () => {
    expect(clampLiveChannelIndex(-1, 5)).toBe(0);
    expect(clampLiveChannelIndex(2, 5)).toBe(2);
    expect(clampLiveChannelIndex(8, 5)).toBe(4);
    expect(clampLiveChannelIndex(0, 0)).toBe(-1);
  });
});
