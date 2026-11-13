import { buildEpisodeRanges } from "../../../core/usecases/catalog/catalogSelection";
import { findEpisodeIndex } from "../../../core/usecases/catalog/episodeNavigation";
import type { AppState } from "../../runtime/state";

export interface DetailEpisode {
  id?: string | number;
  number?: string | number;
  seriesNumber?: string | number;
  title?: string;
  name?: string;
  duration?: string;
  quality?: string;
  description?: string;
  synopsis?: string;
  picture?: string;
  still?: string;
  pictureFallback?: boolean;
  [key: string]: unknown;
}

export interface DetailSeason {
  id?: string;
  number?: string | number;
  _episodes?: DetailEpisode[];
  [key: string]: unknown;
}

export interface DetailItem {
  id?: string | number;
  title?: string;
  score?: string | number;
  country?: string;
  releaseDate?: string;
  tagline?: string;
  year?: string;
  duration?: string;
  alias?: string;
  updateCount?: string | number;
  volumeCount?: string | number;
  genres?: Array<string | number>;
  director?: string;
  actors?: string;
  synopsis?: string;
  poster?: string;
  landscape?: string;
  backdrop?: string;
  seasons?: DetailSeason[];
  episodes?: DetailEpisode[];
  seasonId?: string;
  [key: string]: unknown;
}

export interface DetailNode extends HTMLElement {
  _activate?: () => void;
  _onMove?: (direction: string) => boolean;
  _kind?: string;
  _ep?: DetailEpisode;
}

interface PosterOptions {
  gold?: boolean;
}

export interface DetailHost {
  state: AppState;
  getCatalog(): DetailItem[];
  isSeries(item: DetailItem): boolean;
  isFavorite(item: DetailItem): boolean;
  toggleFavorite(item: DetailItem): boolean;
  isReminderActive(item: DetailItem): boolean;
  toggleReminder(item: DetailItem): boolean;
  toast(message: string): void;
  openDetail(item: DetailItem): void;
  play(item: DetailItem, episode: DetailEpisode | null): void;
  playEpisode(item: DetailItem, episode: DetailEpisode): void;
  startPlayback(item: DetailItem, episode: DetailEpisode): void;
  openLanguage(item: DetailItem): void;
  isSmooth(item: DetailItem): boolean;
  toggleSmooth(item: DetailItem): boolean;
  loadSeason(item: DetailItem, seasonIndex: number, done: (ok?: boolean) => void): void;
  buildPoster(
    item: DetailItem,
    left: number,
    top: number,
    width: number,
    height: number,
    options?: PosterOptions
  ): DetailNode;
  byId(id: string): DetailNode | null;
  el(tag: string, className?: string, text?: string): DetailNode;
  text(value: string): Node;
  clear(element: DetailNode): void;
  place(element: DetailNode, left: number, top: number, width?: number, height?: number): DetailNode;
  focus(element: DetailNode | null): void;
}

let host: DetailHost | null = null;
let seasonPopup: DetailNode | null = null;
let settingsPopup: DetailNode | null = null;
let settingsAnchor: DetailNode | null = null;
let seasonLoadIndex: number | null = null;
let seasonLoadItem: DetailItem | null = null;
let seasonLoadSeq = 0;
let seasonEnterTimer: ReturnType<typeof setTimeout> | null = null;
let preserveRangeOnce = false;

const SYNOPSIS_CLOSED_LABEL = "Ver sinopsis";
const SYNOPSIS_OPEN_LABEL = "Ocultar sinopsis";

export function attachDetail(next: DetailHost): boolean {
  host = next;
  return true;
}

export function hasDetailRuntime(): boolean {
  return host !== null;
}

export function resetDetailRuntime(): void {
  host = null;
  seasonPopup = null;
  settingsPopup = null;
  settingsAnchor = null;
  seasonLoadIndex = null;
  seasonLoadItem = null;
  seasonLoadSeq += 1;
  preserveRangeOnce = false;
  if (seasonEnterTimer !== null) {
    clearTimeout(seasonEnterTimer);
    seasonEnterTimer = null;
  }
}

export function hasSeasonPopup(): boolean {
  return seasonPopup !== null;
}

export function hasSettingsPopup(): boolean {
  return settingsPopup !== null;
}

