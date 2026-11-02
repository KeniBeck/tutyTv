import { describe, expect, it } from "vitest";
import { applyResolvedPlayback, buildPlaybackResolveRequest } from "./playbackResolve";

describe("playback resolve request", () => {
  it("builds a movie request", () => {
    expect(buildPlaybackResolveRequest(
      { id: "movie" },
      null,
      { streamMode: "normal", resumePosition: 0, trackIndex: 0, audioTrack: 1, isSeries: false }
    )).toEqual({
      request: { contentId: "movie", playbackMode: "normal", forceRelay: false, trackIndex: 0, audioTrack: 1 },
      episode: null,
      resumePosition: 0,
      missingEpisodes: false
    });
  });

  it("uses the current or first episode for a series", () => {
    const item = { id: "series", seasonId: "season-2", episodes: [{ id: "ep-1" }, { id: "ep-2" }] };
    expect(buildPlaybackResolveRequest(item, { id: "ep-2" }, {
      streamMode: "relay", resumePosition: 90, trackIndex: 2, audioTrack: 0, isSeries: true
    }).request).toEqual({
      contentId: "ep-2", playbackMode: "relay", forceRelay: true,
      trackIndex: 2, audioTrack: 0, seriesContentId: "season-2"
    });
    expect(buildPlaybackResolveRequest(item, null, {
      streamMode: "normal", resumePosition: 0, trackIndex: 0, audioTrack: 0, isSeries: true
    }).episode).toEqual({ id: "ep-1" });
  });

  it("flags a series without episodes", () => {
    expect(buildPlaybackResolveRequest({ id: "series", episodes: [] }, null, {
      streamMode: "normal", resumePosition: 0, trackIndex: 0, audioTrack: 0, isSeries: true
    }).missingEpisodes).toBe(true);
  });
});

describe("resolved playback application", () => {
  it("applies response metadata and relay resume", () => {
    const item: Record<string, unknown> = { id: "movie", duration: 0 };
    const episode = { id: "ep", duration: 10 };
    expect(applyResolvedPlayback(item, episode, {
      mime: "video/mp4", codec: "h264", duration: 120, subtitles: [{ lang: "spa" }],
      audio: "spa", isHls: false, proxyPath: "http://127.0.0.1:8787/s/ab.mp4"
    }, 45)).toEqual({
      url: "http://127.0.0.1:8787/s/ab.mp4?start=45",
      resumePosition: 0,
      streamInfo: { selectedTrack: {}, availableTracks: [] }
    });
    expect(item).toMatchObject({
      streamMime: "video/mp4", streamCodec: "h264", duration: 120,
      subtitles: [{ lang: "spa" }], streamAudioInfo: "spa", isHls: false
    });
    expect(episode.duration).toBe(120);
  });

  it("preserves the item duration when the response has none", () => {
    const item = { id: "movie", duration: 80 };
    expect(applyResolvedPlayback(item, null, { url: "https://example.test/movie.mp4" }, 0).url)
      .toBe("https://example.test/movie.mp4");
    expect(item.duration).toBe(80);
  });
});
