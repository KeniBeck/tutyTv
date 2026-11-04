import {
  buildServiceParams,
  describeServiceError,
  hasApiSession,
  normalizeApiSession,
  resolveServiceUrl
} from "../../core/usecases/api/apiSession";
import type { AppState } from "./state";
import type { ServiceCallback } from "./service";
import { mergeCatalogDetail } from "../../core/usecases/catalog/catalogDetail";
import { groupCatalogSeries, mergePortalRoots } from "../../core/usecases/catalog/catalogGrouping";
import {
  extractCatalogItems,
  isSeriesLike,
  normalizeCatalogItem
} from "../../core/usecases/catalog/catalogNormalization";
import { selectCatalogPage } from "../../core/usecases/catalog/catalogSelection";
import { resolveDetailSeason } from "../../core/usecases/catalog/episodeNavigation";

export interface CatalogConfig {
  enabled?: boolean;
  mode?: string;
  refresh?: boolean;
  useBundledCatalog?: boolean;
  session?: unknown;
  [key: string]: unknown;
}

export type CatalogItem = Record<string, unknown>;

export interface CatalogStatus {
  loading: boolean;
  source: string;
  error: string | null;
}

export interface PortalState {
  refreshing: boolean;
  lastSync: number;
  roots: number;
  error: string | null;
}

export interface CatalogRuntimeDeps {
  state: AppState;
  getConfig(): CatalogConfig;
  getCatalog(): CatalogItem[];
  getStatus(): CatalogStatus;
  getPortalState(): PortalState;
  getRoots(): string[];
  request(method: string, params: Record<string, unknown> | undefined, done: ServiceCallback): boolean;
  requestDev(
    url: string,
    done: ServiceCallback,
    options?: { method?: string; body?: unknown } | null
  ): boolean;
  afterCatalogApplied(): void;
  checkReminders(): void;
  syncMediaInfo(item: CatalogItem): void;
  afterDetailLoaded(item: CatalogItem): void;
}

