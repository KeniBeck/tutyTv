import type { MediaItem } from "../../models/media";
import { normalizeText } from "../../text/normalizeText";

export function filterCatalogByQuery(items: MediaItem[], query: string): MediaItem[] {
  const normalizedQuery = normalizeText(query).trim();
  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) => {
    const title = normalizeText(item.title);
    const category = normalizeText(item.category ?? "");
    const genres = (item.genres ?? []).map((genre) => normalizeText(genre)).join(" ");

    return (
      title.includes(normalizedQuery) ||
      category.includes(normalizedQuery) ||
      genres.includes(normalizedQuery)
    );
  });
}
