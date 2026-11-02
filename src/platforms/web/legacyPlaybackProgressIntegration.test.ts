import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");

const limit = source.match(/ {4}function legacyLimitSeek\(position, duration, relay\) \{[\s\S]*?(?= {4}function legacyNativeRetry)/)?.[0];
const progress = source.match(
  / {4}function legacyShouldPersistPlaybackHistory\([\s\S]*?(?= {4}function legacyFormatPlaybackTime\()/
)?.[0];

describe("legacy playback progress integration", () => {
  it("keeps history throttling, relay totals and seek targets connected to Core", () => {
    expect(source).toMatch(/legacyShouldPersistPlaybackHistory\(e, a && a\.id, n, La, i\)/);
    expect(source).toMatch(/legacyResolvePlaybackTotalWithRelay\(\{/);
    expect(source).toMatch(/legacyRelaySeekTarget\(zn, we\.currentTime \|\| 0, Vn, i\)/);
    expect(source).toMatch(/legacyLocalSeekTarget\(we\.currentTime \|\| 0, Vn, we\.duration \|\| 0\)/);
  });

  it.each([true, false])("preserves progress decisions and seek math (core available: %s)", (withCore) => {
    expect(limit && progress).toBeTruthy();
    const runtime = runInNewContext(
      `${limit}\n${progress}\n({ legacyShouldPersistPlaybackHistory, legacyResolvePlaybackTotalWithRelay, legacyRelaySeekTarget, legacyLocalSeekTarget })`,
      { window: { TutyCore: withCore ? core : undefined } }
    ) as {
      legacyShouldPersistPlaybackHistory(position: number, itemId: unknown, now: number, lastSavedAt: number, force: boolean): boolean;
      legacyResolvePlaybackTotalWithRelay(input: Record<string, unknown>): number;
      legacyRelaySeekTarget(relayBase: number, currentTime: number, pendingDelta: number, duration: number): number;
      legacyLocalSeekTarget(currentTime: number, pendingDelta: number, duration: number): number;
    };

    expect(runtime.legacyShouldPersistPlaybackHistory(2.9, "1", 100_000, 0, false)).toBe(false);
    expect(runtime.legacyShouldPersistPlaybackHistory(3, "1", 100_000, 0, false)).toBe(true);
    expect(runtime.legacyShouldPersistPlaybackHistory(10, "1", 115_000, 99_500, false)).toBe(true);
    expect(runtime.legacyShouldPersistPlaybackHistory(10, "", 115_000, 0, true)).toBe(false);

    expect(runtime.legacyResolvePlaybackTotalWithRelay({
      hasRelay: true, relayBase: 100, probedDuration: 300,
      videoDuration: 200, episodeDuration: 2700, itemDuration: 5400, inferredDuration: 2400
    })).toBe(300);
    expect(runtime.legacyResolvePlaybackTotalWithRelay({
      hasRelay: true, relayBase: 100, probedDuration: 0,
      videoDuration: 200, episodeDuration: 0, itemDuration: 0, inferredDuration: 0
    })).toBe(300);
    expect(runtime.legacyResolvePlaybackTotalWithRelay({
      hasRelay: false, relayBase: 0, probedDuration: 0,
      videoDuration: 120, episodeDuration: 0, itemDuration: 0, inferredDuration: 0
    })).toBe(120);

    expect(runtime.legacyRelaySeekTarget(100, 20, 10, 500)).toBe(130);
    expect(runtime.legacyRelaySeekTarget(100, 299, 0, 300)).toBe(298);
    expect(runtime.legacyLocalSeekTarget(20, 5, 100)).toBe(25);
    expect(runtime.legacyLocalSeekTarget(99, 5, 100)).toBe(99);
  });
});
