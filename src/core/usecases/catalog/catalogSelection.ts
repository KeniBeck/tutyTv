import { normalizeText } from "../../text/normalizeText";

export interface CatalogSelectable {
  id?: unknown;
  category?: unknown;
  kind?: unknown;
}

export function selectCatalogPage<T extends CatalogSelectable>(
  items: ReadonlyArray<T>,
  category: string | null | undefined,
  limit: number,
  offset: number
): T[] {
  const key = normalizeText(category);
  let selected: T[] = [];

  if (key) {
    for (const item of items) {
      if (normalizeText(item.category || "").split(",").indexOf(key) !== -1) {
        selected.push(item);
      }
    }
  }

  if (!selected.length) selected = items.slice(offset, offset + limit);
  if (!selected.length) selected = items.slice(0, limit);

  if (selected.length < limit && items.length) {
    const seen: Record<string, true> = {};
    for (const item of selected) {
      seen[String(item.id)] = true;
    }

    for (let index = 0; selected.length < limit && index < 2 * items.length; index++) {
      const item = items[index % items.length]!;
      const id = String(item.id);
      if (!seen[id]) {
        selected.push(item);
        seen[id] = true;
      }
    }
  }

  return selected;
}

export function filterCatalogCategory<T extends CatalogSelectable>(
  items: ReadonlyArray<T>,
  category: string | null | undefined
): T[] {
  const key = normalizeText(category);
  const selected: T[] = [];

  if (key) {
    for (const item of items) {
      const categories = normalizeText(item.category || "").split(",");
      const kind = normalizeText(item.kind || "");
      if (categories.indexOf(key) !== -1 || (kind && kind.indexOf(key) !== -1)) {
        selected.push(item);
      }
    }
  }

  return selected.length ? selected : items.slice();
}

export function buildEpisodeRanges(total: number, pageSize: number = 20): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  for (let start = 0; start < total; start += pageSize) {
    ranges.push({ start, end: Math.min(total, start + pageSize) });
  }
  return ranges;
}
