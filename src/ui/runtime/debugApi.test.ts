import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildDebugApi,
  installDebugApi,
  type DebugApiHost,
  type DebugApiWindow
} from "./debugApi";

function createHarness() {
  const state = { screen: "welcome" };
  const vod = [{ id: "v1" }];
  const channels = [{ id: "c1" }];
  const api = { mode: "portal" };
  const portal = { id: "p" };
  const service = vi.fn();
  const host: DebugApiHost = {
    version: "4.34.4",
    state,
    vod,
    channels,
    api,
    portal,
    service,
    refreshPortal: vi.fn(),
    reloadVod: vi.fn(),
    skipWelcome: vi.fn(),
    showScreen: vi.fn(),
    selectTab: vi.fn(),
    openDetail: vi.fn(),
    openSearch: vi.fn(),
    openSettings: vi.fn(),
    openLiveCategories: vi.fn(),
    openLiveSearch: vi.fn(),
    toggleLiveFavorites: vi.fn(),
    openPlayer: vi.fn(),
    focus: vi.fn(),
    handleKey: vi.fn(),
    search: vi.fn(),
    openSettingsPanel: vi.fn()
  };
  return { state, vod, channels, api, portal, service, host };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("debugApi", () => {
  it("exposes the live app references and callbacks", () => {
    const harness = createHarness();
    const target: DebugApiWindow = {};

    expect(installDebugApi(harness.host, target)).toBe(true);
    const debug = target.__tuty as ReturnType<typeof buildDebugApi>;

    expect(debug.version).toBe("4.34.4");
    expect(debug.state).toBe(harness.state);
    expect(debug.vod).toBe(harness.vod);
    expect(debug.channels).toBe(harness.channels);
    expect(debug.api).toBe(harness.api);
    expect(debug.portal).toBe(harness.portal);
    expect(debug.service).toBe(harness.service);
    debug.refreshPortal();
    debug.reloadVod();
    expect(harness.host.refreshPortal).toHaveBeenCalledTimes(1);
    expect(harness.host.reloadVod).toHaveBeenCalledTimes(1);
  });

  it("routes show() to the expected screen entry points", () => {
    const harness = createHarness();
    const debug = buildDebugApi(harness.host);

    debug.show("home");
    expect(harness.host.skipWelcome).toHaveBeenCalledTimes(1);
    debug.show("detail");
    expect(harness.host.openDetail).toHaveBeenCalledWith(0);
    debug.show("search");
    expect(harness.host.openSearch).toHaveBeenCalledTimes(1);
    debug.show("settings");
    expect(harness.host.openSettings).toHaveBeenCalledTimes(1);
    debug.show("player");
    expect(harness.host.openPlayer).toHaveBeenCalledWith("live", 0);
    debug.show("custom");
    expect(harness.host.showScreen).toHaveBeenCalledWith("custom");
  });

  it("implements the tab, player, search and settings shortcuts", () => {
    const harness = createHarness();
    const debug = buildDebugApi(harness.host);

    debug.selectTab(3);
    expect(harness.host.skipWelcome).toHaveBeenCalledTimes(1);
    expect(harness.host.selectTab).toHaveBeenCalledWith(3, true);

    debug.openPlayer("vod", 2);
    expect(harness.host.openPlayer).toHaveBeenCalledWith("vod", 2);

    debug.openDetail(4);
    expect(harness.host.openDetail).toHaveBeenCalledWith(4);

    debug.search("matrix");
    expect(harness.host.openSearch).toHaveBeenCalledTimes(1);
    expect(harness.host.search).toHaveBeenCalledWith("matrix");

    debug.settingsPanel(2);
    expect(harness.host.openSettings).toHaveBeenCalledTimes(1);
    expect(harness.host.openSettingsPanel).toHaveBeenCalledWith(2);
  });

  it("delegates focus and key events", () => {
    const harness = createHarness();
    const debug = buildDebugApi(harness.host);

    debug.focus("#poster");
    debug.key(13);

    expect(harness.host.focus).toHaveBeenCalledWith("#poster");
    expect(harness.host.handleKey).toHaveBeenCalledWith(13);
  });

  it("returns false without a target window", () => {
    const harness = createHarness();
    expect(installDebugApi(harness.host, undefined)).toBe(false);
  });
});
