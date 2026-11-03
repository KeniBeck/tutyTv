import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppState } from "../../runtime/state";
import {
  attachPlayerInfobar,
  hidePlayerInfobar,
  refreshPlayerInfobar,
  resetPlayerInfobarRuntime,
  schedulePlayerInfobarHide,
  showPlaybackOsd,
  showPlayerInfobar,
  type PlayerInfobarHost
} from "./playerInfobar";

function createBar() {
  const classes = new Set<string>();
  return {
    classes,
    classList: {
      add(name: string) {
        classes.add(name);
      },
      remove(name: string) {
        classes.delete(name);
      }
    }
  };
}

function createHarness() {
  const state = createAppState();
  state.screen = "player";
  state.playerMode = "vod";
  const vodBar = createBar();
  const liveBar = createBar();
  const osdClasses = new Set<string>();
  const osd = {
    style: { backgroundImage: "" },
    classList: {
      add(name: string) {
        osdClasses.add(name);
      },
      remove(name: string) {
        osdClasses.delete(name);
      }
    }
  };
  const host: PlayerInfobarHost = {
    state,
    getVodBar: () => vodBar,
    getLiveBar: () => liveBar,
    getOsd: () => osd
  };
  attachPlayerInfobar(host);
  return { state, vodBar, liveBar, osd, osdClasses, host };
}

afterEach(() => {
  resetPlayerInfobarRuntime();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("playerInfobar", () => {
  it("shows the VOD infobar and hides it after the delay", () => {
    vi.useFakeTimers();
    const harness = createHarness();

    expect(showPlayerInfobar()).toBe(true);
    expect(harness.state.infobar).toBe(true);
    expect(harness.vodBar.classes.has("is-active")).toBe(true);
    expect(harness.liveBar.classes.has("is-active")).toBe(false);
    expect(harness.state.infoTimer).not.toBeNull();

    vi.advanceTimersByTime(4999);
    expect(harness.state.infobar).toBe(true);
    vi.advanceTimersByTime(1);
    expect(harness.state.infobar).toBe(false);
    expect(harness.vodBar.classes.has("is-active")).toBe(false);
    expect(harness.state.infoTimer).toBeNull();
  });

  it("switches the active bar for live playback", () => {
    const harness = createHarness();
    harness.state.playerMode = "live";

    refreshPlayerInfobar();

    expect(harness.liveBar.classes.has("is-active")).toBe(true);
    expect(harness.vodBar.classes.has("is-active")).toBe(false);
  });

  it("keeps the bar visible while the live channel panel is open", () => {
    vi.useFakeTimers();
    const harness = createHarness();
    harness.state.channelsOpen = true;

    showPlayerInfobar();
    vi.advanceTimersByTime(5000);

    expect(harness.state.infobar).toBe(true);
    expect(harness.vodBar.classes.has("is-active")).toBe(true);
  });

  it("keeps the bar visible when leaving the player screen", () => {
    vi.useFakeTimers();
    const harness = createHarness();
    showPlayerInfobar();
    harness.state.screen = "detail";

    vi.advanceTimersByTime(5000);

    expect(harness.state.infobar).toBe(true);
    expect(harness.vodBar.classes.has("is-active")).toBe(true);
  });

  it("hides immediately and clears the pending timer", () => {
    vi.useFakeTimers();
    const harness = createHarness();
    showPlayerInfobar();
    const timer = harness.state.infoTimer;

    expect(hidePlayerInfobar()).toBe(true);

    expect(harness.state.infoTimer).toBeNull();
    expect(timer).not.toBeNull();
    expect(harness.state.infobar).toBe(false);
    vi.advanceTimersByTime(5000);
    expect(harness.state.infobar).toBe(false);
  });

  it("schedules a hide without requiring an initial show", () => {
    vi.useFakeTimers();
    const harness = createHarness();

    expect(schedulePlayerInfobarHide()).toBe(true);
    vi.advanceTimersByTime(5000);

    expect(harness.state.infobar).toBe(false);
    expect(harness.vodBar.classes.has("is-active")).toBe(false);
  });

  it("shows pause until replaced and clears transient OSD icons", () => {
    vi.useFakeTimers();
    const harness = createHarness();

    showPlaybackOsd("pause");
    expect(harness.osd.style.backgroundImage).toContain("icon_status_pause");
    expect(harness.osdClasses.has("is-active")).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(harness.osdClasses.has("is-active")).toBe(true);

    showPlaybackOsd("forward");
    expect(harness.osd.style.backgroundImage).toContain("icon_status_forward");
    vi.advanceTimersByTime(899);
    expect(harness.osdClasses.has("is-active")).toBe(true);
    vi.advanceTimersByTime(1);
    expect(harness.osdClasses.has("is-active")).toBe(false);

    showPlaybackOsd("backward");
    expect(harness.osd.style.backgroundImage).toContain("icon_status_backward");
    showPlaybackOsd("none");
    expect(harness.osdClasses.has("is-active")).toBe(false);
    vi.advanceTimersByTime(900);
    expect(harness.osdClasses.has("is-active")).toBe(false);
  });

  it("returns false when the runtime is not attached", () => {
    resetPlayerInfobarRuntime();
    expect(showPlayerInfobar()).toBe(false);
    expect(refreshPlayerInfobar()).toBe(false);
    expect(hidePlayerInfobar()).toBe(false);
    expect(schedulePlayerInfobarHide()).toBe(false);
    expect(showPlaybackOsd("pause")).toBe(false);
  });
});
