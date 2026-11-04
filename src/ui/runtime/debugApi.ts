export interface DebugApiHost {
  version: string;
  state: unknown;
  vod: unknown;
  channels: unknown;
  api: unknown;
  portal: unknown;
  service(method: string, params: unknown, done: (error: unknown, response: unknown) => void): void;
  refreshPortal(): void;
  reloadVod(): void;
  skipWelcome(): void;
  showScreen(screen: string): void;
  selectTab(index: number, focus: boolean): void;
  openDetail(index: number): void;
  openSearch(): void;
  openSettings(): void;
  openLiveCategories(): void;
  openLiveSearch(): void;
  toggleLiveFavorites(): void;
  openPlayer(mode: string, index: number): void;
  focus(target: string | unknown): void;
  handleKey(code: number): void;
  search(query: string): void;
  openSettingsPanel(panel: number): void;
}

export interface DebugApiWindow {
  __tuty?: unknown;
}

export interface DebugApi {
  version: string;
  state: unknown;
  vod: unknown;
  channels: unknown;
  api: unknown;
  portal: unknown;
  service: DebugApiHost["service"];
  refreshPortal: DebugApiHost["refreshPortal"];
  reloadVod: DebugApiHost["reloadVod"];
  skipWelcome: DebugApiHost["skipWelcome"];
  show(screen: string): void;
  selectTab(index: number): void;
  openDetail(index: number): void;
  openSearch: DebugApiHost["openSearch"];
  openSettings: DebugApiHost["openSettings"];
  openLiveCategories: DebugApiHost["openLiveCategories"];
  openLiveSearch: DebugApiHost["openLiveSearch"];
  toggleLiveFavorites: DebugApiHost["toggleLiveFavorites"];
  openPlayer(mode: string, index: number): void;
  focus(target: string | unknown): void;
  key(code: number): void;
  search(query: string): void;
  settingsPanel(panel: number): void;
}

export function buildDebugApi(host: DebugApiHost): DebugApi {
  return {
    version: host.version,
    state: host.state,
    vod: host.vod,
    channels: host.channels,
    api: host.api,
    portal: host.portal,
    service: host.service,
    refreshPortal: host.refreshPortal,
    reloadVod: host.reloadVod,
    skipWelcome: host.skipWelcome,
    show(screen: string) {
      if (screen === "home") {
        host.skipWelcome();
      } else if (screen === "detail") {
        host.openDetail(0);
      } else if (screen === "search") {
        host.openSearch();
      } else if (screen === "settings") {
        host.openSettings();
      } else if (screen === "player") {
        host.openPlayer("live", 0);
      } else {
        host.showScreen(screen);
      }
    },
    selectTab(index: number) {
      host.skipWelcome();
      host.selectTab(index, true);
    },
    openDetail(index: number) {
      host.openDetail(index);
    },
    openSearch: host.openSearch,
    openSettings: host.openSettings,
    openLiveCategories: host.openLiveCategories,
    openLiveSearch: host.openLiveSearch,
    toggleLiveFavorites: host.toggleLiveFavorites,
    openPlayer(mode: string, index: number) {
      host.openPlayer(mode, index);
    },
    focus(target: string | unknown) {
      host.focus(target);
    },
    key(code: number) {
      host.handleKey(code);
    },
    search(query: string) {
      host.openSearch();
      host.search(query);
    },
    settingsPanel(panel: number) {
      host.openSettings();
      host.openSettingsPanel(panel);
    }
  };
}

export function installDebugApi(host: DebugApiHost, target?: DebugApiWindow): boolean {
  const scope = target || (typeof window !== "undefined" ? (window as unknown as DebugApiWindow) : null);
  if (!scope) {
    return false;
  }
  scope.__tuty = buildDebugApi(host);
  return true;
}
