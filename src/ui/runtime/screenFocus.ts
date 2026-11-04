import { computeLegacyScrollAdjustment } from "../../core/usecases/ui/focusScroll";
import { isLegacyFocusVisible } from "../../core/usecases/ui/focusVisibility";
import { moveFocus } from "./focus";
import type { AppState } from "./state";

export interface FocusRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface FocusNode {
  parentNode?: FocusNode | null;
  offsetParent?: unknown;
  classList: {
    contains(name: string): boolean;
  };
  getBoundingClientRect(): FocusRect & { width: number; height: number };
  querySelectorAll(selector: string): ArrayLike<FocusNode>;
  offsetWidth?: number;
  offsetHeight?: number;
  scrollWidth?: number;
  clientWidth?: number;
  scrollTop?: number;
  scrollLeft?: number;
  scrollHeight?: number;
  clientHeight?: number;
}

export interface ScreenFocusHost {
  state: AppState;
  closest(node: FocusNode, selector: string): FocusNode | null;
  queryFocusables(): ArrayLike<FocusNode>;
  getTabFocus(): Array<FocusNode | null>;
  getTabItems(): Array<FocusNode | undefined>;
  getPages(): Array<FocusNode | undefined>;
  getTabPage(tab: number): number;
  isPlaySettingsOpen(): boolean;
  isPlaySettingViewOpen(): boolean;
  focus(node: FocusNode | null, silent?: boolean): void;
}

let host: ScreenFocusHost | null = null;

export function attachScreenFocus(next: ScreenFocusHost): boolean {
  host = next;
  return true;
}

export function hasScreenFocusRuntime(): boolean {
  return host !== null;
}

export function resetScreenFocusRuntime(): void {
  host = null;
}

export function isLegacyFocusVisibleNode(element: FocusNode): boolean {
  if (!host) {
    return false;
  }
  const state = host.state;
  return isLegacyFocusVisible(
    {
      closest(selector: string) {
        const node = host?.closest(element, selector) || null;
        return node
          ? {
            hasClass(name: string) {
              return node.classList.contains(name);
            }
          }
          : null;
      }
    },
    {
      episodeBrowserOpen: Boolean(state.episodeBrowserOpen),
      categoryPickerOpen: Boolean(state.categoryPickerOpen),
      liveCategoriesOpen: Boolean(state.liveCategoriesOpen),
      liveSearchOpen: Boolean(state.liveSearchOpen),
      resumeOpen: Boolean(state.resumeOpen),
      filterOpen: Boolean(state.filterOpen),
      playSettingsOpen: host.isPlaySettingsOpen(),
      playSettingViewOpen: host.isPlaySettingViewOpen(),
      nextEpisodeOpen: Boolean(state.nextEpisodeOpen)
    }
  );
}

export function canFocusLegacyNode(element: FocusNode | null | undefined): boolean {
  if (!element || !element.getBoundingClientRect) {
    return false;
  }
  if (element.offsetParent === null) {
    return false;
  }
  const rect = element.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) {
    return false;
  }
  return isLegacyFocusVisibleNode(element);
}

export function getLegacyFocusables(): FocusNode[] {
  if (!host) {
    return [];
  }
  const nodes = host.queryFocusables();
  const result: FocusNode[] = [];
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (node && canFocusLegacyNode(node)) {
      result.push(node);
    }
  }
  return result;
}

export function scrollLegacyFocusIntoView(element: FocusNode | null): boolean {
  if (!host || !element) {
    return false;
  }
  let container = host.closest(element, ".scrollable");
  while (container) {
    const rect = element.getBoundingClientRect();
    const bounds = container.getBoundingClientRect();
    const adjustment = computeLegacyScrollAdjustment(rect, bounds, {
      offsetWidth: container.offsetWidth || 0,
      offsetHeight: container.offsetHeight || 0,
      scrollWidth: container.scrollWidth || 0,
      clientWidth: container.clientWidth || 0
    });
    container.scrollTop = (container.scrollTop || 0) + adjustment.top;
    container.scrollLeft = (container.scrollLeft || 0) + adjustment.left;
    container = container.parentNode
      ? host.closest(container.parentNode, ".scrollable")
      : null;
  }
  return true;
}

export function firstLegacyFocus(root: FocusNode | null): FocusNode | null {
  if (!root) {
    return null;
  }
  const nodes = root.querySelectorAll(".focusable");
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (node && canFocusLegacyNode(node)) {
      return node;
    }
  }
  return null;
}

export function focusHomeTab(tab: number): boolean {
  if (!host) {
    return false;
  }
  const saved = host.getTabFocus()[tab];
  if (saved && saved.parentNode && canFocusLegacyNode(saved)) {
    host.focus(saved);
    return true;
  }
  const page = host.getTabPage(tab);
  const first = page >= 0 ? firstLegacyFocus(host.getPages()[page] || null) : null;
  if (first) {
    host.focus(first);
  } else {
    host.focus(host.getTabItems()[tab] || null);
  }
  return true;
}

export function moveLegacyFocus(direction: string): boolean {
  if (!host) {
    return false;
  }
  moveFocus(direction);
  return true;
}
