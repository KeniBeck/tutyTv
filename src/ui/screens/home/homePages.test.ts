import { describe, expect, it, vi } from "vitest";
import { buildHomeVodPage, type HomeItem, type HomeNode, type HomePageHost } from "./homePages";

class FakeNode {
  className = "";
  textContent = "";
  style: Record<string, string> = {};
  children: FakeNode[] = [];
  parentNode: FakeNode | null = null;
  attributes: Record<string, string> = {};
  _item?: HomeItem;
  _activate?: () => void;
  _onMove?: (direction: string) => boolean;
  _bentoTimer?: ReturnType<typeof setInterval> | null = null;

  constructor(public tagName: string) {}

  appendChild(child: FakeNode) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child: FakeNode) {
    this.children = this.children.filter((item) => item !== child);
    child.parentNode = null;
  }

  setAttribute(name: string, value: string) {
    this.attributes[name] = value;
  }

  querySelector(selector: string) {
    const className = selector.replace(/^\./, "");
    return this.children.find((child) => child.className.split(" ").includes(className)) ?? null;
  }
}

function createHost(overrides: Partial<HomePageHost> = {}) {
  const item: HomeItem = {
    id: "item-1",
    title: "Titulo",
    poster: "poster.jpg",
    landscape: "landscape.jpg",
    _portal: true
  };
  const host: HomePageHost = {
    getCatalog: () => [item],
    filterCategory: vi.fn(() => [item]),
    selectPage: vi.fn(() => [item]),
    el: (tag, className, text) => {
      const node = new FakeNode(tag);
      node.className = className || "";
      node.textContent = text || "";
      return node as unknown as HomeNode;
    },
    place: (element, left, top, width, height) => {
      element.style.left = `${left}px`;
      element.style.top = `${top}px`;
      if (width !== undefined) {
        element.style.width = `${width}px`;
      }
      if (height !== undefined) {
        element.style.height = `${height}px`;
      }
      return element;
    },
    openDetail: vi.fn(),
    afterBuild: vi.fn(),
    isHomeScreen: () => true,
    onHeroLeft: vi.fn(),
    ...overrides
  };
  return { host, item };
}

describe("buildHomeVodPage", () => {
  it("builds the prototype hero, continue card and featured cards", () => {
    const { host, item } = createHost();
    const raw = new FakeNode("div");
    const page = raw as unknown as HomeNode;

    buildHomeVodPage(1, page, host);

    expect(raw.children.length).toBe(1);
    const content = raw.children[0] as unknown as HomeNode;
    expect(content.className).toContain("home-content");
    const hero = content.children[0] as unknown as HomeNode;
    expect(hero._item).toBe(item);
    hero._activate?.();
    expect(host.openDetail).toHaveBeenCalledWith(item);
    expect(host.afterBuild).toHaveBeenCalled();
  });

  it("keeps the left arrow behaviour on the hero", () => {
    const { host } = createHost();
    const raw = new FakeNode("div");
    const page = raw as unknown as HomeNode;
    buildHomeVodPage(1, page, host);
    const content = raw.children[0] as unknown as HomeNode;
    const hero = content.children[0] as unknown as HomeNode;

    expect(hero._onMove?.("left")).toBe(true);
    expect(host.onHeroLeft).toHaveBeenCalledOnce();
    expect(hero._onMove?.("right")).toBe(false);
  });

  it("falls back to the full catalog for the kids page", () => {
    const { host } = createHost({ selectPage: () => [] });
    const raw = new FakeNode("div");
    const page = raw as unknown as HomeNode;
    buildHomeVodPage(4, page, host);
    expect(raw.children.length).toBe(1);
  });

  it("builds explore rows from category pages", () => {
    const { host } = createHost();
    const raw = new FakeNode("div");
    const page = raw as unknown as HomeNode;
    buildHomeVodPage(6, page, host);
    const content = raw.children[0] as unknown as FakeNode;
    expect(content.children.length).toBeGreaterThan(6);
    expect(host.filterCategory).toHaveBeenCalledWith("pelicula");
    expect(host.filterCategory).toHaveBeenCalledWith("gratis");
  });

  it("does nothing for an unknown page", () => {
    const { host } = createHost();
    const raw = new FakeNode("div");
    const page = raw as unknown as HomeNode;
    buildHomeVodPage(99, page, host);
    expect(raw.children).toHaveLength(0);
  });
});
