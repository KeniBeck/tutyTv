import { describe, expect, it } from "vitest";
import { createAppState } from "../../runtime/state";
import { createLiveRuntimeHosts, type LiveRuntimeDeps } from "./liveRuntimeHosts";

function deps(overrides: Partial<LiveRuntimeDeps> = {}): LiveRuntimeDeps {
  const state = createAppState();
  state.screen = "home";
  state.tab = 0;
  state.playerMode = "vod";
  const channels = [
    { name: "Uno", channelCode: "1" },
    { name: "Dos", channelCode: "2" }
  ];
  return {
    state,
    getChannels: () => channels,
    getRows: () => [],
    getListContainer: () => null,
    getChannelLabel: () => null,
    getTabs: () => [],
    getLiveFocus: () => null,
    getFastAll: () => null,
    getFastFav: () => null,
    isFavoritesOnly: () => false,
    setFavoritesOnly: () => {},
    isLiveFavorite: (channel: { channelCode?: string }) => channel.channelCode === "2",
    toggleLiveFavorite: () => true,
    focus: () => {},
    focusLiveList: () => {},
    canFocus: () => true,
    el: () => ({}) as never,
    clear: () => {},
    openPlayer: () => {},
    getPlayerFocus: () => null,
    refreshPlayerChannels: () => {},
    playPlayerChannel: () => {},
    previewChannel: () => {},
    updateLabel: () => {},
    getChannel: () => null,
    getVideo: () => null,
    getContainer: () => null,
    getStatus: () => null,
    resolveLive: () => {},
    play: () => {},
    pause: () => {},
    setSource: () => {},
    load: () => {},
    loadHls: () => {},
    destroyHls: () => {},
    setHls: () => {},
    createHls: () => ({}) as never,
    hlsEvents: () => null,
    canUseHls: () => false,
    nativeTvPlayback: () => false,
    nativePreviewHls: () => false,
    getCategories: () => [],
    getSelectedCategory: () => null,
    byId: () => null,
    firstFocus: () => null,
    renderList: () => {},
    selectCategory: () => {},
    selectChannel: () => {},
    getPresets: () => [],
    getAddons: () => [],
    saveAddons: () => {},
    installAddon: () => {},
    requestM3u: () => {},
    reloadChannels: () => {},
    isChannelsOpen: () => false,
    getChannelsPanel: () => null,
    setOpen: () => {},
    ...overrides
  };
}

describe("live runtime hosts", () => {
  it("derives live screen flags and filters favorites", () => {
    const hosts = createLiveRuntimeHosts(deps());
    expect(hosts.liveList.isHomeLive()).toBe(true);
    expect(hosts.preview.isHomeLive()).toBe(true);
    expect(hosts.liveList.isPlayerScreen()).toBe(false);
    expect(hosts.liveList.isLiveMode()).toBe(false);
    expect(hosts.liveList.canRefreshPlayerChannels()).toBe(false);
    expect(hosts.liveList.filterChannels(false)).toHaveLength(2);
    expect(hosts.liveList.filterChannels(true)).toEqual([
      { channel: { name: "Dos", channelCode: "2" }, index: 1 }
    ]);
  });

  it("reports player focus and live mode", () => {
    const state = createAppState();
    state.screen = "player";
    state.playerMode = "live";
    state.tab = 1;
    const hosts = createLiveRuntimeHosts(
      deps({
        state,
        getPlayerFocus: () => ({}) as never
      })
    );
    expect(hosts.liveList.isPlayerScreen()).toBe(true);
    expect(hosts.liveList.isLiveMode()).toBe(true);
    expect(hosts.liveList.isHomeLive()).toBe(false);
    expect(hosts.liveList.canRefreshPlayerChannels()).toBe(true);
  });
});
