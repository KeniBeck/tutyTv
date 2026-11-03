import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppState } from "../../runtime/state";
import {
  applyPlayerAspect,
  aspectFromSetting,
  attachPlayerVideoSettings,
  getPlayerAspect,
  normalizePlayerAspect,
  refreshAspectButtons,
  refreshStreamModeButtons,
  resetPlayerVideoSettingsRuntime,
  type PlayerVideoSettingsHost,
  type VideoSettingButton,
  type VideoSettingCheck
} from "./playerVideoSettings";

function createClasses(initial: string[] = []) {
  const values = new Set(initial);
  return {
    values,
    classList: {
      add(name: string) {
        values.add(name);
      },
      remove(...names: string[]) {
        names.forEach((name) => values.delete(name));
      },
      toggle(name: string, force?: boolean) {
        const next = force === undefined ? !values.has(name) : force;
        if (next) {
          values.add(name);
        } else {
          values.delete(name);
        }
      },
      contains(name: string) {
        return values.has(name);
      }
    }
  };
}

function createButton(aspect: string) {
  const classes = createClasses();
  const check: VideoSettingCheck = { style: { display: "none" } };
  const button: VideoSettingButton = {
    classList: classes.classList,
    getAttribute: (name: string) => (name === "data-aspect" ? aspect : null)
  };
  return { button, classes, check };
}

function createHarness() {
  const state = createAppState();
  state.screen = "player";
  state.playerMode = "vod";
  const video = createClasses(["aspect-contain"]);
  const relayClasses = createClasses();
  const normalClasses = createClasses();
  const relayCheck: VideoSettingCheck = { style: { display: "none" } };
  const normalCheck: VideoSettingCheck = { style: { display: "block" } };
  const relay = {
    button: {
      classList: relayClasses.classList,
      getAttribute: () => null
    } as VideoSettingButton,
    check: relayCheck
  };
  const normal = {
    button: {
      classList: normalClasses.classList,
      getAttribute: () => null
    } as VideoSettingButton,
    check: normalCheck
  };
  const aspects = ["cover", "contain", "16-9", "4-3"].map(createButton);
  let relayMode = false;
  const host: PlayerVideoSettingsHost = {
    state,
    getVideo: () => video,
    getRelayButton: () => relay.button,
    getNormalButton: () => normal.button,
    getCheck: (button) => {
      if (button === relay.button) return relayCheck;
      if (button === normal.button) return normalCheck;
      const match = aspects.find((entry) => entry.button === button);
      return match ? match.check : null;
    },
    getAspectButtons: () => aspects.map((entry) => entry.button),
    isRelayMode: () => relayMode
  };
  attachPlayerVideoSettings(host);
  return {
    state,
    video,
    relay: { ...relay, classes: relayClasses },
    normal: { ...normal, classes: normalClasses },
    aspects,
    setRelayMode(value: boolean) {
      relayMode = value;
    }
  };
}

afterEach(() => {
  resetPlayerVideoSettingsRuntime();
  vi.clearAllMocks();
});

describe("playerVideoSettings", () => {
  it("normalizes aspect values and setting indexes", () => {
    expect(normalizePlayerAspect("cover")).toBe("cover");
    expect(normalizePlayerAspect("16-9")).toBe("16-9");
    expect(normalizePlayerAspect("bogus")).toBe("contain");
    expect(normalizePlayerAspect(null)).toBe("contain");
    expect(aspectFromSetting(0)).toBe("cover");
    expect(aspectFromSetting(2)).toBe("16-9");
    expect(aspectFromSetting(9)).toBe("contain");
    expect(aspectFromSetting(undefined)).toBe("cover");
  });

  it("applies the aspect class to the video and updates the buttons", () => {
    const harness = createHarness();

    expect(applyPlayerAspect("16-9")).toBe(true);

    expect(getPlayerAspect()).toBe("16-9");
    expect(harness.video.values.has("aspect-16-9")).toBe(true);
    expect(harness.video.values.has("aspect-contain")).toBe(false);
    const selected = harness.aspects[2];
    expect(selected?.classes.values.has("is-selected")).toBe(true);
    expect(selected?.check.style.display).toBe("block");
    expect(harness.aspects[1]?.classes.values.has("is-selected")).toBe(false);
    expect(harness.aspects[1]?.check.style.display).toBe("none");
  });

  it("falls back to contain when applying an unknown aspect", () => {
    const harness = createHarness();
    applyPlayerAspect("unknown");
    expect(getPlayerAspect()).toBe("contain");
    expect(harness.video.values.has("aspect-contain")).toBe(true);
  });

  it("marks the active stream mode and hides the other check", () => {
    const harness = createHarness();

    harness.setRelayMode(true);
    refreshStreamModeButtons();
    expect(harness.relay.classes.values.has("is-selected")).toBe(true);
    expect(harness.relay.check.style.display).toBe("block");
    expect(harness.normal.classes.values.has("is-selected")).toBe(false);
    expect(harness.normal.check.style.display).toBe("none");

    harness.setRelayMode(false);
    refreshStreamModeButtons();
    expect(harness.relay.classes.values.has("is-selected")).toBe(false);
    expect(harness.relay.check.style.display).toBe("none");
    expect(harness.normal.classes.values.has("is-selected")).toBe(true);
    expect(harness.normal.check.style.display).toBe("block");
  });

  it("refreshes aspect buttons using the current aspect", () => {
    const harness = createHarness();
    applyPlayerAspect("cover");
    harness.aspects[0]?.classes.values.delete("is-selected");

    expect(refreshAspectButtons()).toBe(true);

    expect(harness.aspects[0]?.classes.values.has("is-selected")).toBe(true);
    expect(harness.aspects[0]?.check.style.display).toBe("block");
  });

  it("returns false when the runtime is not attached", () => {
    resetPlayerVideoSettingsRuntime();
    expect(applyPlayerAspect("cover")).toBe(false);
    expect(refreshAspectButtons()).toBe(false);
    expect(refreshStreamModeButtons()).toBe(false);
  });
});
