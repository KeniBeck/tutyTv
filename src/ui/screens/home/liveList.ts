import { clampLiveChannelIndex } from "../../../core/usecases/live/liveLoading";
import { liveListScrollTop } from "../../../core/usecases/live/liveFocus";
import type { AppState } from "../../runtime/state";

export interface LiveChannel {
  id?: string;
  name?: string;
  logo?: string;
  channelCode?: string;
  streamUrl?: string;
  fav?: boolean;
  isAddon?: boolean;
  [key: string]: unknown;
}

export interface LiveNode extends HTMLElement {
  _channel?: number;
  _favBtn?: LiveNode;
  _activate?: () => void;
  _onMove?: (direction: string) => boolean;
}

export interface LiveEntry {
  channel: LiveChannel;
  index: number;
}

export interface LiveListHost {
  state: AppState;
  getChannels(): LiveChannel[];
  getRows(): LiveNode[];
  getListContainer(): LiveNode | null;
  getChannelLabel(): LiveNode | null;
  getTabs(): Array<LiveNode | undefined>;
  getLiveFocus(): LiveNode | null;
  getFastAll(): LiveNode | null;
  isFavoritesOnly(): boolean;
  isLoading(): boolean;
  filterChannels(favoritesOnly: boolean): LiveEntry[];
  isFavorite(channel: LiveChannel): boolean;
  toggleFavorite(channel: LiveChannel): boolean;
  focus(element: LiveNode | null): void;
  focusLiveList(): void;
  canFocus(element: LiveNode | null): boolean;
  el(tag: string, className?: string, text?: string): LiveNode;
  clear(element: LiveNode): void;
  openPlayer(mode: string): void;
  isPlayerScreen(): boolean;
  isLiveMode(): boolean;
  isHomeLive(): boolean;
  canRefreshPlayerChannels(): boolean;
  refreshPlayerChannels(): void;
  playPlayerChannel(channel: LiveChannel, force: boolean): void;
  previewChannel(channel: LiveChannel): void;
  updateLabel(): void;
}

let host: LiveListHost | null = null;

export function attachLiveList(next: LiveListHost): boolean {
  host = next;
  return true;
}

export function hasLiveListRuntime(): boolean {
  return host !== null;
}

