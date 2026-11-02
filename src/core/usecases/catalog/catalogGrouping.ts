import { normalizeText } from "../../text/normalizeText";
import { parseSeriesSeasonTitle } from "./catalogNormalization";

export type CatalogRecord = Record<string, unknown>;

interface CatalogGroup {
  title: string;
  items: Array<{ item: CatalogRecord; number: number }>;
}

interface CatalogSeason {
  id: unknown;
  number: number;
  title: string;
}

export function groupCatalogSeries(items: ReadonlyArray<CatalogRecord>): CatalogRecord[] {
  const groups: Record<string, CatalogGroup> = {};
  const groupedKeys: string[] = [];
  const result: CatalogRecord[] = [];

  for (const item of items) {
    const parsed = parseSeriesSeasonTitle(item);
    if (!parsed) {
      result.push(item);
      continue;
    }
    const key = normalizeText(parsed.title);
    if (!groups[key]) {
      groups[key] = { title: parsed.title, items: [] };
      groupedKeys.push(key);
    }
    groups[key]!.items.push({ item, number: parsed.number });
  }

  for (const key of groupedKeys) {
    const group = groups[key]!;
    if (group.items.length < 2) {
      result.push(group.items[0]!.item);
      continue;
    }

    group.items.sort((left, right) => left.number - right.number);
    const first = group.items[0]!.item;
    const categories: Record<string, boolean> = {};
    const catalogSeasons: CatalogSeason[] = [];
    const seasons: CatalogSeason[] = [];

    for (const entry of group.items) {
      const sourceCategories = String(entry.item.category || "").split(",");
      for (const category of sourceCategories) {
        if (category) categories[category] = true;
      }
      const season = {
        id: entry.item.id,
        number: entry.number,
        title: group.title
      };
      catalogSeasons.push(season);
      seasons.push(season);
    }

    first._catalogSeasons = catalogSeasons;
    first._seriesGroup = true;
    first._seriesTitle = group.title;
    first.title = group.title;
    first.alias = group.title;
    first.seasons = seasons;
    first.category = Object.keys(categories).join(",");
    result.push(first);
  }

  return result;
}

function mergeRootItem(
  item: CatalogRecord,
  byId: Map<string, CatalogRecord>,
  ids: string[],
  categories: Map<string, Record<string, boolean>>
): void {
  if (!item || !item.id) return;
  const id = String(item.id);
  const existing = byId.get(id);
  if (existing) {
    for (const key in item) {
      if (!Object.prototype.hasOwnProperty.call(item, key)) continue;
      const value = item[key];
      if (value === "" || value === "—" || value === null || value === undefined) continue;
      existing[key] = value;
    }
  } else {
    byId.set(id, item);
    ids.push(id);
  }

  const itemCategories = String(item.category || "").split(",");
  let mergedCategories = categories.get(id);
  if (!mergedCategories) {
    mergedCategories = {};
    categories.set(id, mergedCategories);
  }
  for (const category of itemCategories) {
    if (category) mergedCategories[category] = true;
  }
}

export function mergePortalRoots(
  roots: Record<string, unknown>,
  rootKeys: ReadonlyArray<string>,
  bundledItems: ReadonlyArray<CatalogRecord>
): CatalogRecord[] {
  const byId = new Map<string, CatalogRecord>();
  const ids: string[] = [];
  const categories = new Map<string, Record<string, boolean>>();

  for (const key of rootKeys) {
    const list = roots[key];
    if (!Array.isArray(list)) continue;
    for (const value of list) {
      if (!value || typeof value !== "object") continue;
      const item = value as CatalogRecord;
      item.portal = true;
      mergeRootItem(item, byId, ids, categories);
    }
  }

  if (!ids.length) return [];

  const merged: CatalogRecord[] = [];
  for (const id of ids) {
    const item = byId.get(id)!;
    item.category = Object.keys(categories.get(id) || {}).join(",");
    merged.push(item);
  }

  for (const bundled of bundledItems) {
    if (!bundled || !bundled.streamUrl) continue;
    merged.push({
      ...bundled,
      category: "demo",
      portal: false
    });
  }

  return merged;
}
