import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppState } from "../../runtime/state";
import {
  attachPlayerSession,
  clearPlayerSessionSource,
  markPlayerSessionSource,
  openFullscreenPlayer,
  resetPlayerSessionRuntime,
  samePlaybackEpisode,
  samePlaybackItem,
  startPlayerPlayback,
  type PlayerEpisode,
  type PlayerItem,
  type PlayerMedia,
  type PlayerSessionHost
} from "./playerSession";

interface Harness {
  host: PlayerSessionHost;
  state: ReturnType<typeof createAppState>;
  media: PlayerMedia;
  item: PlayerItem;
  episode: PlayerEpisode;
  startPlayback: ReturnType<typeof vi.fn>;
  showFullscreenPlayer: ReturnType<typeof vi.fn>;
  prepareItem: ReturnType<typeof vi.fn>;
  resetPlaybackItem: ReturnType<typeof vi.fn>;
  logTransition: ReturnType<typeof vi.fn>;
  resetStream: ReturnType<typeof vi.fn>;
  prepareMediaInfo: ReturnType<typeof vi.fn>;
  resolvePlayback: ReturnType<typeof vi.fn>;
  loadSource: ReturnType<typeof vi.fn>;
  notifyStatus: ReturnType<typeof vi.fn>;
}

function createHarness(): Harness {
  const state = createAppState();
  state.screen = "detail";
  const item: PlayerItem = { id: "m1", title: "Pelicula" };
  const episode: PlayerEpisode = { id: "e2", number: 2 };
  state.detail = item;
  state.playerItem = item;
  state.playerEpisode = null;
  state.detailSeason = 1;
  const media: PlayerMedia = {
    src: "blob:http://localhost/1",
    currentSrc: "blob:http://localhost/1",
    readyState: 4,
    currentTime: 12
  };
  const startPlayback = vi.fn();
  const showFullscreenPlayer = vi.fn();
  const prepareItem = vi.fn();
  const resetPlaybackItem = vi.fn();
  const logTransition = vi.fn();
  const resetStream = vi.fn();
  const prepareMediaInfo = vi.fn();
  const resolvePlayback = vi.fn();
  const loadSource = vi.fn();
  const notifyStatus = vi.fn();
  const host: PlayerSessionHost = {
    state,
    getMedia: () => media,
    getDetail: () => state.detail as PlayerItem | null,
    getStreamUrl: () => "",
    resetStream,
    prepareMediaInfo,
    resolvePlayback,
    loadSource,
    notifyStatus,
    shouldReuse: vi.fn((screen, hasSource, sameItem, sameEpisode) =>
      screen === "detail" && Boolean(hasSource) && Boolean(sameItem) && Boolean(sameEpisode)
    ),
    hasPlaybackSession: vi.fn(() => false),
    currentPosition: vi.fn((value) => value.currentTime || 0),
    prepareItem,
    resetPlaybackItem,
    showFullscreenPlayer,
    startPlayback,
    logTransition
  };
  attachPlayerSession(host);
  return {
    host,
    state,
    media,
    item,
    episode,
    startPlayback,
    showFullscreenPlayer,
    prepareItem,
    resetPlaybackItem,
    logTransition,
    resetStream,
    prepareMediaInfo,
    resolvePlayback,
    loadSource,
    notifyStatus
  };
}

afterEach(() => {
  resetPlayerSessionRuntime();
  vi.restoreAllMocks();
});

