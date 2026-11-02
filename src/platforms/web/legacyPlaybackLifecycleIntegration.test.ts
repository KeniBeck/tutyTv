import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");

const snippet = [
  source.match(/ {4}function legacyIsSeriesLike\(item\) \{[\s\S]*?\n {4}\}/)?.[0],
  source.match(
    / {4}function legacyShouldSaveHistoryBeforeReset\(mode, hasVideo\) \{[\s\S]*?(?= {4}function legacyDevServiceUrl)/
  )?.[0]
].join("\n");

describe("legacy playback lifecycle integration", () => {
  it("keeps cleanup and transitions connected to the Core helpers", () => {
    expect(source).toMatch(/legacyShouldSaveHistoryBeforeReset\(j\.playerMode, !!we\)/);
    expect(source).toMatch(/var e = legacyResolveAbortServiceBase\(Un, Fn\);/);
    expect(source).toMatch(/legacyShouldLoadSeriesEpisodesBeforePlay\(e, j\.playerEpisode\)/);
    expect(source).toMatch(/legacyShouldReusePlaybackSession\("detail" === j\.screen, hasSession, sameItem, a\)/);
    expect(source).toMatch(/legacyHasPlaybackSession\(we\.src, we\.currentSrc, Fn, j\.streamError\)/);
  });

  it.each([true, false])("resolves cleanup and transition rules (core available: %s)", (withCore) => {
    expect(snippet).toBeTruthy();
    const runtime = runInNewContext(
      `${snippet}\n({ legacyShouldSaveHistoryBeforeReset, legacyResolveAbortServiceBase, `
      + "legacyShouldLoadSeriesEpisodesBeforePlay, legacyShouldReusePlaybackSession, legacyHasPlaybackSession })",
      { window: { TutyCore: withCore ? core : undefined } }
    ) as {
      legacyShouldSaveHistoryBeforeReset(mode: unknown, hasVideo: unknown): boolean;
      legacyResolveAbortServiceBase(directBase: unknown, streamUrl: unknown): string;
      legacyShouldLoadSeriesEpisodesBeforePlay(item: unknown, episode: unknown): boolean;
      legacyShouldReusePlaybackSession(screen: unknown, hasSource: unknown, sameItem: unknown, sameEpisode: unknown): boolean;
      legacyHasPlaybackSession(source: unknown, currentSource: unknown, streamUrl: unknown, streamError: unknown): boolean;
    };

    expect(runtime.legacyShouldSaveHistoryBeforeReset("vod", true)).toBe(true);
    expect(runtime.legacyShouldSaveHistoryBeforeReset("live", true)).toBe(false);
    expect(runtime.legacyResolveAbortServiceBase("", "http://127.0.0.1:9000/s/x.mp4"))
      .toBe("http://127.0.0.1:9000");
    expect(runtime.legacyResolveAbortServiceBase("", "https://cdn/video.mp4")).toBe("");
    expect(runtime.legacyShouldLoadSeriesEpisodesBeforePlay({ type: "series", episodes: [] }, null)).toBe(true);
    expect(runtime.legacyShouldLoadSeriesEpisodesBeforePlay({ type: "series", episodes: [{}] }, null)).toBe(false);
    expect(runtime.legacyShouldReusePlaybackSession("detail", true, true, true)).toBe(true);
    expect(runtime.legacyShouldReusePlaybackSession("home", true, true, true)).toBe(false);
    expect(runtime.legacyHasPlaybackSession("", "blob:http://x/1", "", "")).toBe(true);
    expect(runtime.legacyHasPlaybackSession("", "", "http://127.0.0.1/s/x.mp4", "")).toBe(true);
    expect(runtime.legacyHasPlaybackSession("", "blob:http://x/1", "", "error")).toBe(false);
  });
});
