import { afterEach, describe, expect, it, vi } from "vitest";
import {
  attachPlayerEpisodeSwitch,
  resetPlayerEpisodeSwitch,
  resetPlayerEpisodeSwitchRuntime,
  switchPlayerEpisode
} from "./episodeSwitch";

function setup(screen = "player") {
  const state = {
    screen,
    detailSeason: 2,
    playerSeasonIndex: 0,
    playerItem: null as unknown,
    playerEpisode: null as unknown,
    detailEpisode: null as unknown,
    nextEpisodeDismissed: true,
    nextEpisodeGuardUntil: 0,
    resumePosition: 55
  };
  const host = {
    state: state as never,
    resetStream: vi.fn(),
    closeNextEpisodePrompt: vi.fn(),
    refreshPlayerChannels: vi.fn(),
    renderDetailEpisodes: vi.fn(),
    notify: vi.fn(),
    startPlayback: vi.fn()
  };
  attachPlayerEpisodeSwitch(host);
  return { state, host };
}

describe("episode switch", () => {
  afterEach(() => {
    resetPlayerEpisodeSwitchRuntime();
    vi.useRealTimers();
  });

  it("switches after the delay and updates the player state", () => {
    vi.useFakeTimers();
    const { state, host } = setup();
    const item = { id: "series" };
    const episode = { id: "ep1" };

    expect(switchPlayerEpisode(item, episode)).toBe(true);
    expect(host.closeNextEpisodePrompt).toHaveBeenCalledWith(false);
    expect(host.resetStream).toHaveBeenCalled();
    expect(state.playerItem).toBe(item);
    expect(state.playerEpisode).toBe(episode);
    expect(state.detailEpisode).toBe(episode);
    expect(state.playerSeasonIndex).toBe(2);
    expect(host.refreshPlayerChannels).toHaveBeenCalled();
    expect(host.renderDetailEpisodes).toHaveBeenCalledWith(item);
    expect(host.notify).toHaveBeenCalledWith("Cambiando capítulo…");
    expect(host.startPlayback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(600);
    expect(state.resumePosition).toBe(0);
    expect(host.startPlayback).toHaveBeenCalledWith(item, episode);
  });

  it("cancels a pending switch when another episode is selected", () => {
    vi.useFakeTimers();
    const { host } = setup();
    const item = { id: "series" };
    const first = { id: "ep1" };
    const second = { id: "ep2" };

    switchPlayerEpisode(item, first);
    switchPlayerEpisode(item, second, false);
    expect(host.resetStream).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(600);
    expect(host.startPlayback).toHaveBeenCalledTimes(1);
    expect(host.startPlayback).toHaveBeenCalledWith(item, second);
  });

  it("ignores switches outside the player and detail screens", () => {
    vi.useFakeTimers();
    const { host } = setup("home");

    switchPlayerEpisode({ id: "series" }, { id: "ep1" });
    vi.advanceTimersByTime(600);
    expect(host.startPlayback).not.toHaveBeenCalled();
  });

  it("resets pending switches", () => {
    vi.useFakeTimers();
    const { host } = setup();

    switchPlayerEpisode({ id: "series" }, { id: "ep1" });
    resetPlayerEpisodeSwitch();
    vi.advanceTimersByTime(600);
    expect(host.startPlayback).not.toHaveBeenCalled();
  });
});
