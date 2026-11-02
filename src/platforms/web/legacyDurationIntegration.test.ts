import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");
const format = source.match(/ {4}function legacyFormatPlaybackTime\(value\) \{[\s\S]*?(?= {4}function legacyParsePlaybackDuration)/)?.[0];
const parse = source.match(/ {4}function legacyParsePlaybackDuration\(value\) \{[\s\S]*?(?= {4}function legacyDevServiceUrl)/)?.[0];
const display = source.match(/ {4}function ki\(e\) \{[\s\S]*?(?= {4}function Mi\(e\))/)?.[0];
const parseLegacy = source.match(/ {4}function Mi\(e\) \{[\s\S]*?(?= {4}var Ii = null;)/)?.[0];
const percent = source.match(/ {4}function legacyPlaybackPercent\(value, total\) \{[\s\S]*?(?= {4}function legacyResolvePlaybackDuration)/)?.[0];
const resolve = source.match(/ {4}function legacyResolvePlaybackDuration\(candidates, series, position\) \{[\s\S]*?(?= {4}function legacyDevServiceUrl)/)?.[0];

describe("legacy playback duration", () => {
  it.each([true, false])("formats and parses durations with fallback (core available: %s)", (withCore) => {
    expect(format && parse && display && parseLegacy).toBeTruthy();
    const exposedCore = {
      ...core,
      formatPlaybackTime: vi.fn(core.formatPlaybackTime),
      parsePlaybackDuration: vi.fn(core.parsePlaybackDuration)
    };
    const runtime = runInNewContext(
      `${format}\n${parse}\n${display}\n${parseLegacy}\n({ ki, Mi })`,
      {
        window: { TutyCore: withCore ? exposedCore : undefined },
        r: (value: number) => value < 10 ? `0${value}` : String(value)
      }
    ) as { ki(value: number): string; Mi(value: unknown): number };

    expect(runtime.ki(0)).toBe("00:00:00");
    expect(runtime.ki(3661)).toBe("01:01:01");
    expect(runtime.Mi("1 h 2 min 3 s")).toBe(3723);
    expect(runtime.Mi("1:30")).toBe(90);
    expect(runtime.Mi("abc")).toBe(0);
    expect(exposedCore.formatPlaybackTime).toHaveBeenCalledTimes(withCore ? 2 : 0);
    expect(exposedCore.parsePlaybackDuration).toHaveBeenCalledTimes(withCore ? 3 : 0);
  });

  it.each([true, false])("resolves duration and progress with fallback (core available: %s)", (withCore) => {
    expect(percent && resolve).toBeTruthy();
    const exposedCore = {
      ...core,
      playbackPercent: vi.fn(core.playbackPercent),
      resolvePlaybackDuration: vi.fn(core.resolvePlaybackDuration)
    };
    const runtime = runInNewContext(
      `${format}\n${parse}\n${percent}\n${resolve}\n${display}\n${parseLegacy}\n({ legacyPlaybackPercent, legacyResolvePlaybackDuration })`,
      {
        window: { TutyCore: withCore ? exposedCore : undefined },
        r: (value: number) => value < 10 ? `0${value}` : String(value)
      }
    ) as {
      legacyPlaybackPercent(value: number, total: number): number;
      legacyResolvePlaybackDuration(candidates: unknown[], series: boolean, position: number): number;
    };

    expect(runtime.legacyPlaybackPercent(50, 100)).toBe(50);
    expect(runtime.legacyPlaybackPercent(-10, 100)).toBe(0);
    expect(runtime.legacyPlaybackPercent(150, 100)).toBe(100);
    expect(runtime.legacyPlaybackPercent(10, 0)).toBe(0);
    expect(runtime.legacyResolvePlaybackDuration(["—", "1:30", 120], false, 0)).toBe(90);
    expect(runtime.legacyResolvePlaybackDuration([], true, 0)).toBe(2700);
    expect(runtime.legacyResolvePlaybackDuration([], false, 0)).toBe(6300);
    expect(runtime.legacyResolvePlaybackDuration([], false, 7000)).toBe(8050);
    expect(exposedCore.playbackPercent).toHaveBeenCalledTimes(withCore ? 4 : 0);
    expect(exposedCore.resolvePlaybackDuration).toHaveBeenCalledTimes(withCore ? 4 : 0);
  });
});