export function renderLiveList(favoritesOnlyOverride?: boolean): boolean {
  if (!host) {
    return false;
  }
  const runtime = host;
  const container = runtime.getListContainer();
  if (!container) {
    return true;
  }

  const rows = runtime.getRows();
  const state = runtime.state;
  const keepRow = Boolean(
    state.focus &&
      (state.focus as LiveNode)._channel !== undefined &&
      state.focus.parentNode === container
  );
  const keepChannel = keepRow ? (state.focus as LiveNode)._channel ?? -1 : -1;

  runtime.clear(container);
  rows.length = 0;

  const favoritesOnly = Boolean(favoritesOnlyOverride) || runtime.isFavoritesOnly();
  const entries = runtime.filterChannels(favoritesOnly);
  if (runtime.getChannels().length) {
    for (const entry of entries) {
      const channel = entry.channel;
      const index = entry.index;
      const row = runtime.el("div", "live-row focusable");
      row._channel = index;

      const icon = runtime.el("div", "row-icon");
      if (channel.logo) {
        icon.style.backgroundImage = `url(${channel.logo})`;
        icon.style.backgroundSize = "contain";
        icon.style.backgroundRepeat = "no-repeat";
        icon.style.backgroundPosition = "center";
      }

      const play = runtime.el("div", "row-play");
      const name = runtime.el("div", "row-name", channel.name || "");
      const rowIndex = rows.length;
      const favorite = runtime.el(
        "div",
        "live-row-fav focusable" + (runtime.isFavorite(channel) ? " is-fav" : ""),
        "♥"
      );
      favorite._channel = index;
      row._favBtn = favorite;
      favorite._activate = function activateFavorite() {
        runtime.toggleFavorite(channel);
        const isFavorite = runtime.isFavorite(channel);
        favorite.classList.toggle("is-fav", isFavorite);
        if (favoritesOnly && !isFavorite) {
          renderLiveList(true);
          let next: LiveNode | null = null;
          const nextRows = runtime.getRows();
          for (let cursor = 0; cursor < nextRows.length; cursor += 1) {
            const candidate = nextRows[cursor];
            if (candidate && (candidate._channel ?? -1) >= index) {
              next = candidate;
              break;
            }
          }
          next = next || nextRows[0] || null;
          if (next) {
            runtime.focus(next);
          } else {
            runtime.focusLiveList();
          }
        }
      };
      favorite._onMove = function moveFavorite(action: string) {
        if (action === "left") {
          runtime.focus(row);
          return true;
        }
        if (action === "up" || action === "down") {
          const nextRows = runtime.getRows();
          const target = nextRows[action === "up" ? rowIndex - 1 : rowIndex + 1];
          if (target && target._favBtn) {
            runtime.focus(target._favBtn);
          }
          return true;
        }
        return true;
      };

      row.appendChild(icon);
      row.appendChild(play);
      row.appendChild(name);
      row.appendChild(favorite);
      if (index === state.channel) {
        row.classList.add("is-current");
      }
      row._activate = function activateChannel() {
        selectLiveChannel(index, true);
        runtime.openPlayer("live");
      };
      row._onMove = function moveChannel(action: string) {
        if (action === "left") {
          const liveFocus = runtime.getLiveFocus();
          if (liveFocus) {
            runtime.focus(liveFocus);
          } else {
            runtime.focus(runtime.getTabs()[0] || null);
          }
          return true;
        }
        if (action === "right") {
          if (row._favBtn) {
            runtime.focus(row._favBtn);
            return true;
          }
          return false;
        }
        if (action === "up") {
          const nextRows = runtime.getRows();
          if (rowIndex > 0 && nextRows[rowIndex - 1]) {
            runtime.focus(nextRows[rowIndex - 1] || null);
            return true;
          }
          const fastAll = runtime.getFastAll();
          if (fastAll) {
            runtime.focus(fastAll);
            return true;
          }
          return false;
        }
        if (action === "down") {
          const nextRows = runtime.getRows();
          const target = nextRows[rowIndex + 1];
          if (target) {
            runtime.focus(target);
            return true;
          }
        }
        return false;
      };

      container.appendChild(row);
      rows.push(row);
    }

    if (!rows.length && favoritesOnly) {
      container.appendChild(runtime.el("div", "live-list-status", "No tienes canales favoritos en esta categoría"));
    }
    const currentChannel = runtime.getChannels()[state.channel];
    const label = runtime.getChannelLabel();
    if (currentChannel && label) {
      label.textContent = currentChannel.name || "";
    }
    scrollLiveList();
  } else {
    const message = runtime.isLoading()
      ? favoritesOnly
        ? "No tienes canales favoritos"
        : "No se encontraron canales"
      : "Cargando canales…";
    container.appendChild(runtime.el("div", "live-list-status", message));
  }

  if (keepRow && rows.length) {
    for (const row of rows) {
      if (row._channel === keepChannel) {
        runtime.focus(row);
        break;
      }
    }
  }
  runtime.updateLabel();
  return true;
}

export function scrollLiveList(): boolean {
  if (!host) {
    return false;
  }
  const runtime = host;
  const rows = runtime.getRows();
  if (!rows.length) {
    return true;
  }
  const current = rows.find((row) => row._channel === runtime.state.channel);
  const container = runtime.getListContainer();
  if (current && container) {
    container.scrollTop = liveListScrollTop(
      rows.indexOf(current),
      container.scrollTop,
      container.scrollHeight,
      container.clientHeight
    );
  }
  return true;
}

export function selectLiveChannel(index: number, force?: boolean): boolean {
  if (!host) {
    return false;
  }
  const runtime = host;
  const channels = runtime.getChannels();
  const selected = clampLiveChannelIndex(index, channels.length);
  runtime.state.channel = selected;
  const rows = runtime.getRows();
  for (const row of rows) {
    row.classList.toggle("is-current", row._channel === selected);
  }
  const channel = channels[selected];
  const label = runtime.getChannelLabel();
  if (channel && label) {
    label.textContent = channel.name || "";
  }
  scrollLiveList();
  if (runtime.isPlayerScreen()) {
    if (runtime.canRefreshPlayerChannels()) {
      runtime.refreshPlayerChannels();
    }
    if (runtime.isLiveMode() && channel) {
      runtime.playPlayerChannel(channel, Boolean(force));
    }
  } else if (runtime.isHomeLive() && channel) {
    runtime.previewChannel(channel);
  }
  return true;
}

export function clearLiveListRuntime(): void {
  host = null;
}
