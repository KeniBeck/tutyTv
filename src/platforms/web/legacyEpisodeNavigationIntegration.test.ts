import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");
const list = source.match(/ {4}function legacySeasonList\(item\) \{[\s\S]*?(?= {4}function legacySeasonEpisodes)/)?.[0];
const episodes = source.match(/ {4}function legacySeasonEpisodes\(item, seasonIndex\) \{[\s\S]*?(?= {4}function legacyFindEpisodeIndex)/)?.[0];
const index = source.match(/ {4}function legacyFindEpisodeIndex\(episodes, current\) \{[\s\S]*?(?= {4}function legacyNextSeasonIndex)/)?.[0];
const next = source.match(/ {4}function legacyNextSeasonIndex\(seasons, currentIndex\) \{[\s\S]*?(?= {4}function legacyFormatEpisodeDuration)/)?.[0];
const seasons = source.match(/ {4}function sn\(e\) \{[\s\S]*?(?= {4}function ln\(e, t, i\))/)?.[0];
const loadSeason = source.match(/ {4}function ln\(e, t, i\) \{[\s\S]*?(?= {4}function dn)/)?.[0];
const switchEpisode = source.match(/ {4}function gn\(e, t, saveHistory\) \{[\s\S]*?(?= {4}function mn\(\))/)?.[0];

const series = {
  id: "series",
  seasonId: "t2",
  episodes: [{ id: "e3" }],
  seasons: [
    { id: "t1", number: 1, _episodes: [{ id: "e1" }] },
    { id: "t2", number: 2 }
  ]
};

describe("legacy episode navigation integration", () => {
  it.each([true, false])("resolves seasons, episodes and the current index (core available: %s)", (withCore) => {
    expect(list && episodes && index && next && seasons).toBeTruthy();
    const runtime = runInNewContext(
      `${list}\n${episodes}\n${index}\n${next}\n${seasons}\n({ legacySeasonList, legacySeasonEpisodes, legacyFindEpisodeIndex, legacyNextSeasonIndex, sn })`,
      { window: { TutyCore: withCore ? core : undefined } }
    ) as {
      legacySeasonList(item: unknown): unknown[];
      legacySeasonEpisodes(item: unknown, seasonIndex: number): unknown[];
      legacyFindEpisodeIndex(episodes: unknown[], current: unknown): number;
      legacyNextSeasonIndex(seasons: unknown[], currentIndex: number): number;
      sn(item: unknown): unknown[];
    };

    expect(runtime.legacySeasonList(null)).toEqual([{ id: "", number: 1 }]);
    expect(runtime.sn(series)).toHaveLength(2);
    expect(runtime.legacySeasonEpisodes(series, 1)).toEqual([{ id: "e3" }]);
    expect(runtime.legacySeasonEpisodes(series, 0)).toEqual([{ id: "e1" }]);
    expect(runtime.legacyFindEpisodeIndex(
      [{ id: "a", number: 1 }, { id: "b", number: 2 }],
      { id: "x", number: 2 }
    )).toBe(1);
    expect(runtime.legacyFindEpisodeIndex([], { id: "b" })).toBe(-1);
    expect(runtime.legacyNextSeasonIndex(
      [6, 4, 3, 2, 5, 7, 8, 1, 9, 10].map((number) => ({ number })),
      7
    )).toBe(3);
  });

  it("closes a pending next-episode prompt when switching episodes", () => {
    expect(switchEpisode).toBeTruthy();
    const scheduled: Array<() => void> = [];
    const close = vi.fn();
    const ar = vi.fn();
    const sr = vi.fn();
    const context = {
      window: { TutyUI: { hasNextEpisodePromptRuntime: () => true, closeNextEpisodePrompt: close } },
      j: {
        screen: "player",
        detailSeason: 1,
        playerItem: null,
        playerEpisode: null,
        detailEpisode: null,
        playerSeasonIndex: 0,
        nextEpisodeSeq: 0,
        nextEpisodeOpen: true,
        nextEpisodeDismissed: true,
        nextEpisodeGuardUntil: 0,
        resumePosition: 40
      },
      ye: {}, be: {},
      closeNextEpisodePrompt: close,
      ar,
      vr: vi.fn(),
      bn: vi.fn(),
      nr: vi.fn(),
      sr,
      setTimeout(callback: () => void) { scheduled.push(callback); return 1; },
      clearTimeout: vi.fn()
    };
    const runtime = runInNewContext(`${switchEpisode}
({ gn })`, context) as { gn(item: unknown, episode: unknown, saveHistory: boolean): void };
    const item = { id: "series" };
    const episode = { id: "e4" };

    runtime.gn(item, episode, false);

    expect(close).toHaveBeenCalledWith(false);
    expect(context.j.nextEpisodeDismissed).toBe(false);
    expect(context.j.nextEpisodeGuardUntil).toBeGreaterThan(Date.now());
    expect(ar).not.toHaveBeenCalled();
    expect(scheduled).toHaveLength(1);
    scheduled[0]?.();
    expect(context.j.resumePosition).toBe(0);
    expect(sr).toHaveBeenCalledWith(item, episode);
  });

  it("passes the season item and episodes to the loader callback", () => {
    expect(loadSeason).toBeTruthy();
    let respond: ((error: unknown, data: unknown) => void) | undefined;
    const context = {
      q: vi.fn((_method: string, _params: unknown, callback: typeof respond) => { respond = callback; })
    };
    const runtime = runInNewContext(`${loadSeason}
({ ln })`, context) as {
      ln(e: unknown, t: Record<string, unknown>, cb: (episodes: unknown[], item: unknown) => void): void;
    };
    const season = { id: "s2" };
    const callback = vi.fn();

    runtime.ln({ id: "series", seasonId: "s1" }, season, callback);
    respond?.(null, { returnValue: true, item: { id: "s2", title: "Serie T2" }, episodes: [{ id: "e" }] });
    expect(callback).toHaveBeenCalledWith([{ id: "e" }], { id: "s2", title: "Serie T2" });
  });
});
