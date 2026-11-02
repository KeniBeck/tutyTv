export interface M3uAddon {
  id?: string | undefined;
  name?: string | undefined;
  url?: string | undefined;
  count?: number | undefined;
}

export function isM3uAddonUrl(value: unknown): boolean {
  return /^https?:\/\//i.test(String(value ?? "").trim());
}

export function upsertM3uAddon(
  addons: ReadonlyArray<M3uAddon>,
  entry: M3uAddon,
  count: number,
  now: number = Date.now()
): M3uAddon[] {
  const next = addons.slice();
  const index = next.findIndex((addon) => addon.url === entry.url);

  if (index !== -1) {
    next[index] = { ...next[index], count };
    return next;
  }

  next.push({
    id: entry.id || `addon_${now}`,
    name: entry.name || "Lista M3U",
    url: entry.url,
    count
  });
  return next;
}
