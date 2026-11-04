import { describe, expect, it, vi } from "vitest";
import {
  createHomeLivePageHost,
  createHomePageHost,
  createHomeShellHost
} from "./homePageHosts";

describe("home page hosts", () => {
  it("builds the VOD page host with the provided callbacks", () => {
    const deps = {
      getCatalog: vi.fn(() => []),
      filterCategory: vi.fn(() => []),
      selectPage: vi.fn(() => []),
      el: vi.fn(),
      place: vi.fn(),
      openDetail: vi.fn(),
      afterBuild: vi.fn(),
      isHomeScreen: vi.fn(() => true),
      onHeroLeft: vi.fn()
    };
    const host = createHomePageHost(deps as never);

    expect(host.getCatalog).toBe(deps.getCatalog);
    expect(host.filterCategory).toBe(deps.filterCategory);
    expect(host.selectPage).toBe(deps.selectPage);
    expect(host.openDetail).toBe(deps.openDetail);
    expect(host.afterBuild).toBe(deps.afterBuild);
    expect(host.isHomeScreen()).toBe(true);
    expect(host.onHeroLeft).toBe(deps.onHeroLeft);
  });

  it("builds the live page host with the provided callbacks", () => {
    const state = {} as never;
    const deps = {
      state,
      getChannels: vi.fn(() => []),
      getRows: vi.fn(() => []),
      createVideo: vi.fn(),
      el: vi.fn(),
      focus: vi.fn(),
      canFocus: vi.fn(() => true),
      openCategories: vi.fn(),
      toggleFavorites: vi.fn(),
      openSearch: vi.fn(),
      selectChannel: vi.fn(),
      openPlayer: vi.fn(),
      focusLive: vi.fn(),
      focusTab: vi.fn()
    };
    const host = createHomeLivePageHost(deps as never);

    expect(host.state).toBe(state);
    expect(host.getChannels).toBe(deps.getChannels);
    expect(host.openCategories).toBe(deps.openCategories);
    expect(host.toggleFavorites).toBe(deps.toggleFavorites);
    host.openPlayer();
    expect(deps.openPlayer).toHaveBeenCalledWith("live");
  });

  it("builds the shell host with the provided callbacks", () => {
    const state = {} as never;
    const deps = {
      state,
      byId: vi.fn(),
      el: vi.fn(),
      clear: vi.fn(),
      focus: vi.fn(),
      getTabs: vi.fn(() => []),
      getIcons: vi.fn(() => ({})),
      getPageCount: vi.fn(() => 7),
      getInitialPage: vi.fn(() => 1),
      getChannels: vi.fn(() => []),
      getLiveFocus: vi.fn(() => null),
      selectTab: vi.fn(),
      focusHomeTab: vi.fn(),
      openSettings: vi.fn(),
      openSearch: vi.fn(),
      openFilter: vi.fn()
    };
    const host = createHomeShellHost(deps as never);

    expect(host.state).toBe(state);
    expect(host.getPageCount()).toBe(7);
    expect(host.getInitialPage()).toBe(1);
    expect(host.selectTab).toBe(deps.selectTab);
    expect(host.openFilter).toBe(deps.openFilter);
  });
});
