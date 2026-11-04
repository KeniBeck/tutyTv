import { afterEach, describe, expect, it, vi } from "vitest";

const source = vi.hoisted(() => ({
  position: 100,
  total: 1000,
  pending: false,
  seek: vi.fn()
}));
const progress = vi.hoisted(() => ({
  update: vi.fn()
}));

vi.mock("./playerSource", () => ({
  getPlayerPosition: () => source.position,
  getPlayerPlaybackTotal: () => source.total
}));
vi.mock("./playerSeek", () => ({
  hasPendingPlayerSeek: () => source.pending,
  seekPlayerBy: (delta: number) => {
    source.seek(delta);
    source.pending = true;
    return true;
  }
}));
vi.mock("./playerProgress", () => ({
  updatePlayerProgress: progress.update
}));

import {
  attachPlayerTransport,
  endPlayerScrub,
  getPlayerScrubPosition,
  isPlayerScrubbing,
  resetPlayerTransportRuntime,
  setPlayerScrubPosition,
  startPlayerScrub,
  stepPlayerScrub,
  togglePlayerPlayback
} from "./playerTransport";

function setup(paused = false) {
  const video = { paused };
  const host = {
    state: {} as never,
    getVideo: () => video,
    hasSeekbar: () => true,
    playVideo: vi.fn(),
    pauseVideo: vi.fn(),
    setTransport: vi.fn(),
    showInfobar: vi.fn(),
    scheduleInfobarHide: vi.fn(),
    clearInfobarTimer: vi.fn(),
    setScrubbing: vi.fn(),
    focusSeekbar: vi.fn(),
    focusPlayer: vi.fn()
  };
  attachPlayerTransport(host);
  return { video, host };
}

describe("player transport", () => {
  afterEach(() => {
    resetPlayerTransportRuntime();
    source.position = 100;
    source.total = 1000;
    source.pending = false;
    source.seek.mockClear();
    progress.update.mockClear();
  });

  it("starts, steps and ends the scrub preview", () => {
    const { host } = setup();

    expect(startPlayerScrub()).toBe(true);
    expect(isPlayerScrubbing()).toBe(true);
    expect(getPlayerScrubPosition()).toBe(100);
    expect(host.setScrubbing).toHaveBeenLastCalledWith(true);
    expect(host.showInfobar).toHaveBeenCalled();
    expect(host.clearInfobarTimer).toHaveBeenCalled();
    expect(host.focusSeekbar).toHaveBeenCalled();
    expect(progress.update).toHaveBeenLastCalledWith(100, 1000);

    expect(stepPlayerScrub(1)).toBe(true);
    expect(getPlayerScrubPosition()).toBe(110);
    expect(source.seek).toHaveBeenLastCalledWith(10);

    expect(stepPlayerScrub(-1)).toBe(true);
    expect(getPlayerScrubPosition()).toBe(100);
    expect(source.seek).toHaveBeenLastCalledWith(-10);

    expect(endPlayerScrub()).toBe(true);
    expect(isPlayerScrubbing()).toBe(false);
    expect(host.setScrubbing).toHaveBeenLastCalledWith(false);
    expect(host.focusPlayer).toHaveBeenCalled();
    expect(host.scheduleInfobarHide).toHaveBeenCalled();
    expect(progress.update).toHaveBeenLastCalledWith(100, 1000);
  });

  it("only shows the infobar when there is no seek range", () => {
    const { host } = setup();
    source.total = 0;

    expect(startPlayerScrub()).toBe(false);
    expect(host.showInfobar).toHaveBeenCalled();
    expect(isPlayerScrubbing()).toBe(false);
  });

  it("keeps scrub positions inside the seek range", () => {
    const { host } = setup();
    source.position = 995;

    expect(startPlayerScrub()).toBe(true);
    expect(getPlayerScrubPosition()).toBe(995);
    expect(stepPlayerScrub(1)).toBe(true);
    expect(getPlayerScrubPosition()).toBe(999);
    expect(host.focusSeekbar).toHaveBeenCalled();
  });

  it("sets the seek preview without starting a scrub", () => {
    setPlayerScrubPosition(42);
    expect(getPlayerScrubPosition()).toBe(42);
    expect(isPlayerScrubbing()).toBe(false);
  });

  it("toggles play and pause with the transport OSD", () => {
    const { video, host } = setup(true);

    expect(togglePlayerPlayback()).toBe(true);
    expect(host.playVideo).toHaveBeenCalledWith(video);
    expect(host.setTransport).toHaveBeenLastCalledWith("none");
    expect(host.showInfobar).toHaveBeenCalled();

    video.paused = false;
    expect(togglePlayerPlayback()).toBe(true);
    expect(host.pauseVideo).toHaveBeenCalledWith(video);
    expect(host.setTransport).toHaveBeenLastCalledWith("pause");
  });
});
