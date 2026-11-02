import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");

const snippet = source.match(
  / {4}function legacyPlaybackTiming\(\) \{[\s\S]*?(?= {4}function legacyDevServiceUrl)/
)?.[0];

describe("legacy playback timing integration", () => {
  it("keeps player timers and guards connected to Core", () => {
    expect(source).toMatch(/legacyPlaybackTiming\(\)\.bufferNoticeMs/);
    expect(source).toMatch(/legacyPlaybackTiming\(\)\.seekCommitMs/);
    expect(source).toMatch(/legacyPlaybackTiming\(\)\.historyTickMs/);
    expect(source).toMatch(/legacyShouldReportBuffering\(j\.streamError, !!we/);
    expect(source).toMatch(/legacyShouldTickPlayback\(j\.screen, j\.playerMode/);
  });

  it.each([true, false])("resolves timer guards and delays (core available: %s)", (withCore) => {
    expect(snippet).toBeTruthy();
    const runtime = runInNewContext(
      `${snippet}\n({ legacyPlaybackTiming, legacyShouldReportBuffering, `
      + "legacyShouldTickPlayback, legacyResolveLiveResolveDelay })",
      { window: { TutyCore: withCore ? core : undefined } }
    ) as {
      legacyPlaybackTiming(): Record<string, number>;
      legacyShouldReportBuffering(error: unknown, video: unknown, paused: unknown, ready: unknown): boolean;
      legacyShouldTickPlayback(screen: unknown, mode: unknown, video: unknown, paused: unknown): boolean;
      legacyResolveLiveResolveDelay(immediate: unknown): number;
    };

    expect(runtime.legacyPlaybackTiming()).toEqual({
      bufferNoticeMs: 700,
      seekCommitMs: 800,
      liveResolveMs: 180,
      historyTickMs: 500,
      relaySeekResetMs: 12000
    });
    expect(runtime.legacyShouldReportBuffering("", true, false, 2)).toBe(true);
    expect(runtime.legacyShouldReportBuffering("error", true, false, 2)).toBe(false);
    expect(runtime.legacyShouldTickPlayback("player", "vod", true, false)).toBe(true);
    expect(runtime.legacyShouldTickPlayback("home", "vod", true, false)).toBe(false);
    expect(runtime.legacyResolveLiveResolveDelay(true)).toBe(0);
    expect(runtime.legacyResolveLiveResolveDelay(false)).toBe(180);
  });
});
