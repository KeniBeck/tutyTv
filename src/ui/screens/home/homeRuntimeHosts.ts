import type { AppState } from "../../runtime/state";
import type { LazyPosterHost } from "../../runtime/lazyPosters";
import type { ScreenFocusHost } from "../../runtime/screenFocus";
import type { HomeAddonsHost } from "./homeAddons";
import {
  createHomeLivePageHost,
  createHomePageHost,
  createHomeShellHost
} from "./homePageHosts";
import type { HomeShellHost } from "./homeShell";
import type { HomeTabsHost, HomeTabShell } from "./homeTabs";
import type { LiveLoaderHost } from "./liveLoader";
import type { LiveFavoritesHost } from "./liveFavorites";
import type { LiveCategoryHost } from "../player/playerLiveCategories";
import type { PosterHost } from "./posterCard";

export interface HomeRuntimeDeps {
  state: AppState;
  [key: string]: unknown;
}

export interface HomeRuntimeHosts {
  poster: PosterHost;
  lazyPosters: LazyPosterHost;
  homeTabs: HomeTabsHost;
  homeShell: HomeShellHost;
  liveFavorites: LiveFavoritesHost;
  playerLiveCategories: LiveCategoryHost;
  homeAddons: HomeAddonsHost;
  liveLoader: LiveLoaderHost;
  homeLivePage: ReturnType<typeof createHomeLivePageHost>;
  homePage: ReturnType<typeof createHomePageHost>;
  screenFocus: ScreenFocusHost;
}

