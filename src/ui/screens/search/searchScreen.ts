import { filterMatches } from "../../../core/usecases/catalog/filterMatches";
import { combineSearchResults, findLocalSearchMatches } from "../../../core/usecases/catalog/catalogSearch";
import { normalizeText } from "../../../core/text/normalizeText";
import type { AppState } from "../../runtime/state";

export interface SearchItem {
  id?: string;
  title?: string;
  poster?: string;
  genres?: string[];
  category?: string;
  kind?: string;
  [key: string]: unknown;
}

export interface SearchNode extends HTMLElement {
  _activate?: () => void;
  _onMove?: (direction: string) => boolean;
  _char?: string;
  _kind?: string;
  _filterValue?: string;
  _filterLabel?: string;
}

interface SearchRemoteResponse {
  items?: unknown[];
  returnValue?: boolean;
}

export interface SearchHost {
  state: AppState;
  getCatalog(): SearchItem[];
  getHotSearches(): SearchItem[];
  isPortal(): boolean;
  searchRemote(query: string, done: (error: string | null, response: SearchRemoteResponse | null) => void): void;
  normalizeItem(item: unknown, index: number): SearchItem;
  buildPoster(item: SearchItem, left: number, top: number, width: number, height: number, options: { gold?: boolean }): SearchNode;
  byId(id: string): SearchNode | null;
  el(tag: string, className?: string, text?: string): SearchNode;
  clear(element: SearchNode): void;
  place(element: SearchNode, left: number, top: number, width?: number, height?: number): SearchNode;
  focus(element: SearchNode | null): void;
  canFocus(element: SearchNode | null): boolean;
  firstFocus(root: Element): SearchNode | null;
  showScreen(name: string): void;
  getAppRoot(): SearchNode;
  getNotify(): SearchNode | null;
}

