import { describe, expect, it } from "vitest";
import {
  PLAYBACK_TIMING,
  resolveLiveResolveDelay,
  shouldReportBuffering,
  shouldTickPlayback
} from "./playbackTiming";

describe("playback timing", () => {
  it("reports buffering only while the video is active and unhealthy", () => {
    expect(shouldReportBuffering("", true, false, 2)).toBe(true);
    expect(shouldReportBuffering("error", true, false, 2)).toBe(false);
    expect(shouldReportBuffering("", false, false, 2)).toBe(false);
    expect(shouldReportBuffering("", true, true, 2)).toBe(false);
    expect(shouldReportBuffering("", true, false, 3)).toBe(false);
  });

  it("ticks the VOD heartbeat only in the active player", () => {
    expect(shouldTickPlayback("player", "vod", true, false)).toBe(true);
    expect(shouldTickPlayback("home", "vod", true, false)).toBe(false);
    expect(shouldTickPlayback("player", "live", true, false)).toBe(false);
    expect(shouldTickPlayback("player", "vod", false, false)).toBe(false);
    expect(shouldTickPlayback("player", "vod", true, true)).toBe(false);
  });

  it("keeps the legacy timer values and live resolve delay", () => {
    expect(PLAYBACK_TIMING).toEqual({
      bufferNoticeMs: 700,
      seekCommitMs: 800,
      liveResolveMs: 180,
      historyTickMs: 500,
      relaySeekResetMs: 12000
    });
    expect(resolveLiveResolveDelay(true)).toBe(0);
    expect(resolveLiveResolveDelay(false)).toBe(180);
  });
});
