import { describe, expect, it } from "vitest";
import {
  formatPlaybackTime,
  inferEpisodeDuration,
  parsePlaybackDuration,
  playbackPercent,
  resolvePlaybackDuration
} from "./duration";

describe("playback duration", () => {
  it("formats seconds as HH:MM:SS", () => {
    expect(formatPlaybackTime(0)).toBe("00:00:00");
    expect(formatPlaybackTime(1.9)).toBe("00:00:01");
    expect(formatPlaybackTime(59)).toBe("00:00:59");
    expect(formatPlaybackTime(60)).toBe("00:01:00");
    expect(formatPlaybackTime(3661)).toBe("01:01:01");
    expect(formatPlaybackTime(7325)).toBe("02:02:05");
    expect(formatPlaybackTime(-5)).toBe("00:00:00");
    expect(formatPlaybackTime(Number.NaN)).toBe("00:00:00");
  });

  it("parses numeric, colon and text durations", () => {
    expect(parsePlaybackDuration(90)).toBe(90);
    expect(parsePlaybackDuration("90")).toBe(90);
    expect(parsePlaybackDuration("1:30")).toBe(90);
    expect(parsePlaybackDuration("1:02:03")).toBe(3723);
    expect(parsePlaybackDuration("1 h 2 min 3 s")).toBe(3723);
    expect(parsePlaybackDuration("2 horas")).toBe(7200);
    expect(parsePlaybackDuration("45 minutos")).toBe(2700);
    expect(parsePlaybackDuration("30 seg")).toBe(30);
    expect(parsePlaybackDuration("")).toBe(0);
    expect(parsePlaybackDuration("—")).toBe(0);
    expect(parsePlaybackDuration("-")).toBe(0);
    expect(parsePlaybackDuration("abc")).toBe(0);
    expect(parsePlaybackDuration(0)).toBe(0);
    expect(parsePlaybackDuration(-5)).toBe(0);
    expect(parsePlaybackDuration(null)).toBe(0);
  });

  it("clamps the progress percentage", () => {
    expect(playbackPercent(50, 100)).toBe(50);
    expect(playbackPercent(-10, 100)).toBe(0);
    expect(playbackPercent(150, 100)).toBe(100);
    expect(playbackPercent(10, 0)).toBe(0);
  });

  it("resolves the first valid candidate and falls back by type", () => {
    expect(resolvePlaybackDuration(["—", "1:30", 120], false, 0)).toBe(90);
    expect(resolvePlaybackDuration([0, undefined, "2 h"], true, 0)).toBe(7200);
    expect(resolvePlaybackDuration([], true, 0)).toBe(2700);
    expect(resolvePlaybackDuration([], false, 0)).toBe(6300);
    expect(resolvePlaybackDuration([], false, 7000)).toBe(8050);
    expect(resolvePlaybackDuration([], true, 100)).toBe(2700);
  });

  it("ignores candidates shorter than the current position", () => {
    expect(resolvePlaybackDuration([5, 2700], false, 8)).toBe(2700);
    expect(resolvePlaybackDuration([5], false, 8)).toBe(6300);
    expect(resolvePlaybackDuration([100, 90], false, 95)).toBe(100);
  });

  it("infers a missing episode duration from its siblings", () => {
    const current = { duration: "" };
    const episodes = [
      { duration: "00:50:00" },
      { duration: "00:50:00" },
      { duration: "00:52:00" },
      current
    ];
    expect(inferEpisodeDuration(episodes, current)).toBe(3000);
    expect(inferEpisodeDuration([{ duration: "" }, current], current)).toBe(0);
    expect(inferEpisodeDuration([], current)).toBe(0);
  });
});
