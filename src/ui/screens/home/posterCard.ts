export interface PosterItem {
  poster?: string;
  title?: string;
  [key: string]: unknown;
}

export interface PosterNode {
  style: { display?: string };
  appendChild(node: PosterNode): void;
  setAttribute(name: string, value: string): void;
  onerror?: (() => void) | null;
  _item?: PosterItem;
  _activate?: (() => void) | null;
}

export interface PosterOptions {
  gold?: boolean;
  type3?: boolean;
}

export interface PosterHost {
  el(tag: string, className?: string, text?: string): PosterNode;
  place(node: PosterNode, left: number, top: number, width: number, height: number): PosterNode;
  openDetail(item: PosterItem): void;
  afterBuild(): void;
}

let host: PosterHost | null = null;

export function attachPosterCard(next: PosterHost): boolean {
  host = next;
  return true;
}

export function hasPosterCardRuntime(): boolean {
  return host !== null;
}

export function resetPosterCardRuntime(): void {
  host = null;
}

export function buildHomePoster(
  item: PosterItem,
  left: number,
  top: number,
  width: number,
  height: number,
  options?: PosterOptions
): PosterNode | null {
  if (!host || !item) {
    return null;
  }
  const settings = options || {};
  const node = host.el(
    "div",
    "poster focusable" +
      (settings.gold ? " gold" : "") +
      (settings.type3 ? " type3" : "")
  );
  host.place(node, left, top, width, height);
  if (item.poster) {
    const image = host.el("img", "p-img");
    image.setAttribute("data-poster-src", item.poster);
    image.onerror = function onPosterError() {
      image.style.display = "none";
    };
    node.appendChild(image);
  }
  if (!settings.gold) {
    node.appendChild(host.el("div", "p-shade"));
    node.appendChild(host.el("div", "p-title", item.title || ""));
  }
  node._item = item;
  node._activate = function activatePoster() {
    host?.openDetail(item);
  };
  host.afterBuild();
  return node;
}
