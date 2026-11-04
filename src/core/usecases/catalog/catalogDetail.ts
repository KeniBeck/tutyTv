import { normalizeCatalogItem } from "./catalogNormalization";

export interface CatalogFavoriteResult {
  favorites: Record<string, boolean>;
  active: boolean;
}

function hasValue(value: unknown): boolean {
  return value !== "—" && value !== "" && value !== "Sin sinopsis disponible.";
}

export function mergeCatalogDetail<T extends Record<string, unknown>>(item: T, detail: unknown): T {
  const target = item as Record<string, unknown>;
  const seriesId = target._seriesGroup ? target.id : null;
  const seriesTitle = target._seriesGroup ? target._seriesTitle : null;
  const normalized = normalizeCatalogItem(detail, target.id as number) as unknown as Record<string, unknown>;

  for (const key of Object.keys(normalized)) {
    const value = normalized[key];
    if (Array.isArray(value) && value.length === 0) {
      const current = target[key];
      if (Array.isArray(current) && current.length > 0) {
        continue;
      }
    }
    if (hasValue(value)) {
      target[key] = value;
    }
  }

  if (seriesId !== null) {
    target.id = seriesId;
    target.title = seriesTitle;
    target.alias = seriesTitle;
    target.seasons = target._catalogSeasons || target.seasons;
  }

  return item;
}

export function toggleCatalogFavorite(
  favorites: Record<string, boolean>,
  itemId: unknown
): CatalogFavoriteResult {
  if (!itemId) {
    return { favorites, active: false };
  }

  const id = String(itemId);
  const active = !favorites[id];
  const next: Record<string, boolean> = { ...favorites };

  if (active) {
    next[id] = true;
  } else {
    delete next[id];
  }

  return { favorites: next, active };
}
