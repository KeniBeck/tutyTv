export interface LiveFavoriteSource {
  channelCode?: string;
  id?: string;
  name?: string;
  fav?: boolean;
}

export type LiveFavorites = Record<string, boolean>;

export function liveFavKey(item: LiveFavoriteSource | null | undefined): string {
  const code = item ? item.channelCode || item.id || item.name : "";
  return "live:" + (code ?? "");
}

export function isLiveFavorite(
  item: LiveFavoriteSource | null | undefined,
  favorites: LiveFavorites | undefined
): boolean {
  if (!item) {
    return false;
  }

  return Boolean(item.fav || (favorites && favorites[liveFavKey(item)]));
}

export function toggleLiveFavorite(
  item: LiveFavoriteSource | null | undefined,
  favorites: LiveFavorites
): { favorites: LiveFavorites; favorite: boolean } {
  if (!item) {
    return { favorites, favorite: false };
  }

  const key = liveFavKey(item);
  const favorite = !favorites[key];
  const next: LiveFavorites = { ...favorites };

  if (favorite) {
    next[key] = true;
  } else {
    delete next[key];
  }

  return { favorites: next, favorite };
}
