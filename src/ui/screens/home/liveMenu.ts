import { findLiveSearchMatches } from "../../../core/usecases/live/liveChannels";
import { normalizeText } from "../../../core/text/normalizeText";
import type { LiveChannel, LiveNode } from "./liveList";
import type { AppState } from "../../runtime/state";

export interface LiveCategory {
  id?: string | number;
  name: string;
  code?: string | number;
  isAddon?: boolean;
}

interface MenuNode extends LiveNode {
  _special?: string;
  _liveCat?: LiveCategory;
  _char?: string;
}

export interface LiveMenuHost {
  state: AppState;
  getCategories(): LiveCategory[];
  getSelectedCategory(): LiveCategory | null;
  getChannels(): LiveChannel[];
  getRows(): LiveNode[];
  getFastFav(): LiveNode | null;
  getFastAll(): LiveNode | null;
  getLiveFocus(): LiveNode | null;
  isFavoritesOnly(): boolean;
  setFavoritesOnly(value: boolean): void;
  byId(id: string): MenuNode | null;
  el(tag: string, className?: string, text?: string): MenuNode;
  clear(element: MenuNode): void;
  firstFocus(root: Element): MenuNode | null;
  canFocus(element: LiveNode | null): boolean;
  focus(element: LiveNode | null): void;
  renderList(favoritesOnly?: boolean): void;
  selectCategory(category: LiveCategory, first: () => void, complete?: () => void): void;
  selectChannel(index: number, force?: boolean): void;
  openPlayer(mode: string): void;
  updateLabel(): void;
}

const DEFAULT_CATEGORIES: LiveCategory[] = [
  { id: 76182, name: "Todos" },
  { id: 76206, name: "Deportes" },
  { id: 76205, name: "Cine y Series" },
  { id: 76188, name: "Colombia" },
  { id: 76191, name: "España" },
  { id: 76197, name: "México" }
];

let host: LiveMenuHost | null = null;
let searchEdit: MenuNode | null = null;
let searchBuilt = false;
let searchQuery = "";
let searchReturn: LiveNode | null = null;
let categoryReturn: LiveNode | null = null;

export function attachLiveMenu(next: LiveMenuHost): boolean {
  host = next;
  return true;
}

export function hasLiveMenuRuntime(): boolean {
  return host !== null;
}

function categoryName(): string {
  const selected = host?.getSelectedCategory();
  return selected && selected.name ? selected.name : "Todos";
}

function syncFavoriteButton(): void {
  if (!host) {
    return;
  }
  const button = host.getFastFav();
  button?.classList.toggle("is-active", host.isFavoritesOnly());
}

function focusList(): void {
  if (!host) {
    return;
  }
  const rows = host.getRows();
  let target: LiveNode | null = null;
  for (const row of rows) {
    if (row._channel === host.state.channel) {
      target = row;
      break;
    }
  }
  if (!target && rows.length) {
    target = rows[0] || null;
  }
  if (target && host.canFocus(target)) {
    host.focus(target);
    return;
  }
  const fastAll = host.getFastAll();
  if (fastAll && host.canFocus(fastAll)) {
    host.focus(fastAll);
    return;
  }
  const liveFocus = host.getLiveFocus();
  if (liveFocus && host.canFocus(liveFocus)) {
    host.focus(liveFocus);
  }
}

function buildCategories(): void {
  if (!host) {
    return;
  }
  const grid = host.byId("live-cat-grid");
  if (!grid) {
    return;
  }
  host.clear(grid);
  const sub = host.byId("live-cat-sub");
  const categories = host.getCategories().length ? host.getCategories() : DEFAULT_CATEGORIES;
  const close = host.byId("live-cat-close");
  if (sub) {
    sub.textContent = `${categories.length} categorías disponibles · elige una para cargar sus canales`;
  }
  if (close) {
    close._activate = function activateClose() {
      closeCategories();
    };
  }

  const favorite = host.el("div", "pcat-tile focusable");
  favorite.appendChild(host.el("div", "pcat-name", "❤ Favoritos"));
  favorite._special = "fav";
  if (host.isFavoritesOnly()) {
    favorite.classList.add("is-selected");
  }
  favorite._activate = function activateFavorites() {
    if (!host) {
      return;
    }
    host.setFavoritesOnly(true);
    syncFavoriteButton();
    closeCategories(true);
    host.renderList(true);
    host.updateLabel();
    focusList();
  };
  grid.appendChild(favorite);

  const search = host.el("div", "pcat-tile focusable");
  search.appendChild(host.el("div", "pcat-name", "🔍 Buscar canal o categoría"));
  search._special = "search";
  search._activate = function activateSearch() {
    closeCategories(true);
    openSearch();
  };
  grid.appendChild(search);

  const selected = host.getSelectedCategory();
  for (const category of categories) {
    const tile = host.el("div", "pcat-tile focusable");
    tile.appendChild(host.el("div", "pcat-name", category.name));
    if (selected && selected.id === category.id) {
      tile.classList.add("is-selected");
    }
    tile._liveCat = category;
    tile._activate = function activateCategory() {
      if (!host) {
        return;
      }
      host.setFavoritesOnly(false);
      syncFavoriteButton();
      closeCategories(true);
      const liveFocus = host.getLiveFocus();
      if (liveFocus) {
        host.focus(liveFocus);
      }
      const focusAtRequest = host.state.focus;
      host.selectCategory(category, function afterCategory() {
        if (!host) {
          return;
        }
        host.updateLabel();
        if (host.state.focus === focusAtRequest) {
          focusList();
        }
      });
    };
    grid.appendChild(tile);
  }
}