const PAGE_SIZE = 10;
let host: SearchHost | null = null;
let keyboard: SearchNode | null = null;
let hot: SearchNode | null = null;
let results: SearchNode | null = null;
let empty: SearchNode | null = null;
let hotGrid: SearchNode | null = null;
let resultGrid: SearchNode | null = null;
let nav: SearchNode | null = null;
let edit: SearchNode | null = null;
let query = "";
let matches: SearchItem[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let sequence = 0;
let numeric = false;
let letterKeys: SearchNode[] = [];
let initialized = false;

export function attachSearch(next: SearchHost): boolean {
  host = next;
  return true;
}

export function hasSearchRuntime(): boolean {
  return host !== null;
}

function applyStyles(): void {
  if (!host) {
    return;
  }
  keyboard = host.byId("search-keyboard");
  hot = host.byId("search-hot");
  results = host.byId("search-results");
  empty = host.byId("search-empty");
  hotGrid = host.byId("search-hot-grid");
  resultGrid = host.byId("search-result-grid");
  nav = host.byId("search-nav");
}

function updateEdit(): void {
  if (!edit) {
    return;
  }
  if (query) {
    edit.textContent = query;
    edit.classList.remove("is-placeholder");
  } else {
    edit.textContent = "Buscar películas, series, directores y actores.";
    edit.classList.add("is-placeholder");
  }
}

function buildCell(item: SearchItem, index: number): SearchNode {
  if (!host) {
    return {} as SearchNode;
  }
  const cell = host.el("div", "search-cell");
  host.place(cell, (index % 5) * 246, 437 * Math.floor(index / 5), 246, 437);
  cell.appendChild(host.buildPoster(item, 0, 0, 222, 329, { gold: true }));
  cell.appendChild(host.el("div", "s-name", item.title || ""));
  return cell;
}

function renderPage(nextPage: number, focusIndex: number): void {
  if (!host || !resultGrid || !results || !empty || !nav || !hot) {
    return;
  }
  hot.classList.add("is-hidden");
  results.classList.add("is-active");
  const previousFocus = host.state.focus;
  const previousInResults = Boolean(previousFocus && previousFocus.closest(".search-results"));
  const previousPosters = previousInResults ? resultGrid.querySelectorAll(".poster.focusable") : [];
  let previousIndex = -1;
  for (let index = 0; index < previousPosters.length; index += 1) {
    if (previousPosters[index] === previousFocus) {
      previousIndex = index;
      break;
    }
  }
  host.clear(resultGrid);
  if (!matches.length) {
    empty.classList.add("is-active");
    nav.textContent = "";
    return;
  }
  empty.classList.remove("is-active");
  const totalPages = Math.ceil(matches.length / PAGE_SIZE);
  const current = Math.max(0, Math.min(totalPages - 1, nextPage || 0));
  const start = current * PAGE_SIZE;
  const end = Math.min(matches.length, start + PAGE_SIZE);
  nav.textContent = `Resultados ${start + 1}-${end} de ${matches.length}` + (totalPages > 1 ? `  ·  Página ${current + 1}/${totalPages}` : "");
  for (let index = start; index < end; index += 1) {
    const item = matches[index];
    if (!item) {
      continue;
    }
    const cellIndex = index - start;
    const cell = buildCell(host.normalizeItem(item, index + 1), cellIndex);
    const poster = cell.querySelector(".poster") as SearchNode | null;
    if (poster) {
      poster._onMove = function movePoster(direction: string) {
        if (direction === "down" && cellIndex >= 5 && end < matches.length) {
          renderPage(current + 1, cellIndex);
          return true;
        }
        if (direction === "up" && cellIndex < 5 && start > 0) {
          renderPage(current - 1, 5 + cellIndex);
          return true;
        }
        return false;
      };
    }
    resultGrid.appendChild(cell);
  }
  resultGrid.style.height = "874px";
  const targetIndex = focusIndex >= 0 ? focusIndex : previousIndex;
  if (targetIndex >= 0) {
    const posters = resultGrid.querySelectorAll(".poster.focusable");
    const target = (posters[targetIndex] as SearchNode | null) || host.firstFocus(resultGrid);
    if (target) {
      host.focus(target);
    }
  } else if (host.state.screen === "search" && (host.state.focus?.closest(".search-hot") || host.state.focus?.closest(".search-results"))) {
    const first = host.firstFocus(resultGrid);
    if (first) {
      host.focus(first);
    }
  }
}

function setMatches(nextMatches: SearchItem[]): void {
  matches = nextMatches || [];
  renderPage(0, -1);
}

function runSearch(): void {
  if (!host) {
    return;
  }
  const value = query || "";
  const normalized = normalizeText(value.trim());
  if (!normalized) {
    resetSearch();
    return;
  }
  const local = findLocalSearchMatches(host.getCatalog(), value);
  setMatches(local);
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (host.isPortal() && normalized.length >= 2) {
    const current = ++sequence;
    timer = setTimeout(function remoteSearch() {
      host?.searchRemote(value.trim(), function afterRemote(error, response) {
        if (current !== sequence || error || !response || response.returnValue === false || !response.items) {
          return;
        }
        if (response.items.length) {
          setMatches(combineSearchResults(local, response.items, function normalize(item, index) {
            return host?.normalizeItem(item, index) || {};
          }));
        }
      });
    }, 350);
  }
}

function buildKeyboard(): void {
  if (!host) {
    return;
  }
  applyStyles();
  if (!keyboard) {
    return;
  }
  host.clear(keyboard);
  edit = host.el("div", "kb-edit focusable");
  edit._activate = function activateEdit() {};
  keyboard.appendChild(edit);

  const actions = host.el("div", "kb-actions");
  const defs = [
    { cls: "switch", width: 100.5 },
    { cls: "clear", width: 100.5 },
    { cls: "del", width: 100.5 },
    { cls: "go", width: 120 }
  ];
  for (const action of defs) {
    const button = host.el("div", `kb-action focusable ${action.cls}`);
    button.style.width = `${action.width}px`;
    if (action.cls === "go") {
      button.textContent = "Busca";
    } else {
      button.appendChild(host.el("div", "ico"));
    }
    button._kind = action.cls;
    button._activate = function activateAction() {
      if (action.cls === "switch") {
        toggleNumeric();
      } else if (action.cls === "clear") {
        setSearchQuery("");
      } else if (action.cls === "del") {
        setSearchQuery(query.slice(0, -1));
      } else {
        goSearch();
      }
    };
    actions.appendChild(button);
  }
  keyboard.appendChild(actions);

  letterKeys = [];
  const rows = [
    ["A", "Á", "B", "C", "D", "E", "É"],
    ["F", "G", "H", "I", "Í", "J", "K"],
    ["L", "M", "N", "Ñ", "O", "Ó", "P"],
    ["Q", "R", "S", "T", "U", "Ú", "Ü"],
    ["V", "W", "X", "Y", "Z", " "]
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
        setSearchQuery(query + character);
      };
      row.appendChild(key);
      letterKeys.push(key);
    }
    keyboard.appendChild(row);
  }

  const feedback = host.el("div", "kb-feedback focusable", "Feedback");
  feedback._activate = function activateFeedback() {};
  keyboard.appendChild(feedback);

  if (!hotGrid) {
    return;
  }
  host.clear(hotGrid);
  const hotItems = host.getHotSearches();
  for (let index = 0; index < hotItems.length; index += 1) {
    const item = hotItems[index];
    if (item) {
      hotGrid.appendChild(buildCell(item, index));
    }
  }
  results?.classList.remove("is-active");
  empty?.classList.remove("is-active");
  host.byId("search-hot")?.classList.remove("is-hidden");
  updateEdit();
}

