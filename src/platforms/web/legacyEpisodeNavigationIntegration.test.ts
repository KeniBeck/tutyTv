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
const nextEpisode = source.match(/ {4}function yn\(\) \{[\s\S]*?(?= {4}function bn\(e\))/)?.[0];
const loadSeason = source.match(/ {4}function ln\(e, t, i\) \{[\s\S]*?(?= {4}function dn)/)?.[0];

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

  it("loads the next chronological season when the current one ends", () => {
    expect(nextEpisode).toBeTruthy();
    const gn = vi.fn();
    const R = vi.fn((target: Record<string, unknown>, data: Record<string, unknown>) => {
      Object.assign(target, data);
    });
    const ln = vi.fn((_item: unknown, _season: unknown, callback: (episodes: unknown[], item: unknown) => void) => {
      callback([{ id: "s2e1" }], {
        title: "Serie T2",
        id: "s2",
        seasons: [{ id: "s6", number: 6 }, { id: "s2", number: 2 }, { id: "s1", number: 1 }]
      });
    });
    const item = {
      id: "series",
      title: "Serie T1",
      seasonId: "s1",
      episodes: [{ id: "e1" }],
      seasons: [
        { id: "s6", number: 6 },
        { id: "s1", number: 1 },
        { id: "s2", number: 2 }
      ]
    };
    const context = {
      window: { TutyCore: core },
      S: () => true,
      j: {
        screen: "player",
        detail: item,
        playerItem: item,
        playerSeasonIndex: 1,
        playerEpisode: { id: "e1" },
        detailNeedsRebuild: false
      },
      _e: null,
      t: () => ({ classList: { add() {}, remove() {} }, style: {} }),
      mn: vi.fn(),
      R,
      gn,
      ln
    };
    const runtime = runInNewContext(
      `${list}
${episodes}
${index}
${next}
${seasons}
${nextEpisode}
({ yn })`,
      context
    ) as { yn(): void };

    runtime.yn();
    expect(ln).toHaveBeenCalledWith(item, item.seasons[2], expect.any(Function));
    expect(context.j.playerSeasonIndex).toBe(2);
    expect(item.seasonId).toBe("s2");
    expect(item.title).toBe("Serie T2");
    expect(item.seasons?.[2]?.id).toBe("s2");
    expect(R).toHaveBeenCalledWith(item, expect.objectContaining({ title: "Serie T2", id: "s2" }));
    expect(context.j.detailNeedsRebuild).toBe(true);
    expect(gn).toHaveBeenCalledWith(item, { id: "s2e1" });
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
