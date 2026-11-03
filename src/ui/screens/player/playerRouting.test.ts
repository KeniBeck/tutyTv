import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppState } from "../../runtime/state";
import {
  attachPlayerRouting,
  openPlayer,
  resetPlayerRoutingRuntime,
  type PlayerRoutingHost
} from "./playerRouting";

function createHarness() {
  const state = createAppState();
  state.screen = "home";
  const host: PlayerRoutingHost = {
    state,
    ensurePlayerStage: vi.fn(),
    stopPreview: vi.fn(),
    resetPlaybackItem: vi.fn(),
    prepareItem: vi.fn(),
    applyPlayerMode: vi.fn(),
    refreshPlayer: vi.fn(),
    showPlayerScreen: vi.fn(),
    focusPlayer: vi.fn(),
    closeChannelPanels: vi.fn(),
    showInfobar: vi.fn(),
    playLive: vi.fn(),
    playVod: vi.fn(),
    openFullscreen: vi.fn()
  };
  attachPlayerRouting(host);
  return { state, host };
}

afterEach(() => {
  resetPlayerRoutingRuntime();
  vi.clearAllMocks();
});

describe("playerRouting", () => {
  it("uses the fullscreen transition when opening VOD from detail", () => {
    const harness = createHarness();
    harness.state.screen = "detail";
    const item = { id: "movie" };
    const episode = { id: "e1" };

    expect(openPlayer("vod", item, episode)).toBe(true);

    expect(harness.host.openFullscreen).toHaveBeenCalledWith(item, episode);
    expect(harness.host.ensurePlayerStage).not.toHaveBeenCalled();
    expect(harness.host.playVod).not.toHaveBeenCalled();
  });

  it("opens and starts a live channel with the player UI", () => {
    const harness = createHarness();
    harness.state.screen = "home";

    expect(openPlayer("live", null, null)).toBe(true);

    expect(harness.host.ensurePlayerStage).toHaveBeenCalledTimes(1);
    expect(harness.host.stopPreview).toHaveBeenCalledTimes(1);
    expect(harness.state.playerMode).toBe("live");
    expect(harness.state.playerItem).toBeNull();
    expect(harness.state.playerEpisode).toBeNull();
    expect(harness.state.playerReturn).toEqual({ screen: "home", focus: null });
    expect(harness.host.closeChannelPanels).toHaveBeenCalledTimes(1);
    expect(harness.host.applyPlayerMode).toHaveBeenCalledWith(false);
    expect(harness.host.refreshPlayer).toHaveBeenCalledTimes(2);
    expect(harness.host.showPlayerScreen).toHaveBeenCalledTimes(1);
    expect(harness.host.focusPlayer).toHaveBeenCalledTimes(1);
    expect(harness.host.showInfobar).toHaveBeenCalledTimes(1);
    expect(harness.host.playLive).toHaveBeenCalledTimes(1);
    expect(harness.host.playVod).not.toHaveBeenCalled();
  });

  it("opens VOD outside detail without stopping the live preview", () => {
    const harness = createHarness();
    harness.state.screen = "home";
    harness.state.detailSeason = 2;
    const item = { id: "movie" };
    const episode = { id: "e1" };

    expect(openPlayer("vod", item, episode)).toBe(true);

    expect(harness.host.stopPreview).not.toHaveBeenCalled();
    expect(harness.host.resetPlaybackItem).toHaveBeenCalledTimes(1);
    expect(harness.host.prepareItem).toHaveBeenCalledWith(item);
    expect(harness.state.playerMode).toBe("vod");
    expect(harness.state.playerItem).toBe(item);
    expect(harness.state.playerEpisode).toBe(episode);
    expect(harness.state.playerSeasonIndex).toBe(2);
    expect(harness.host.applyPlayerMode).toHaveBeenCalledWith(true);
    expect(harness.host.showInfobar).toHaveBeenCalledTimes(1);
    expect(harness.host.playVod).toHaveBeenCalledWith(item, episode);
    expect(harness.host.playLive).not.toHaveBeenCalled();
  });

  it("does not reset the media pipeline when the item is already loaded", () => {
    const harness = createHarness();
    const item = { id: "movie" };
    harness.state.playerItem = item;

    openPlayer("vod", item, null);

    expect(harness.host.resetPlaybackItem).not.toHaveBeenCalled();
  });

  it("returns false without the runtime", () => {
    resetPlayerRoutingRuntime();
    expect(openPlayer("live", null, null)).toBe(false);
  });
});