export function createHomeRuntimeHosts(deps: HomeRuntimeDeps): HomeRuntimeHosts {
  const homeShell = createHomeShellHost({
    state: deps.state,
    byId: deps.byId,
    el: deps.el,
    clear: deps.clear,
    focus: deps.focus,
    getTabs: deps.getShellTabs,
    getIcons: deps.getIcons,
    getPageCount: deps.getPageCount,
    getInitialPage: deps.getInitialPage,
    getChannels: deps.getShellChannels,
    getLiveFocus: deps.getLiveFocus,
    selectTab: deps.selectTab,
    focusHomeTab: deps.focusHomeTab,
    openSettings: deps.openSettings,
    openSearch: deps.openSearch,
    openFilter: deps.openFilter
  } as never);
  const homeLivePage = createHomeLivePageHost({
    state: deps.state,
    getChannels: deps.getChannels,
    getRows: deps.getLiveRows,
    createVideo: deps.createVideo,
    el: deps.el,
    focus: deps.focus,
    canFocus: deps.canFocus,
    openCategories: deps.openCategories,
    toggleFavorites: deps.toggleFavorites,
    openSearch: deps.openLiveSearch,
    selectChannel: deps.selectChannel,
    openPlayer: deps.openPlayer,
    focusLive: deps.focusLive,
    focusTab: deps.focusTab
  } as never);
  const homePage = createHomePageHost({
    getCatalog: deps.getCatalog,
    filterCategory: deps.filterCategory,
    selectPage: deps.selectPage,
    el: deps.el,
    place: deps.place,
    openDetail: deps.openDetail,
    afterBuild: deps.afterBuild,
    isHomeScreen: deps.isHomeScreen,
    onHeroLeft: deps.onHeroLeft
  } as never);
  const homeTabs = {
    state: deps.state,
    buildShell: function buildShell(): HomeTabShell | null {
      const build = deps.buildShell as ((host: HomeShellHost) => HomeTabShell | null) | undefined;
      return build ? build(homeShell) : null;
    },
    getTabConfig: deps.getTabConfig,
    buildPage: function buildPage(index: number, page: unknown): void {
      if (index === 0) {
        const build = deps.buildLivePage as
          | ((page: unknown, host: unknown) => unknown)
          | undefined;
        if (!build) return;
        const refs = build(page, homeLivePage);
        const apply = deps.applyLiveRefs as ((refs: unknown) => void) | undefined;
        if (refs && apply) {
          apply(refs);
        }
        return;
      }
      const build = deps.buildVodPage as
        | ((index: number, page: unknown, host: unknown) => void)
        | undefined;
      if (build) {
        build(index, page, homePage);
      }
    },
    getPages: deps.getPages,
    setPages: deps.setPages,
    getTabs: deps.getTabs,
    setTabs: deps.setTabs,
    getLiveRows: deps.getLiveRows,
    getLiveFocus: deps.getLiveFocus,
    getChannels: deps.getChannels,
    focus: deps.focus,
    focusHomeTab: deps.focusHomeTab,
    stopPreview: deps.stopPreview,
    previewChannel: deps.previewChannel,
    isWeb: deps.isWeb,
    stopWebMedia: deps.stopWebMedia,
    openSettings: deps.openSettings,
    afterBuild: deps.afterBuild
  } as unknown as HomeTabsHost;
  const poster = {
    el: deps.el,
    place: deps.place,
    openDetail: deps.openDetail,
    afterBuild: deps.afterBuild
  } as unknown as PosterHost;
  const lazyPosters = {
    state: deps.state,
    closest: deps.closest,
    queryPosters: deps.queryPosters,
    getViewport: deps.getViewport,
    focus: deps.focus,
    focusHomeTab: deps.focusHomeTab,
    stopPreview: deps.stopPreview,
    previewChannel: deps.previewChannel,
    isWeb: deps.isWeb,
    stopWebMedia: deps.stopWebMedia,
    openSettings: deps.openSettings,
    afterBuild: deps.afterBuild
  } as unknown as LazyPosterHost;
  const liveFavorites = {
    state: deps.state,
    syncFavorites: deps.syncFavorites
  } as unknown as LiveFavoritesHost;
  const playerLiveCategories = {
    state: deps.state,
    ensureOverlay: deps.ensureOverlay,
    ensureGrid: deps.ensureGrid,
    ensureSubtitle: deps.ensureSubtitle,
    getCategories: deps.getCategories,
    getSelectedCategory: deps.getSelectedCategory,
    selectCategory: deps.selectCategory,
    el: deps.el,
    clear: deps.clear,
    focus: deps.focus,
    canFocus: deps.canFocus,
    firstFocus: deps.firstFocus,
    getChannelPanel: deps.getChannelPanel,
    hideInfobar: deps.hideInfobar,
    focusPlayer: deps.focusPlayer,
    layoutSelectedCategory: deps.layoutSelectedCategory,
    closeChannels: deps.closeChannels
  } as unknown as LiveCategoryHost;
  const homeAddons = {
    readStorage: deps.readStorage,
    writeStorage: deps.writeStorage
  } as unknown as HomeAddonsHost;
  const liveLoader = {
    state: deps.state,
    getChannels: deps.getChannels,
    getCategories: deps.getCategories,
    getSelectedCategory: deps.getSelectedCategory,
    setSelectedCategory: deps.setSelectedCategory,
    isFavorite: deps.isLiveFavorite,
    getAddons: deps.getAddons,
    requestChannels: deps.requestChannels,
    requestCategories: deps.requestCategories,
    requestM3u: deps.requestM3u,
    notify: deps.notify,
    renderList: deps.renderList,
    renderPlayerChannels: deps.renderPlayerChannels,
    refreshPlayerChannels: deps.refreshPlayerChannels,
    playPlayerChannel: deps.playPlayerChannel,
    previewChannel: deps.previewChannel,
    setChannelLabel: deps.setChannelLabel,
    renderCategories: deps.renderCategories,
    updateCategoryLabel: deps.updateCategoryLabel
  } as unknown as LiveLoaderHost;
  const screenFocus = {
    state: deps.state,
    closest: deps.closest,
    queryFocusables: deps.queryFocusables,
    getTabFocus: deps.getTabFocus,
    getTabItems: deps.getTabItems,
    getPages: deps.getPages,
    getTabPage: deps.getTabPage,
    isPlaySettingsOpen: deps.isPlaySettingsOpen,
    isPlaySettingViewOpen: deps.isPlaySettingViewOpen,
    focus: deps.focus
  } as unknown as ScreenFocusHost;
  return {
    poster,
    lazyPosters,
    homeTabs,
    homeShell,
    liveFavorites,
    playerLiveCategories,
    homeAddons,
    liveLoader,
    homeLivePage,
    homePage,
    screenFocus
  };
}
