import { normalizeText } from "../../text/normalizeText";

export interface FilterableItem {
  category?: string;
  genres?: string[];
  kind?: string;
}

export function filterMatches(item: FilterableItem, value: string): boolean {
  if (value === "*") {
    return true;
  }

  if (value.indexOf("cat:") === 0) {
    const category = value.slice(4);
    const categories = String(item.category ?? "").split(",");

    for (const candidate of categories) {
      if (normalizeText(candidate) === normalizeText(category)) {
        return true;
      }
    }

    return normalizeText(item.kind ?? "") === normalizeText(category);
  }

  if (value.indexOf("gen:") === 0) {
    const genre = value.slice(4);

    for (const candidate of item.genres ?? []) {
      if (normalizeText(candidate) === normalizeText(genre)) {
        return true;
      }
    }
  }

  return false;
}
