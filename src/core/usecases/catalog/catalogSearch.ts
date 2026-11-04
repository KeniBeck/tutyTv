import { normalizeText } from "../../text/normalizeText";

export interface SearchableCatalogItem {
  id?: unknown;
  title?: unknown;
  alias?: unknown;
}

export function findLocalSearchMatches<T extends SearchableCatalogItem>(
  items: ReadonlyArray<T>,
  query: unknown
): T[] {
  const needle = normalizeText(String(query ?? "").trim());
  if (!needle) return [];

  const matches: T[] = [];
  for (const item of items) {
    const title = normalizeText(item.title || "");
    const alias = item.alias ? normalizeText(item.alias) : "";
    if (title.indexOf(needle) !== -1 || (alias && alias.indexOf(needle) !== -1)) {
      matches.push(item);
    }
  }
  return matches;
}

export function combineSearchResults<T extends SearchableCatalogItem>(
  localItems: ReadonlyArray<T>,
  remoteItems: ReadonlyArray<unknown>,
  normalizeRemote: (item: unknown, index: number) => T
): T[] {
  const merged = localItems.slice();
  const seen: Record<string, true> = {};
  for (const item of merged) {
    seen[String(item.id)] = true;
  }

  for (const remote of remoteItems) {
    const item = normalizeRemote(remote, merged.length + 1);
    const id = String(item.id);
    if (!seen[id]) {
      seen[id] = true;
      merged.push(item);
    }
  }
  return merged;
}
