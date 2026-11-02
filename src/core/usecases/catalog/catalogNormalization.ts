import { normalizeText } from "../../text/normalizeText";

export interface CatalogNormalizationOptions {
  imageBaseUrl?: string;
  portalMode?: boolean;
}

export interface NormalizedCatalogItem {
  id: string;
  title: string;
  category: string;
  score: string;
  year: string;
  duration: string;
  genres: string[];
  director: string;
  actors: string;
  synopsis: string;
  kind: string;
  poster: string;
  landscape: string;
  backdrop: string;
  streamUrl: unknown;
  type: string;
  row: string;
  alias: string;
  country: string;
  releaseDate: string;
  tagline: string;
  volumeCount: number;
  updateCount: number;
  episodes: unknown;
  seasons: unknown;
  moreAudio: unknown;
  moreSubtitle: unknown;
  _portal: boolean;
}

export interface ParsedSeasonTitle {
  title: string;
  number: number;
}

const CATALOG_CONTAINER_KEYS = [
  "items",
  "movies",
  "results",
  "recommendList",
  "movieList",
  "totalMovieList",
  "programList",
  "data"
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function fallback(value: unknown, replacement: string): string {
  return value === null || value === undefined || value === "" ? replacement : String(value);
}

function hasEntries(value: unknown): boolean {
  if (!value) return false;
  const length = (value as { length?: unknown }).length;
  return typeof length === "number" && length > 0;
}

function asCount(value: unknown): number {
  return parseInt(String(value), 10) || 0;
}

export function resolveCatalogImage(value: unknown, imageBaseUrl?: string): string {
  if (!value) return "";
  const text = String(value);
  if (/^https?:\/\//i.test(text) || text.indexOf("data:") === 0) return text;
  if (imageBaseUrl) {
    return String(imageBaseUrl).replace(/\/$/, "") + "/" + text.replace(/^\//, "");
  }
  return text;
}

export function isSeriesLike(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return item.type === "teleplay"
    || item.type === "series"
    || item.kind === "serie"
    || (item.category !== undefined
      && item.category !== null
      && String(item.category).indexOf("serie") !== -1)
    || hasEntries(item.episodes)
    || hasEntries(item.seasons)
    || asCount(item.volumeCount) > 1;
}

export function parseSeriesSeasonTitle(value: unknown): ParsedSeasonTitle | null {
  if (!isSeriesLike(value)) return null;
  const item = value as Record<string, unknown>;
  const title = String(item.title || item.alias || "")
    .replace(/\s+/g, " ")
    .replace(/^\s+|\s+$/g, "");
  const match = /^(.*?)(?:\s*[-–:|]?\s*(?:temporada|season)\s*(\d+)|\s*[-–:|]?\s*[st]\s*0?(\d+))\s*$/i.exec(title);
  const seriesTitle = match?.[1];
  if (!seriesTitle) return null;
  const number = parseInt(match?.[2] || match?.[3] || "", 10);
  if (!number || number > 99) return null;
  return {
    title: seriesTitle.replace(/\s+$/, ""),
    number
  };
}

export function extractCatalogItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  for (const key of CATALOG_CONTAINER_KEYS) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (isRecord(value)) {
      const nested = extractCatalogItems(value);
      if (nested.length) return nested;
    }
  }
  return [];
}

export function normalizeCatalogItem(
  value: unknown,
  index: number,
  options: CatalogNormalizationOptions = {}
): NormalizedCatalogItem {
  const item = isRecord(value) ? value : {};
  const genresSource = item.genres || item.genre || [];
  const genres = Array.isArray(genresSource)
    ? genresSource
    : typeof genresSource === "string" ? genresSource.split(",") : [];
  const genreNames: string[] = [];
  for (const genre of genres) {
    if (typeof genre === "string") {
      genreNames.push(genre);
    } else if (isRecord(genre)) {
      genreNames.push(String(genre.name || ""));
    }
  }

  const rawDuration = item.duration || item.runtime || item.runtimeMinutes || "";
  const duration = typeof rawDuration === "number"
    ? Math.floor(rawDuration / 60) + " h " + rawDuration % 60 + " min"
    : rawDuration;

  const type = fallback(item.type || item.programType, "");
  const normalizedKind = normalizeText(fallback(item.kind || "", ""));
  const normalizedCategory = normalizeText(fallback(item.category || "", ""));
  const series = type === "teleplay"
    || type === "series"
    || normalizedKind === "serie"
    || normalizedCategory.indexOf("serie") !== -1
    || hasEntries(item.episodes)
    || hasEntries(item.seasons)
    || asCount(item.volumeCount) > 1
    || asCount(item.volumnCount) > 1;

  const idSource = item.id || item.vodId || item.programId || item.program_id || item.tmdb_id;
  const portal = item.portal === true
    || item._portal === true
    || (options.portalMode === true && String(item.id || "").length > 10);

  return {
    id: fallback(idSource, "api-" + index),
    title: fallback(
      item.title || item.name || item.programName || item.programTitle || item.original_title,
      "Sin título"
    ),
    category: normalizeText(fallback(
      item.category || item.section || item.collection || item.homeSection,
      ""
    )),
    score: fallback(
      item.score || item.vote_average || item.rating || item.movieRate || item.programScore,
      "—"
    ),
    year: fallback(
      item.year
        || item.release_year
        || item.programYear
        || (String(item.releaseDate || item.releaseTime || item.release_date || "").slice(0, 4)),
      "—"
    ),
    duration: fallback(duration, "—"),
    genres: genreNames.length ? genreNames : ["Sin clasificar"],
    director: fallback(item.director, "—"),
    actors: fallback(item.actors || item.actorDisplay || item.cast, "—"),
    synopsis: fallback(
      item.synopsis || item.overview || item.description || item.programUpdateContent,
      "Sin sinopsis disponible."
    ),
    kind: series ? "serie" : fallback(item.kind || item.media_type, "película"),
    poster: resolveCatalogImage(
      item.posterUrl
        || item.poster_url
        || item.poster
        || item.poster_path
        || item.image
        || item.imageUrl
        || item.cover
        || item.coverUrl
        || item.programPoster
        || item.programImage,
      options.imageBaseUrl
    ),
    landscape: resolveCatalogImage(
      item.landscapeUrl || item.landscape_url || item.landscape || item.wideImage || item.bannerImage,
      options.imageBaseUrl
    ),
    backdrop: resolveCatalogImage(
      item.backdropUrl || item.backdrop_url || item.backdrop || item.backdrop_path,
      options.imageBaseUrl
    ),
    streamUrl: item.streamUrl || item.stream_url || "",
    type: type || (series ? "teleplay" : "movie"),
    row: fallback(item.row, ""),
    alias: fallback(item.alias, ""),
    country: fallback(item.country || item.originalCountry, ""),
    releaseDate: fallback(item.releaseDate || item.releaseTime, ""),
    tagline: fallback(item.tagline || item.viewPoint, ""),
    volumeCount: asCount(item.volumeCount || item.volumnCount),
    updateCount: asCount(item.updateCount),
    episodes: item.episodes || [],
    seasons: item.seasons || [],
    moreAudio: item.moreAudio !== undefined ? item.moreAudio : 0,
    moreSubtitle: item.moreSubtitle !== undefined ? item.moreSubtitle : 0,
    _portal: portal
  };
}