export function closeSeasonPopup(restoreFocus = true): boolean {
  if (!host) {
    return false;
  }
  const popup = seasonPopup;
  if (popup && popup.parentNode) {
    popup.parentNode.removeChild(popup);
  }
  seasonPopup = null;
  const bottom = host.byId("detail-bottom");
  const arrow = bottom?.querySelector(".season-arrow");
  arrow?.classList.remove("is-open");
  if (restoreFocus) {
    focusSeason();
  }
  return true;
}

export function closeSettingsPopup(focusAnchor = true): boolean {
  if (!host) {
    return false;
  }
  const popup = settingsPopup;
  if (popup && popup.parentNode) {
    popup.parentNode.removeChild(popup);
  }
  settingsPopup = null;
  const anchor = settingsAnchor;
  settingsAnchor = null;
  if (focusAnchor && anchor) {
    host.focus(anchor);
  }
  return true;
}

function currentEpisode(): DetailEpisode | null {
  return (host?.state.detailEpisode as DetailEpisode | null | undefined) || null;
}

export function syncDetailCurrentEpisode(item: DetailItem | null | undefined): boolean {
  if (!host || !item) {
    return false;
  }
  const episodes = item.episodes || [];
  if (findEpisodeIndex(episodes as never, currentEpisode()) < 0) {
    return false;
  }
  return renderDetail(item);
}

function episodeNumber(episode: DetailEpisode, index: number): string {
  return episode.number !== undefined && episode.number !== null
    ? String(episode.number)
    : String(index + 1);
}

function seasonLabel(item: DetailItem, index: number): string {
  let number = 0;
  if (item.seasons && item.seasons.length > 0) {
    const season = item.seasons[index] || item.seasons[0];
    number = season && season.number ? parseInt(String(season.number), 10) || 0 : index + 1;
  }
  if (!number) {
    const match = /S(\d+)/i.exec(item.alias || "") || /T(\d+)/i.exec(item.title || "");
    if (match) {
      number = parseInt(match[1] || "0", 10) || 0;
    }
  }
  return `Temporada ${number || 1}`;
}

function focusSeason(): void {
  const button = host?.byId("detail-bottom")?.querySelector(".detail-season");
  if (button) {
    host?.focus(button as DetailNode);
  }
}

function revealSeasonEntry(entry: DetailNode, popup: DetailNode, index: number): void {
  const itemTop = entry.offsetTop || index * 54;
  const itemHeight = entry.offsetHeight || 54;
  const viewHeight = popup.clientHeight || 0;
  if (!viewHeight) {
    return;
  }
  const viewTop = popup.scrollTop || 0;
  if (itemTop < viewTop) {
    popup.scrollTop = itemTop;
  } else if (itemTop + itemHeight > viewTop + viewHeight) {
    popup.scrollTop = itemTop + itemHeight - viewHeight;
  }
}

function focusSeasonEntry(entry: DetailNode, index: number): void {
  if (seasonPopup) {
    revealSeasonEntry(entry, seasonPopup, index);
  }
  host?.focus(entry);
}

function synopsisTextView(): DetailNode | null {
  const panel = host?.byId("detail-left")?.querySelector(".detail-synopsis") as DetailNode | null;
  return (panel?.querySelector(".text") as DetailNode | null) || null;
}

function scrollSynopsis(direction: string): boolean {
  const text = synopsisTextView();
  if (!text) {
    return false;
  }
  const max = Math.max(0, (text.scrollHeight || 0) - (text.clientHeight || 0));
  if (max <= 0) {
    return false;
  }
  const current = Math.max(0, text.scrollTop || 0);
  if (direction === "down") {
    if (current >= max) {
      return false;
    }
    text.scrollTop = Math.min(max, current + 90);
    return true;
  }
  if (direction === "up") {
    if (current <= 0) {
      return false;
    }
    text.scrollTop = Math.max(0, current - 90);
    return true;
  }
  return false;
}

function focusFirstRange(): boolean {
  const bottom = host?.byId("detail-bottom");
  const ranges = bottom?.querySelectorAll(".detail-range") || [];
  let target: DetailNode | null = null;
  for (let index = 0; index < ranges.length; index += 1) {
    const node = ranges[index] as DetailNode;
    if (node.classList.contains("is-selected")) {
      target = node;
      break;
    }
    if (!target) {
      target = node;
    }
  }
  if (target) {
    host?.focus(target);
    return true;
  }
  return false;
}

