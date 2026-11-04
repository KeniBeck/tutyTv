import type { AppState } from "../../runtime/state";

export interface LivePanelNode {
  textContent?: string | null;
  style: {
    padding?: string;
    color?: string;
    fontSize?: string;
    backgroundImage?: string;
    backgroundSize?: string;
    backgroundRepeat?: string;
    backgroundPosition?: string;
  };
  classList: {
    add(name: string): void;
    remove(name: string): void;
    toggle?(name: string, force?: boolean): void;
  };
  appendChild(node: LivePanelNode): void;
  querySelector(selector: string): LivePanelNode | null;
  offsetLeft?: number;
  offsetWidth?: number;
  scrollLeft?: number;
  clientWidth?: number;
  _activate?: (() => void) | null;
  _onMove?: ((direction: string) => boolean) | null;
  _cat?: LiveCategory;
  _idx?: number;
  _channel?: number;
  _pills?: LivePanelNode[];
}

export interface LiveCategory {
  id?: string | number;
  name?: string;
  isAddon?: boolean;
  [key: string]: unknown;
}

export interface LivePanelChannel {
  index?: string | number;
  name?: string;
  now?: string;
  logo?: string;
  [key: string]: unknown;
}

export interface LiveChannelPanelHost {
  state: AppState;
  getPanel(): LivePanelNode | null;
  getCategories(): LiveCategory[];
  getSelectedCategory(): LiveCategory | null;
  getChannels(): LivePanelChannel[];
  getPageSize(): number;
  getCategorySignature(): string;
  setCategorySignature(value: string): void;
  getFocusCategory(): LiveCategory | null;
  getChannelRows(): Record<string, LivePanelNode>;
  setChannelRows(rows: Record<string, LivePanelNode>): void;
  el(tag: string, className?: string, text?: string): LivePanelNode;
  clear(node: LivePanelNode): void;
  focus(node: LivePanelNode): void;
  focusAndScroll(container: LivePanelNode, node: LivePanelNode): void;
  scrollIntoView(container: LivePanelNode, node: LivePanelNode): void;
  selectCategory(category: LiveCategory): void;
  openCategories(): void;
  openAddons(): void;
  playChannel(index: number, focus: boolean): void;
  closePanel(): void;
  focusCurrentChannel(index: number): void;
  focusPlayer(): void;
}

const DEFAULT_CATEGORIES: LiveCategory[] = [
  { id: 76182, name: "Todos" },
  { id: 76206, name: "Deportes" },
  { id: 76205, name: "Cine y Series" },
  { id: 76188, name: "Colombia" },
  { id: 76191, name: "España" },
  { id: 76197, name: "México" },
  { id: "addons", name: "➕ Addons M3U", isAddon: true }
];

let host: LiveChannelPanelHost | null = null;

export function attachLiveChannelPanel(next: LiveChannelPanelHost): boolean {
  host = next;
  return true;
}

export function hasLiveChannelPanelRuntime(): boolean {
  return host !== null;
}

export function resetLiveChannelPanelRuntime(): void {
  host = null;
}

export function openLiveChannelPanel(): boolean {
  if (!host || host.state.playerMode !== "live") {
    return false;
  }
  const panel = host.getPanel();
  if (!panel) {
    return false;
  }
  host.state.channelsOpen = true;
  panel.classList.add("is-active");
  renderLiveCategories();
  renderLiveChannels(host.state.channel);
  layoutSelectedCategory();
  host.focusCurrentChannel(host.state.channel);
  return true;
}

export function closeLiveChannelPanel(): boolean {
  if (!host) {
    return false;
  }
  const panel = host.getPanel();
  if (!panel) {
    return false;
  }
  host.state.channelsOpen = false;
  panel.classList.remove("is-active");
  if (host.state.screen === "player") {
    host.focusPlayer();
  }
  return true;
}

