import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");

const snippet = source.match(
  / {4}function legacyCurrentPlaybackPosition\(currentTime, relay, relayBase\) \{[\s\S]*?(?= {4}function legacyDevServiceUrl)/
)?.[0];

describe("legacy playback session integration", () => {
  it("keeps player events connected to the Core session helpers", () => {
    expect(source).toMatch(/legacyCurrentPlaybackPosition\(we\.currentTime \|\| 0, Hn, zn\)/);
    expect(source).toMatch(/legacyResolvePlaybackTotal\(we\.duration/);
    expect(source).toMatch(/var descriptor = legacyDescribePlaybackStream\(e,/);
    expect(source).toMatch(/legacyShouldUseHls\(o, i, legacyNativeTvPlayback\(\)/);
  });

  it.each([true, false])("resolves clocks and stream strategy (core available: %s)", (withCore) => {
    expect(snippet).toBeTruthy();
    const runtime = runInNewContext(
      `${snippet}\n({ legacyCurrentPlaybackPosition, legacyResolvePlaybackTotal, `
      + "legacyDescribePlaybackStream, legacyShouldUseHls })",
      { window: { TutyCore: withCore ? core : undefined } }
    ) as {
      legacyCurrentPlaybackPosition(currentTime: unknown, relay: unknown, relayBase: unknown): number;
      legacyResolvePlaybackTotal(video: unknown, episode: unknown, item: unknown): number;
      legacyDescribePlaybackStream(url: unknown, mime: unknown, itemIsHls: unknown): {
        isHls: boolean;
        contentType: string;
      };
      legacyShouldUseHls(isHls: unknown, nativeHls: unknown, nativeTv: unknown, supported: unknown): boolean;
    };

    expect(runtime.legacyCurrentPlaybackPosition(15, false, 100)).toBe(15);
    expect(runtime.legacyCurrentPlaybackPosition(15, true, 100)).toBe(115);
    expect(runtime.legacyResolvePlaybackTotal(0, 2700, 6300)).toBe(2700);
    expect(runtime.legacyResolvePlaybackTotal(Infinity, 0, 6300)).toBe(6300);
    expect(runtime.legacyDescribePlaybackStream("https://x/video.m3u8", "", false))
      .toEqual({ isHls: true, contentType: "application/vnd.apple.mpegurl" });
    expect(runtime.legacyDescribePlaybackStream("https://x/video.mp4", "", false))
      .toEqual({ isHls: false, contentType: "video/mp4" });
    expect(runtime.legacyShouldUseHls(true, false, false, true)).toBe(true);
    expect(runtime.legacyShouldUseHls(true, true, false, true)).toBe(false);
  });
});
