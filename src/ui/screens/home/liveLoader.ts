import {
  normalizeLiveCategories,
  type LiveCategory,
  type LiveCategorySource
} from "../../../core/usecases/live/liveCategories";
import { selectNewLiveChannels } from "../../../core/usecases/live/liveChannels";
import { prepareAddonChannels } from "../../../core/usecases/live/liveLoading";
import type { AppState } from "../../runtime/state";

export interface LiveChannel {
  id?: string;
  name?: string;
  channelCode?: string;
  streamUrl?: string;
  fav?: boolean;
  [key: string]: unknown;
}

export interface LivePageResponse {
  channels?: LiveChannel[];
  hasMore?: boolean;
  returnValue?: boolean;
  [key: string]: unknown;
}

export interface LiveCategoryResponse {
  categories?: unknown[];
  returnValue?: boolean;
  [key: string]: unknown;
}

export interface LiveAddon {
  id?: string;
  name?: string;
  url: string;
  count?: number;
  [key: string]: unknown;
}

export interface LiveLoaderHost {
  state: AppState;
  getChannels(): LiveChannel[];
  getCategories(): LiveCategory[];
  getSelectedCategory(): LiveCategory | null;
  setSelectedCategory(category: LiveCategory | null): void;
  isFavorite(channel: LiveChannel): boolean;
  getAddons(): LiveAddon[];
  requestChannels(
    params: Record<string, unknown>,
    done: (error: unknown, response: LivePageResponse | null) => void
  ): void;
  requestCategories(
    done: (error: unknown, response: LiveCategoryResponse | null) => void
  ): void;
  requestM3u(
    url: string,
    done: (error: unknown, response: LivePageResponse | null) => void
  ): void;
  notify(message: string): void;
  renderList(favoritesOnly?: boolean): void;
  renderPlayerChannels(): void;
  refreshPlayerChannels(): void;
  playPlayerChannel(channel: LiveChannel, force: boolean): void;
  previewChannel(channel: LiveChannel): void;
  setChannelLabel(name: string): void;
  renderCategories(): void;
  updateCategoryLabel(): void;
}

let host: LiveLoaderHost | null = null;
let categoriesLoaded = false;
let channelsLoading = false;
let channelsLoaded = false;
let currentCategoryId: string | number | null = null;
let loadSequence = 0;

export function attachLiveLoader(next: LiveLoaderHost): boolean {
  host = next;
  return true;
}

export function hasLiveLoaderRuntime(): boolean {
  return host !== null;
}

export function resetLiveLoaderRuntime(): void {
  host = null;
  categoriesLoaded = false;
  channelsLoading = false;
  channelsLoaded = false;
  currentCategoryId = null;
  loadSequence += 1;
}

export function isLiveChannelsLoading(): boolean {
  return channelsLoading;
}

export function selectLiveCategory(
  category: LiveCategory | null | undefined,
  first?: () => void,
  complete?: () => void
): boolean {
  if (!host || !category) {
    return false;
  }
  host.setSelectedCategory(category);
  host.renderCategories();
  if (category.isAddon) {
    return loadLiveAddonChannels(function afterAddons() {
      if (first) {
        first();
      }
      if (complete) {
        complete();
      }
    });
  }
  return loadLiveChannels(category.id as string | number | undefined, first, complete);
}

export function loadLiveAddonChannels(done?: () => void): boolean {
  if (!host) {
    return false;
  }
  const addons = host.getAddons();
  const channels = host.getChannels();
  if (!addons.length) {
    channels.splice(0, channels.length);
    host.renderList();
    host.renderPlayerChannels();
    if (done) {
      done();
    }
    return true;
  }
  host.notify("Cargando canales de Addon…");
  const collected: LiveChannel[] = [];
  let remaining = addons.length;
  for (const addon of addons) {
    host.requestM3u(addon.url, function onM3u(error, response) {
      if (!error && response && response.channels && response.channels.length) {
        for (const channel of response.channels) {
          collected.push(channel);
        }
      }
      remaining -= 1;
      if (remaining <= 0 && host) {
        const ready = prepareAddonChannels(collected, host.isFavorite);
        host.notify("");
        channels.splice(0, channels.length);
        for (const channel of ready) {
          channels.push(channel);
        }
        host.state.channel = 0;
        host.renderList();
        host.renderPlayerChannels();
        if (channels[0]) {
          host.setChannelLabel(channels[0].name || "");
        }
        if (host.state.screen === "player" && host.state.playerMode === "live") {
          host.refreshPlayerChannels();
          if (channels[0]) {
            host.playPlayerChannel(channels[0], true);
          }
        }
        if (done) {
          done();
        }
      }
    });
  }
  return true;
}

export function loadLiveChannels(
  categoryId?: string | number | null,
  done?: (error: unknown, response: LivePageResponse | null) => void,
  complete?: () => void
): boolean {
  if (!host) {
    return false;
  }
  const id = categoryId || 76182;
  if (channelsLoading && currentCategoryId === id) {
    return false;
  }
  const sequence = ++loadSequence;
  currentCategoryId = id;
  channelsLoading = true;
  channelsLoaded = false;
  const channels = host.getChannels();
  channels.splice(0, channels.length);
  host.state.channel = 0;
  host.renderList();
  host.renderPlayerChannels();

  let page = 1;
  let categoriesRequested = false;

  function requestPage(): void {
    if (!host) {
      return;
    }
    host.requestChannels(
      { columnId: id, pageNum: page, pageSize: 20 },
      function onPage(error, response) {
        if (!host || sequence !== loadSequence) {
          return;
        }
        const list = response && response.channels ? response.channels : [];
        if (!error && list.length) {
          const fresh = selectNewLiveChannels(channels, list);
          for (const channel of fresh) {
            channel.fav = host.isFavorite(channel);
            channels.push(channel);
          }
          channelsLoaded = true;
          host.renderList();
          host.renderPlayerChannels();
          if (host.state.channel >= channels.length) {
            host.state.channel = 0;
          }
          const current = channels[host.state.channel];
          if (current) {
            host.setChannelLabel(current.name || "");
          }
          if (host.state.screen === "player" && host.state.playerMode === "live") {
            host.refreshPlayerChannels();
          } else if (current) {
            host.previewChannel(current);
          }
        }
        if (!categoriesRequested) {
          categoriesRequested = true;
          loadCategories();
        }
        if (done) {
          done(error, response);
        }
        if (!error && response && response.hasMore && list.length) {
          page += 1;
          setTimeout(requestPage, 25);
          return;
        }
        channelsLoading = false;
        if (!error && complete) {
          complete();
        }
        if (error && !channelsLoaded) {
          setTimeout(function retryLiveChannels() {
            loadLiveChannels(id, undefined, complete);
          }, 2500);
        }
      }
    );
  }

  requestPage();
  return true;
}

function loadCategories(): void {
  if (!host) {
    return;
  }
  if (categoriesLoaded && host.getCategories().length) {
    return;
  }
  host.requestCategories(function onCategories(error, response) {
    if (!host) {
      return;
    }
    const categories = normalizeLiveCategories(response && (response.categories as LiveCategorySource[]));
    const target = host.getCategories();
    target.splice(0, target.length);
    for (const category of categories) {
      target.push(category);
    }
    categoriesLoaded = true;
    if (!host.getSelectedCategory()) {
      host.setSelectedCategory(target[0] || null);
    }
    host.renderCategories();
    host.updateCategoryLabel();
    void error;
  });
}
