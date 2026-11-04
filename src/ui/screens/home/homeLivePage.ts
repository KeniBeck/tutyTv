import type { AppState } from "../../runtime/state";

export interface HomeLiveNode {
  style: { right?: string; backgroundImage?: string; [key: string]: string | undefined };
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
  category?: string;
  fav?: boolean;
  [key: string]: unknown;
}

export interface HomeLiveCategory {
  name?: string;
  [key: string]: unknown;
}

export interface HomeLivePageHost {
  state: AppState;
  getChannels(): HomeLiveChannel[];
  getCategories?: (() => HomeLiveCategory[]) | undefined;
  getSelectedCategory?: (() => HomeLiveCategory | null) | undefined;
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

function hint(host: HomeLivePageHost, key: string, label: string): HomeLiveNode {
  const item = host.el("span", "hint-item");
  item.appendChild(host.el("span", "key", key));
  item.appendChild(host.el("span", "hint-label", label));
  return item;
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

  const container = host.el("div", "live-main live-preview");
  container.appendChild(video);
  const status = host.el("div", "live-preview-status");
  container.appendChild(status);

  const copy = host.el("div", "live-copy");
  copy.appendChild(host.el("div", "live-now", "Ahora en TV"));
  const channelLabel = host.el("div", "live-channel");
  channelLabel.style.right = "112.5px";
  copy.appendChild(channelLabel);
  const progress = host.el("div", "live-progress");
  const bar = host.el("div", "bar");
  bar.appendChild(host.el("i", ""));
  progress.appendChild(bar);
  const times = host.el("div", "times");
  times.appendChild(host.el("span", "", "Ahora"));
  times.appendChild(host.el("span", "", "TutyTV"));
  progress.appendChild(times);
  copy.appendChild(progress);

  const openFullscreen = host.el("div", "live-fullscreen");
  openFullscreen._activate = function activateFullscreen() {
    host.openPlayer();
  };
  copy.appendChild(openFullscreen);
  container.appendChild(copy);
  page.appendChild(container);

  const guide = host.el("div", "guide");
  guide.appendChild(host.el("div", "guide-icon", "EPG"));
  const guideMain = host.el("div", "guide-main");
  guideMain.appendChild(host.el("b", "", "Guía de programación"));
  guideMain.appendChild(host.el("span", "", "Selecciona un canal para ver la programación"));
  guide.appendChild(guideMain);
  page.appendChild(guide);

  const panel = host.el("div", "live-panel");
  const categories = host.getCategories ? host.getCategories() : [];
  const channels = host.getChannels();
  const favoriteCount = channels.filter(function countFavorites(channel) {
    return Boolean(channel.fav);
  }).length;
  const selectedCategory = host.getSelectedCategory ? host.getSelectedCategory() : null;
  const head = host.el("div", "live-head");
  const headCopy = host.el("div", "live-head-copy");
  headCopy.appendChild(host.el("h3", "live-head-title", "TV en vivo"));
  headCopy.appendChild(
    host.el(
      "p",
      "live-head-sub",
      String(categories.length || 1) +
        " categorías · " +
        String(channels.length) +
        " canales"
    )
  );
  head.appendChild(headCopy);
  const meta = host.el("div", "live-meta");
  meta.appendChild(host.el("div", "live-count", "Favoritos " + String(favoriteCount)));
  const categoryLabel = host.el(
    "div",
    "live-cat-current",
    selectedCategory && selectedCategory.name ? String(selectedCategory.name) : "Todos"
  );
  categoryLabel.id = "live-cat-label";
  meta.appendChild(categoryLabel);
  head.appendChild(meta);
  panel.appendChild(head);

  const actions = host.el("div", "live-actions");
  const fastList: HomeLiveNode[] = [];
  function fastButton(className: string, id: string, label: string): HomeLiveNode {
    const button = host.el("div", `fast-btn focusable ${className}`);
    button.appendChild(host.el("i", "fast-icon"));
    button.appendChild(host.el("span", "fast-label", label));
    button.id = id;
    button._label = label;
    actions.appendChild(button);
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
  panel.appendChild(actions);

  const list = host.el("div", "live-list scrollable");
  panel.appendChild(list);

  const foot = host.el("div", "panel-foot");
  foot.appendChild(hint(host, "OK", "Reproducir"));
  foot.appendChild(hint(host, "ARRIBA", "Categorías"));
  foot.appendChild(hint(host, "MENU", "Filtros"));
  panel.appendChild(foot);
  page.appendChild(panel);

  const liveHint = host.el("div", "live-hint");
  const liveHintLeft = host.el("div", "hint-group");
  liveHintLeft.appendChild(hint(host, "OK", "Reproducir"));
  liveHintLeft.appendChild(hint(host, "ARRIBA", "Categorías"));
  liveHintLeft.appendChild(hint(host, "BACK", "Volver"));
  liveHint.appendChild(liveHintLeft);
  liveHint.appendChild(host.el("div", "hint-note", "TV en vivo · TutyTV"));
  page.appendChild(liveHint);

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
