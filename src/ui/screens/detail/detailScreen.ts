import { buildEpisodeRanges } from "../../../core/usecases/catalog/catalogSelection";
import type { AppState } from "../../runtime/state";

export interface DetailEpisode {
  id?: string | number;
  number?: string | number;
  seriesNumber?: string | number;
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
  play(item: DetailItem, episode: DetailEpisode | null): void;
  playEpisode(item: DetailItem, episode: DetailEpisode): void;
  startPlayback(item: DetailItem, episode: DetailEpisode): void;
  openLanguage(item: DetailItem): void;
  isSmooth(item: DetailItem): boolean;
  toggleSmooth(item: DetailItem): boolean;
  loadSeason(item: DetailItem, seasonIndex: number, done: () => void): void;
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
}

export function hasSeasonPopup(): boolean {
  return seasonPopup !== null;
}

export function closeSeasonPopup(): boolean {
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
  return true;
}

function currentEpisode(): DetailEpisode | null {
  return (host?.state.detailEpisode as DetailEpisode | null | undefined) || null;
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

function focusFirstRelated(): boolean {
  const grid = host?.byId("detail-bottom")?.querySelector(".detail-grid");
  const poster = grid?.querySelector(".poster");
  if (poster) {
    host?.focus(poster as DetailNode);
    return true;
  }
  return false;
}

function selectRange(item: DetailItem, index: number): void {
  if (!host) {
    return;
  }
  host.state.detailRange = index;
  renderDetail(item);
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
  const seasons = item.seasons || [];
  if (seasons.length < 2) {
    return;
  }
  const arrow = seasonButton.querySelector(".season-arrow");
  arrow?.classList.add("is-open");
  const popup = host.el("div", "season-popup");
  host.place(popup, 80, 100, 280, Math.min(320, 54 * seasons.length));
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
    entry._activate = function activateSeason() {
      closeSeasonPopup();
      if (host && host.state.detailSeason !== index) {
        host.state.detailSeason = index;
        host.state.detailRange = 0;
        host.state.detailEpisode = null;
        host.loadSeason(item, index, function seasonLoaded() {
          if (!host) {
            return;
          }
          renderDetail(item);
          const episode = currentEpisode();
          if (episode) {
            host.startPlayback(item, episode);
          }
          focusSeason();
        });
      } else {
        focusSeason();
      }
    };
    popup.appendChild(entry);
  }

  bottom.appendChild(popup);
  const selected = popup.children[host.state.detailSeason] || popup.children[0];
  if (selected) {
    host.focus(selected as DetailNode);
  }
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
  seasonPopup = null;

  const titleWrap = host.el("div", "detail-titlewrap");
  titleWrap.appendChild(host.el("div", "detail-title", item.title || ""));
  titleWrap.appendChild(
    host.el("div", "detail-score", item.score !== undefined && item.score !== null ? String(item.score) : "")
  );
  left.appendChild(titleWrap);

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
  left.appendChild(host.el("div", "detail-meta", meta));

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
      left.appendChild(host.el("div", "detail-update", `T${number} - E${String(count)}`));
    }
  }

  const genres = host.el("div", "detail-genres");
  genres.appendChild(host.el("span", "label", "Género : "));
  for (const genre of item.genres || []) {
    genres.appendChild(host.el("div", "chip", String(genre)));
  }
  left.appendChild(genres);

  const director = host.el("div", "detail-row");
  director.appendChild(host.text("Director : "));
  director.appendChild(host.el("span", "val", item.director || ""));
  left.appendChild(director);

  const actors = host.el("div", "detail-row");
  actors.appendChild(host.text("Actors : "));
  actors.appendChild(host.el("span", "val", item.actors || ""));
  left.appendChild(actors);

  const synopsis = host.el("div", "detail-synopsis");
  synopsis.appendChild(host.el("span", "label", "Sinopsis : "));
  synopsis.appendChild(host.el("div", "text", item.synopsis || ""));
  synopsis.appendChild(host.el("div", "detail-more", "Más"));
  left.appendChild(synopsis);

  player.classList.add("focusable");
  player._activate = function activatePlayer() {
    host?.play(item, currentEpisode());
  };
  player._onMove = function playerMove() {
    return false;
  };

  const actions = [
    { icon: "icon_detail_fullscreen.png", label: "Pantalla completa", kind: "fullscreen" },
    { icon: "icon_detail_subtitle_audio.png", label: "Idioma", kind: "language" },
    { icon: "icon_detail_favorite.png", label: "Favorito", kind: "favorite" },
    { icon: "icon_detail_subscribe.png", label: "Recordatorios", kind: "subscribe" }
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
      if (action.kind === "fullscreen") {
        host.play(item, currentEpisode());
      } else if (action.kind === "language") {
        host.openLanguage(item);
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

  const smooth = host.el("div", "detail-btn focusable");
  const smoothImage = host.el("img") as HTMLImageElement;
  smoothImage.src = "assets/original/vod/icon_detail_quality.png";
  smoothImage.alt = "";
  smooth.appendChild(smoothImage);
  const smoothLabel = host.el("span", undefined, host.isSmooth(item) ? "Modo fluido: Sí" : "Modo fluido: No");
  smooth.appendChild(smoothLabel);
  smooth._activate = function activateSmooth() {
    if (!host) {
      return;
    }
    const active = host.toggleSmooth(item);
    smoothLabel.textContent = active ? "Modo fluido: Sí" : "Modo fluido: No";
  };
  buttons.appendChild(smooth);

  const episodes = host.isSeries(item) && item.episodes ? item.episodes : [];
  const hasEpisodes = episodes.length > 0;
  const ranges = buildEpisodeRanges(episodes.length);
  if (host.state.detailRange >= ranges.length) {
    host.state.detailRange = 0;
  }

  if (host.isSeries(item)) {
    const seasonButton = host.el("div", "detail-season focusable");
    host.place(seasonButton, 80, 42, 280, 53);
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
    bottom.appendChild(seasonButton);
  }

  if (hasEpisodes && episodes.length > 20) {
    const rangeBar = host.el("div", "detail-ranges");
    host.place(rangeBar, 398, 51, 1522, 46);
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
      host.place(node, 160 * index, 0, 150, 46);
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

  if (hasEpisodes) {
    const activeRange = ranges[host.state.detailRange] || { start: 0, end: episodes.length };
    const episodeList = host.el("div", "detail-episodes scrollable");
    host.place(episodeList, 80, 149, 1840, 65);
    for (let index = activeRange.start; index < activeRange.end; index += 1) {
      const episode = episodes[index];
      if (!episode) {
        continue;
      }
      const playing = Boolean(
        currentEpisode() && (currentEpisode()?.id === episode.id || currentEpisode() === episode)
      );
      const node = host.el("div", "detail-episode focusable" + (playing ? " is-playing" : ""));
      host.place(node, 160 * (index - activeRange.start), 0, 150, 65);
      node.appendChild(host.el("span", "ep-num", episodeNumber(episode, index)));
      node._ep = episode;
      node._activate = function activateEpisode() {
        host?.playEpisode(item, episode);
      };
      node._onMove = function moveEpisode(direction: string) {
        if (direction === "up") {
          return focusSeasonSection();
        }
        if (direction === "down") {
          return focusFirstRelated();
        }
        return false;
      };
      episodeList.appendChild(node);
    }
    bottom.appendChild(episodeList);
  }

  const relatedY = hasEpisodes ? 240 : 25;
  const gridY = hasEpisodes ? 290 : 91;
  const relatedTitle = host.el("div", "detail-related", "Quizás te guste");
  host.place(relatedTitle, 80, relatedY, 400, 44);
  bottom.appendChild(relatedTitle);
  const relatedGrid = host.el("div", "detail-grid scrollable");
  host.place(relatedGrid, 72, gridY - 8, 1750, 388);

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
  const start = (3 * itemIndex) % Math.max(1, catalog.length - 6);
  for (let offset = 0; offset < 16; offset += 1) {
    const related = catalog[(start + offset) % catalog.length];
    if (related) {
      const cell = host.el("div", "cell");
      const poster = host.buildPoster(related, 0, 0, 210, 308, { gold: true });
      poster._onMove = function moveRelated(direction: string) {
        if (direction === "up" && hasEpisodes) {
          return focusFirstEpisode();
        }
        return false;
      };
      cell.appendChild(poster);
      cell.appendChild(host.el("div", "d-name", related.title || ""));
      relatedGrid.appendChild(cell);
    }
  }
  bottom.appendChild(relatedGrid);
  return true;
}
