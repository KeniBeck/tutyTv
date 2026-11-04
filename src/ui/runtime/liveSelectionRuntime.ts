import type { AppState } from "./state";

export interface LiveSelectionChannel {
  name?: string;
  [key: string]: unknown;
}

export interface LiveSelectionRow {
  classList: {
    toggle(name: string, force?: boolean): void;
  };
  _channel?: number;
  [key: string]: unknown;
}

export interface LiveSelectionRuntimeDeps {
  state: AppState;
  getChannels(): LiveSelectionChannel[];
  getRows(): LiveSelectionRow[];
  getContainer(): { scrollTop: number; scrollHeight: number; clientHeight: number } | null;
  getLabel(): { textContent: string | null } | null;
  byId(id: string): { textContent: string | null } | null;
  getSelectedCategory(): { name?: string } | null;
  isFavoritesOnly(): boolean;
  getPlayerStage(): unknown;
  saveProfile(): void;
  setProfileFavorites(favorites: Record<string, boolean>): void;
  clampIndex(index: number, size: number): number;
  formatLabel(name: string, favoritesOnly: boolean, count: number): string;
  scrollTop(index: number, current: number, scrollHeight: number, clientHeight: number): number;
  refreshPlayerChannels(): void;
  playChannel(channel: LiveSelectionChannel | undefined, force: boolean): void;
  previewChannel(channel: LiveSelectionChannel | undefined): void;
  selectFromRuntime(index: number, force: boolean): boolean;
  scrollFromRuntime(): boolean;
}

export interface LiveSelectionRuntime {
  select(index: number, force?: boolean): void;
  scrollList(): boolean;
  updateLabel(): void;
  syncFavorites(favorites: Record<string, boolean>): void;
  categoryName(): string;
}

export function createLiveSelectionRuntime(deps: LiveSelectionRuntimeDeps): LiveSelectionRuntime {
  function categoryName(): string {
    const category = deps.getSelectedCategory();
    return category && category.name ? category.name : "Todos";
  }

  function scrollList(): boolean {
    if (deps.scrollFromRuntime()) {
      return true;
    }
    const rows = deps.getRows();
    const container = deps.getContainer();
    if (!rows.length || !container) {
      return false;
    }
    const row = rows.find((candidate) => candidate._channel === deps.state.channel);
    if (row) {
      container.scrollTop = deps.scrollTop(
        rows.indexOf(row),
        container.scrollTop,
        container.scrollHeight,
        container.clientHeight
      );
    }
    return true;
  }

  function updateLabel(): void {
    const label = deps.byId("live-cat-label");
    if (!label) {
      return;
    }
    const favoritesOnly = deps.isFavoritesOnly();
    const count = favoritesOnly ? deps.getRows().length : deps.getChannels().length;
    label.textContent = deps.formatLabel(categoryName(), favoritesOnly, count);
  }

  function select(index: number, force = false): void {
    if (deps.state.screen !== "player" && deps.selectFromRuntime(index, force)) {
      return;
    }
    const channels = deps.getChannels();
    const rows = deps.getRows();
    const selected = deps.clampIndex(index, channels.length);
    deps.state.channel = selected;
    for (const row of rows) {
      row.classList.toggle("is-current", row._channel === selected);
    }
    const channel = channels[selected];
    const label = deps.getLabel();
    if (channel && label) {
      label.textContent = channel.name || null;
    }
    scrollList();
    if (deps.state.screen === "player") {
      if (deps.getPlayerStage()) {
        deps.refreshPlayerChannels();
      }
      if (deps.state.playerMode === "live") {
        deps.playChannel(channel, Boolean(force));
      }
      return;
    }
    if (deps.state.screen === "home" && deps.state.tab === 0) {
      deps.previewChannel(channel);
    }
  }

  function syncFavorites(favorites: Record<string, boolean>): void {
    deps.state.favs = favorites;
    deps.setProfileFavorites(favorites);
    deps.saveProfile();
  }

  return { select, scrollList, updateLabel, syncFavorites, categoryName };
}
