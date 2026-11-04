import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppState } from "../../runtime/state";
import {
  attachLiveFavorites,
  isLiveFavoriteChannel,
  liveFavoriteKey,
  resetLiveFavoritesRuntime,
  toggleLiveFavoriteChannel
} from "./liveFavorites";

describe("live favorites", () => {
  afterEach(() => resetLiveFavoritesRuntime());

  it("keys channels and toggles favorites through the profile", () => {
    const state = createAppState();
    const syncFavorites = vi.fn();
    attachLiveFavorites({ state, syncFavorites });

    expect(liveFavoriteKey({ channelCode: "ABC", id: "1", name: "Uno" })).toBe("live:ABC");
    expect(isLiveFavoriteChannel({ channelCode: "ABC" })).toBe(false);

    const channel: { channelCode: string; id: string; name: string; fav?: boolean } =
      { channelCode: "ABC", id: "1", name: "Uno" };
    expect(toggleLiveFavoriteChannel(channel)).toBe(true);
    expect(state.favs["live:ABC"]).toBe(true);
    expect(channel.fav).toBe(true);
    expect(syncFavorites).toHaveBeenLastCalledWith(state.favs);

    expect(isLiveFavoriteChannel(channel)).toBe(true);
    expect(toggleLiveFavoriteChannel(channel)).toBe(false);
    expect(state.favs["live:ABC"]).toBeUndefined();
    expect(channel.fav).toBe(false);
  });

  it("ignores missing channels", () => {
    const state = createAppState();
    attachLiveFavorites({ state, syncFavorites: vi.fn() });
    expect(toggleLiveFavoriteChannel(null)).toBe(false);
    expect(isLiveFavoriteChannel(null)).toBe(false);
  });
});