function focusSeasonSection(): boolean {
  const season = host?.byId("detail-bottom")?.querySelector(".detail-season");
  if (season) {
    host?.focus(season as DetailNode);
    return true;
  }
  return focusFirstRange();
}

function focusFirstEpisode(): boolean {
  const episode = host?.byId("detail-bottom")?.querySelector(".detail-episode");
  if (episode) {
    host?.focus(episode as DetailNode);
    return true;
  }
  return false;
}

function selectRange(item: DetailItem, index: number): void {
  if (!host) {
    return;
  }
  host.state.detailRange = index;
  preserveRangeOnce = true;
  try {
    renderDetail(item);
  } finally {
    preserveRangeOnce = false;
  }
  const bottom = host.byId("detail-bottom");
  if (!bottom) {
    return;
  }
  const ranges = bottom.querySelectorAll(".detail-range");
  for (let cursor = 0; cursor < ranges.length; cursor += 1) {
    const node = ranges[cursor] as DetailNode;
    if (node.classList.contains("is-selected")) {
      host.focus(node);
      return;
    }
  }
}

function openSeasonPopup(item: DetailItem, bottom: DetailNode, seasonButton: DetailNode): void {
  if (!host) {
    return;
  }
  if (seasonPopup) {
    closeSeasonPopup();
    return;
  }
  if (isSeasonLoading(item)) {
    focusSeason();
    return;
  }
  closeSettingsPopup(false);
  const seasons = item.seasons || [];
  if (seasons.length < 2) {
    return;
  }
  const arrow = seasonButton.querySelector(".season-arrow");
  arrow?.classList.add("is-open");
  const popup = host.el("div", "season-popup");
  host.place(popup, 236, 50, 280, Math.min(320, 54 * seasons.length));
  seasonPopup = popup;

  for (let index = 0; index < seasons.length; index += 1) {
    const season = seasons[index];
    const entry = host.el(
      "div",
      "season-popup-item focusable" + (index === host.state.detailSeason ? " is-selected" : "")
    );
    entry.appendChild(host.el("span", "season-item-text", `Temporada ${(season && season.number) || index + 1}`));
    const check = host.el("img", "season-item-check") as HTMLImageElement;
    check.src = "assets/original/vod/icon_nation_selected.png";
    check.alt = "";
    entry.appendChild(check);
    entry._onMove = function moveSeason(direction: string) {
      if (direction === "up" || direction === "down") {
        const nextIndex = direction === "up"
          ? Math.max(0, index - 1)
          : Math.min(seasons.length - 1, index + 1);
        const next = popup.children[nextIndex];
        if (next) {
          focusSeasonEntry(next as DetailNode, nextIndex);
        }
      }
      return true;
    };
    entry._activate = function activateSeason() {
      closeSeasonPopup();
      if (!host) {
        return;
      }
      if (host.state.detailSeason === index) {
        focusSeason();
        return;
      }
      const previousSeason = host.state.detailSeason;
      const previousRange = host.state.detailRange;
      const previousEpisode = host.state.detailEpisode;
      const previousRail = host.byId("detail-bottom")?.querySelector(".detail-episodes");
      const previousScroll = previousRail ? previousRail.scrollLeft || 0 : 0;
      host.state.detailSeason = index;
      host.state.detailRange = 0;
      host.state.detailEpisode = null;
      seasonLoadIndex = index;
      seasonLoadItem = item;
      const requestId = ++seasonLoadSeq;
      renderDetail(item);
      focusSeason();
      host.loadSeason(item, index, function seasonLoaded(ok?: boolean) {
        if (!host || requestId !== seasonLoadSeq) {
          return;
        }
        const visible = host.state.screen === "detail";
        const loaded = ok !== false;
        seasonLoadIndex = null;
        seasonLoadItem = null;
        if (!loaded) {
          host.state.detailSeason = previousSeason;
          host.state.detailRange = previousRange;
          host.state.detailEpisode = previousEpisode;
          renderDetail(item);
          const rail = host.byId("detail-bottom")?.querySelector(".detail-episodes");
          if (rail) {
            rail.scrollLeft = previousScroll;
          }
          if (visible) {
            focusSeason();
            host.toast("No se pudo cargar la temporada");
          }
          return;
        }
        renderDetail(item);
        revealEpisodes();
        if (visible) {
          focusSeason();
        }
      });
    };
    popup.appendChild(entry);
  }

  bottom.appendChild(popup);
  const selectedIndex = host.state.detailSeason >= 0 && host.state.detailSeason < seasons.length
    ? host.state.detailSeason
    : 0;
  const selected = popup.children[selectedIndex] || popup.children[0];
  if (selected) {
    focusSeasonEntry(selected as DetailNode, selectedIndex);
  }
}