function ensureInitialized(): void {
  if (!initialized) {
    buildKeyboard();
    initialized = true;
  }
}

function toggleNumeric(): void {
  if (!host || !keyboard) {
    return;
  }
  numeric = !numeric;
  host.state.searchNumeric = numeric;
  const switchIcon = keyboard.querySelector(".kb-action.switch .ico") as SearchNode | null;
  if (switchIcon) {
    switchIcon.style.backgroundImage = `url(assets/original/search/${numeric ? "ic_vod_search_abc.png" : "ic_vod_search_123.png"})`;
  }
  const rows = keyboard.querySelectorAll(".kb-row:not(.kb-row-num)");
  if (numeric) {
    for (let index = 0; index < rows.length; index += 1) {
      rows[index]?.classList.add("hidden");
    }
    if (!keyboard.querySelector(".kb-row-num")) {
      const numRows = [
        ["1", "2", "3", "4", "5", "6", "7"],
        ["8", "9", "0", " "]
      ];
      for (let index = 0; index < numRows.length; index += 1) {
        const row = host.el("div", "kb-row kb-row-num");
        row.style.top = `${264 + 88.5 * index}px`;
        for (const character of numRows[index] || []) {
          const key = host.el("div", "kb-key focusable" + (character === " " ? " space" : ""), character === " " ? "" : character);
          key._activate = function activateNumeric() {
            setSearchQuery(query + character);
          };
          row.appendChild(key);
        }
        keyboard.appendChild(row);
      }
    }
    const numericRows = keyboard.querySelectorAll(".kb-row-num");
    for (let index = 0; index < numericRows.length; index += 1) {
      numericRows[index]?.classList.remove("hidden");
    }
  } else {
    for (let index = 0; index < rows.length; index += 1) {
      rows[index]?.classList.remove("hidden");
    }
    for (const key of letterKeys) {
      key.classList.remove("hidden");
    }
    const numericRows = keyboard.querySelectorAll(".kb-row-num");
    for (let index = 0; index < numericRows.length; index += 1) {
      numericRows[index]?.classList.add("hidden");
    }
  }
}

export function openSearchScreen(): boolean {
  if (!host) {
    return false;
  }
  ensureInitialized();
  const screen = host.byId("screen-search");
  screen?.classList.remove("is-filter-results");
  const searchKeyboard = host.byId("search-keyboard");
  const searchHot = host.byId("search-hot");
  if (searchKeyboard) {
    searchKeyboard.style.display = "";
  }
  if (searchHot) {
    searchHot.style.display = "";
  }
  host.showScreen("search");
  if (edit) {
    host.focus(edit);
  }
  return true;
}

export function setSearchQuery(nextQuery: string): boolean {
  query = nextQuery;
  if (host) {
    host.state.searchQuery = query;
  }
  updateEdit();
  runSearch();
  return true;
}

export function resetSearch(): boolean {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  query = "";
  if (host) {
    host.state.searchQuery = "";
  }
  updateEdit();
  if (resultGrid) {
    host?.clear(resultGrid);
  }
  matches = [];
  if (nav) {
    nav.textContent = "";
  }
  results?.classList.remove("is-active");
  empty?.classList.remove("is-active");
  hot?.classList.remove("is-hidden");
  return true;
}

export function runSearchAction(): boolean {
  runSearch();
  return true;
}

