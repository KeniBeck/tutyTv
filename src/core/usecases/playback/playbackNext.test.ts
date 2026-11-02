import { describe, expect, it } from "vitest";
import { resolveNextPlaybackTarget } from "./playbackNext";

describe("next playback target", () => {
  const seasons = [
    { id: "s1", number: 1, _episodes: [{ id: "e1" }, { id: "e2" }] },
    { id: "s2", number: 2, _episodes: [{ id: "e3" }, { id: "e4" }] }
  ];

  it("advances to the next episode in the current season", () => {
    expect(resolveNextPlaybackTarget(seasons, 0, 0, seasons[0]!._episodes as Array<{ id: string }>, { id: "e1" }))
      .toEqual({ kind: "episode", seasonIndex: 0, episode: { id: "e2" } });
  });

  it("advances to the next season after the last episode", () => {
    expect(resolveNextPlaybackTarget(seasons, 0, 0, seasons[0]!._episodes as Array<{ id: string }>, { id: "e2" }))
      .toEqual({ kind: "season", seasonIndex: 1, season: seasons[1] });
  });

  it("repairs a stale season index from the fallback season", () => {
    expect(resolveNextPlaybackTarget(seasons, 0, 1, seasons[0]!._episodes as Array<{ id: string }>, { id: "e3" }))
      .toEqual({ kind: "episode", seasonIndex: 1, episode: { id: "e4" } });
  });

  it("returns null when the episode is unknown or is the last episode of the last season", () => {
    expect(resolveNextPlaybackTarget(seasons, 0, 0, seasons[0]!._episodes as Array<{ id: string }>, { id: "missing" })).toBeNull();
    expect(resolveNextPlaybackTarget(seasons, 1, 1, seasons[1]!._episodes as Array<{ id: string }>, { id: "e4" })).toBeNull();
  });
});
