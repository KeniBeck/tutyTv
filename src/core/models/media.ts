export type MediaKind = "movie" | "series" | "live";

export interface MediaItem {
  id: string;
  title: string;
  kind: MediaKind;
  category?: string;
  genres?: string[];
  year?: string;
  score?: string;
}

export interface Catalog {
  items: MediaItem[];
}