export function openFilterPanel(): boolean {
  if (!host || host.state.screen !== "home") {
    return false;
  }
  host.state.filterOpen = true;
  host.state.filterReturn = host.state.focus;
  const root = host.getAppRoot();
  let panel = host.byId("filter-panel");
  if (!panel) {
    panel = host.el("div", "filter-panel");
    panel.id = "filter-panel";
    root.appendChild(panel);
  }
  host.clear(panel);
  panel.classList.add("is-active");
  const head = host.el("div", "pcat-head");
  head.appendChild(host.el("div", "pcat-title", "Filtrar contenido"));
  head.appendChild(host.el("div", "pcat-sub", "Elige una categoría o género para ver solo esos títulos"));
  panel.appendChild(head);
  const close = host.el("div", "filter-close focusable", "Cerrar");
  close._activate = function activateClose() {
    closeFilterPanel();
  };
  panel.appendChild(close);
  const grid = host.el("div", "pcat-grid");
  panel.appendChild(grid);

  const values: Array<{ label: string; value: string }> = [
    { label: "Todos", value: "*" },
    { label: "Destacados", value: "cat:destacado" },
    { label: "Películas", value: "cat:pelicula" },
    { label: "Series", value: "cat:serie" },
    { label: "Gratis", value: "cat:gratis" },
    { label: "Infantil", value: "cat:infantil" },
    { label: "UHD", value: "cat:uhd" },
    { label: "Extra", value: "cat:extra" }
  ];
  const seen: Record<string, true> = {};
  for (const value of values) {
    seen[normalizeText(value.label)] = true;
  }
  const counts: Record<string, { name: string; count: number }> = {};
  const order: string[] = [];
  const catalog = host.getCatalog();
  for (const item of catalog) {
    for (const genre of item.genres || []) {
      if (!genre) {
        continue;
      }
      const key = normalizeText(genre);
      if (!counts[key]) {
        counts[key] = { name: genre, count: 0 };
        order.push(key);
      }
      counts[key]!.count += 1;
    }
  }
  order.sort((left, right) => (counts[right]?.count || 0) - (counts[left]?.count || 0));
  for (let index = 0; index < order.length && values.length < 34; index += 1) {
    const genre = counts[order[index] || ""];
    if (!genre || seen[normalizeText(genre.name)]) {
      continue;
    }
    seen[normalizeText(genre.name)] = true;
    values.push({ label: genre.name, value: `gen:${genre.name}` });
  }
  for (const value of values) {
    const tile = host.el("div", "pcat-tile focusable");
    tile.appendChild(host.el("div", "pcat-name", value.label));
    tile._filterValue = value.value;
    tile._filterLabel = value.label;
    tile._activate = function activateFilter() {
      applyFilter(value.label, value.value);
    };
    grid.appendChild(tile);
  }
  const first = (panel.querySelector(".pcat-tile") as SearchNode | null) || host.firstFocus(panel);
  if (first) {
    host.focus(first);
  }
  return true;
}

export function closeFilterPanel(): boolean {
  if (!host) {
    return false;
  }
  host.state.filterOpen = false;
  const panel = host.byId("filter-panel");
  panel?.classList.remove("is-active");
  const back = host.state.filterReturn as SearchNode | null;
  if (back && host.canFocus(back)) {
    host.focus(back);
  } else {
    const notify = host.getNotify();
    const first = notify ? host.firstFocus(notify) : null;
    if (first) {
      host.focus(first);
    }
  }
  return true;
}

export function applyFilter(label: string, value: string): boolean {
  if (!host) {
    return false;
  }
  host.state.filterOpen = false;
  const panel = host.byId("filter-panel");
  panel?.classList.remove("is-active");
  const items: SearchItem[] = [];
  for (const item of host.getCatalog()) {
    if (filterMatches(item, value)) {
      items.push(item);
    }
  }
  ensureInitialized();
  matches = items;
  const screen = host.byId("screen-search");
  screen?.classList.add("is-filter-results");
  const searchKeyboard = host.byId("search-keyboard");
  const searchHot = host.byId("search-hot");
  if (searchKeyboard) {
    searchKeyboard.style.display = "none";
  }
  if (searchHot) {
    searchHot.style.display = "none";
  }
  host.showScreen("search");
  renderPage(0, -1);
  if (nav) {
    nav.textContent = `Filtro: ${label} · ${items.length} títulos`;
  }
  const first = resultGrid ? host.firstFocus(resultGrid) : null;
  if (first) {
    host.focus(first);
  }
  return true;
}

export function goSearch(): boolean {
  if (!host) {
    return false;
  }
  const list = resultGrid;
  const first = list
    ? (list.querySelector(".poster.focusable") as SearchNode | null) || host.firstFocus(list)
    : null;
  if (first && host.canFocus(first)) {
    host.focus(first);
  }
  return true;
}

export function resetSearchRuntime(): void {
  host = null;
  keyboard = null;
  hot = null;
  results = null;
  empty = null;
  hotGrid = null;
  resultGrid = null;
  nav = null;
  edit = null;
  query = "";
  matches = [];
  if (timer) {
    clearTimeout(timer);
  }
  timer = null;
  sequence = 0;
  numeric = false;
  letterKeys = [];
  initialized = false;
}
