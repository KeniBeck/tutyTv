import { describe, expect, it } from "vitest";
import {
  HOME_ICONS,
  HOME_TABS,
  PLAYBACK_KEY,
  PORTAL_ROOTS,
  PROFILE_KEY,
  createInitialProfile,
  createLegacyAppState,
  createLegacyCatalog
} from "./legacyState.js";

describe("legacy state", () => {
  it("provides stable storage keys and portal roots", () => {
    expect(PROFILE_KEY).toBe("xuper_local_profile_v1");
    expect(PLAYBACK_KEY).toBe("xuper_global_playback_v1");
    expect(PORTAL_ROOTS).toHaveLength(6);
  });

  it("provides icons for every tab", () => {
    expect(HOME_TABS).toHaveLength(7);
    for (const tab of HOME_TABS) {
      expect((HOME_ICONS as Record<string, string>)[tab.icon]).toContain("<svg");
    }
  });

  it("creates the demo catalog and a clean app state", () => {
    const catalog = createLegacyCatalog();
    expect(catalog).toHaveLength(40);
    const state = createLegacyAppState();
    expect(state.screen).toBe("welcome");
    expect(state.favs).toEqual({});
    expect(createInitialProfile()).toMatchObject({ id: "", history: [], reminders: {} });
  });
});
