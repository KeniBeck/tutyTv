import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppState } from "../../runtime/state";
import {
  attachHomeTabs,
  buildHomeTabs,
  ensureHomePage,
  isHomeTabsBuilt,
  resetHomeTabsRuntime,
  selectHomeTab,
  type HomeTabNode
} from "./homeTabs";

function node(): HomeTabNode {
  const classes = new Set<string>();
  return {
    classList: {
      add: (...names: string[]) => { for (const name of names) classes.add(name); },
      remove: (...names: string[]) => { for (const name of names) classes.delete(name); },
      toggle: (name: string, force?: boolean) => {
        const next = force === undefined ? !classes.has(name) : force;
        if (next) classes.add(name); else classes.delete(name);
      }
    }
  };
}

function setup() {
  const state = createAppState();
  state.screen = "home";
  const pages = [node(), node(), node()];
  const tabs = [node(), node(), node()];
  const rows = [node(), node()];
  const liveFocus = node();
  const buildPage = vi.fn();
  const host = {
    state,
    buildShell: () => ({ pages, tabs, initialPage: 1 }),
    getTabConfig: (tab: number) => ({
      page: tab === 0 ? 0 : tab === 1 ? 1 : -1
    }),
    buildPage,
    getPages: () => pages,
    setPages: vi.fn(),
    getTabs: () => tabs,
    setTabs: vi.fn(),
    getLiveRows: () => rows,
    getLiveFocus: () => liveFocus,
    getChannels: () => [{ name: "A" }, { name: "B" }],
    focus: vi.fn(),
    focusHomeTab: vi.fn(),
    stopPreview: vi.fn(),
    previewChannel: vi.fn(),
    isWeb: () => true,
    stopWebMedia: vi.fn(),
    openSettings: vi.fn(),
    afterBuild: vi.fn()
  };
  attachHomeTabs(host as never);
  return { state, pages, tabs, rows, liveFocus, buildPage, host };
}

describe("home tabs", () => {
  afterEach(() => resetHomeTabsRuntime());

  it("builds the shell and the initial page", () => {
    const { buildPage, host } = setup();

    expect(buildHomeTabs()).toBe(true);
    expect(isHomeTabsBuilt()).toBe(true);
    expect(host.setPages).toHaveBeenCalled();
    expect(host.setTabs).toHaveBeenCalled();
    expect(buildPage).toHaveBeenCalledTimes(1);
    expect(buildPage).toHaveBeenCalledWith(1, expect.anything());
  });

  it("builds lazily and ignores unknown pages", () => {
    const { buildPage } = setup();
    buildHomeTabs();

    expect(ensureHomePage(2)).toBe(true);
    expect(ensureHomePage(2)).toBe(true);
    expect(buildPage).toHaveBeenCalledTimes(2);
    expect(ensureHomePage(9)).toBe(false);
  });

  it("switches tabs, previews live and focuses rows", () => {
    const { state, pages, tabs, rows, buildPage, host } = setup();
    buildHomeTabs();
    state.channel = 1;
    rows[1]!._channel = 1;

    expect(selectHomeTab(0, true)).toBe(true);
    expect(state.tab).toBe(0);
    expect(tabs[0]?.classList.toggle).toBeDefined();
    expect(host.stopWebMedia).toHaveBeenCalled();
    expect(host.previewChannel).toHaveBeenCalledWith({ name: "B" });
    expect(pages[0]).toBeDefined();
    expect(host.focus).toHaveBeenCalledWith(rows[1]);
    expect(host.afterBuild).toHaveBeenCalled();
    void buildPage;
  });

  it("stops the preview and focuses the tab on VOD pages", () => {
    const { state, host } = setup();
    buildHomeTabs();
    state.tab = 0;

    expect(selectHomeTab(1, true)).toBe(true);
    expect(host.stopPreview).toHaveBeenCalled();
    expect(host.focusHomeTab).toHaveBeenCalledWith(1);
  });

  it("opens settings for negative pages", () => {
    const { state, host } = setup();
    buildHomeTabs();
    state.tab = 1;

    expect(selectHomeTab(2, false)).toBe(false);
    expect(host.openSettings).toHaveBeenCalled();
  });
});
