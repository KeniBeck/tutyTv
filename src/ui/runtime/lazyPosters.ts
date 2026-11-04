import type { AppState } from "./state";

export interface LazyPosterNode {
  style: { display?: string };
  src?: string;
  classList?: { contains(name: string): boolean };
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  getBoundingClientRect?(): { bottom: number; top: number; right: number; left: number };
}

export interface LazyPosterHost {
  state: AppState;
  closest(node: LazyPosterNode, selector: string): LazyPosterNode | null;
  queryPosters(): ArrayLike<LazyPosterNode>;
  getViewport(): { width: number; height: number };
}

let host: LazyPosterHost | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

export function attachLazyPosters(next: LazyPosterHost): boolean {
  host = next;
  return true;
}

export function hasLazyPostersRuntime(): boolean {
  return host !== null;
}

export function resetLazyPostersRuntime(): void {
  host = null;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

export function scheduleLazyPosters(): boolean {
  if (!host) {
    return false;
  }
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(function loadPostersLater() {
    timer = null;
    loadVisiblePosters();
  }, 80);
  return true;
}

export function loadVisiblePosters(): boolean {
  if (!host) {
    return false;
  }
  const posters = host.queryPosters();
  const viewport = host.getViewport();
  for (let index = 0; index < posters.length; index += 1) {
    const image = posters[index];
    if (!image) {
      continue;
    }
    const container = host.closest(image, ".poster, .bento");
    const rect = container && container.getBoundingClientRect
      ? container.getBoundingClientRect()
      : null;
    if (
      isPosterVisible(image)
      && rect
      && rect.bottom > -420
      && rect.top < viewport.height + 420
      && rect.right > -320
      && rect.left < viewport.width + 320
    ) {
      if (!image.getAttribute("src")) {
        image.style.display = "";
        image.src = image.getAttribute("data-poster-src") || "";
      }
    } else if (image.getAttribute("src")) {
      image.removeAttribute("src");
      try {
        image.src = "";
      } catch {
        // Ignore source cleanup failures for lazy posters.
      }
    }
  }
  return true;
}

export function isPosterVisible(image: LazyPosterNode): boolean {
  if (!host) {
    return false;
  }
  if (host.state.screen === "home") {
    const page = host.closest(image, ".home-page");
    return Boolean(page && page.classList && page.classList.contains("is-current"));
  }
  if (host.state.screen === "search") {
    const results = host.closest(image, ".search-results");
    return Boolean(results && results.classList && results.classList.contains("is-active"));
  }
  if (host.state.screen === "detail") {
    const detail = host.closest(image, "#screen-detail");
    return Boolean(detail && detail.classList && detail.classList.contains("is-active"));
  }
  return false;
}
