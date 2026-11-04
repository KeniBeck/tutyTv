import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  attachAddonsDialog,
  closeAddons,
  installAddonList,
  openAddons,
  resetAddonsDialogRuntime,
  type AddonsDialogHost
} from "./addonsDialog";
import type { M3uAddon } from "../../../core/usecases/live/addons";

class FakeNode {
  className = "";
  textContent = "";
  value = "";
  style: Record<string, string> = {};
  children: FakeNode[] = [];
  parentNode: FakeNode | null = null;
  _activate?: () => void;
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

  querySelector(selector: string) {
    if (selector === ".focusable" || selector === "#pc-btn-addons") {
      return this.children[0] || null;
    }
    return null;
  }
}

function createHost() {
  const nodes: Record<string, FakeNode> = {
    "dialog-addons": new FakeNode(),
    "da-presets-list": new FakeNode(),
    "da-installed-list": new FakeNode(),
    "da-btn-add-custom": new FakeNode(),
    "da-custom-url": new FakeNode(),
    "da-btn-exit": new FakeNode()
  };
  const addons: M3uAddon[] = [{ id: "one", name: "Lista", url: "https://one", count: 2 }];
  const focus = vi.fn();
  let open = false;
  const host: AddonsDialogHost = {
    getPresets: () => [
      { id: "p1", name: "Preset 1", url: "https://p1", desc: "Uno" },
      { id: "p2", name: "Preset 2", url: "https://p2", desc: "Dos" }
    ],
    getAddons: () => addons,
    saveAddons: vi.fn(),
    installAddon: vi.fn((_entry, done) => done(null, 3)),
    requestM3u: vi.fn((_url, done) => done(null, { channels: [{ name: "A" }, { name: "B" }] })),
    getSelectedCategory: () => ({ id: "addons", name: "Addons", isAddon: true }),
    reloadChannels: vi.fn(),
    byId: (id) => (nodes[id] as unknown as ReturnType<AddonsDialogHost["byId"]>) || null,
    el: (tag, className, text) => {
      const node = new FakeNode();
      node.className = className || "";
      node.textContent = text || "";
      return node as unknown as ReturnType<AddonsDialogHost["el"]>;
    },
    clear: (element) => {
      (element as unknown as FakeNode).children = [];
    },
    firstFocus: (root) => ((root as unknown as FakeNode).children[0] as unknown as ReturnType<AddonsDialogHost["firstFocus"]>) || null,
    focus,
    isChannelsOpen: () => true,
    getChannelsPanel: () => nodes["dialog-addons"] as unknown as ReturnType<AddonsDialogHost["getChannelsPanel"]>,
    getPlayerFocus: () => new FakeNode() as unknown as ReturnType<AddonsDialogHost["getPlayerFocus"]>,
    setOpen: (value) => {
      open = value;
    }
  };
  nodes["dialog-addons"]?.appendChild(nodes["da-presets-list"] as FakeNode);
  return { host, nodes, addons, focus, isOpen: () => open };
}

describe("addons dialog runtime", () => {
  beforeEach(() => {
    resetAddonsDialogRuntime();
  });

  it("opens the dialog and renders presets and installed addons", () => {
    const { host, nodes, focus, isOpen } = createHost();
    attachAddonsDialog(host);

    expect(openAddons()).toBe(true);
    expect(isOpen()).toBe(true);
    expect(nodes["dialog-addons"]?.classList.contains("is-active")).toBe(true);
    expect(nodes["da-presets-list"]?.children).toHaveLength(2);
    expect(nodes["da-installed-list"]?.children).toHaveLength(1);
    expect(focus).toHaveBeenCalled();
  });

  it("installs a preset and refreshes the dialog", () => {
    const { host, nodes } = createHost();
    attachAddonsDialog(host);
    openAddons();
    const presetButton = nodes["da-presets-list"]?.children[0]?.children[1];
    presetButton?._activate?.();
    expect(host.installAddon).toHaveBeenCalledWith(expect.objectContaining({ url: "https://p1" }), expect.any(Function));
    expect(host.reloadChannels).toHaveBeenCalled();
  });

  it("removes an installed addon", () => {
    const { host, nodes } = createHost();
    attachAddonsDialog(host);
    openAddons();
    const installedItem = nodes["da-installed-list"]?.children[0];
    const removeButton = installedItem?.children[1];
    removeButton?._activate?.();
    expect(host.saveAddons).toHaveBeenCalledWith([]);
  });

  it("closes the dialog and restores the player focus", () => {
    const { host, nodes, focus, isOpen } = createHost();
    attachAddonsDialog(host);
    openAddons();
    focus.mockClear();
    expect(closeAddons()).toBe(true);
    expect(isOpen()).toBe(false);
    expect(nodes["dialog-addons"]?.classList.contains("is-active")).toBe(false);
    expect(focus).toHaveBeenCalled();
  });
  it("installs an M3U list and persists the addon count", () => {
    const { host } = createHost();
    attachAddonsDialog(host);
    const done = vi.fn();

    expect(installAddonList({ id: "p1", name: "Preset", url: "https://p1" }, done)).toBe(true);
    expect(host.requestM3u).toHaveBeenCalledWith("https://p1", expect.any(Function));
    expect(host.saveAddons).toHaveBeenCalledWith([
      expect.objectContaining({ id: "one", count: 2 }),
      expect.objectContaining({ id: "p1", url: "https://p1", count: 2 })
    ]);
    expect(done).toHaveBeenCalledWith(null, 2);
  });

});
