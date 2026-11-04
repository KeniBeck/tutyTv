import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyDeepLink,
  attachDeepLink,
  parseDeepLink,
  resetDeepLinkRuntime,
  type DeepLinkHost
} from "./deepLink";
import { createAppState } from "./state";

function createHarness(search: string) {
  const state = createAppState();
  let currentSearch = search;
  const skipWelcome = vi.fn();
  const selectTab = vi.fn();
  const focusDefault = vi.fn();
  const openDetail = vi.fn();
  const openSearch = vi.fn();
  const setSearchQuery = vi.fn();
  const openSettings = vi.fn();
  const openSettingsPanel = vi.fn();
  const openPlayer = vi.fn();
  const openChannels = vi.fn();
  const focusSelector = vi.fn();
  const host: DeepLinkHost = {
    state,
    getSearch: () => currentSearch,
    getChannelCount: () => 10,
    skipWelcome,
    selectTab,
    focusDefault,
    openDetail,
    openSearch,
    setSearchQuery,
    openSettings,
    openSettingsPanel,
    openPlayer,
    openChannels,
    focusSelector
  };
  attachDeepLink(host);
  return {
    state,
    skipWelcome,
    selectTab,
    focusDefault,
    openDetail,
    openSearch,
    setSearchQuery,
    openSettings,
    openSettingsPanel,
    openPlayer,
    openChannels,
    focusSelector,
    setSearch(value: string) {
      currentSearch = value;
    }
  };
}

afterEach(() => {
  resetDeepLinkRuntime();
  vi.clearAllMocks();
});

describe("deep links", () => {
  it("decodes query parameters", () => {
    expect(parseDeepLink("?screen=search&q=matrix%20x&flag=")).toEqual({
      screen: "search",
      q: "matrix x",
      flag: ""
    });
    expect(parseDeepLink("")).toEqual({});
  });

  it("does nothing without parameters", () => {
    const harness = createHarness("");
    expect(applyDeepLink()).toBe(false);
    expect(harness.skipWelcome).not.toHaveBeenCalled();
  });

  it("leaves the welcome screen untouched", () => {
    const harness = createHarness("?screen=welcome");
    expect(applyDeepLink()).toBe(true);
    expect(harness.skipWelcome).not.toHaveBeenCalled();
    expect(harness.selectTab).not.toHaveBeenCalled();
  });

  it("clamps the channel and opens the default home tab", () => {
    const harness = createHarness("?ch=99&screen=home");

    expect(applyDeepLink()).toBe(true);

    expect(harness.state.channel).toBe(9);
    expect(harness.skipWelcome).toHaveBeenCalledTimes(1);
    expect(harness.selectTab).toHaveBeenCalledWith(0, false);
    expect(harness.focusDefault).toHaveBeenCalledTimes(1);
  });

  it("selects a tab and opens a detail", () => {
    const harness = createHarness("?screen=detail&tab=2&vod=4&focus=%23poster");

    applyDeepLink();

    expect(harness.selectTab).toHaveBeenCalledWith(2, true);
    expect(harness.focusDefault).not.toHaveBeenCalled();
    expect(harness.openDetail).toHaveBeenCalledWith(4);
    expect(harness.focusSelector).toHaveBeenCalledWith("#poster");
  });

  it("opens search with the requested query", () => {
    const harness = createHarness("?screen=search&q=hello");

    applyDeepLink();

    expect(harness.openSearch).toHaveBeenCalledTimes(1);
    expect(harness.setSearchQuery).toHaveBeenCalledWith("hello");
  });

  it("opens settings at the requested panel", () => {
    const harness = createHarness("?screen=settings&panel=3");

    applyDeepLink();

    expect(harness.openSettings).toHaveBeenCalledTimes(1);
    expect(harness.openSettingsPanel).toHaveBeenCalledWith(3);
  });

  it("opens the player in vod or live mode and optionally the channel panel", () => {
    const vod = createHarness("?screen=player&mode=vod&vod=2");
    applyDeepLink();
    expect(vod.openPlayer).toHaveBeenCalledWith("vod", 2);

    const live = createHarness("?screen=player&channels=1");
    applyDeepLink();
    expect(live.openPlayer).toHaveBeenCalledWith("live", 0);
    expect(live.openChannels).toHaveBeenCalledTimes(1);
  });

  it("returns false when the runtime is not attached", () => {
    resetDeepLinkRuntime();
    expect(applyDeepLink()).toBe(false);
  });
});