function isSeasonLoading(item: DetailItem): boolean {
  return seasonLoadIndex !== null && seasonLoadItem === item;
}

function revealEpisodes(): void {
  const list = host?.byId("detail-bottom")?.querySelector(".detail-episodes");
  if (!list) {
    return;
  }
  list.classList.add("is-season-enter");
  if (seasonEnterTimer !== null) {
    clearTimeout(seasonEnterTimer);
  }
  seasonEnterTimer = setTimeout(function clearSeasonEnter() {
    list.classList.remove("is-season-enter");
    seasonEnterTimer = null;
  }, 240);
}

function openSettingsPopup(item: DetailItem, buttons: DetailNode, anchor: DetailNode): void {
  if (!host) {
    return;
  }
  if (settingsPopup) {
    closeSettingsPopup(true);
    return;
  }
  closeSeasonPopup(false);
  settingsAnchor = anchor;
  const popup = host.el("div", "detail-settings-popup");
  host.place(popup, 0, 62, 340, 196);
  popup.appendChild(host.el("div", "detail-settings-title", "Reproducción"));

  const language = host.el("div", "detail-setting-row focusable");
  language.appendChild(host.el("span", "detail-setting-label", "Idioma"));
  language.appendChild(host.el("span", "detail-setting-value", "Abrir ajuste"));
  language._activate = function activateLanguage() {
    closeSettingsPopup(true);
    host?.openLanguage(item);
  };
  popup.appendChild(language);

  const smooth = host.el("div", "detail-setting-row detail-setting-smooth");
  smooth.appendChild(host.el("span", "detail-setting-label", "Fluidez"));
  const options = host.el("div", "detail-setting-options");
  const normal = host.el("div", "detail-setting-option focusable", "Normal");
  const fluid = host.el("div", "detail-setting-option focusable", "Fluido");
  const refresh = function refreshSmooth() {
    if (!host) {
      return;
    }
    const active = host.isSmooth(item);
    normal.classList.toggle("is-selected", !active);
    fluid.classList.toggle("is-selected", active);
  };
  normal._activate = function activateNormal() {
    if (host?.isSmooth(item)) {
      host.toggleSmooth(item);
    }
    refresh();
  };
  fluid._activate = function activateFluid() {
    if (host && !host.isSmooth(item)) {
      host.toggleSmooth(item);
    }
    refresh();
  };
  refresh();
  options.appendChild(normal);
  options.appendChild(fluid);
  smooth.appendChild(options);
  popup.appendChild(smooth);
  popup.appendChild(host.el("div", "detail-setting-close", "BACK para cerrar"));

  language._onMove = function moveLanguage(direction: string) {
    if (direction === "down") {
      host?.focus(normal);
      return true;
    }
    return true;
  };
  normal._onMove = function moveNormal(direction: string) {
    if (direction === "up") {
      host?.focus(language);
      return true;
    }
    if (direction === "right") {
      host?.focus(fluid);
      return true;
    }
    return true;
  };
  fluid._onMove = function moveFluid(direction: string) {
    if (direction === "up") {
      host?.focus(language);
      return true;
    }
    if (direction === "left") {
      host?.focus(normal);
      return true;
    }
    return true;
  };

  buttons.appendChild(popup);
  settingsPopup = popup;
  host.focus(language);
}

