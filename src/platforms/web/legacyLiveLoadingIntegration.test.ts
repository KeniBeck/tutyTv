import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");

const snippet = source.match(
  / {4}function legacySelectInitialAddons\([\s\S]*?(?= {4}function legacySelectNewLiveChannels\()/
)?.[0];

describe("legacy live loading integration", () => {
  it("keeps addon seeding, addon channel prep and clamp connected to Core", () => {
    expect(source).toMatch(/legacySelectInitialAddons\(e, Ct\)/);
    expect(source).toMatch(/legacyPrepareAddonChannels\(i, liveIsFav\)/);
    expect(source).toMatch(/legacyClampLiveChannelIndex\(e, F\.length\)/);
  });

  it.each([true, false])("preserves addon seeding and live channel preparation (core available: %s)", (withCore) => {
    expect(snippet).toBeTruthy();
    const runtime = runInNewContext(
      `${snippet}\n({ legacySelectInitialAddons, legacyPrepareAddonChannels, legacyClampLiveChannelIndex })`,
      { window: { TutyCore: withCore ? core : undefined } }
    ) as {
      legacySelectInitialAddons(stored: unknown, presets: Array<{ id: string; url: string }>): {
        addons: Array<{ id: string; url: string }>;
        persist: boolean;
      };
      legacyPrepareAddonChannels(
        channels: Array<{ name: string }>,
        isFavorite: (channel: { name: string }) => boolean
      ): Array<{ name: string; index: number; fav: boolean }>;
      legacyClampLiveChannelIndex(index: number, length: number): number;
    };

    const presets = [{ id: "one", url: "https://one" }, { id: "two", url: "https://two" }];
    expect(runtime.legacySelectInitialAddons([], presets)).toEqual({ addons: [presets[0]], persist: true });
    expect(runtime.legacySelectInitialAddons([presets[1]], presets)).toEqual({ addons: [presets[1]], persist: false });

    const channels = [{ name: "A" }, { name: "B" }];
    const isFavorite = vi.fn((channel: { name: string }) => channel.name === "B");
    expect(runtime.legacyPrepareAddonChannels(channels, isFavorite)).toEqual([
      { name: "A", index: 1, fav: false },
      { name: "B", index: 2, fav: true }
    ]);
    expect(channels).toEqual([{ name: "A" }, { name: "B" }]);

    expect(runtime.legacyClampLiveChannelIndex(-1, 5)).toBe(0);
    expect(runtime.legacyClampLiveChannelIndex(8, 5)).toBe(4);
    expect(runtime.legacyClampLiveChannelIndex(0, 0)).toBe(-1);
  });
});
