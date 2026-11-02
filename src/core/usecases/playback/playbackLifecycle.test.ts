import { describe, expect, it } from "vitest";
import {
  hasPlaybackSession,
  resolveAbortServiceBase,
  shouldLoadSeriesEpisodesBeforePlay,
  shouldReusePlaybackSession,
  shouldSaveHistoryBeforeReset
} from "./playbackLifecycle";

describe("playback lifecycle", () => {
  it("decides when history must be saved before cleanup", () => {
    expect(shouldSaveHistoryBeforeReset("vod", true)).toBe(true);
    expect(shouldSaveHistoryBeforeReset("live", true)).toBe(false);
    expect(shouldSaveHistoryBeforeReset("vod", false)).toBe(false);
  });

  it("resolves the local media abort base", () => {
    expect(resolveAbortServiceBase("http://127.0.0.1:9000", "http://127.0.0.1:9000/s/x.mp4"))
      .toBe("http://127.0.0.1:9000");
    expect(resolveAbortServiceBase("", "http://127.0.0.1:9000/s/x.mp4"))
      .toBe("http://127.0.0.1:9000");
    expect(resolveAbortServiceBase("", "https://cdn.example/video.mp4")).toBe("");
    expect(resolveAbortServiceBase("", "")).toBe("");
  });

  it("requires loading series episodes only when details are missing", () => {
    expect(shouldLoadSeriesEpisodesBeforePlay({ type: "series", episodes: [] }, null)).toBe(true);
    expect(shouldLoadSeriesEpisodesBeforePlay({ type: "series", seasons: [{}] }, null)).toBe(true);
    expect(shouldLoadSeriesEpisodesBeforePlay({ type: "series", episodes: [{}] }, null)).toBe(false);
    expect(shouldLoadSeriesEpisodesBeforePlay({ type: "series", episodes: [] }, { id: "e1" })).toBe(false);
    expect(shouldLoadSeriesEpisodesBeforePlay({ type: "series", episodes: [], _detailsLoaded: true }, null)).toBe(false);
    expect(shouldLoadSeriesEpisodesBeforePlay({ type: "movie" }, null)).toBe(false);
  });

  it("detects an active preview session including HLS blob sources", () => {
    expect(hasPlaybackSession("", "blob:http://x/1", "", "")).toBe(true);
    expect(hasPlaybackSession("", "", "http://127.0.0.1/s/x.mp4", "")).toBe(true);
    expect(hasPlaybackSession("", "", "", "")).toBe(false);
    expect(hasPlaybackSession("", "blob:http://x/1", "", "error")).toBe(false);
  });

  it("reuses the detail player only for the same item and episode", () => {
    expect(shouldReusePlaybackSession("detail", true, true, true)).toBe(true);
    expect(shouldReusePlaybackSession("home", true, true, true)).toBe(false);
    expect(shouldReusePlaybackSession("detail", false, true, true)).toBe(false);
    expect(shouldReusePlaybackSession("detail", true, false, true)).toBe(false);
    expect(shouldReusePlaybackSession("detail", true, true, false)).toBe(false);
  });
});
