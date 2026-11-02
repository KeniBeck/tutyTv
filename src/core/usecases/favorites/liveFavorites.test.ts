import { describe, expect, it } from "vitest";
import { isLiveFavorite, liveFavKey, toggleLiveFavorite } from "./liveFavorites";

describe("liveFavorites", () => {
  it("builds a stable key preferring channelCode, id and name", () => {
    expect(liveFavKey({ channelCode: "ABC", id: "1", name: "Uno" })).toBe("live:ABC");
    expect(liveFavKey({ id: "1", name: "Uno" })).toBe("live:1");
    expect(liveFavKey({ name: "Uno" })).toBe("live:Uno");
    expect(liveFavKey(null)).toBe("live:");
  });

  it("detects favorites from the channel flag or the favorites map", () => {
    expect(isLiveFavorite({ channelCode: "ABC", fav: true }, {})).toBe(true);
    expect(isLiveFavorite({ channelCode: "ABC" }, { "live:ABC": true })).toBe(true);
    expect(isLiveFavorite({ channelCode: "ABC" }, {})).toBe(false);
  });

  it("toggles without mutating the original map", () => {
    const original = {};
    const added = toggleLiveFavorite({ channelCode: "ABC" }, original);
    expect(added.favorite).toBe(true);
    expect(added.favorites).toEqual({ "live:ABC": true });
    expect(original).toEqual({});

    const removed = toggleLiveFavorite({ channelCode: "ABC" }, added.favorites);
    expect(removed.favorite).toBe(false);
    expect(removed.favorites).toEqual({});
  });
});
