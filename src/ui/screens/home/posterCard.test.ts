import { afterEach, describe, expect, it, vi } from "vitest";
import {
  attachPosterCard,
  buildHomePoster,
  resetPosterCardRuntime,
  type PosterNode
} from "./posterCard";

function node(className = "", text = ""): PosterNode & { children: PosterNode[]; className: string; textContent: string; attributes: Record<string, string> } {
  const value = {
    className,
    textContent: text,
    style: {} as { display?: string },
    attributes: {} as Record<string, string>,
    children: [] as PosterNode[],
    appendChild(child: PosterNode) { value.children.push(child); },
    setAttribute(name: string, content: string) { value.attributes[name] = content; },
    onerror: null
  };
  return value;
}

function setup() {
  const host = {
    el: (tag: string, className?: string, text?: string) => node(className, text) as never,
    place: vi.fn((element: PosterNode) => element),
    openDetail: vi.fn(),
    afterBuild: vi.fn()
  };
  attachPosterCard(host as never);
  return host;
}

describe("home poster card", () => {
  afterEach(() => resetPosterCardRuntime());

  it("builds a poster with title, shade and lazy image", () => {
    const host = setup();
    const item = { id: "1", title: "Peli", poster: "poster.jpg" };
    const poster = buildHomePoster(item, 10, 20, 250, 360) as ReturnType<typeof node>;
    const image = poster.children[0] as ReturnType<typeof node>;

    expect(host.place).toHaveBeenCalledWith(poster, 10, 20, 250, 360);
    expect(image.attributes["data-poster-src"]).toBe("poster.jpg");
    expect((poster.children[1] as ReturnType<typeof node>).className).toBe("p-shade");
    expect((poster.children[2] as ReturnType<typeof node>).textContent).toBe("Peli");
    expect(poster._item).toBe(item);
    expect(host.afterBuild).toHaveBeenCalled();
    poster._activate?.();
    expect(host.openDetail).toHaveBeenCalledWith(item);
  });

  it("builds gold cards without title/shade", () => {
    setup();
    const poster = buildHomePoster({ title: "Peli" }, 0, 0, 100, 100, { gold: true }) as ReturnType<typeof node>;
    expect(poster.className).toContain("gold");
    expect(poster.children).toHaveLength(0);
  });

  it("hides broken images", () => {
    setup();
    const poster = buildHomePoster({ poster: "bad.jpg" }, 0, 0, 100, 100) as ReturnType<typeof node>;
    const image = poster.children[0] as ReturnType<typeof node>;
    image.onerror?.();
    expect(image.style.display).toBe("none");
  });

  it("returns null without an item", () => {
    setup();
    expect(buildHomePoster(null as never, 0, 0, 10, 10)).toBeNull();
  });
});
