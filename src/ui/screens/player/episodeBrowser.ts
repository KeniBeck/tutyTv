import type { AppState } from "../../runtime/state";

export interface BrowserEpisode {
  id?: string | number;
  number?: string | number;
  duration?: unknown;
  quality?: string;
  description?: string;
  [key: string]: unknown;
}

export interface BrowserSeason {
  id?: string;
  number?: string | number;
  _episodes?: BrowserEpisode[];
  _item?: unknown;
  [key: string]: unknown;
}

export interface BrowserItem {
  id?: string | number;
  title?: string;
  seasonId?: string;
  episodes?: BrowserEpisode[];
  _detailsLoaded?: boolean;
  [key: string]: unknown;
}

export interface BrowserNode {
  textContent?: string | null;
  style: {
    display: string;
  };
  classList: {
    add(name: string): void;
    remove(name: string): void;
    toggle(name: string, force?: boolean): void;
  };
  _onFocus?: (() => void) | null;
  _activate?: (() => void) | null;
  appendChild(node: BrowserNode): void;
}

export interface EpisodeBrowserHost {
  state: AppState;
  isSeries(item: BrowserItem): boolean;
  ensureDom(): BrowserNode | null;
  getOverlay(): BrowserNode | null;
  getTitle(): BrowserNode | null;
  getSubtitle(): BrowserNode | null;
  getSeasonLabel(): BrowserNode | null;
  getSeasonsContainer(): BrowserNode | null;
  getEpisodesContainer(): BrowserNode | null;
  el(tag: string, className?: string, text?: string): BrowserNode;
  clear(node: BrowserNode): void;
  focus(node: BrowserNode): void;
  firstFocus(node: BrowserNode): BrowserNode | null;
  querySelector(root: BrowserNode, selector: string): BrowserNode | null;
  querySelectorAll(root: BrowserNode, selector: string): ArrayLike<BrowserNode>;
  getSeasons(item: BrowserItem): BrowserSeason[];
  loadSeasonEpisodes(
    item: BrowserItem,
    season: BrowserSeason,
    done: (episodes: BrowserEpisode[], detail: unknown) => void
  ): void;
  formatEpisode(item: BrowserItem, episode: BrowserEpisode, index?: number): string;
  formatDuration(episode: BrowserEpisode): string;
  loadDetail(item: BrowserItem, done: () => void): void;
  notify(message: string): void;
  hideInfobar(): void;
  closePlaySettingsIfOpen(): void;
  focusPlayer(): void;
  isFocusWithin?(id: string): boolean;
  playEpisode(item: BrowserItem, episode: BrowserEpisode): void;
}

let host: EpisodeBrowserHost | null = null;

export function attachEpisodeBrowser(next: EpisodeBrowserHost): boolean {
  host = next;
  return true;
}

export function hasEpisodeBrowserRuntime(): boolean {
  return host !== null;
}

export function resetEpisodeBrowserRuntime(): void {
  host = null;
}

export function openEpisodeBrowser(): boolean {
  if (!host) {
    return false;
  }
  const state = host.state;
  const item = state.playerItem as BrowserItem | null;
  if (!item || !host.isSeries(item)) {
    return false;
  }
  host.closePlaySettingsIfOpen();
  const overlay = host.ensureDom();
  if (!overlay) {
    return false;
  }
  if (!(item.episodes && item.episodes.length) && !item._detailsLoaded) {
    host.notify("Cargando capítulos…");
    host.loadDetail(item, () => {
      if (host && host.state.screen === "player") {
        const current = host.state.playerItem as BrowserItem | null;
        if (current && !host.state.playerEpisode && current.episodes && current.episodes.length) {
          host.state.playerEpisode = current.episodes[0];
          host.state.detailEpisode = current.episodes[0];
        }
        openEpisodeBrowser();
      }
    });
    return true;
  }
  if (!state.playerEpisode && item.episodes && item.episodes.length) {
    state.playerEpisode = item.episodes[0];
    state.detailEpisode = item.episodes[0];
    state.playerSeasonIndex = state.detailSeason || 0;
  }
  state.episodeBrowserOpen = true;
  state.browserSeason = Number(state.playerSeasonIndex) || 0;
  overlay.classList.add("is-active");
  host.hideInfobar();
  renderBrowser();
  const episodes = host.getEpisodesContainer();
  const seasonsContainer = host.getSeasonsContainer();
  const current = episodes && host.querySelector(episodes, ".pe-ep.is-current");
  const focusNode = current
    || (episodes && host.firstFocus(episodes))
    || (seasonsContainer && host.firstFocus(seasonsContainer));
  if (focusNode) {
    host.focus(focusNode);
  }
  return true;
}

