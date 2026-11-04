import type { AppState } from "../../runtime/state";

export interface LiveCategoryItem {
  id?: string | number;
  name?: string;
  isAddon?: boolean;
  [key: string]: unknown;
}

export interface LiveCategoryNode {
  textContent?: string | null;
  classList: {
    add(name: string): void;
    remove(name: string): void;
  };
  appendChild(node: LiveCategoryNode): void;
  querySelector(selector: string): LiveCategoryNode | null;
  _cat?: LiveCategoryItem;
  _activate?: (() => void) | null;
}

export interface LiveCategoryHost {
  state: AppState;
  ensureOverlay(): LiveCategoryNode | null;
  ensureGrid(): LiveCategoryNode | null;
  ensureSubtitle(): LiveCategoryNode | null;
  getCategories(): LiveCategoryItem[];
  getSelectedCategory(): LiveCategoryItem | null;
  selectCategory(category: LiveCategoryItem, first?: () => void, complete?: () => void): void;
  el(tag: string, className?: string, text?: string): LiveCategoryNode;
  clear(node: LiveCategoryNode): void;
  focus(node: LiveCategoryNode | null): void;
  canFocus(node: LiveCategoryNode | null): boolean;
  firstFocus(root: LiveCategoryNode): LiveCategoryNode | null;
  getChannelPanel(): LiveCategoryNode | null;
  hideInfobar(): void;
  focusPlayer(): void;
  layoutSelectedCategory(): void;
  closeChannels(): void;
}

let host: LiveCategoryHost | null = null;

export function attachPlayerLiveCategories(next: LiveCategoryHost): boolean {
  host = next;
  return true;
}

export function hasPlayerLiveCategoriesRuntime(): boolean {
  return host !== null;
}

export function resetPlayerLiveCategoriesRuntime(): void {
  host = null;
}

export function openPlayerLiveCategories(): boolean {
  if (!host) {
    return false;
  }
  const overlay = host.ensureOverlay();
  const grid = host.ensureGrid();
  if (!overlay || !grid) {
    return false;
  }
  const state = host.state;
  state.categoryPickerOpen = true;
  overlay.classList.add("is-active");
  host.hideInfobar();
  const categories = host.getCategories();
  host.clear(grid);
  const sub = host.ensureSubtitle();
  if (sub) {
    sub.textContent = categories.length
      ? `${categories.length} categorías · elige una para filtrar los canales`
      : "Cargando categorías…";
  }
  const selected = host.getSelectedCategory();
  for (const category of categories) {
    const tile = host.el("div", "pcat-tile focusable");
    tile.appendChild(host.el("div", "pcat-name", category.name || ""));
    if (selected && selected.id === category.id) {
      tile.classList.add("is-selected");
    }
    tile._cat = category;
    tile._activate = function activateCategory() {
      host?.selectCategory(category);
      closePlayerLiveCategories(true);
      const pill = host?.getChannelPanel()?.querySelector(".pc-cat-pill.is-selected") || null;
      if (pill) {
        host?.focus(pill);
        host?.layoutSelectedCategory();
      } else {
        host?.closeChannels();
      }
    };
    grid.appendChild(tile);
  }
  const target = grid.querySelector(".pcat-tile.is-selected") || host.firstFocus(grid);
  if (target) {
    host.focus(target);
  }
  return true;
}

export function closePlayerLiveCategories(silent?: boolean): boolean {
  if (!host || !host.state.categoryPickerOpen) {
    return false;
  }
  const overlay = host.ensureOverlay();
  host.state.categoryPickerOpen = false;
  overlay?.classList.remove("is-active");
  if (!silent) {
    const pill = host.getChannelPanel()?.querySelector(".pc-cat-pill.is-selected") || null;
    if (pill) {
      host.focus(pill);
      host.layoutSelectedCategory();
    } else if (host.state.screen === "player") {
      host.focusPlayer();
    }
  }
  return true;
}

export function scrollPlayerLiveCategory(
  container: { scrollLeft: number; clientWidth: number } | null,
  target: { offsetLeft?: number; offsetWidth?: number } | null
): boolean {
  if (!container || !target) {
    return false;
  }
  const left = target.offsetLeft || 0;
  const width = target.offsetWidth || 0;
  const current = container.scrollLeft;
  const visible = container.clientWidth;
  if (left < current) {
    container.scrollLeft = left - 20;
  } else if (left + width > current + visible) {
    container.scrollLeft = left + width - visible + 20;
  }
  return true;
}
