import { describe, expect, it, vi } from "vitest";
import { attachLiveList, renderLiveList, selectLiveChannel, type LiveChannel, type LiveListHost, type LiveNode } from "./liveList";
import { createAppState } from "../../runtime/state";

class FakeNode {
  className = "";
  textContent = "";
  style: Record<string, string> = {};
  children: FakeNode[] = [];
  parentNode: FakeNode | null = null;
  scrollTop = 0;
  scrollHeight = 1000;
  clientHeight = 300;
  _channel?: number;
  _favBtn?: FakeNode;
  _activate?: () => void;
  _onMove?: (direction: string) => boolean;
  _classes = new Set<string>();

  classList = {
    add: (name: string) => this._classes.add(name),
    remove: (name: string) => this._classes.delete(name),
    toggle: (name: string, force?: boolean) => {
      if (force === true) {
        this._classes.add(name);
      } else if (force === false) {
        this._classes.delete(name);
      } else if (this._classes.has(name)) {
        this._classes.delete(name);
      } else {
        this._classes.add(name);
      }
    },
    contains: (name: string) => this._classes.has(name)
  };

  appendChild(child: FakeNode) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }
}

function createHost() {
  const channels: LiveChannel[] = [
    { id: "a", name: "Canal A", logo: "a.png" },
    { id: "b", name: "Canal B" }
  ];
  const state = createAppState();
  const container = new FakeNode();
  const label = new FakeNode();
  const rows: FakeNode[] = [];
  const host: LiveListHost = {
    state,
    getChannels: () => channels,
    getRows: () => rows as unknown as LiveNode[],
    getListContainer: () => container as unknown as LiveNode,
    getChannelLabel: () => label as unknown as LiveNode,
    getTabs: () => [],
    getLiveFocus: () => null,
    getFastAll: () => null,
    isFavoritesOnly: () => false,
    isLoading: () => true,
    filterChannels: (favoritesOnly) => channels
      .map((channel, index) => ({ channel, index }))
      .filter((entry) => !favoritesOnly || entry.channel.fav),
    isFavorite: (channel) => Boolean(channel.fav),
    toggleFavorite: (channel) => {
      channel.fav = !channel.fav;
      return Boolean(channel.fav);
    },
    focus: vi.fn(),
    focusLiveList: vi.fn(),
    canFocus: () => true,
    el: (tag, className, text) => {
      const node = new FakeNode();
      node.className = className || "";
      node.textContent = text || "";
      return node as unknown as LiveNode;
    },
    clear: (element) => {
      const node = element as unknown as FakeNode;
      node.children = [];
    },
    openPlayer: vi.fn(),
    isPlayerScreen: () => false,
    isLiveMode: () => false,
    isHomeLive: () => true,
    canRefreshPlayerChannels: () => true,
    refreshPlayerChannels: vi.fn(),
    playPlayerChannel: vi.fn(),
    previewChannel: vi.fn(),
    updateLabel: vi.fn()
  };
  state.screen = "home";
  state.tab = 0;
  state.channel = 0;
  return { host, state, channels, container, label, rows };
}

describe("live list runtime", () => {
  it("renders channels and updates the active label", () => {
    const { host, container, label, rows } = createHost();
    attachLiveList(host);

    expect(renderLiveList()).toBe(true);
    expect(rows).toHaveLength(2);
    expect(container.children).toHaveLength(2);
    expect(rows[0]?.classList.contains("is-current")).toBe(true);
    expect(label.textContent).toBe("Canal A");
    expect(host.updateLabel).toHaveBeenCalled();
  });

  it("selects a channel and updates preview state", () => {
    const { host, state, channels, label, rows } = createHost();
    attachLiveList(host);
    renderLiveList();

    expect(selectLiveChannel(1, true)).toBe(true);
    expect(state.channel).toBe(1);
    expect(rows[0]?.classList.contains("is-current")).toBe(false);
    expect(rows[1]?.classList.contains("is-current")).toBe(true);
    expect(label.textContent).toBe("Canal B");
    expect(host.previewChannel).toHaveBeenCalledWith(channels[1]);
  });

  it("renders only favorites when the filter is active", () => {
    const { host, channels, rows } = createHost();
    channels[1]!.fav = true;
    host.isFavoritesOnly = () => true;
    attachLiveList(host);

    renderLiveList(true);
    expect(rows).toHaveLength(1);
    expect(rows[0]?._channel).toBe(1);
  });

  it("toggles a favourite from the row heart", () => {
    const { host, channels, rows } = createHost();
    attachLiveList(host);
    renderLiveList();

    rows[0]?._favBtn?._activate?.();
    expect(channels[0]?.fav).toBe(true);
    expect(rows[0]?._favBtn?.classList.contains("is-fav")).toBe(true);
  });

  it("keeps focus on the favorite when the list reloads", () => {
    const { host, state, rows } = createHost();
    attachLiveList(host);
    renderLiveList();
    const firstFavorite = rows[0]?._favBtn;
    state.focus = firstFavorite as never;

    renderLiveList();

    expect(host.focus).toHaveBeenLastCalledWith(rows[0]?._favBtn);
  });

  it("shows the loading message when no channels exist", () => {
    const { host, channels, container } = createHost();
    channels.length = 0;
    attachLiveList(host);

    renderLiveList();
    expect(container.children[0]?.textContent).toBe("No se encontraron canales");
  });
});
