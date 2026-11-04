import {
  isLiveFavorite,
  liveFavKey,
  toggleLiveFavorite
} from "../../../core/usecases/favorites/liveFavorites";
import type { AppState } from "../../runtime/state";

export interface FavoriteLiveChannel {
  id?: string;
  name?: string;
  channelCode?: string;
  fav?: boolean;
  [key: string]: unknown;
}

export interface LiveFavoritesHost {
  state: AppState;
  syncFavorites(favorites: Record<string, boolean>): void;
}

let host: LiveFavoritesHost | null = null;

export function attachLiveFavorites(next: LiveFavoritesHost): boolean {
  host = next;
  return true;
}

export function hasLiveFavoritesRuntime(): boolean {
  return host !== null;
}

export function resetLiveFavoritesRuntime(): void {
  host = null;
}

export function liveFavoriteKey(channel: FavoriteLiveChannel | null | undefined): string {
  return liveFavKey(channel);
}

export function isLiveFavoriteChannel(
  channel: FavoriteLiveChannel | null | undefined
): boolean {
  if (!host) {
    return false;
  }
  return isLiveFavorite(channel, host.state.favs);
}

export function toggleLiveFavoriteChannel(
  channel: FavoriteLiveChannel | null | undefined
): boolean {
  if (!host || !channel) {
    return false;
  }
  const result = toggleLiveFavorite(channel, host.state.favs);
  host.state.favs = result.favorites;
  host.syncFavorites(result.favorites);
  channel.fav = result.favorite;
  return result.favorite;
}