export interface CatalogRuntime {
  extract(payload: unknown): CatalogItem[];
  resolveUrl(method: string): string;
  normalizeSession(): Record<string, string>;
  hasSession(): boolean;
  buildParams(kind: string, value?: unknown): Record<string, unknown>;
  similar(item: unknown): boolean;
  normalizeItem(item: unknown, index?: number): CatalogItem;
  applyCatalog(items: CatalogItem[], source: string, portal?: boolean): boolean;
  selectPage(category: string, limit: number, offset: number): CatalogItem[];
  bundledCatalog(): CatalogItem[];
  applyPortal(roots: Record<string, unknown>): CatalogItem[] | false;
  refreshPortal(): void;
  startPortal(): void;
  fallback(source?: string, error?: string | null): boolean;
  loadCatalog(): void;
  mergeDetail(item: CatalogItem, detail: unknown): CatalogItem;
  loadDetail(item: CatalogItem | null, done?: (item: CatalogItem | null) => void): void;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export function createCatalogRuntime(deps: CatalogRuntimeDeps): CatalogRuntime {
  function extract(payload: unknown): CatalogItem[] {
    return extractCatalogItems(payload) as CatalogItem[];
  }

  function resolveUrl(method: string): string {
    return resolveServiceUrl(deps.getConfig(), method);
  }

  function normalizeSession(): Record<string, string> {
    return normalizeApiSession(deps.getConfig().session as never) as unknown as Record<string, string>;
  }

  function hasSession(): boolean {
    return hasApiSession(deps.getConfig().session as never);
  }

  function buildParams(kind: string, value?: unknown): Record<string, unknown> {
    return buildServiceParams(kind, value, deps.getConfig().session as never) as unknown as Record<string, unknown>;
  }

  function similar(item: unknown): boolean {
    return isSeriesLike(item);
  }

  function normalizeItem(item: unknown, index = 0): CatalogItem {
    return normalizeCatalogItem(item, index) as unknown as CatalogItem;
  }

  function applyCatalog(items: CatalogItem[], source: string, portal = false): boolean {
    if (!items.length) {
      return false;
    }
    const state = deps.state;
    const catalog = deps.getCatalog();
    const current: Record<string, CatalogItem> = {};
    for (const item of catalog) {
      current[String(item.id)] = item;
    }
    catalog.splice(0, catalog.length);
    const next: CatalogItem[] = [];
    for (let index = 0; index < items.length; index += 1) {
      const item = normalizeItem(items[index], index + 1);
      if (portal && items[index] && items[index]!.portal !== false) {
        item._portal = true;
      }
      const previous = current[String(item.id)];
      if (previous) {
        if (previous.episodes) item.episodes = previous.episodes;
        if (previous.seasons) item.seasons = previous.seasons;
        if (previous._detailsLoaded) item._detailsLoaded = true;
        if (!item.streamUrl && previous.streamUrl) item.streamUrl = previous.streamUrl;
      }
      next.push(item);
    }
    const grouped = groupCatalogSeries(next) as CatalogItem[];
    for (const item of grouped) {
      catalog.push(item);
    }
    if (state.detail) {
      const detail = state.detail as CatalogItem;
      let found = false;
      for (const item of catalog) {
        if (String(item.id) === String(detail.id)) {
          state.detail = item;
          found = true;
          break;
        }
      }
      if (!found) state.detail = catalog[0];
    }
    setTimeout(deps.checkReminders, 1500);
    const status = deps.getStatus();
    status.source = source;
    status.error = null;
    deps.afterCatalogApplied();
    return true;
  }

  function selectPage(category: string, limit: number, offset: number): CatalogItem[] {
    return selectCatalogPage(deps.getCatalog(), category, limit, offset) as CatalogItem[];
  }

  function bundledCatalog(): CatalogItem[] {
    const source = (window as unknown as { TUTYTV_CATALOG?: unknown }).TUTYTV_CATALOG;
    return source ? extract(source) : [];
  }

  function applyPortal(roots: Record<string, unknown>): CatalogItem[] | false {
    const merged = mergePortalRoots(roots, deps.getRoots(), bundledCatalog()) as CatalogItem[];
    if (!merged.length) {
      return false;
    }
    applyCatalog(merged, "portal", true);
    return merged;
  }

  function refreshPortal(): void {
    const portal = deps.getPortalState();
    if (portal.refreshing) {
      return;
    }
    portal.refreshing = true;
    portal.error = null;
    const roots: Record<string, unknown> = {};
    let index = 0;
    const nextRoot = function nextRoot(): void {
      if (index >= deps.getRoots().length) {
        portal.refreshing = false;
        portal.lastSync = Date.now();
        applyPortal(roots);
        return;
      }
      const root = deps.getRoots()[index++];
      if (!root) {
        nextRoot();
        return;
      }
      deps.request("home", { root }, function homeDone(error, response) {
        const payload = isObject(response) ? response : null;
        const items = payload && Array.isArray(payload.items) ? payload.items : null;
        if (!error && payload && payload.returnValue !== false && items && items.length) {
          roots[root] = items;
          portal.roots += 1;
        } else if (error) {
          portal.error = error;
        }
        nextRoot();
      });
    };
    nextRoot();
  }

  function startPortal(): void {
    const source = (window as unknown as { TUTYTV_PORTAL?: unknown }).TUTYTV_PORTAL;
    const snapshot = source ? extract(source) : [];
    if (snapshot.length) {
      applyCatalog(snapshot, "portal-snapshot", true);
    }
    if (deps.getConfig().refresh === false) {
      if (!snapshot.length) {
        deps.getStatus().error = "Sin snapshot del portal";
      }
      return;
    }
    refreshPortal();
  }

  function fallback(source?: string, error?: string | null): boolean {
    if (applyCatalog(bundledCatalog(), source || "bundled")) {
      if (error) deps.getStatus().error = error;
      return true;
    }
    deps.getStatus().error = error || "No hay catálogo local ni remoto";
    return false;
  }

  function loadCatalog(): void {
    const config = deps.getConfig();
    if (!config.enabled) {
      return;
    }
    if (config.mode === "portal") {
      startPortal();
      return;
    }
    if (config.mode === "static") {
      fallback("bundled", null);
      return;
    }
    const url = resolveUrl("catalog");
    if (config.mode === "xuper" && !hasSession()) {
      deps.getStatus().error = "Falta la sesión TutyTV (userId, userToken y portalCode)";
      return;
    }
    if (!url) {
      if (config.useBundledCatalog) {
        fallback("bundled", null);
      } else {
        deps.getStatus().error = "Falta baseUrl/catalogUrl del catálogo autorizado";
      }
      return;
    }
    const status = deps.getStatus();
    status.loading = true;
    deps.requestDev(url, function catalogDone(error, response) {
      status.loading = false;
      const described = describeServiceError(response);
      if (error || described || !applyCatalog(extract(response), "api")) {
        const message = error || described || "La API no devolvió películas";
        if (!fallback("bundled-fallback", message)) {
          status.error = message;
        }
      }
    }, config.mode === "xuper" ? { method: "POST", body: buildParams("catalog") } : null);
  }

  function mergeDetail(item: CatalogItem, detail: unknown): CatalogItem {
    return mergeCatalogDetail(item, detail);
  }

  function loadDetail(item: CatalogItem | null, done?: (item: CatalogItem | null) => void): void {
    const finish = done || function finish() {};
    if (!item) {
      finish(null);
      return;
    }
    if (item._detailsLoaded) {
      finish(item);
      return;
    }
    if (item._detailLoading) {
      item._detailWait = (item._detailWait as Array<(value: CatalogItem) => void> | undefined) || [];
      (item._detailWait as Array<(value: CatalogItem) => void>).push(finish);
      return;
    }
    const config = deps.getConfig();
    if (config.mode === "portal" && item._portal) {
      item._detailLoading = true;
      item._detailWait = [finish];
      deps.request("detail", { contentId: item.id }, function detailDone(error, response) {
        item._detailLoading = false;
        const payload = isObject(response) ? response : null;
        if (!error && payload && payload.returnValue !== false && payload.item) {
          mergeDetail(item, payload.item);
          item.episodes = payload.episodes || [];
          item.seasons = Array.isArray(payload.seasons) && payload.seasons.length
            ? payload.seasons
            : (item._catalogSeasons as unknown[] | undefined) || [];
          if (!item.seasonId) item.seasonId = item.id;
          applySeasonFallback(item);
          resolveSeason(item);
          setDetailEpisode(item);
          deps.syncMediaInfo(item);
          item._detailsLoaded = true;
        }
        finishWaiters(item);
        callAfterDetail(item);
      });
      return;
    }
    const url = resolveUrl("detail");
    if (config.enabled && url && (config.mode !== "xuper" || hasSession())) {
      item._detailLoading = true;
      deps.requestDev(
        url.replace("{id}", encodeURIComponent(String(item.id))),
        function detailDone(error, response) {
          item._detailLoading = false;
          if (!error) {
            const extracted = extract(response);
            const first = extracted.length
              ? extracted[0]
              : isObject(response)
                ? (response.item || response.movie || response)
                : null;
            if (isObject(first)) {
              mergeDetail(item, first);
              item._detailsLoaded = true;
              callAfterDetail(item);
            }
          }
          finish(item);
        },
        config.mode === "xuper" ? { method: "POST", body: buildParams("detail", item.id) } : null
      );
      return;
    }
    finish(item);
  }

  function applySeasonFallback(item: CatalogItem): void {
    const seasons = item.seasons as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(seasons)) {
      seasons.sort(function byNumber(first, second) {
        return (parseInt(String(first.number), 10) || 0) - (parseInt(String(second.number), 10) || 0);
      });
    }
    if ((!seasons || !seasons.length) && similar(item)) {
      let number = 1;
      const match = /S(\d+)/i.exec(String(item.alias || "")) || /T(\d+)/i.exec(String(item.title || ""));
      if (match) number = parseInt(match[1] || "1", 10) || 1;
      item.seasons = [{ id: item.id, number }];
    }
  }

