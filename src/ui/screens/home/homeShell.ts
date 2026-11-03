import type { AppState } from "../../runtime/state";

export interface HomeShellNode {
  id?: string;
  textContent?: string | null;
  innerHTML?: string;
  style: { backgroundImage?: string };
  classList: {
    add(name: string): void;
    remove(name: string): void;
    toggle(name: string, force?: boolean): void;
  };
  appendChild(node: HomeShellNode): void;
  _tab?: number;
  _channel?: number;
  _activate?: (() => void) | null;
  _onMove?: ((direction: string) => boolean) | null;
}

export interface HomeShellTab {
  label: string;
  page: number;
  icon: string;
}

export interface HomeShellHost {
  state: AppState;
  byId(id: string): HomeShellNode | null;
  el(tag: string, className?: string, text?: string): HomeShellNode;
  clear(node: HomeShellNode): void;
  focus(node: HomeShellNode | null): void;
  getTabs(): HomeShellTab[];
  getIcons(): Record<string, string>;
  getPageCount(): number;
  getInitialPage(): number;
  getChannels(): HomeShellNode[];
  getLiveFocus(): HomeShellNode | null;
  selectTab(index: number, focus: boolean): void;
  focusHomeTab(index: number): void;
  openSettings(): void;
  openSearch(): void;
  openFilter(): void;
}

export interface HomeShellRefs {
  pagesContainer: HomeShellNode;
  notifyContainer: HomeShellNode;
  pages: HomeShellNode[];
  tabs: HomeShellNode[];
  initialPage: number;
}

const CLOCK_INTERVAL_MS = 30000;
let clockTimer: ReturnType<typeof setInterval> | null = null;

export function buildHomeShell(host: HomeShellHost): HomeShellRefs | null {
  const pagesContainer = host.byId("home-pages");
  const notifyContainer = host.byId("home-notify");
  if (!pagesContainer || !notifyContainer) {
    return null;
  }
  stopHomeShellClock();
  host.clear(pagesContainer);
  const pages: HomeShellNode[] = [];
  for (let index = 0; index < host.getPageCount(); index += 1) {
    const page = host.el("div", "home-page scrollable");
    if (index === 0) {
      page.classList.add("is-current");
    }
    pagesContainer.appendChild(page);
    pages.push(page);
  }
  const initialPage = host.getInitialPage();
  const tabs = buildTabs(host);
  buildNotifications(host, notifyContainer);
  clockTimer = setInterval(function tick() {
    updateClock(host);
  }, CLOCK_INTERVAL_MS);
  return { pagesContainer, notifyContainer, pages, tabs, initialPage };
}

export function stopHomeShellClock(): void {
  if (clockTimer) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
}

function buildTabs(host: HomeShellHost): HomeShellNode[] {
  const container = host.byId("home-tabs");
  const tabConfig = host.getTabs();
  const icons = host.getIcons();
  const tabs: HomeShellNode[] = [];
  if (!container) {
    return tabs;
  }
  host.clear(container);
  container.classList.add("scrollable");
  container.classList.add("is-expanded");
  for (let index = 0; index < tabConfig.length; index += 1) {
    const config = tabConfig[index] as HomeShellTab;
    const tab = host.el("div", "tab-item focusable");
    tab.appendChild(host.el("div", "tab-pill"));
    const icon = host.el("div", "tab-icon");
    icon.innerHTML = icons[config.icon] || "";
    tab.appendChild(icon);
    tab.appendChild(host.el("div", "tab-title", config.label));
    tab._tab = index;
    tab._activate = function activateTab() {
      host.selectTab(index, false);
      focusForTab(host, index);
    };
    tab._onMove = function moveTab(direction: string): boolean {
      if (direction === "up") {
        if (index > 0 && tabs[index - 1]) {
          host.focus(tabs[index - 1] || null);
          host.selectTab(index - 1, false);
        }
        return true;
      }
      if (direction === "down") {
        if (index < tabs.length - 1 && tabs[index + 1]) {
          host.focus(tabs[index + 1] || null);
          host.selectTab(index + 1, false);
        }
        return true;
      }
      if (direction === "left") {
        return true;
      }
      if (direction === "right") {
        host.selectTab(index, false);
        focusForTab(host, index);
        return true;
      }
      return false;
    };
    container.appendChild(tab);
    tabs.push(tab);
  }
  return tabs;
}

function focusForTab(host: HomeShellHost, index: number): void {
  if (index === 0) {
    const rows = host.getChannels();
    let row: HomeShellNode | null = null;
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      if (rows[rowIndex]?._channel === host.state.channel) {
        row = rows[rowIndex] || null;
        break;
      }
    }
    if (row) {
      host.focus(row);
    } else if (rows.length) {
      host.focus(rows[0] || null);
    } else {
      host.focus(host.getLiveFocus());
    }
    return;
  }
  if (host.getTabs()[index] && host.getTabs()[index]!.page >= 0) {
    host.focusHomeTab(index);
  }
}

function buildNotifications(host: HomeShellHost, container: HomeShellNode): void {
  host.clear(container);
  const entries = [
    { cls: "search", icon: "assets/original/home/icon_notify_search.png", small: true },
    { cls: "filter", icon: "assets/original/search/icon_category_filter_n.png", small: true },
    { cls: "personal", icon: "assets/original/home/icon_notify_personal.png", small: true }
  ];
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index] as typeof entries[number];
    const item = host.el(
      "div",
      `notify-item focusable ${entry.cls}${entry.small ? " is-small" : ""}`
    );
    const normal = host.el("div", "n-normal");
    normal.style.backgroundImage = `url(${entry.icon})`;
    item.appendChild(normal);
    if (entry.cls === "personal") {
      item._activate = function openPersonal() {
        host.openSettings();
      };
    } else if (entry.cls === "search") {
      item._activate = function openSearch() {
        host.openSearch();
      };
    } else if (entry.cls === "filter") {
      item._activate = function openFilter() {
        host.openFilter();
      };
    } else {
      item._activate = function noop() {};
    }
    container.appendChild(item);
  }
  container.appendChild(host.el("div", "notify-divider"));
  const wifi = host.el("div", "notify-wifi");
  wifi.innerHTML =
    '<svg viewBox="0 0 30 22"><path d="M15 19.5a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2z" fill="currentColor"/><path d="M8.4 12.2a9.6 9.6 0 0 1 13.2 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M4.2 7.6a15.6 15.6 0 0 1 21.6 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
  container.appendChild(wifi);
  const time = host.el("div", "notify-time");
  time.id = "notify-time";
  container.appendChild(time);
  updateClock(host);
}

function updateClock(host: HomeShellHost): void {
  const node = host.byId("notify-time");
  if (!node) {
    return;
  }
  const now = new Date();
  let hours = now.getHours();
  const suffix = hours >= 12 ? "PM" : "AM";
  hours %= 12;
  if (hours === 0) {
    hours = 12;
  }
  node.textContent = `${hours}:${String(now.getMinutes()).padStart(2, "0")} ${suffix}`;
}
