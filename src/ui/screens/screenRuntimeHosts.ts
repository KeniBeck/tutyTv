import type { AppState } from "../runtime/state";
import type { DetailHost } from "./detail/detailScreen";
import type { ResumeHost } from "./detail/resumeDialog";
import type { SearchHost } from "./search/searchScreen";
import type { SettingsHost } from "./settings/settingsScreen";

export interface ScreenRuntimeDeps {
  state: AppState;
  getCatalog(): unknown[];
  byId(id: string): unknown;
  el(tag: string, className?: string, text?: string): unknown;
  clear(element: unknown): void;
  place(element: unknown, left: number, top: number, width?: number, height?: number): unknown;
  focus(element: unknown): void;
  canFocus(element: unknown): boolean;
  firstFocus(root: Element): unknown;
  showScreen(name: string): void;
  getHotSearches(): unknown[];
  isPortal(): boolean;
  searchRemote(value: string, done: (error: string | null, response: unknown) => void): void;
  normalizeItem(item: unknown, index: number): unknown;
  buildPoster(item: unknown, left: number, top: number, width: number, height: number, options?: unknown): unknown;
  getProfile(): unknown;
  isSeries(item: unknown): boolean;
  openHistory(entry: unknown): void;
  formatTime(value: number): string;
  refreshPlayback(): void;
  onStreamModeChanged(): void;
  isFavorite(item: unknown): boolean;
  toggleFavorite(item: unknown): boolean;
  isReminderActive(item: unknown): boolean;
  toggleReminder(item: unknown): boolean;
  toast(message: string): void;
  playItem(item: unknown, episode: unknown): void;
  playEpisode(item: unknown, episode: unknown): void;
  startPlayback(item: unknown, episode: unknown): void;
  openLanguage(item: unknown): void;
  isSmooth(item: unknown): boolean;
  toggleSmooth(item: unknown): boolean;
  loadSeason(item: unknown, seasonIndex: number, done: () => void): void;
}

export interface ScreenRuntimeHosts {
  search: SearchHost;
  settings: SettingsHost;
  detail: DetailHost;
  resume: ResumeHost;
}

export function createScreenRuntimeHosts(deps: ScreenRuntimeDeps): ScreenRuntimeHosts {
  const search = {
    state: deps.state,
    getCatalog: deps.getCatalog,
    getHotSearches: deps.getHotSearches,
    isPortal: deps.isPortal,
    searchRemote: deps.searchRemote,
    normalizeItem: deps.normalizeItem,
    buildPoster: deps.buildPoster,
    byId: deps.byId,
    el: deps.el,
    clear: deps.clear,
    place: deps.place,
    focus: deps.focus,
    canFocus: deps.canFocus,
    firstFocus: deps.firstFocus,
    showScreen: deps.showScreen,
    getAppRoot: function getAppRoot() {
      return deps.byId("app");
    },
    getNotify: function getNotify() {
      return deps.byId("home-notify");
    }
  } as unknown as SearchHost;
  const settings = {
    state: deps.state,
    getProfile: deps.getProfile,
    getCatalog: deps.getCatalog,
    isSeries: deps.isSeries,
    openHistory: deps.openHistory,
    formatTime: deps.formatTime,
    refreshPlayback: deps.refreshPlayback,
    onStreamModeChanged: deps.onStreamModeChanged,
    byId: deps.byId,
    el: deps.el,
    clear: deps.clear,
    place: deps.place,
    focus: deps.focus,
    firstFocus: deps.firstFocus,
    showScreen: deps.showScreen
  } as unknown as SettingsHost;
  const detail = {
    state: deps.state,
    getCatalog: deps.getCatalog,
    isSeries: deps.isSeries,
    isFavorite: deps.isFavorite,
    toggleFavorite: deps.toggleFavorite,
    isReminderActive: deps.isReminderActive,
    toggleReminder: deps.toggleReminder,
    toast: deps.toast,
    play: deps.playItem,
    playEpisode: deps.playEpisode,
    startPlayback: deps.startPlayback,
    openLanguage: deps.openLanguage,
    isSmooth: deps.isSmooth,
    toggleSmooth: deps.toggleSmooth,
    loadSeason: deps.loadSeason,
    buildPoster: deps.buildPoster,
    byId: deps.byId,
    el: deps.el,
    text: function text(value: string) {
      return document.createTextNode(value);
    },
    clear: deps.clear,
    place: deps.place,
    focus: deps.focus
  } as unknown as DetailHost;
  const resume = {
    state: deps.state,
    byId: deps.byId,
    el: deps.el,
    text: function text(value: string) {
      return document.createTextNode(value);
    },
    clear: deps.clear,
    focus: deps.focus,
    canFocus: deps.canFocus,
    getAppRoot: function getAppRoot() {
      return deps.byId("app");
    },
    formatTime: deps.formatTime
  } as unknown as ResumeHost;
  return { search, settings, detail, resume };
}
