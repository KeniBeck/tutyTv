import { describe, expect, it } from "vitest";
import {
  currentPlaybackPosition,
  describePlaybackStream,
  resolvePlaybackTotal,
  shouldUseHls
} from "./playbackSession";

describe("playback session", () => {
  it("resolves absolute relay positions and total durations", () => {
    expect(currentPlaybackPosition(15, false, 100)).toBe(15);
    expect(currentPlaybackPosition(15, true, 100)).toBe(115);
    expect(currentPlaybackPosition(NaN, true, 100)).toBe(100);

    expect(resolvePlaybackTotal(5400, 2700, 6300)).toBe(5400);
    expect(resolvePlaybackTotal(0, 2700, 6300)).toBe(2700);
    expect(resolvePlaybackTotal(Infinity, 0, 6300)).toBe(6300);
    expect(resolvePlaybackTotal(undefined, undefined, undefined)).toBe(0);
  });

  it("describes HLS, MP4 and fallback stream types", () => {
    expect(describePlaybackStream("https://x/video.m3u8", "", false))
      .toEqual({ isHls: true, contentType: "application/vnd.apple.mpegurl" });
    expect(describePlaybackStream("https://x/stream", "application/x-mpegurl", false))
      .toEqual({ isHls: true, contentType: "application/vnd.apple.mpegurl" });
    expect(describePlaybackStream("https://x/stream", "", true))
      .toEqual({ isHls: true, contentType: "application/vnd.apple.mpegurl" });
    expect(describePlaybackStream("https://x/video.mp4", "", false))
      .toEqual({ isHls: false, contentType: "video/mp4" });
    expect(describePlaybackStream("https://x/live", "", false))
      .toEqual({ isHls: false, contentType: "video/mp2t" });
  });

  it("selects HLS.js only when no native path is available", () => {
    expect(shouldUseHls(true, false, false, true)).toBe(true);
    expect(shouldUseHls(true, true, false, true)).toBe(false);
    expect(shouldUseHls(true, false, true, true)).toBe(false);
    expect(shouldUseHls(true, false, false, false)).toBe(false);
    expect(shouldUseHls(false, false, false, true)).toBe(false);
  });
});
