import { describe, expect, it } from "vitest";
import {
  localSeekTarget,
  relaySeekTarget,
  resolvePlaybackTotalWithRelay,
  shouldPersistPlaybackHistory
} from "./playbackProgress";

describe("playback progress", () => {
  it("persists after the minimum position and throttle interval", () => {
    expect(shouldPersistPlaybackHistory(2.9, "1", 100_000, 0, false)).toBe(false);
    expect(shouldPersistPlaybackHistory(3, "1", 100_000, 0, false)).toBe(true);
    expect(shouldPersistPlaybackHistory(10, "1", 100_000, 99_500, false)).toBe(false);
    expect(shouldPersistPlaybackHistory(10, "1", 115_000, 99_500, false)).toBe(true);
    expect(shouldPersistPlaybackHistory(10, "1", 100_000, 99_500, true)).toBe(true);
    expect(shouldPersistPlaybackHistory(10, "", 115_000, 0, true)).toBe(false);
  });

  it("resolves relay totals with the legacy priority", () => {
    expect(resolvePlaybackTotalWithRelay({
      hasRelay: true, relayBase: 100, probedDuration: 300,
      videoDuration: 200, episodeDuration: 2700, itemDuration: 5400, inferredDuration: 2400
    })).toBe(300);
    expect(resolvePlaybackTotalWithRelay({
      hasRelay: true, relayBase: 100, probedDuration: 0,
      videoDuration: 200, episodeDuration: 2700, itemDuration: 5400, inferredDuration: 2400
    })).toBe(2700);
    expect(resolvePlaybackTotalWithRelay({
      hasRelay: true, relayBase: 100, probedDuration: 0,
      videoDuration: 200, episodeDuration: 0, itemDuration: 0, inferredDuration: 0
    })).toBe(300);
  });

  it("resolves non-relay totals from video, episode, item or inferred duration", () => {
    const base = {
      hasRelay: false, relayBase: 0, probedDuration: 0,
      videoDuration: 0, episodeDuration: 0, itemDuration: 0, inferredDuration: 0
    };
    expect(resolvePlaybackTotalWithRelay({ ...base, videoDuration: 120 })).toBe(120);
    expect(resolvePlaybackTotalWithRelay({ ...base, episodeDuration: 60 })).toBe(60);
    expect(resolvePlaybackTotalWithRelay({ ...base, itemDuration: 50 })).toBe(50);
    expect(resolvePlaybackTotalWithRelay({ ...base, inferredDuration: 40 })).toBe(40);
    expect(resolvePlaybackTotalWithRelay(base)).toBe(0);
  });

  it("calculates relay and local seek targets", () => {
    expect(relaySeekTarget(100, 20, 10, 500)).toBe(130);
    expect(relaySeekTarget(100, 299, 0, 300)).toBe(298);
    expect(relaySeekTarget(0, -5, -10, 300)).toBe(0);
    expect(localSeekTarget(20, 5, 100)).toBe(25);
    expect(localSeekTarget(99, 5, 100)).toBe(99);
  });
});
