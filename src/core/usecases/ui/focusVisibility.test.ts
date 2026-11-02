import { describe, expect, it } from "vitest";
import {
  isLegacyFocusVisible,
  type LegacyFocusVisibilityState,
  type LegacyVisibilityProbe
} from "./focusVisibility";

function state(overrides: Partial<LegacyFocusVisibilityState> = {}): LegacyFocusVisibilityState {
  return {
    episodeBrowserOpen: false,
    categoryPickerOpen: false,
    liveCategoriesOpen: false,
    liveSearchOpen: false,
    resumeOpen: false,
    filterOpen: false,
    playSettingsOpen: false,
    playSettingViewOpen: false,
    nextEpisodeOpen: false,
    ...overrides
  };
}

function probe(entries: Record<string, string[]> = {}): LegacyVisibilityProbe {
  return {
    closest(selector) {
      const classes = entries[selector];
      if (!classes) return null;
      return { hasClass: (className) => classes.includes(className) };
    }
  };
}

describe("legacy focus visibility", () => {
  it("returns true without container restrictions", () => {
    expect(isLegacyFocusVisible(probe(), state())).toBe(true);
  });

  it.each([
    ["episodeBrowserOpen", "#player-episodes"],
    ["categoryPickerOpen", "#player-categories"],
    ["liveCategoriesOpen", "#live-categories"],
    ["liveSearchOpen", "#live-search"],
    ["resumeOpen", "#dialog-resume"],
    ["filterOpen", "#filter-panel"],
    ["playSettingsOpen", "#dialog-playsettings"],
    ["playSettingViewOpen", "#player-playsetting-view"],
    ["nextEpisodeOpen", "#next-episode-prompt"]
  ] as const)("requires focus inside %s container", (flag, selector) => {
    expect(isLegacyFocusVisible(probe(), state({ [flag]: true }))).toBe(false);
    expect(isLegacyFocusVisible(probe({ [selector]: [] }), state({ [flag]: true }))).toBe(true);
  });

  it("hides focus outside the current home page", () => {
    expect(isLegacyFocusVisible(probe({ ".home-page": [] }), state())).toBe(false);
    expect(isLegacyFocusVisible(probe({ ".home-page": ["is-current"] }), state())).toBe(true);
  });

  it("hides focus in inactive panels and results", () => {
    expect(isLegacyFocusVisible(probe({ ".settings-panel": [] }), state())).toBe(false);
    expect(isLegacyFocusVisible(probe({ ".settings-panel": ["is-active"] }), state())).toBe(true);
    expect(isLegacyFocusVisible(probe({ ".search-results": [] }), state())).toBe(false);
    expect(isLegacyFocusVisible(probe({ ".search-results": ["is-active"] }), state())).toBe(true);
    expect(isLegacyFocusVisible(probe({ ".player-channels": [] }), state())).toBe(false);
    expect(isLegacyFocusVisible(probe({ ".player-channels": ["is-active"] }), state())).toBe(true);
    expect(isLegacyFocusVisible(probe({ ".player-infobar": [] }), state())).toBe(false);
    expect(isLegacyFocusVisible(probe({ ".player-infobar": ["is-active"] }), state())).toBe(true);
  });

  it("hides focus in hidden search hot content", () => {
    expect(isLegacyFocusVisible(probe({ ".search-hot": ["is-hidden"] }), state())).toBe(false);
    expect(isLegacyFocusVisible(probe({ ".search-hot": [] }), state())).toBe(true);
  });
});
