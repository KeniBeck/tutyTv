import type { AppState } from "../../runtime/state";

export interface HomeLiveNode {
  style: { right?: string };
  className?: string;
  id?: string;
  preload?: string;
  muted?: boolean;
  volume?: number;
  appendChild(node: HomeLiveNode): void;
  setAttribute(name: string, value: string): void;
  _label?: string;
  _channel?: number;
  _activate?: (() => void) | null;
  _onMove?: ((direction: string) => boolean) | null;
}

export interface HomeLiveChannel {
  name?: string;
  [key: string]: unknown;
}

export interface HomeLivePageHost {
  state: AppState;
  getChannels(): HomeLiveChannel[];
  getRows(): HomeLiveNode[];
  createVideo(): HomeLiveNode;
  el(tag: string, className?: string, text?: string): HomeLiveNode;
  focus(node: HomeLiveNode | null): void;
  canFocus(node: HomeLiveNode | null): boolean;
  openCategories(): void;
  toggleFavorites(): void;
  openSearch(): void;
  selectChannel(index: number, force?: boolean): void;
  openPlayer(): void;
  focusLive(): void;
  focusTab(): void;
}

export interface HomeLivePageRefs {
  video: HomeLiveNode;
  container: HomeLiveNode;
  status: HomeLiveNode;
  list: HomeLiveNode;
  channelLabel: HomeLiveNode;
  focus: HomeLiveNode;
  fastAll: HomeLiveNode;
  fastFav: HomeLiveNode;
  fastSearch: HomeLiveNode;
}

export function buildHomeLivePage(page: HomeLiveNode, host: HomeLivePageHost): HomeLivePageRefs {
  const video = host.createVideo();
  video.className = "live-preview-video";
  video.preload = "auto";
  video.muted = true;
  video.volume = 0;
  video.setAttribute("muted", "muted");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");

  const container = host.el("div", "live-main");
  container.appendChild(video);
  container.appendChild(host.el("div", "live-frame"));
  container.appendChild(host.el("div", "live-logo"));
  const status = host.el("div", "live-preview-status");
  container.appendChild(status);
  page.appendChild(container);

  const info = host.el("div", "live-info");
  const category = host.el("div", "live-category");
  category.id = "live-cat-label";
  info.appendChild(category);
  const channelLabel = host.el("div", "live-channel");
  channelLabel.style.right = "112.5px";
  info.appendChild(channelLabel);
  const openFullscreen = host.el("div", "live-fullscreen");
  openFullscreen._activate = function activateFullscreen() {
    host.openPlayer();
  };
  info.appendChild(openFullscreen);
  container.appendChild(info);

  page.appendChild(host.el("div", "live-arrow-up"));
  page.appendChild(host.el("div", "live-arrow-down"));
  const list = host.el("div", "live-list scrollable");
  page.appendChild(list);

  const fast = host.el("div", "live-fast live-fast-right");
  const fastList: HomeLiveNode[] = [];
  function fastButton(className: string, id: string, label: string): HomeLiveNode {
    const button = host.el("div", `fast-btn focusable ${className}`);
    button.id = id;
    button._label = label;
    fast.appendChild(button);
    fastList.push(button);
    return button;
  }
  function fastMove(index: number) {
    return function move(direction: string): boolean {
      if (direction === "left") {
        if (index > 0) {
          host.focus(fastList[index - 1] || null);
        }
        return true;
      }
      if (direction === "right") {
        if (index < fastList.length - 1) {
          host.focus(fastList[index + 1] || null);
        }
        return true;
      }
      if (direction === "up") {
        host.focusLive();
        return true;
      }
      if (direction === "down") {
        let row: HomeLiveNode | null = null;
        const rows = host.getRows();
        for (let i = 0; i < rows.length; i += 1) {
          if (rows[i]?._channel === host.state.channel) {
            row = rows[i] || null;
            break;
          }
        }
        if (!row && rows.length) {
          row = rows[0] || null;
        }
        if (row && host.canFocus(row)) {
          host.focus(row);
          return true;
        }
        return false;
      }
      return false;
    };
  }

  const fastAll = fastButton("f-all", "live-btn-all", "Categorías");
  const fastFav = fastButton("f-fav", "live-btn-fav", "Favoritos");
  const fastSearch = fastButton("f-srch", "live-btn-srch", "Buscar");
  fastAll._activate = function openCategories() {
    host.openCategories();
  };
  fastFav._activate = function toggleFavorites() {
    host.toggleFavorites();
  };
  fastSearch._activate = function openSearch() {
    host.openSearch();
  };
  fastAll._onMove = fastMove(0);
  fastFav._onMove = fastMove(1);
  fastSearch._onMove = fastMove(2);
  page.appendChild(fast);

  const focus = host.el("div", "live-focus focusable");
  focus._onMove = function moveLiveFocus(direction: string): boolean {
    if (direction === "up") {
      if (host.state.channel > 0) {
        host.selectChannel(host.state.channel - 1);
      }
      return true;
    }
    if (direction === "down") {
      if (host.state.channel < host.getChannels().length - 1) {
        host.selectChannel(host.state.channel + 1);
      }
      return true;
    }
    if (direction === "right") {
      const rows = host.getRows();
      let row: HomeLiveNode | null = null;
      for (let i = 0; i < rows.length; i += 1) {
        if (rows[i]?._channel === host.state.channel) {
          row = rows[i] || null;
          break;
        }
      }
      if (row) {
        host.focus(row);
      } else if (rows.length) {
        host.focus(rows[0] || null);
      } else {
        host.focus(fastAll);
      }
      return true;
    }
    if (direction === "left") {
      host.focusTab();
      return true;
    }
    return false;
  };
  focus._activate = function openPlayer() {
    host.openPlayer();
  };
  page.appendChild(focus);

  return { video, container, status, list, channelLabel, focus, fastAll, fastFav, fastSearch };
}
