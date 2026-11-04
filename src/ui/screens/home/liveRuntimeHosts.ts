import { filterLiveChannels } from "../../../core/usecases/live/liveChannels";
import type { AppState } from "../../runtime/state";
import type { PreviewChannel, PreviewContainer, PreviewHls, PreviewHlsEvents, PreviewHost, PreviewResponse, PreviewStatus, PreviewVideo } from "../player/previewPlayer";
import { isLiveChannelsLoading } from "./liveLoader";
import type { AddonEntry, AddonPreset, AddonsDialogHost } from "./addonsDialog";
import type { LiveCategory, LiveMenuHost } from "./liveMenu";
import type { LiveChannel, LiveEntry, LiveListHost, LiveNode } from "./liveList";

export interface LiveRuntimeDeps {
  state: AppState;
  getChannels(): LiveChannel[];
  getRows(): LiveNode[];
  getListContainer(): LiveNode | null;
  getChannelLabel(): LiveNode | null;
  getTabs(): Array<LiveNode | undefined>;
  getLiveFocus(): LiveNode | null;
  getFastAll(): LiveNode | null;
  getFastFav(): LiveNode | null;
  isFavoritesOnly(): boolean;
  setFavoritesOnly(value: boolean): void;
  isLiveFavorite(channel: LiveChannel): boolean;
  toggleLiveFavorite(channel: LiveChannel): boolean;
  focus(node: LiveNode | null): void;
  focusLiveList(): void;
  canFocus(node: LiveNode | null): boolean;
  el(tag: string, className?: string, text?: string): LiveNode;
  clear(node: LiveNode): void;
  openPlayer(mode: string): void;
  getPlayerFocus(): LiveNode | null;
  refreshPlayerChannels(): void;
  playPlayerChannel(channel: LiveChannel, force: boolean): void;
  previewChannel(channel: LiveChannel): void;
  updateLabel(): void;
  getChannel(): PreviewChannel | null;
  getVideo(): PreviewVideo | null;
  getContainer(): PreviewContainer | null;
  getStatus(): PreviewStatus | null;
  resolveLive(
    channel: PreviewChannel,
    done: (error: string | null | undefined, response: PreviewResponse | null | undefined) => void
  ): void;
  play(video: PreviewVideo): Promise<void> | void;
  pause(video: PreviewVideo): void;
  setSource(video: PreviewVideo, url: string): void;
  load(video: PreviewVideo): void;
  loadHls(video: PreviewVideo, hls: PreviewHls, url: string): void;
  destroyHls(): void;
  setHls(hls: PreviewHls): void;
  createHls(): PreviewHls;
  hlsEvents(): PreviewHlsEvents | null;
  canUseHls(): boolean;
  nativeTvPlayback(): boolean;
  nativePreviewHls(video: PreviewVideo): boolean;
  getCategories(): LiveCategory[];
  getSelectedCategory(): LiveCategory | null;
  byId(id: string): LiveNode | null;
  firstFocus(root: Element): LiveNode | null;
  renderList(favoritesOnly?: boolean): void;
  selectCategory(category: LiveCategory, first: () => void, complete?: () => void): void;
  selectChannel(index: number, force?: boolean): void;
  getPresets(): AddonPreset[];
  getAddons(): AddonEntry[];
  saveAddons(addons: AddonEntry[]): void;
  installAddon(entry: AddonPreset, done: (error: string | null, count?: number) => void): void;
  requestM3u(
    url: string,
    done: (error: unknown, response: { channels?: unknown[] } | null) => void
  ): void;
  reloadChannels(): void;
  isChannelsOpen(): boolean;
  getChannelsPanel(): LiveNode | null;
  setOpen(open: boolean): void;
}

export interface LiveRuntimeHosts {
  liveList: LiveListHost;
  preview: PreviewHost;
  liveMenu: LiveMenuHost;
  addonsDialog: AddonsDialogHost;
}