export function renderDetail(item: DetailItem | null | undefined): boolean {
  if (!host || !item) {
    return false;
  }
  const left = host.byId("detail-left");
  const player = host.byId("detail-player");
  const buttons = host.byId("detail-buttons");
  const bottom = host.byId("detail-bottom");
  if (!left || !player || !buttons || !bottom) {
    return false;
  }

  host.clear(left);
  host.clear(buttons);
  host.clear(bottom);
  host.clear(player);
  host.byId("screen-detail")?.classList.remove("is-synopsis-open");
  seasonPopup = null;
  settingsPopup = null;
  settingsAnchor = null;
  if (!isSeasonLoading(item)) {
    if (seasonLoadItem !== null) {
      seasonLoadSeq += 1;
    }
    seasonLoadIndex = null;
    seasonLoadItem = null;
  }

  const backdropValue = typeof item.backdrop === "string" && item.backdrop
    ? item.backdrop.trim()
    : typeof item.landscape === "string" && item.landscape
      ? item.landscape.trim()
      : typeof item.poster === "string"
        ? item.poster.trim()
        : "";
  if (backdropValue) {
    const backdrop = host.el("div", "detail-backdrop");
    const image = host.el("img", "detail-backdrop-img") as HTMLImageElement;
    image.src = backdropValue;
    image.alt = "";
    backdrop.appendChild(image);
    left.appendChild(backdrop);
  }

  const posterValue = typeof item.poster === "string"
    ? item.poster.trim()
    : typeof item.landscape === "string"
      ? item.landscape.trim()
      : typeof item.backdrop === "string"
        ? item.backdrop.trim()
        : "";
  if (posterValue) {
    const poster = host.el("div", "detail-poster");
    host.place(poster, 80, 140, 230, 345);
    const image = host.el("img", "detail-poster-img") as HTMLImageElement;
    image.src = posterValue;
    image.alt = "";
    poster.appendChild(image);
    left.appendChild(poster);
  }

  const info = host.el("div", "detail-info");
  host.place(info, 350, 140, 680, 400);
  left.appendChild(info);

  const titleWrap = host.el("div", "detail-titlewrap");
  titleWrap.appendChild(host.el("div", "detail-title", item.title || ""));
  titleWrap.appendChild(
    host.el("div", "detail-score", item.score !== undefined && item.score !== null ? String(item.score) : "")
  );
  info.appendChild(titleWrap);

  let meta = "";
  if (item.country || item.releaseDate || item.tagline) {
    const parts: string[] = [];
    if (item.country) parts.push(item.country);
    if (item.releaseDate) parts.push(item.releaseDate);
    if (item.tagline) parts.push(item.tagline);
    meta = parts.join(" | ");
  } else {
    const parts: string[] = [];
    if (item.year && item.year !== "—") parts.push(item.year);
    if (item.duration && item.duration !== "—") parts.push(item.duration);
    parts.push("HD");
    meta = parts.join("  ·  ");
  }
  info.appendChild(host.el("div", "detail-meta", meta));

  if (host.isSeries(item)) {
    let number = 0;
    const match = /S(\d+)/i.exec(item.alias || "") || /T(\d+)/i.exec(item.title || "");
    if (match) {
      number = parseInt(match[1] || "0", 10) || 0;
    }
    if (!number && item.seasons && item.seasons.length) {
      const season = item.seasons[host.state.detailSeason] || item.seasons[0];
      number = (season && season.number ? parseInt(String(season.number), 10) : 0) || 1;
    }
    if (!number) {
      number = 1;
    }
    const count = item.updateCount || item.volumeCount || (item.episodes ? item.episodes.length : 0);
    if (count) {
      info.appendChild(host.el("div", "detail-update", `T${number} - E${String(count)}`));
    }
  }

  const genreValues = (item.genres || []).filter((genre) => genre !== undefined && genre !== null && String(genre).trim() !== "");
  if (genreValues.length) {
    const genres = host.el("div", "detail-genres");
    for (const genre of genreValues) {
      genres.appendChild(host.el("div", "chip", String(genre)));
    }
    info.appendChild(genres);
  }

  if (item.director) {
    const director = host.el("div", "detail-row");
    director.appendChild(host.text("Director : "));
    director.appendChild(host.el("span", "val", item.director));
    info.appendChild(director);
  }

  if (item.actors) {
    const actors = host.el("div", "detail-row");
    actors.appendChild(host.text("Reparto : "));
    actors.appendChild(host.el("span", "val", item.actors));
    info.appendChild(actors);
  }

  if (item.synopsis) {
    const synopsis = host.el("div", "detail-synopsis");
    synopsis.appendChild(host.el("div", "text", item.synopsis));
    const more = host.el("div", "detail-more focusable", SYNOPSIS_CLOSED_LABEL);
    more._activate = function activateSynopsis() {
      const detail = host?.byId("screen-detail");
      if (!detail) {
        return;
      }
      const open = !detail.classList.contains("is-synopsis-open");
      detail.classList.toggle("is-synopsis-open", open);
      more.textContent = open ? SYNOPSIS_OPEN_LABEL : SYNOPSIS_CLOSED_LABEL;
      if (open) {
        const text = synopsis.querySelector(".text") as DetailNode | null;
        if (text) {
          text.scrollTop = 0;
        }
      }
    };
    more._onMove = function moveSynopsis(direction: string) {
      const detail = host?.byId("screen-detail");
      if (detail?.classList.contains("is-synopsis-open") && (direction === "up" || direction === "down")) {
        return scrollSynopsis(direction);
      }
      return direction === "left" || direction === "right";
    };
    synopsis.appendChild(more);
    info.appendChild(synopsis);
  }

  player.classList.add("focusable");
  player._activate = function activatePlayer() {
    const episode = currentEpisode() || (host?.isSeries(item) ? (item.episodes && item.episodes[0]) || null : null);
    host?.play(item, episode);
  };
  player._onMove = function playerMove() {
    return false;
  };

  const actions = [
    { icon: "icon_detail_favorite.png", label: "Favorito", kind: "favorite" },
    { icon: "icon_detail_subscribe.png", label: "Recordatorios", kind: "subscribe" },
    { icon: "icon_detail_fullscreen.png", label: "Pantalla completa", kind: "fullscreen" },
    { icon: "icon_detail_quality.png", label: "Ajustes", kind: "settings" }
  ];

  for (const action of actions) {
    const button = host.el("div", "detail-btn focusable");
    const image = host.el("img") as HTMLImageElement;
    image.src = `assets/original/vod/${action.icon}`;
    image.alt = "";
    button.appendChild(image);
    button.appendChild(host.el("span", undefined, action.label));
    button._kind = action.kind;
    if (action.kind === "favorite" && host.isFavorite(item)) {
      button.classList.add("is-selected");
      const label = button.querySelector("span");
      if (label) {
        label.textContent = "En favoritos";
      }
    } else if (action.kind === "subscribe" && host.isReminderActive(item)) {
      button.classList.add("is-selected");
      const label = button.querySelector("span");
      if (label) {
        label.textContent = "En recordatorios";
      }
      image.src = "assets/original/vod/icon_detail_subscribed.png";
    }
    button._activate = function activateDetailButton() {
      if (!host) {
        return;
      }
      if (action.kind === "settings") {
        openSettingsPopup(item, buttons, button);
      } else if (action.kind === "fullscreen") {
        host.play(item, currentEpisode());
      } else if (action.kind === "favorite") {
        const active = host.toggleFavorite(item);
        button.classList.toggle("is-selected", active);
        const label = button.querySelector("span");
        if (label) {
          label.textContent = active ? "En favoritos" : "Favorito";
        }
      } else if (action.kind === "subscribe") {
        const active = host.toggleReminder(item);
        image.src = `assets/original/vod/icon_detail_${active ? "subscribed" : "subscribe"}.png`;
        button.classList.toggle("is-selected", active);
        const label = button.querySelector("span");
        if (label) {
          label.textContent = active ? "En recordatorios" : "Recordatorios";
        }
        host.toast(active ? "Recordatorio activado" : "Recordatorio eliminado");
      }
    };
    buttons.appendChild(button);
  }

  const series = host.isSeries(item);
  const loadingSeason = series && isSeasonLoading(item);
  const episodes = series && item.episodes ? item.episodes : [];
  const hasEpisodes = !loadingSeason && episodes.length > 0;
  const ranges = hasEpisodes ? buildEpisodeRanges(episodes.length) : [];
  const currentIndex = hasEpisodes ? findEpisodeIndex(episodes as never, currentEpisode()) : -1;
  if (hasEpisodes && currentIndex >= 0 && !preserveRangeOnce) {
    for (let index = 0; index < ranges.length; index += 1) {
      const range = ranges[index];
      if (range && currentIndex >= range.start && currentIndex < range.end) {
        host.state.detailRange = index;
        break;
      }
    }
  }
  if (host.state.detailRange >= ranges.length) {
    host.state.detailRange = 0;
  }
  const activeRange = hasEpisodes
    ? ranges[host.state.detailRange] || { start: 0, end: episodes.length }
    : { start: 0, end: 0 };

  if (series) {
    const head = host.el("div", "detail-episodes-head");
    host.place(head, 80, 0, 1760, 50);
    const heading = host.el("div", "detail-episodes-heading");
    heading.appendChild(host.el("div", "detail-episodes-title", "Episodios"));

    const seasonButton = host.el("div", "detail-season detail-season-inline focusable");
    seasonButton.appendChild(host.el("span", "season-text", seasonLabel(item, host.state.detailSeason)));
    const arrow = host.el("img", "season-arrow") as HTMLImageElement;
    arrow.src = "assets/original/vod/ic_down_icon.png";
    arrow.alt = "▼";
    seasonButton.appendChild(arrow);
    seasonButton._activate = function activateSeasons() {
      if (item.seasons && item.seasons.length >= 2) {
        openSeasonPopup(item, bottom, seasonButton);
      }
    };
    seasonButton._onMove = function moveSeasons(direction: string) {
      if (direction === "down") {
        return focusFirstRange() || focusFirstEpisode();
      }
      return false;
    };
    heading.appendChild(seasonButton);
    head.appendChild(heading);
    head.appendChild(
      host.el(
        "div",
        "detail-episodes-count",
        loadingSeason
          ? "Cargando episodios…"
          : `${Math.max(0, activeRange.end - activeRange.start)} de ${episodes.length} episodios`
      )
    );
    bottom.appendChild(head);
  }

  if (!loadingSeason && hasEpisodes && episodes.length > 20) {
    const rangeBar = host.el("div", "detail-ranges");
    host.place(rangeBar, 80, 54, 1760, 34);
    for (let index = 0; index < ranges.length; index += 1) {
      const range = ranges[index];
      if (!range) {
        continue;
      }
      const node = host.el(
        "div",
        "detail-range focusable" + (index === host.state.detailRange ? " is-selected" : ""),
        `${range.start + 1}-${range.end}`
      );
      host.place(node, 96 * index, 0, 88, 32);
      node._activate = function activateRange() {
        selectRange(item, index);
      };
      node._onMove = function moveRange(direction: string) {
        if (direction === "up") {
          const season = host?.byId("detail-bottom")?.querySelector(".detail-season");
          if (season) {
            host?.focus(season as DetailNode);
            return true;
          }
          return false;
        }
        if (direction === "down") {
          return focusFirstEpisode();
        }
        return false;
      };
      rangeBar.appendChild(node);
    }
    bottom.appendChild(rangeBar);
  }

  if (loadingSeason || hasEpisodes) {
    const episodeTop = episodes.length > 20 ? 96 : 54;
    const episodeList = host.el("div", "detail-episodes scrollable");
    host.place(episodeList, 80, episodeTop, 1760, 290);
    if (loadingSeason) {
      for (let offset = 0; offset < 6; offset += 1) {
        const card = host.el("div", "detail-episode detail-card is-skeleton");
        host.place(card, 8 + 292 * offset, 10, 280, 270);
        card.appendChild(host.el("div", "detail-card-thumb detail-skeleton-thumb"));
        const body = host.el("div", "detail-card-body");
        body.appendChild(host.el("div", "detail-skeleton-line detail-skeleton-title"));
        body.appendChild(host.el("div", "detail-skeleton-line detail-skeleton-meta"));
        body.appendChild(host.el("div", "detail-skeleton-line detail-skeleton-desc"));
        body.appendChild(host.el("div", "detail-skeleton-line detail-skeleton-desc short"));
        card.appendChild(body);
        episodeList.appendChild(card);
      }
    }
    for (let index = activeRange.start; index < activeRange.end; index += 1) {
      const episode = episodes[index];
      if (!episode) {
        continue;
      }
      const playing = currentIndex === index;
      const picture = typeof episode.picture === "string" ? episode.picture.trim() : "";
      const card = host.el(
        "div",
        "detail-episode detail-card focusable" + (playing ? " is-playing is-current" : "") + (picture ? " has-thumb" : "")
      );
      host.place(card, 8 + 292 * (index - activeRange.start), 10, 280, 270);

      const thumb = host.el("div", "detail-card-thumb");
      if (picture) {
        const image = host.el("img", "detail-card-img") as HTMLImageElement;
        image.src = picture;
        image.alt = "";
        thumb.appendChild(image);
      }
      thumb.appendChild(host.el("span", "detail-card-num", `E${episodeNumber(episode, index)}`));
      if (playing) {
        thumb.appendChild(host.el("span", "detail-card-current", "Viendo"));
      }
      card.appendChild(thumb);

      const body = host.el("div", "detail-card-body");
      body.appendChild(
        host.el("div", "detail-card-title", episode.title || episode.name || `Episodio ${episodeNumber(episode, index)}`)
      );
      const parts: string[] = [];
      if (episode.duration) parts.push(String(episode.duration));
      if (episode.quality) parts.push(String(episode.quality));
      body.appendChild(host.el("div", "detail-card-meta", parts.join(" · ") || "Episodio"));
      const description = episode.description || episode.synopsis || "";
      if (description) {
        body.appendChild(host.el("div", "detail-card-desc", description));
      }
      card.appendChild(body);

      card._ep = episode;
      card._activate = function activateEpisode() {
        host?.playEpisode(item, episode);
      };
      card._onMove = function moveEpisode(direction: string) {
        if (direction === "up") {
          return focusSeasonSection();
        }
        return false;
      };
      episodeList.appendChild(card);
    }
    bottom.appendChild(episodeList);
  }

  if (!series) {
    const relatedTitle = host.el("div", "detail-related", "Quizás te guste");
    host.place(relatedTitle, 80, 0, 400, 44);
    bottom.appendChild(relatedTitle);

    const relatedGrid = host.el("div", "detail-grid scrollable");
    host.place(relatedGrid, 80, 50, 1840, 290);
    const catalog = host.getCatalog();
    let itemIndex = parseInt(String(item.id || ""), 10);
    if (isNaN(itemIndex)) {
      itemIndex = 0;
      for (let index = 0; index < catalog.length; index += 1) {
        if (catalog[index] === item) {
          itemIndex = index;
          break;
        }
      }
    }
    const start = catalog.length ? (3 * itemIndex) % catalog.length : 0;
    const total = Math.min(6, catalog.length);
    for (let offset = 0; offset < total; offset += 1) {
      const related = catalog[(start + offset) % catalog.length];
      if (!related) {
        continue;
      }
      const card = host.el("div", "detail-rec-card detail-card focusable");
      host.place(card, 8 + 292 * offset, 10, 280, 270);

      const thumb = host.el("div", "detail-card-thumb");
      const imageValue = typeof related.landscape === "string" && related.landscape
        ? related.landscape
        : typeof related.backdrop === "string" && related.backdrop
          ? related.backdrop
          : typeof related.poster === "string"
            ? related.poster
            : "";
      if (imageValue) {
        const image = host.el("img", "detail-card-img") as HTMLImageElement;
        image.src = imageValue;
        image.alt = "";
        thumb.appendChild(image);
      }
      card.appendChild(thumb);

      const body = host.el("div", "detail-card-body");
      body.appendChild(host.el("div", "detail-card-title", related.title || ""));
      const parts: string[] = [];
      if (related.year) parts.push(String(related.year));
      if (related.genres && related.genres.length) parts.push(String(related.genres[0]));
      body.appendChild(host.el("div", "detail-card-meta", parts.join(" · ") || "TutyTV"));
      if (typeof related.synopsis === "string" && related.synopsis) {
        body.appendChild(host.el("div", "detail-card-desc", related.synopsis));
      }
      card.appendChild(body);
      card._activate = function activateRelated() {
        host?.openDetail(related);
      };
      relatedGrid.appendChild(card);
    }
    bottom.appendChild(relatedGrid);
  }

  return true;
}