export function renderLiveCategories(): boolean {
  if (!host) {
    return false;
  }
  const panel = host.getPanel();
  const container = panel?.querySelector(".pc-categories");
  if (!panel || !container) {
    return false;
  }
  const categories = host.getCategories().length ? host.getCategories() : DEFAULT_CATEGORIES;
  const signature = categories.map((category) => `${category.id}|`).join("");
  const focusCategory = host.getFocusCategory();
  if (signature !== host.getCategorySignature()) {
    host.clear(container);
    const pills: LivePanelNode[] = [];
    for (let index = 0; index < categories.length; index += 1) {
      const category = categories[index] as LiveCategory;
      const pill = host.el("button", "pc-cat-pill focusable", category.name);
      pill._cat = category;
      pill._idx = index;
      pill._activate = function activateCategory() {
        host?.selectCategory(category);
      };
      pill._onMove = function moveCategory(direction: string) {
        if (!host) {
          return false;
        }
        if (direction === "left") {
          if (index > 0 && pills[index - 1]) {
            host.focusAndScroll(container, pills[index - 1] as LivePanelNode);
          }
          return true;
        }
        if (direction === "right") {
          if (index < pills.length - 1 && pills[index + 1]) {
            host.focusAndScroll(container, pills[index + 1] as LivePanelNode);
          } else {
            host.focusPlayer();
          }
          return true;
        }
        if (direction === "up") {
          host.openCategories();
          return true;
        }
        if (direction === "down") {
          const promo = panel.querySelector(".pc-row-addon-promo");
          if (promo) {
            host.focus(promo);
          } else if (host.getChannels().length) {
            focusChannelRow(host.state.channel);
          }
          return true;
        }
        return false;
      };
      container.appendChild(pill);
      pills.push(pill);
    }
    container._pills = pills;
    host.setCategorySignature(signature);
  }
  const selected = host.getSelectedCategory() || categories[0];
  const pills = container._pills || [];
  for (let index = 0; index < pills.length; index += 1) {
    const pill = pills[index] as LivePanelNode;
    if (pill._cat && selected && pill._cat.id === selected.id) {
      pill.classList.add("is-selected");
    } else {
      pill.classList.remove("is-selected");
    }
  }
  const focusedNode = host.state.focus as (LivePanelNode & {
    closest?: (selector: string) => LivePanelNode | null;
  }) | null;
  const focusInCategories = Boolean(
    focusedNode
    && typeof focusedNode.closest === "function"
    && focusedNode.closest(".pc-categories")
  );
  if (focusCategory && focusInCategories) {
    for (const pill of pills) {
      if (pill._cat && pill._cat.id === focusCategory.id) {
        if (host.state.focus !== pill) {
          host.focusAndScroll(container, pill);
        } else {
          host.scrollIntoView(container, pill);
        }
        break;
      }
    }
  }
  return true;
}