describe("playerSession", () => {
  it("compares items and episodes by id", () => {
    expect(samePlaybackItem({ id: 7 }, { id: "7" })).toBe(true);
    expect(samePlaybackItem({ id: 7 }, { id: 8 })).toBe(false);
    expect(samePlaybackItem(null, { id: 7 })).toBe(false);
    expect(samePlaybackEpisode({ id: "e1" }, { id: "e1" })).toBe(true);
    expect(samePlaybackEpisode(null, null)).toBe(true);
    expect(samePlaybackEpisode(null, { id: "e1" })).toBe(false);
  });

  it("reuses the active preview when entering fullscreen", () => {
    const harness = createHarness();
    markPlayerSessionSource(harness.item, null);

    expect(openFullscreenPlayer(harness.item, null)).toBe(true);

    expect(harness.host.shouldReuse).toHaveBeenCalledWith("detail", true, true, true);
    expect(harness.showFullscreenPlayer).toHaveBeenCalledTimes(1);
    expect(harness.startPlayback).not.toHaveBeenCalled();
    expect(harness.prepareItem).toHaveBeenCalledWith(harness.item);
    expect(harness.state.screen).toBe("player");
    expect(harness.state.playerMode).toBe("vod");
    expect(harness.logTransition).toHaveBeenCalledWith(
      expect.objectContaining({ reuse: true, screen: "detail" })
    );
  });

  it("reloads when the item changes and resets the previous session", () => {
    const harness = createHarness();
    const next: PlayerItem = { id: "m2", title: "Otra" };
    harness.state.screen = "home";

    openFullscreenPlayer(next, null);

    expect(harness.host.shouldReuse).toHaveBeenCalledWith("home", true, false, true);
    expect(harness.resetPlaybackItem).toHaveBeenCalledTimes(1);
    expect(harness.startPlayback).toHaveBeenCalledWith(next, null);
    expect(harness.state.playerItem).toBe(next);
  });

  it("keeps the current position when reloading the same title without a session", () => {
    const harness = createHarness();
    clearPlayerSessionSource();
    harness.media.src = "";
    harness.media.currentSrc = "";
    harness.media.readyState = 0;
    harness.media.currentTime = 42;

    openFullscreenPlayer(harness.item, null);

    expect(harness.host.shouldReuse).toHaveBeenCalledWith("detail", false, true, true);
    expect(harness.state.resumePosition).toBe(42);
    expect(harness.startPlayback).toHaveBeenCalledWith(harness.item, null);
  });

  it("does not reload a second time while already fullscreen", () => {
    const harness = createHarness();
    markPlayerSessionSource(harness.item, null);
    harness.state.screen = "player";

    openFullscreenPlayer(harness.item, null);

    expect(harness.startPlayback).not.toHaveBeenCalled();
    expect(harness.showFullscreenPlayer).toHaveBeenCalledTimes(1);
    expect(harness.logTransition).toHaveBeenCalledWith(
      expect.objectContaining({ alreadyFullscreen: true, reuse: true })
    );
  });

  it("clears the tracked source on stop", () => {
    const harness = createHarness();
    markPlayerSessionSource(harness.item, harness.episode);
    clearPlayerSessionSource();
    harness.media.readyState = 0;
    harness.media.src = "";
    harness.media.currentSrc = "";
    harness.state.playerItem = null;
    harness.state.detail = null;

    openFullscreenPlayer(harness.item, harness.episode);

    expect(harness.host.shouldReuse).toHaveBeenCalledWith("detail", false, false, true);
    expect(harness.startPlayback).toHaveBeenCalledWith(harness.item, harness.episode);
  });

  it("returns false when the runtime is not attached", () => {
    resetPlayerSessionRuntime();
    expect(openFullscreenPlayer({ id: "m1" }, null)).toBe(false);
    expect(startPlayerPlayback({ id: "m1" }, null)).toBe(false);
  });

  it("starts a direct stream and records the active source", () => {
    const harness = createHarness();
    const item: PlayerItem = { id: "m1", streamUrl: "https://example.com/movie.mp4" };

    expect(startPlayerPlayback(item, null)).toBe(true);

    expect(harness.resetStream).toHaveBeenCalledTimes(1);
    expect(harness.prepareItem).toHaveBeenCalledWith(item);
    expect(harness.prepareMediaInfo).toHaveBeenCalledWith(item);
    expect(harness.loadSource).toHaveBeenCalledWith("https://example.com/movie.mp4");
    expect(harness.state.playerItem).toBe(item);
    expect(harness.state.playerMode).toBe("vod");
    expect(harness.logTransition).not.toHaveBeenCalled();
  });

  it("resolves portal streams before loading and marks the episode", () => {
    const harness = createHarness();
    const item: PlayerItem = { id: "s1", title: "Serie", _portal: true };
    const episode: PlayerEpisode = { id: "e1", number: 3 };
    harness.state.detailSeason = 2;

    startPlayerPlayback(item, episode);

    expect(harness.notifyStatus).toHaveBeenCalledWith("Cargando capítulo 3…");
    expect(harness.loadSource).not.toHaveBeenCalled();
    const done = harness.resolvePlayback.mock.calls[0]?.[1] as (url: string) => void;
    done("https://example.com/episode.mp4");
    expect(harness.loadSource).toHaveBeenCalledWith("https://example.com/episode.mp4");
    expect(harness.state.playerEpisode).toBe(episode);
    expect(harness.state.playerSeasonIndex).toBe(2);
  });

  it("reports a missing portal source only when no error was set", () => {
    const harness = createHarness();
    startPlayerPlayback({ id: "s1", _portal: true }, null);
    const done = harness.resolvePlayback.mock.calls[0]?.[1] as (url: string) => void;

    done("");

    expect(harness.loadSource).not.toHaveBeenCalled();
    expect(harness.notifyStatus).toHaveBeenLastCalledWith("Sin fuente de reproducción");

    harness.state.streamError = "fallo";
    harness.notifyStatus.mockClear();
    startPlayerPlayback({ id: "s2", _portal: true }, null);
    const failed = harness.resolvePlayback.mock.calls[1]?.[1] as (url: string) => void;
    failed("");
    expect(harness.notifyStatus).toHaveBeenCalledTimes(1);
    expect(harness.notifyStatus).not.toHaveBeenCalledWith("Sin fuente de reproducción");
  });

  it("does not start playback while the resume dialog is open", () => {
    const harness = createHarness();
    harness.state.resumeOpen = true;

    expect(startPlayerPlayback({ id: "m1", streamUrl: "https://example.com/a.mp4" }, null)).toBe(true);
    expect(harness.resetStream).not.toHaveBeenCalled();
    expect(harness.loadSource).not.toHaveBeenCalled();
  });

  it("does not reset the player when there is no media element", () => {
    const harness = createHarness();
    vi.spyOn(harness.host, "getMedia").mockReturnValue(null);

    expect(startPlayerPlayback({ id: "m1", streamUrl: "https://example.com/a.mp4" }, null)).toBe(true);
    expect(harness.resetStream).not.toHaveBeenCalled();
    expect(harness.loadSource).not.toHaveBeenCalled();
  });
});
