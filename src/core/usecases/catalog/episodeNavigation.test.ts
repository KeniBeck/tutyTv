import { describe, expect, it } from "vitest";
import { findEpisodeIndex, nextSeasonIndex, seasonEpisodes, seasonList } from "./episodeNavigation";

describe("episode navigation", () => {
  it("falls back to a synthetic season when the item has none", () => {
    expect(seasonList(null)).toEqual([{ id: "", number: 1 }]);
    expect(seasonList({ id: "movie" })).toEqual([{ id: "movie", number: 1 }]);
    expect(seasonList({ id: "s", seasons: [{ id: "t1", number: 1 }] }))
      .toEqual([{ id: "t1", number: 1 }]);
  });

  it("returns episodes from the current season or its cached list", () => {
    const current = {
      id: "series",
      seasonId: "t2",
      episodes: [{ id: "e3" }],
      seasons: [
        { id: "t1", number: 1, _episodes: [{ id: "e1" }] },
        { id: "t2", number: 2 }
      ]
    };
    expect(seasonEpisodes(current, 1)).toEqual([{ id: "e3" }]);
    expect(seasonEpisodes(current, 0)).toEqual([{ id: "e1" }]);
    expect(seasonEpisodes({ id: "series", seasons: [] }, 0)).toEqual([]);
  });

  it("selects the next season by number, not by array order", () => {
    const seasons = [6, 4, 3, 2, 5, 7, 8, 1, 9, 10].map((number) => ({ number }));
    expect(nextSeasonIndex(seasons, 7)).toBe(3);
    expect(nextSeasonIndex(seasons, 0)).toBe(5);
    expect(nextSeasonIndex(seasons, 9)).toBe(-1);
    expect(nextSeasonIndex([{ number: 1 }, { number: 2 }], 0)).toBe(1);
    expect(nextSeasonIndex([{}, {}], 0)).toBe(1);
  });

  it("finds the current episode by id or number", () => {
    const episodes = [{ id: "a", number: 1 }, { id: "b", number: 2 }];
    expect(findEpisodeIndex(episodes, { id: "b", number: 2 })).toBe(1);
    expect(findEpisodeIndex(episodes, { id: "x", number: 2 })).toBe(1);
    expect(findEpisodeIndex(episodes, { id: "x", number: 9 })).toBe(-1);
    expect(findEpisodeIndex(episodes, null)).toBe(-1);
    expect(findEpisodeIndex([{ id: "a" }, { id: "b" }], { id: "x" })).toBe(-1);
    expect(findEpisodeIndex([{}, {}], {})).toBe(-1);
  });
});