  function resolveSeason(item: CatalogItem): void {
    const seasons = item.seasons as Array<Record<string, unknown>> | undefined;
    if (!seasons || !seasons.length) {
      return;
    }
    const resolved = resolveDetailSeason(
      seasons as never,
      item.id,
      item.seasonId,
      String(item.title || item.alias || "")
    );
    deps.state.detailSeason = resolved.seasonIndex;
    if (resolved.seasonId) item.seasonId = resolved.seasonId;
  }

  function setDetailEpisode(item: CatalogItem): void {
    const episodes = item.episodes as unknown[] | undefined;
    if (episodes && episodes.length && !deps.state.detailEpisode) {
      deps.state.detailEpisode = episodes[0];
    }
  }

  function finishWaiters(item: CatalogItem): void {
    const waiters = (item._detailWait as Array<(value: CatalogItem) => void> | undefined) || [];
    item._detailWait = [];
    for (const waiter of waiters) {
      waiter(item);
    }
  }

  function callAfterDetail(item: CatalogItem): void {
    deps.afterDetailLoaded(item);
  }

  return {
    extract,
    resolveUrl,
    normalizeSession,
    hasSession,
    buildParams,
    similar,
    normalizeItem,
    applyCatalog,
    selectPage,
    bundledCatalog,
    applyPortal,
    refreshPortal,
    startPortal,
    fallback,
    loadCatalog,
    mergeDetail,
    loadDetail
  };
}
