import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppState } from "../../runtime/state";
import {
  attachLiveLoader,
  isLiveChannelsLoading,
  loadLiveAddonChannels,
  loadLiveChannels,
  resetLiveLoaderRuntime,
  selectLiveCategory
} from "./liveLoader";

function setup() {
  const state = createAppState();
  state.screen = "home";
  const channels: Array<Record<string, unknown>> = [];
  const categories: Array<Record<string, unknown>> = [];
  const host = {
    state,
    getChannels: () => channels,
    getCategories: () => categories as never[],
    getSelectedCategory: () => null,
    setSelectedCategory: vi.fn(),
    isFavorite: () => false,
    getAddons: () => [{ id: "a1", name: "Lista", url: "http://m3u" }],
    requestChannels: vi.fn(),
    requestCategories: vi.fn(),
    requestM3u: vi.fn(),
    notify: vi.fn(),
    renderList: vi.fn(),
    renderPlayerChannels: vi.fn(),
    refreshPlayerChannels: vi.fn(),
    playPlayerChannel: vi.fn(),
    previewChannel: vi.fn(),
    setChannelLabel: vi.fn(),
    renderCategories: vi.fn(),
    updateCategoryLabel: vi.fn()
  };
  attachLiveLoader(host);
  return { state, channels, categories, host };
}

describe("live loader", () => {
  afterEach(() => {
    resetLiveLoaderRuntime();
    vi.useRealTimers();
  });

  it("loads channels, categories and previews the current channel", () => {
    const { state, channels, categories, host } = setup();
    (host.requestChannels as ReturnType<typeof vi.fn>).mockImplementation((_params, done) => {
      done(null, {
        channels: [{ id: "c1", channelCode: "1", name: "Uno" }],
        hasMore: false
      });
    });
    (host.requestCategories as ReturnType<typeof vi.fn>).mockImplementation((done) => {
      done(null, { categories: [{ id: 1, name: "Todos" }] });
    });

    expect(loadLiveChannels(76182)).toBe(true);
    expect(isLiveChannelsLoading()).toBe(false);
    expect(channels).toEqual([{ id: "c1", channelCode: "1", name: "Uno", fav: false }]);
    expect(categories[0]).toEqual({ id: 1, name: "Todos", code: undefined, isAddon: false });
    expect(categories[1]).toEqual(expect.objectContaining({ id: "addons", isAddon: true }));
    expect(host.setSelectedCategory).toHaveBeenCalledWith(expect.objectContaining({ name: "Todos" }));
    expect(host.renderList).toHaveBeenCalled();
    expect(host.renderPlayerChannels).toHaveBeenCalled();
    expect(host.setChannelLabel).toHaveBeenLastCalledWith("Uno");
    expect(host.previewChannel).toHaveBeenCalledWith(expect.objectContaining({ id: "c1" }));
    expect(state.channel).toBe(0);
  });

  it("loads addon channels and plays the first one in the live player", () => {
    const { state, channels, host } = setup();
    state.screen = "player";
    state.playerMode = "live";
    (host.requestM3u as ReturnType<typeof vi.fn>).mockImplementation((_url, done) => {
      done(null, { channels: [{ name: "Addon 1" }] });
    });

    expect(loadLiveAddonChannels()).toBe(true);
    expect(host.notify).toHaveBeenCalledWith("Cargando canales de Addon…");
    expect(channels).toEqual([{ name: "Addon 1", index: 1, fav: false }]);
    expect(host.refreshPlayerChannels).toHaveBeenCalled();
    expect(host.playPlayerChannel).toHaveBeenCalledWith(expect.objectContaining({ name: "Addon 1" }), true);
  });

  it("selects regular and addon categories", () => {
    const { host } = setup();
    (host.requestChannels as ReturnType<typeof vi.fn>).mockImplementation((_params, done) => {
      done(null, { channels: [], hasMore: false });
    });
    (host.requestCategories as ReturnType<typeof vi.fn>).mockImplementation((done) => {
      done(null, { categories: [] });
    });
    const first = vi.fn();
    const complete = vi.fn();

    expect(selectLiveCategory({ id: 1, name: "Todos", isAddon: false }, first, complete)).toBe(true);
    expect(host.setSelectedCategory).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    expect(host.renderCategories).toHaveBeenCalled();
    expect(complete).toHaveBeenCalled();

    (host.requestM3u as ReturnType<typeof vi.fn>).mockImplementation((_url, done) => {
      done(null, { channels: [{ name: "Addon" }] });
    });
    expect(selectLiveCategory({ id: "addons", name: "Addons", isAddon: true }, first, complete)).toBe(true);
    expect(first).toHaveBeenCalled();
  });
});
