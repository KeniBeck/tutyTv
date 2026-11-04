import { closest } from "./dom";
import type { AppState, FocusableElement } from "./state";

export interface FocusDependencies {
  state: AppState;
  byId(id: string): HTMLElement | null;
  getFocusables(): FocusableElement[];
  getTabFocus(): Array<FocusableElement | null>;
  getTabItems(): Array<FocusableElement | undefined>;
  scrollIntoView(element: FocusableElement): void;
  onFocusChanged(): void;
  afterFocus(): void;
  score?(
    direction: string,
    current: DOMRect,
    candidate: DOMRect
  ): number | null;
}

let dependencies: FocusDependencies | null = null;

export function attachFocus(next: FocusDependencies): boolean {
  dependencies = next;
  return true;
}

export function hasFocusRuntime(): boolean {
  return dependencies !== null;
}

export function focusElement(element: FocusableElement | null, silent?: boolean): boolean {
  if (!dependencies || !element) {
    return false;
  }
  const { state, byId, scrollIntoView, onFocusChanged, afterFocus, getTabFocus } = dependencies;

  if (state.focus !== element) {
    if (state.focus && state.screen === "home" && closest(state.focus, ".home-page")) {
      getTabFocus()[state.tab] = state.focus;
    }
    if (state.focus) {
      state.focus.classList.remove("is-focused");
    }
    state.focus = element;
    element.classList.add("is-focused");
    element._onFocus?.();
    onFocusChanged();

    const tabs = byId("home-tabs");
    if (tabs && state.screen === "home") {
      const inTabs = !!closest(element, ".home-tabs");
      tabs.classList.toggle("is-expanded", inTabs);
      tabs.classList.toggle("is-collapsed", !inTabs);
      const sidebar = document.querySelector(".home-sidebar-bg");
      if (sidebar) {
        sidebar.classList.toggle("is-on", inTabs);
      }
    }

    if (!silent) {
      scrollIntoView(element);
    }
    afterFocus();
  } else if (!silent) {
    scrollIntoView(element);
  }
  return true;
}

export function moveFocus(direction: string): boolean {
  if (!dependencies) {
    return false;
  }
  const { state, getFocusables, focusElement: focus, score, getTabItems } = {
    ...dependencies,
    focusElement
  };

  if (state.focus) {
    if (state.focus._onMove?.(direction)) {
      return true;
    }

    const inPage = state.screen === "home" && !!closest(state.focus, ".home-page");
    const inTabs = state.screen === "home" && !!closest(state.focus, ".home-tabs");
    const candidates = getFocusables();
    const currentRect = state.focus.getBoundingClientRect();
    const currentX = currentRect.left + currentRect.width / 2;
    const currentY = currentRect.top + currentRect.height / 2;
    let target: FocusableElement | null = null;
    let best = Infinity;

    for (const candidate of candidates) {
      if (candidate === state.focus) {
        continue;
      }
      if (inPage && closest(candidate, ".home-tabs")) {
        continue;
      }
      if (inTabs && !closest(candidate, ".home-tabs")) {
        continue;
      }

      const candidateRect = candidate.getBoundingClientRect();
      const dx = candidateRect.left + candidateRect.width / 2 - currentX;
      const dy = candidateRect.top + candidateRect.height / 2 - currentY;
      if (score) {
        const directScore = score(direction, currentRect, candidateRect);
        if (directScore !== null && directScore !== undefined && directScore < best) {
          best = directScore;
          target = candidate;
        }
        continue;
      }

      let distanceX: number;
      let distanceY: number;
      let aligned: boolean;
      if (direction === "left") {
        if (dx > -4) {
          continue;
        }
        distanceX = Math.max(0, currentRect.left - candidateRect.right);
        distanceY = Math.abs(dy);
        aligned = candidateRect.bottom > currentRect.top + 2 && candidateRect.top < currentRect.bottom - 2;
      } else if (direction === "right") {
        if (dx < 4) {
          continue;
        }
        distanceX = Math.max(0, candidateRect.left - currentRect.right);
        distanceY = Math.abs(dy);
        aligned = candidateRect.bottom > currentRect.top + 2 && candidateRect.top < currentRect.bottom - 2;
      } else if (direction === "up") {
        if (dy > -4) {
          continue;
        }
        distanceX = Math.max(0, currentRect.top - candidateRect.bottom);
        distanceY = Math.abs(dx);
        aligned = candidateRect.right > currentRect.left + 2 && candidateRect.left < currentRect.right - 2;
      } else {
        if (dy < 4) {
          continue;
        }
        distanceX = Math.max(0, candidateRect.top - currentRect.bottom);
        distanceY = Math.abs(dx);
        aligned = candidateRect.right > currentRect.left + 2 && candidateRect.left < currentRect.right - 2;
      }

      const value = distanceX + 0.5 * distanceY + (aligned ? 0 : 320);
      if (value < best) {
        best = value;
        target = candidate;
      }
    }

    if (target) {
      focus(target);
    } else if (direction === "left" && inPage) {
      const tab = getTabItems()[state.tab];
      if (tab) {
        focus(tab);
      }
    }
  } else {
    const first = getFocusables()[0];
    if (first) {
      focus(first);
    }
  }
  return true;
}

export type FocusHostDeps = Omit<FocusDependencies, "score">;

interface FocusScoreCore {
  scoreLegacyFocus?(direction: string, current: DOMRect, candidate: DOMRect): number | null | undefined;
}

export function createFocusHost(deps: FocusHostDeps): FocusDependencies {
  return {
    ...deps,
    score: function score(direction: string, current: DOMRect, candidate: DOMRect) {
      const core = (window as unknown as { TutyCore?: FocusScoreCore }).TutyCore;
      if (!core || typeof core.scoreLegacyFocus !== "function") {
        return null;
      }
      const value = core.scoreLegacyFocus(direction, current, candidate);
      return null === value || void 0 === value ? null : value;
    }
  };
}
