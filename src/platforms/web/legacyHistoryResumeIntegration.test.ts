import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");
const resume = source.match(/ {4}function qa\(e\) \{[\s\S]*?(?= {4}function Oa\(e\))/)?.[0];
const historyEpisode = source.match(/ {4}function legacyResolveHistoryEpisode\([\s\S]*?(?= {4}function legacyFormatPlaybackTime\()/)?.[0];

describe("legacy history resume", () => {
  it("loads the saved season and resumes its episode", () => {
    expect(resume && historyEpisode).toBeDefined();
    const item = {
      id: "s1",
      title: "Serie T1",
      seasonId: "s1",
      _seriesId: "series",
      episodes: [{ id: "e1", number: 1 }],
      seasons: [{ id: "s1", number: 1 }, { id: "s2", number: 2 }]
    };
    const entry = {
      id: "s2", title: "Serie T2", poster: "poster.jpg", seriesId: "series",
      seasonId: "s2", episodeId: "e2", episodeNumber: 2,
      episodeTitle: "Episodio 2", duration: 120
    };
    const ln = vi.fn((_item: unknown, _season: unknown, callback: (episodes: unknown[]) => void) => {
      callback([{ id: "e2", number: 2, title: "Episodio 2" }]);
    });
    const ti = vi.fn();
    const j = {
      screen: "detail", detail: item, playerEpisode: null as unknown,
      detailEpisode: null as unknown, detailSeason: 0
    };
    const runtime = runInNewContext(`${historyEpisode}\n${resume}\n({ qa })`, {
      window: {}, findHistory: () => entry, Ea: null, j, ln, ti
    }) as { qa(item: unknown): void };

    runtime.qa(item);

    expect(ln).toHaveBeenCalledWith(item, item.seasons[1], expect.any(Function));
    expect(j.detailSeason).toBe(1);
    expect(item.seasonId).toBe("s2");
    expect(item.id).toBe("s2");
    expect(item.title).toBe("Serie T2");
    expect(item._seriesId).toBe("series");
    expect(item.episodes).toEqual([{ id: "e2", number: 2, title: "Episodio 2" }]);
    expect(j.playerEpisode).toEqual({ id: "e2", number: 2, title: "Episodio 2" });
    expect(ti).toHaveBeenCalledWith(item);
  });

  it("does not fall back to an unrelated history entry", () => {
    expect(resume && historyEpisode).toBeDefined();
    const item = { id: "movie", title: "Película buscada", episodes: [] };
    const j = {
      screen: "detail", detail: item, playerEpisode: null as unknown,
      detailEpisode: null as unknown, detailSeason: 0
    };
    const runtime = runInNewContext(`${historyEpisode}\n${resume}\n({ qa })`, {
      window: {}, findHistory: () => null,
      Ea: { id: "series", title: "Otra serie", episodeId: "e1" },
      j, ln: vi.fn(), ti: vi.fn()
    }) as { qa(item: unknown): void };

    runtime.qa(item);

    expect(item).toEqual({ id: "movie", title: "Película buscada", episodes: [] });
    expect(j.detailEpisode).toBeNull();
    expect(j.playerEpisode).toBeNull();
  });

  it("keeps the old episode lookup when history has no season", () => {
    expect(resume && historyEpisode).toBeDefined();
    const item = { id: "s1", episodes: [{ id: "e1", number: 1 }] };
    const entry = { id: "s1", episodeId: "e1", episodeNumber: 1 };
    const j = {
      screen: "player", detail: null, playerEpisode: null as unknown,
      detailEpisode: null as unknown, detailSeason: 0
    };
    const runtime = runInNewContext(`${historyEpisode}\n${resume}\n({ qa })`, {
      window: {}, findHistory: () => entry, Ea: null, j, ln: vi.fn(), ti: vi.fn()
    }) as { qa(item: unknown): void };

    runtime.qa(item);
    expect(j.playerEpisode).toEqual({ id: "e1", number: 1 });
  });
});
