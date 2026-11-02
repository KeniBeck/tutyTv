export interface LiveCategorySource {
  id?: unknown;
  name?: unknown;
  code?: unknown;
}

export interface LiveCategory {
  id?: unknown;
  name: string;
  code?: unknown;
  isAddon: boolean;
}

export const DEFAULT_LIVE_CATEGORIES: ReadonlyArray<LiveCategory> = [
  { id: 76182, name: "Todos", isAddon: false },
  { id: 76206, name: "Deportes", isAddon: false },
  { id: 76205, name: "Cine y Series", isAddon: false },
  { id: 76188, name: "Colombia", isAddon: false },
  { id: 76191, name: "España", isAddon: false },
  { id: 76197, name: "México", isAddon: false }
];

export const ADDON_LIVE_CATEGORY: LiveCategory = {
  id: "addons",
  name: "➕ Addons M3U",
  isAddon: true
};

export function normalizeLiveCategories(
  categories: ReadonlyArray<LiveCategorySource> | null | undefined
): LiveCategory[] {
  const result: LiveCategory[] = [];

  if (categories && categories.length) {
    for (const category of categories) {
      const name = String(category.name ?? "");
      const isAll = name === "ChannelList" || category.id === 76182;
      result.push({
        id: category.id,
        name: isAll ? "Todos" : name,
        code: category.code,
        isAddon: false
      });
    }
  } else {
    for (const category of DEFAULT_LIVE_CATEGORIES) {
      result.push({ ...category });
    }
  }

  result.push({ ...ADDON_LIVE_CATEGORY });
  return result;
}