export function createLiveRuntimeHosts(deps: LiveRuntimeDeps): LiveRuntimeHosts {
  const liveList: LiveListHost = {
    state: deps.state,
    getChannels: deps.getChannels,
    getRows: deps.getRows,
    getListContainer: deps.getListContainer,
    getChannelLabel: deps.getChannelLabel,
    getTabs: deps.getTabs,
    getLiveFocus: deps.getLiveFocus,
    getFastAll: deps.getFastAll,
    isFavoritesOnly: deps.isFavoritesOnly,
    isLoading: function isLoading() {
      return isLiveChannelsLoading();
    },
    filterChannels: function filterChannels(favoritesOnly: boolean): LiveEntry[] {
      return filterLiveChannels(deps.getChannels(), favoritesOnly, deps.isLiveFavorite);
    },
    isFavorite: deps.isLiveFavorite,
    toggleFavorite: deps.toggleLiveFavorite,
    focus: deps.focus,
    focusLiveList: deps.focusLiveList,
    canFocus: deps.canFocus,
    el: deps.el,
    clear: deps.clear,
    openPlayer: deps.openPlayer,
    isPlayerScreen: function isPlayerScreen() {
      return deps.state.screen === "player";
    },
    isLiveMode: function isLiveMode() {
      return deps.state.playerMode === "live";
    },
    isHomeLive: function isHomeLive() {
      return deps.state.screen === "home" && deps.state.tab === 0;
    },
    canRefreshPlayerChannels: function canRefreshPlayerChannels() {
      return Boolean(deps.getPlayerFocus());
    },
    refreshPlayerChannels: deps.refreshPlayerChannels,
    playPlayerChannel: deps.playPlayerChannel,
    previewChannel: deps.previewChannel,
    updateLabel: deps.updateLabel
  };
  const preview: PreviewHost = {
    isHomeLive: function isHomeLive() {
      return deps.state.screen === "home" && deps.state.tab === 0;
    },
    getChannel: deps.getChannel,
    getVideo: deps.getVideo,
    getContainer: deps.getContainer,
    getStatus: deps.getStatus,
    resolveLive: deps.resolveLive,
    play: deps.play,
    pause: deps.pause,
    setSource: deps.setSource,
    load: deps.load,
    loadHls: deps.loadHls,
    destroyHls: deps.destroyHls,
    setHls: deps.setHls,
    createHls: deps.createHls,
    hlsEvents: deps.hlsEvents,
    canUseHls: deps.canUseHls,
    nativeTvPlayback: deps.nativeTvPlayback,
    nativePreviewHls: deps.nativePreviewHls
  };
  const liveMenu: LiveMenuHost = {
    state: deps.state,
    getCategories: deps.getCategories,
    getSelectedCategory: deps.getSelectedCategory,
    getChannels: deps.getChannels,
    getRows: deps.getRows,
    getFastFav: deps.getFastFav,
    getFastAll: deps.getFastAll,
    getLiveFocus: deps.getLiveFocus,
    isFavoritesOnly: deps.isFavoritesOnly,
    setFavoritesOnly: deps.setFavoritesOnly,
    byId: deps.byId,
    el: deps.el,
    clear: deps.clear,
    firstFocus: deps.firstFocus,
    canFocus: deps.canFocus,
    focus: deps.focus,
    renderList: deps.renderList,
    selectCategory: deps.selectCategory,
    selectChannel: deps.selectChannel,
    openPlayer: deps.openPlayer,
    updateLabel: deps.updateLabel
  };
  const addonsDialog: AddonsDialogHost = {
    getPresets: deps.getPresets,
    getAddons: deps.getAddons,
    saveAddons: deps.saveAddons,
    installAddon: deps.installAddon,
    requestM3u: deps.requestM3u,
    getSelectedCategory: deps.getSelectedCategory,
    reloadChannels: deps.reloadChannels,
    byId: deps.byId,
    el: deps.el,
    clear: deps.clear,
    firstFocus: deps.firstFocus,
    focus: deps.focus,
    isChannelsOpen: deps.isChannelsOpen,
    getChannelsPanel: deps.getChannelsPanel,
    getPlayerFocus: deps.getPlayerFocus,
    setOpen: deps.setOpen
  };
  return { liveList, preview, liveMenu, addonsDialog };
}