export function closeEpisodeBrowser(restoreFocus = false): boolean {
  if (!host) {
    return false;
  }
  const overlay = host.getOverlay();
  if (!overlay || !host.state.episodeBrowserOpen) {
    return false;
  }
  host.state.episodeBrowserOpen = false;
  overlay.classList.remove("is-active");
  if (!restoreFocus && host.state.screen === "player") {
    host.focusPlayer();
  }
  return true;
}

export function selectBrowserSeason(index: number, focusEpisodes: boolean): boolean {
  if (!host) {
    return false;
  }
  const state = host.state;
  const item = state.playerItem as BrowserItem | null;
  if (!item) {
    return false;
  }
  const seasons = host.getSeasons(item);
  const season = seasons[index];
  if (!season) {
    return false;
  }
  state.browserSeason = index;
  const seasonsContainer = host.getSeasonsContainer();
  if (seasonsContainer) {
    const nodes = host.querySelectorAll(seasonsContainer, ".pe-season");
    for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += 1) {
      nodes[nodeIndex]?.classList.toggle("is-selected", nodeIndex === index);
    }
  }
  const label = host.getSeasonLabel();
  if (label) {
    label.textContent = `Episodios · Temporada ${season.number || index + 1}`;
  }
  renderEpisodeList(item, season);
  if (focusEpisodes) {
    const episodes = host.getEpisodesContainer();
    const target = episodes && host.querySelector(episodes, ".pe-ep.is-current");
    const fallback = episodes && host.firstFocus(episodes);
    const node = target || fallback;
    if (node) {
      host.focus(node);
    }
  }
  return true;
}

export function playBrowserEpisode(episode: BrowserEpisode | null): boolean {
  if (!host) {
    return false;
  }
  return playEpisodeAtIndex(episode, Number(host.state.browserSeason) || 0);
}

export function playEpisodeSelection(
  episode: BrowserEpisode | null,
  seasonIndex: number
): boolean {
  return playEpisodeAtIndex(episode, Number(seasonIndex) || 0);
}

function playEpisodeAtIndex(episode: BrowserEpisode | null, index: number): boolean {
  if (!host || !episode) {
    return false;
  }
  const state = host.state;
  const item = state.playerItem as BrowserItem | null;
  if (!item) {
    return false;
  }
  const seasons = host.getSeasons(item);
  const active = seasons[Number(state.playerSeasonIndex) || 0];
  if (active && active.id === (item.seasonId || item.id) && item.episodes && item.episodes.length) {
    active._episodes = item.episodes;
  }
  const season = seasons[index];
  if (season) {
    if (state.detailSeason !== index) {
      state.detailNeedsRebuild = true;
    }
    state.detailSeason = index;
    state.playerSeasonIndex = index;
    if (season.id) {
      item.seasonId = season.id;
    }
    if (season._episodes) {
      item.episodes = season._episodes;
    }
  }
  closeEpisodeBrowser(false);
  host.closePlaySettingsIfOpen();
  host.playEpisode(item, episode);
  return true;
}

function renderBrowser(): void {
  if (!host) {
    return;
  }
  const state = host.state;
  const item = state.playerItem as BrowserItem | null;
  if (!item) {
    return;
  }
  const seasons = host.getSeasons(item);
  if (state.browserSeason >= seasons.length) {
    state.browserSeason = 0;
  }
  if (state.browserSeason < 0) {
    state.browserSeason = 0;
  }
  const selectedSeason = seasons[state.browserSeason];
  const playingSeason = seasons[Number(state.playerSeasonIndex) || 0] || seasons[0];
  const episode = state.playerEpisode as BrowserEpisode | null;

  const title = host.getTitle();
  if (title) {
    title.textContent = item.title || "";
  }
  const subtitle = host.getSubtitle();
  if (subtitle) {
    if (episode) {
      const parts: string[] = [];
      if (playingSeason && playingSeason.number) {
        parts.push(`T${playingSeason.number}`);
      }
      if (episode.number) {
        parts.push(`E${episode.number}`);
      }
      subtitle.textContent = `Reproduciendo ${parts.join(" ")} · ${host.formatEpisode(item, episode)}`;
    } else {
      subtitle.textContent = "Elige un episodio";
    }
  }
  const label = host.getSeasonLabel();
  if (label) {
    label.textContent = `Episodios · Temporada ${(selectedSeason && selectedSeason.number) || state.browserSeason + 1}`;
  }
  renderSeasonList(seasons);
  if (selectedSeason) {
    renderEpisodeList(item, selectedSeason);
  }
}

