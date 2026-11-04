import type { M3uAddon } from "../../../core/usecases/live/addons";
import { selectInitialAddons } from "../../../core/usecases/live/liveLoading";

export interface HomeAddonPreset {
  id?: string;
  name?: string;
  url: string;
  desc?: string;
  count?: number;
  [key: string]: unknown;
}

export interface HomeAddonsHost {
  readStorage<T>(key: string, fallback: T): T;
  writeStorage(key: string, value: unknown): void;
}

const STORAGE_KEY = "xuper_m3u_addons";

const PRESETS: HomeAddonPreset[] = [
  {
    id: "es_tdt",
    name: "España - Canales Nacionales y TDT",
    url: "https://iptv-org.github.io/iptv/countries/es.m3u",
    desc: "320+ canales: La 1, La 2, Antena 3, Telecinco, laSexta, autonómicas"
  },
  {
    id: "latam_spa",
    name: "Latinoamérica y Deportes (Hispano)",
    url: "https://iptv-org.github.io/iptv/languages/spa.m3u",
    desc: "Canales en español de Colombia, México, Argentina, Chile y Perú"
  },
  {
    id: "sports_iptv",
    name: "Deportes Internacionales",
    url: "https://iptv-org.github.io/iptv/categories/sports.m3u",
    desc: "Transmisiones deportivas y canales de competiciones"
  },
  {
    id: "movies_iptv",
    name: "Cine y Series 24/7",
    url: "https://iptv-org.github.io/iptv/categories/movies.m3u",
    desc: "Cine clásico, cine de acción y canales continuos de series"
  }
];

let host: HomeAddonsHost | null = null;
let cached: M3uAddon[] | null = null;

export function attachHomeAddons(next: HomeAddonsHost): boolean {
  host = next;
  cached = null;
  return true;
}

export function hasHomeAddonsRuntime(): boolean {
  return host !== null;
}

export function resetHomeAddonsRuntime(): void {
  host = null;
  cached = null;
}

export function getHomeAddonPresets(): HomeAddonPreset[] {
  return PRESETS;
}

export function getHomeAddons(): M3uAddon[] {
  if (!host) {
    return [];
  }
  if (cached) {
    return cached;
  }
  const stored = host.readStorage<unknown>(STORAGE_KEY, null);
  const result = selectInitialAddons(stored, PRESETS);
  if (result.persist) {
    host.writeStorage(STORAGE_KEY, result.addons);
  }
  cached = result.addons;
  return cached;
}

export function saveHomeAddons(addons: M3uAddon[] | null | undefined): void {
  if (!host) {
    return;
  }
  cached = addons || [];
  host.writeStorage(STORAGE_KEY, cached);
}
