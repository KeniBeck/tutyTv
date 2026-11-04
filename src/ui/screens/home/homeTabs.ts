import type { AppState } from "../../runtime/state";

export interface HomeTabNode {
  classList: {
    add(...names: string[]): void;
    remove(...names: string[]): void;
    toggle(name: string, force?: boolean): void;
  };
  _channel?: number;
}

export interface HomeTabConfig {
  page: number;
}

export interface HomeTabShell {
  pages: HomeTabNode[];
  tabs: HomeTabNode[];
  initialPage: number;
}

export interface HomeTabsHost {
  state: AppState;
  buildShell(): HomeTabShell | null;
  getTabConfig(tab: number): HomeTabConfig | null;
  buildPage(index: number, page: HomeTabNode): void;
  getPages(): HomeTabNode[];
  setPages(pages: HomeTabNode[]): void;
  getTabs(): HomeTabNode[];
  setTabs(tabs: HomeTabNode[]): void;
  getLiveRows(): HomeTabNode[];
  getLiveFocus(): HomeTabNode | null;
  getChannels(): Array<{ name?: string; [key: string]: unknown }>;
  focus(node: HomeTabNode | null, silent?: boolean): void;
  focusHomeTab(tab: number): void;
  stopPreview(): void;
  previewChannel(channel: unknown): void;
  isWeb(): boolean;
  stopWebMedia(): void;
  openSettings(): void;
  afterBuild(): void;
}

let host: HomeTabsHost | null = null;
let built = false;
let builtPages: Record<number, boolean> = {};

export function attachHomeTabs(next: HomeTabsHost): boolean {
  host = next;
  return true;
}

export function hasHomeTabsRuntime(): boolean {
  return host !== null;
}

export function resetHomeTabsRuntime(): void {
  host = null;
  built = false;
  builtPages = {};
}

export function isHomeTabsBuilt(): boolean {
  return built;
}

export function buildHomeTabs(): boolean {
  if (!host) {
    return false;
  }
  const refs = host.buildShell();
  if (!refs) {
    return false;
  }
  built = true;
  builtPages = {};
  host.setPages(refs.pages);
  host.setTabs(refs.tabs);
  ensureHomePage(refs.initialPage);
  return true;
}

export function ensureHomePage(index: number): boolean {
  if (!host) {
    return false;
  }
  if (builtPages[index]) {
    return true;
  }
  const page = host.getPages()[index];
  if (!page) {
    return false;
  }
  builtPages[index] = true;
  host.buildPage(index, page);
  return true;
}

export function selectHomeTab(tab: number, focus: boolean): boolean {
  if (!host) {
    return false;
  }
  const config = host.getTabConfig(tab);
  if (!config) {
    return false;
  }
  const state = host.state;
  if (host.isWeb() && state.screen !== "player" && state.screen !== "detail") {
    host.stopWebMedia();
  }
  if (config.page < 0) {
    host.openSettings();
    return false;
  }
  const previousConfig = host.getTabConfig(state.tab);
  const previousPage = previousConfig ? previousConfig.page : config.page;
  state.tab = tab;
  const tabs = host.getTabs();
  for (let index = 0; index < tabs.length; index += 1) {
    tabs[index]?.classList.toggle("is-selected", index === tab);
  }
  ensureHomePage(config.page);
  if (config.page === 0) {
    host.previewChannel(host.getChannels()[state.channel]);
  } else {
    host.stopPreview();
  }
  const pages = host.getPages();
  for (let index = 0; index < pages.length; index += 1) {
    pages[index]?.classList.remove("is-entering", "from-left", "from-right");
    pages[index]?.classList.toggle("is-current", index === config.page);
  }
  if (config.page !== previousPage && pages[config.page]) {
    const page = pages[config.page];
    page?.classList.add("is-entering", config.page > previousPage ? "from-right" : "from-left");
    setTimeout(function clearEntering() {
      page?.classList.remove("is-entering", "from-left", "from-right");
    }, 320);
  }
  if (focus) {
    if (config.page === 0) {
      const rows = host.getLiveRows();
      const current = rows.find((row) => row._channel === state.channel) || rows[0] || null;
      if (current) {
        host.focus(current);
      } else {
        host.focus(host.getLiveFocus());
      }
    } else {
      host.focusHomeTab(tab);
    }
  }
  host.afterBuild();
  return true;
}