function renderSeasonList(seasons: BrowserSeason[]): void {
  if (!host) {
    return;
  }
  const container = host.getSeasonsContainer();
  if (!container) {
    return;
  }
  host.clear(container);
  container.style.display = "flex";
  const state = host.state;
  for (let index = 0; index < seasons.length; index += 1) {
    const season = seasons[index];
    const node = host.el(
      "div",
      "pe-season focusable",
      `Temporada ${(season && season.number) || index + 1}`
    );
    if (index === state.browserSeason) {
      node.classList.add("is-selected");
    }
    node._onFocus = function onSeasonFocus() {
      if (state.browserSeason !== index) {
        selectBrowserSeason(index, false);
      }
    };
    node._activate = function onSeasonActivate() {
      selectBrowserSeason(index, true);
    };
    container.appendChild(node);
  }
}

function renderEpisodeList(item: BrowserItem, season: BrowserSeason): void {
  if (!host) {
    return;
  }
  const container = host.getEpisodesContainer();
  if (!container) {
    return;
  }
  host.clear(container);
  const episodes = seasonEpisodes(item, season);
  if (!episodes.length) {
    container.appendChild(host.el("div", "pe-loading", "Cargando episodios…"));
    host.loadSeasonEpisodes(item, season, () => {
      if (!host || !host.state.episodeBrowserOpen) {
        return;
      }
      const active = host.getSeasons(host.state.playerItem as BrowserItem)[host.state.browserSeason];
      if (active !== season) {
        return;
      }
      renderEpisodeList(item, season);
      if (host.isFocusWithin && !host.isFocusWithin("pe-episodes")) {
        return;
      }
      const target = host.querySelector(container, ".pe-ep.is-current") || host.firstFocus(container);
      if (target) {
        host.focus(target);
      }
    });
    return;
  }
  const limit = Math.min(episodes.length, 24);
  for (let index = 0; index < limit; index += 1) {
    const episode = episodes[index] as BrowserEpisode;
    const node = host.el("div", "pe-ep focusable");
    const number = episode.number !== undefined && episode.number !== null ? episode.number : index + 1;
    node.appendChild(host.el("div", "pe-num", String(number)));
    const thumb = host.el("div", "pe-thumb");
    thumb.appendChild(host.el("div", "pe-thumb-play", "▶"));
    node.appendChild(thumb);
    const info = host.el("div", "pe-info");
    info.appendChild(host.el("div", "pe-name", host.formatEpisode(item, episode, index)));
    const meta: string[] = [];
    const duration = host.formatDuration(episode);
    if (duration) {
      meta.push(duration);
    }
    if (episode.quality) {
      meta.push(String(episode.quality).split(",")[0]?.toUpperCase() || "");
    }
    info.appendChild(host.el("div", "pe-meta", meta.join("   ·   ")));
    if (episode.description) {
      info.appendChild(host.el("div", "pe-desc", episode.description));
    }
    node.appendChild(info);
    const current = host.state.playerEpisode as BrowserEpisode | null;
    const isCurrent = Boolean(
      current &&
        (current.id === episode.id ||
          (current.number !== undefined && current.number === episode.number))
    );
    node.appendChild(host.el("div", "pe-badge", "▶ REPRODUCIENDO"));
    if (isCurrent) {
      node.classList.add("is-current");
    }
    node._activate = function playEpisode() {
      playBrowserEpisode(episode);
    };
    container.appendChild(node);
  }
  if (episodes.length > limit) {
    container.appendChild(
      host.el("div", "pe-loading", `Mostrando los primeros ${limit} capítulos`)
    );
  }
}

function seasonEpisodes(item: BrowserItem, season: BrowserSeason): BrowserEpisode[] {
  if (
    season.id === (item.seasonId || item.id) &&
    item.episodes &&
    item.episodes.length
  ) {
    return item.episodes;
  }
  return season._episodes || [];
}