export function openCategories(): boolean {
  if (!host) {
    return false;
  }
  if (host.state.liveSearchOpen) {
    closeSearch(true);
  }
  host.state.liveCategoriesOpen = true;
  categoryReturn = host.state.focus as LiveNode | null;
  const panel = host.byId("live-categories");
  if (panel) {
    buildCategories();
    panel.classList.add("is-active");
    const selected = panel.querySelector(".pcat-tile.is-selected") as MenuNode | null;
    const first = selected || (panel.querySelector(".pcat-tile") as MenuNode | null) || host.firstFocus(panel);
    if (first) {
      host.focus(first);
    }
  }
  return true;
}

export function closeCategories(silent?: boolean): boolean {
  if (!host) {
    return false;
  }
  host.state.liveCategoriesOpen = false;
  const panel = host.byId("live-categories");
  panel?.classList.remove("is-active");
  if (!silent) {
    if (categoryReturn && host.canFocus(categoryReturn)) {
      host.focus(categoryReturn);
    } else {
      focusList();
    }
  }
  return true;
}

export function toggleFavorites(): boolean {
  if (!host) {
    return false;
  }
  host.setFavoritesOnly(!host.isFavoritesOnly());
  syncFavoriteButton();
  host.renderList(host.isFavoritesOnly());
  host.updateLabel();
  if (host.isFavoritesOnly() && !host.getRows().length) {
    const button = host.getFastFav();
    if (button) {
      host.focus(button);
    }
  } else {
    focusList();
  }
  return true;
}

function updateSearchEdit(): void {
  if (!searchEdit) {
    return;
  }
  if (searchQuery) {
    searchEdit.textContent = searchQuery;
    searchEdit.classList.remove("is-placeholder");
  } else {
    searchEdit.textContent = "Buscar canal o categoría…";
    searchEdit.classList.add("is-placeholder");
  }
}

function renderResults(): void {
  if (!host) {
    return;
  }
  const list = host.byId("live-search-list");
  if (!list) {
    return;
  }
  host.clear(list);
  const sub = host.byId("live-search-sub");
  const normalized = normalizeText(searchQuery);
  const categories = host.getCategories();
  const search = findLiveSearchMatches(host.getChannels(), categories, searchQuery);
  const categoryMatches = search.categories;
  const matches = search.channels;
  if (sub) {
    sub.textContent = normalized
      ? `${matches.length}${matches.length === 1 ? " canal" : " canales"} · ${categoryMatches.length}${categoryMatches.length === 1 ? " categoría" : " categorías"}`
      : `Escribe para filtrar los ${host.getChannels().length} canales de ${categoryName()} o busca otra categoría`;
  }

  for (const category of categoryMatches) {
    const row = host.el("div", "live-sr-row live-sr-cat focusable");
    row.appendChild(host.el("div", "live-sr-icon live-sr-icon-cat", "TV"));
    row.appendChild(host.el("div", "live-sr-name", `Categoría: ${category.name}`));
    row.appendChild(host.el("div", "live-sr-badge", "CATEGORÍA"));
    row._activate = function activateCategoryResult() {
      if (!host) {
        return;
      }
      host.setFavoritesOnly(false);
      syncFavoriteButton();
      searchQuery = "";
      updateSearchEdit();
      const focusAtRequest = host.state.focus;
      const focusResults = function focusResults() {
        if (!host) {
          return;
        }
        renderResults();
        host.updateLabel();
        if (host.state.focus !== focusAtRequest) {
          return;
        }
        const resultList = host.byId("live-search-list");
        const first = resultList
          ? (resultList.querySelector(".live-sr-row:not(.live-sr-cat)") as MenuNode | null) ||
            (resultList.querySelector(".live-sr-row") as MenuNode | null)
          : null;
        if (first) {
          host.focus(first);
        }
      };
      const selected = host.getSelectedCategory();
      if (selected && selected.id === category.id) {
        host.renderList(false);
        focusResults();
      } else {
        host.selectCategory(category, focusResults, focusResults);
      }
    };
    list.appendChild(row);
  }

  for (const match of matches) {
    const row = host.el("div", "live-sr-row focusable");
    const icon = host.el("div", "live-sr-icon");
    if (match.channel.logo) {
      icon.style.backgroundImage = `url(${match.channel.logo})`;
      icon.style.backgroundSize = "contain";
      icon.style.backgroundRepeat = "no-repeat";
      icon.style.backgroundPosition = "center";
    }
    row.appendChild(icon);
    row.appendChild(host.el("div", "live-sr-name", match.channel.name || "Canal"));
    row.appendChild(host.el("div", "live-sr-badge", "EN VIVO"));
    row._activate = function activateChannelResult() {
      if (!host) {
        return;
      }
      closeSearch(true);
      host.selectChannel(match.index, true);
      host.openPlayer("live");
    };
    list.appendChild(row);
  }

  if (!categoryMatches.length && !matches.length) {
    list.appendChild(host.el(
      "div",
      "live-sr-empty",
      normalized
        ? `No hay canales que coincidan con "${searchQuery}"`
        : "No hay canales en esta categoría"
    ));
  }
}