export function renderLiveChannels(index?: number): boolean {
  if (!host) {
    return false;
  }
  const panel = host.getPanel();
  const list = panel?.querySelector(".pc-list");
  if (!panel || !list) {
    return false;
  }
  const focusedNode = host.state.focus as (LivePanelNode & {
    closest?: (selector: string) => LivePanelNode | null;
  }) | null;
  const focusedRow = focusedNode
    && typeof focusedNode.closest === "function"
    && focusedNode.closest(".pc-row")
    ? focusedNode
    : null;
  const preserveIndex = focusedRow && typeof focusedRow._channel === "number"
    ? focusedRow._channel
    : -1;
  const restoreFocus = preserveIndex >= 0 && (index === undefined || index === null);
  host.clear(list);
  host.setChannelRows({});
  const channels = host.getChannels();
  const category = host.getSelectedCategory();
  if (category && category.isAddon) {
    const promo = host.el("div", "pc-row-addon-promo focusable");
    promo.appendChild(host.el("div", "promo-icon", "⚙️"));
    const info = host.el("div", "promo-info");
    info.appendChild(host.el("div", "promo-text", "➕ Administrar Addons y Listas M3U"));
    info.appendChild(host.el("div", "promo-sub", "Instala listas recomendadas o agrega tu enlace"));
    promo.appendChild(info);
    promo._activate = function openAddons() {
      host?.openAddons();
    };
    promo._onMove = function movePromo(direction: string) {
      if (!host) {
        return false;
      }
      if (direction === "up") {
        const pill = panel.querySelector(".pc-cat-pill.is-selected") || panel.querySelector(".pc-cat-pill");
        if (pill) {
          host.focus(pill);
        }
        return true;
      }
      if (direction === "down") {
        if (host.getChannels().length) {
          focusChannelRow(0);
        }
        return true;
      }
      if (direction === "right") {
        host.focusPlayer();
        return true;
      }
      return false;
    };
    list.appendChild(promo);
  }
  if (!channels.length) {
    const empty = host.el("div", "pc-empty-channels", "No hay canales disponibles en esta categoría");
    empty.style.padding = "30px";
    empty.style.color = "#888";
    empty.style.fontSize = "20px";
    list.appendChild(empty);
    return true;
  }
  let target = Number(index);
  if (!isFinite(target) || (index === undefined || index === null)) {
    target = restoreFocus ? preserveIndex : host.state.channel;
  }
  target = Math.max(0, Math.min(channels.length - 1, target || 0));
  const pageSize = host.getPageSize() || 1;
  let start = Math.max(0, target - Math.floor(pageSize / 2));
  const end = Math.min(channels.length, start + pageSize);
  start = Math.max(0, end - pageSize);
  const rows: Record<string, LivePanelNode> = {};
  for (let channelIndex = start; channelIndex < end; channelIndex += 1) {
    const channel = channels[channelIndex] as LivePanelChannel;
    const row = host.el("div", "pc-row focusable");
    row._channel = channelIndex;
    const icon = host.el("div", "ic");
    if (channel.logo) {
      icon.style.backgroundImage = `url(${channel.logo})`;
      icon.style.backgroundSize = "contain";
      icon.style.backgroundRepeat = "no-repeat";
      icon.style.backgroundPosition = "center";
    }
    const number = host.el("div", "num", padChannelIndex(channel.index || channelIndex + 1));
    const name = host.el("div", "nm", channel.name);
    const epg = host.el("div", "epg", channel.now || "En vivo");
    row.appendChild(icon);
    row.appendChild(number);
    row.appendChild(name);
    row.appendChild(epg);
    if (channelIndex === host.state.channel) {
      row.classList.add("is-current");
    }
    row._activate = function activateChannel() {
      if (!host) {
        return;
      }
      host.playChannel(channelIndex, true);
      host.closePanel();
      host.focusPlayer();
    };
    row._onMove = function moveChannel(direction: string) {
      if (!host) {
        return false;
      }
      if (direction === "right") {
        host.focusPlayer();
        return true;
      }
      if (direction === "up") {
        if (channelIndex > 0) {
          focusChannelRow(channelIndex - 1);
        } else if (channelIndex === 0) {
          const promo = panel.querySelector(".pc-row-addon-promo");
          if (promo) {
            host.focus(promo);
          } else {
            const pill = panel.querySelector(".pc-cat-pill.is-selected") || panel.querySelector(".pc-cat-pill");
            if (pill) {
              host.focus(pill);
            }
          }
        }
        return true;
      }
      if (direction === "down") {
        if (channelIndex < channels.length - 1) {
          focusChannelRow(channelIndex + 1);
        }
        return true;
      }
      return false;
    };
    list.appendChild(row);
    rows[channelIndex] = row;
  }
  host.setChannelRows(rows);
  if (restoreFocus && rows[preserveIndex]) {
    host.focus(rows[preserveIndex] as LivePanelNode);
  }
  return true;
}

export function focusLiveChannelRow(index: number): boolean {
  if (!host) {
    return false;
  }
  const channels = host.getChannels();
  if (!channels.length) {
    return false;
  }
  const target = Math.max(0, Math.min(channels.length - 1, Number(index) || 0));
  if (!host.getChannelRows()[target]) {
    renderLiveChannels(target);
  }
  const row = host.getChannelRows()[target];
  if (row) {
    host.focus(row);
  }
  return true;
}

export function layoutLiveSelectedCategory(): boolean {
  if (!host) {
    return false;
  }
  const container = host.getPanel()?.querySelector(".pc-categories");
  const selected = container?.querySelector(".pc-cat-pill.is-selected");
  if (container && selected) {
    host.scrollIntoView(container, selected);
  }
  return true;
}

function layoutSelectedCategory(): void {
  layoutLiveSelectedCategory();
}

function focusChannelRow(index: number): boolean {
  return focusLiveChannelRow(index);
}

function padChannelIndex(value: string | number): string {
  const channel = Number(value) || 0;
  return channel < 10 ? `0${channel}` : String(channel);
}
