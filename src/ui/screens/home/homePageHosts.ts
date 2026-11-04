import type {
  HomeLivePageHost
} from "./homeLivePage";
import type {
  HomeItem,
  HomePageHost
} from "./homePages";
import type {
  HomeShellHost,
  HomeShellNode,
  HomeShellTab
} from "./homeShell";
import type { AppState } from "../../runtime/state";

export interface HomePageHostDeps {
  getCatalog(): HomeItem[];
  filterCategory(category: string): HomeItem[];
  selectPage(category: string, limit: number, offset: number): HomeItem[];
  el: HomePageHost["el"];
  place: HomePageHost["place"];
  openDetail(item: HomeItem): void;
  afterBuild(): void;
  isHomeScreen(): boolean;
  onHeroLeft(): void;
}

export interface HomeLivePageHostDeps {
  state: AppState;
  getChannels: HomeLivePageHost["getChannels"];
  getRows: HomeLivePageHost["getRows"];
  createVideo: HomeLivePageHost["createVideo"];
  el: HomeLivePageHost["el"];
  focus: HomeLivePageHost["focus"];
  canFocus: HomeLivePageHost["canFocus"];
  openCategories(): void;
  toggleFavorites(): void;
  openSearch(): void;
  selectChannel(index: number, force?: boolean): void;
  openPlayer(mode: string): void;
  focusLive(): void;
  focusTab(): void;
}

export interface HomeShellHostDeps {
  state: AppState;
  byId(id: string): HomeShellNode | null;
  el: HomeShellHost["el"];
  clear: HomeShellHost["clear"];
  focus: HomeShellHost["focus"];
  getTabs(): HomeShellTab[];
  getIcons(): Record<string, string>;
  getPageCount(): number;
  getInitialPage(): number;
  getChannels(): HomeShellNode[];
  getLiveFocus(): HomeShellNode | null;
  selectTab(index: number, focus: boolean): void;
  focusHomeTab(index: number): void;
  openSettings(): void;
  openSearch(): void;
  openFilter(): void;
}

export function createHomePageHost(deps: HomePageHostDeps): HomePageHost {
  return {
    getCatalog: deps.getCatalog,
    filterCategory: deps.filterCategory,
    selectPage: deps.selectPage,
    el: deps.el,
    place: deps.place,
    openDetail: deps.openDetail,
    afterBuild: deps.afterBuild,
    isHomeScreen: deps.isHomeScreen,
    onHeroLeft: deps.onHeroLeft
  };
}

export function createHomeLivePageHost(deps: HomeLivePageHostDeps): HomeLivePageHost {
  return {
    state: deps.state,
    getChannels: deps.getChannels,
    getRows: deps.getRows,
    createVideo: deps.createVideo,
    el: deps.el,
    focus: deps.focus,
    canFocus: deps.canFocus,
    openCategories: deps.openCategories,
    toggleFavorites: deps.toggleFavorites,
    openSearch: deps.openSearch,
    selectChannel: deps.selectChannel,
    openPlayer: function openPlayer() {
      deps.openPlayer("live");
    },
    focusLive: deps.focusLive,
    focusTab: deps.focusTab
  };
}

export function createHomeShellHost(deps: HomeShellHostDeps): HomeShellHost {
  return {
    state: deps.state,
    byId: deps.byId,
    el: deps.el,
    clear: deps.clear,
    focus: deps.focus,
    getTabs: deps.getTabs,
    getIcons: deps.getIcons,
    getPageCount: deps.getPageCount,
    getInitialPage: deps.getInitialPage,
    getChannels: deps.getChannels,
    getLiveFocus: deps.getLiveFocus,
    selectTab: deps.selectTab,
    focusHomeTab: deps.focusHomeTab,
    openSettings: deps.openSettings,
    openSearch: deps.openSearch,
    openFilter: deps.openFilter
  };
}