function typeCharacter(character: string): void {
  if (searchQuery.length < 40) {
    searchQuery += character;
    updateSearchEdit();
    renderResults();
  }
}

function backspace(): void {
  searchQuery = searchQuery.slice(0, -1);
  updateSearchEdit();
  renderResults();
}

function clearSearch(): void {
  searchQuery = "";
  updateSearchEdit();
  renderResults();
}

function searchGo(): void {
  if (!host) {
    return;
  }
  const list = host.byId("live-search-list");
  const first = list
    ? (list.querySelector(".live-sr-row:not(.live-sr-cat)") as MenuNode | null) ||
      (list.querySelector(".live-sr-row") as MenuNode | null)
    : null;
  if (first && host.canFocus(first)) {
    host.focus(first);
  }
}

function buildKeyboard(): void {
  if (!host) {
    return;
  }
  const keyboard = host.byId("live-search-kb");
  if (!keyboard) {
    return;
  }
  searchEdit = host.el("div", "kb-edit focusable");
  searchEdit._activate = function activateEdit() {};
  keyboard.appendChild(searchEdit);

  const actions = host.el("div", "kb-actions");
  const actionDefs = [
    { cls: "clear", width: 100.5 },
    { cls: "del", width: 100.5 },
    { cls: "go", width: 120 }
  ];
  for (const action of actionDefs) {
    const button = host.el("div", `kb-action focusable ${action.cls}`);
    button.style.width = `${action.width}px`;
    if (action.cls === "go") {
      button.textContent = "Buscar";
    } else {
      button.appendChild(host.el("div", "ico"));
    }
    button._activate = function activateAction() {
      if (action.cls === "clear") {
        clearSearch();
      } else if (action.cls === "del") {
        backspace();
      } else {
        searchGo();
      }
    };
    actions.appendChild(button);
  }
  keyboard.appendChild(actions);

  const rows = [
    ["A", "Á", "B", "C", "D", "E", "É"],
    ["F", "G", "H", "I", "Í", "J", "K"],
    ["L", "M", "N", "Ñ", "O", "Ó", "P"],
    ["Q", "R", "S", "T", "U", "Ú", "Ü"],
    ["V", "W", "X", "Y", "Z", " "],
    ["1", "2", "3", "4", "5", "6", "7"],
    ["8", "9", "0", "+", "-", "/", "."]
  ];
  for (let index = 0; index < rows.length; index += 1) {
    const row = host.el("div", "kb-row");
    row.style.top = `${264 + 88.5 * index}px`;
    for (const character of rows[index] || []) {
      const key = host.el(
        "div",
        "kb-key focusable" + (character === " " ? " space" : ""),
        character === " " ? "" : character
      );
      key._char = character;
      key._activate = function activateKey() {
        typeCharacter(character);
      };
      row.appendChild(key);
    }
    keyboard.appendChild(row);
  }

  const feedback = host.el("div", "kb-feedback focusable", "Cerrar búsqueda");
  feedback._activate = function activateFeedback() {
    closeSearch();
  };
  keyboard.appendChild(feedback);
}

export function openSearch(): boolean {
  if (!host) {
    return false;
  }
  if (host.state.liveCategoriesOpen) {
    closeCategories(true);
  }
  host.state.liveSearchOpen = true;
  searchReturn = host.state.focus as LiveNode | null;
  const panel = host.byId("live-search");
  if (panel) {
    if (!searchBuilt) {
      buildKeyboard();
      searchBuilt = true;
    }
    searchQuery = "";
    updateSearchEdit();
    renderResults();
    panel.classList.add("is-active");
    const first = (panel.querySelector(".kb-key") as MenuNode | null) || host.firstFocus(panel);
    if (first) {
      host.focus(first);
    }
  }
  return true;
}

export function closeSearch(silent?: boolean): boolean {
  if (!host) {
    return false;
  }
  host.state.liveSearchOpen = false;
  const panel = host.byId("live-search");
  panel?.classList.remove("is-active");
  if (!silent) {
    if (searchReturn && host.canFocus(searchReturn)) {
      host.focus(searchReturn);
    } else {
      focusList();
    }
  }
  return true;
}

export function syncFavorites(): boolean {
  syncFavoriteButton();
  return true;
}

export function focusLiveList(): boolean {
  focusList();
  return true;
}

export function resetLiveMenuRuntime(): void {
  host = null;
  searchEdit = null;
  searchBuilt = false;
  searchQuery = "";
  searchReturn = null;
  categoryReturn = null;
}
