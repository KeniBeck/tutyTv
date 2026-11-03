import type { AppState } from "./state";

export interface DeepLinkHost {
  state: AppState;
  getSearch(): string;
  getChannelCount(): number;
  skipWelcome(): void;
  selectTab(index: number, focus: boolean): void;
  focusDefault(): void;
  openDetail(index: number): void;
  openSearch(): void;
  setSearchQuery(query: string): void;
  openSettings(): void;
  openSettingsPanel(index: number): void;
  openPlayer(mode: "vod" | "live", index: number): void;
  openChannels(): void;
  focusSelector(selector: string): void;
}

let host: DeepLinkHost | null = null;

export function attachDeepLink(next: DeepLinkHost): boolean {
  host = next;
  return true;
}

export function hasDeepLinkRuntime(): boolean {
  return host !== null;
}

export function resetDeepLinkRuntime(): void {
  host = null;
}

export function parseDeepLink(search: string): Record<string, string> {
  const params: Record<string, string> = {};
  const query = String(search || "").replace(/^\?/, "");
  if (!query) {
    return params;
  }
  const parts = query.split("&");
  for (const part of parts) {
    if (!part) {
      continue;
    }
    const pair = part.split("=");
    const key = pair[0];
    if (key === undefined) {
      continue;
    }
    params[decodeURIComponent(key)] = decodeURIComponent(pair.slice(1).join("=") || "");
  }
  return params;
}

export function applyDeepLink(): boolean {
  if (!host) {
    return false;
  }
  const params = parseDeepLink(host.getSearch());
  if (Object.keys(params).length === 0) {
    return false;
  }
  const state = host.state;
  if (params.ch !== undefined) {
    const channel = parseInt(params.ch, 10) || 0;
    state.channel = Math.max(0, Math.min(host.getChannelCount() - 1, channel));
  }
  const screen = params.screen || "home";
  if (screen === "welcome") {
    return true;
  }
  host.skipWelcome();
  if (params.tab !== undefined) {
    host.selectTab(parseInt(params.tab, 10) || 0, true);
  } else {
    host.selectTab(0, false);
    host.focusDefault();
  }
  if (screen === "detail") {
    host.openDetail(parseInt(params.vod || "0", 10) || 0);
  } else if (screen === "search") {
    host.openSearch();
    if (params.q) {
      host.setSearchQuery(params.q);
    }
  } else if (screen === "settings") {
    host.openSettings();
    if (params.panel !== undefined) {
      host.openSettingsPanel(parseInt(params.panel, 10) || 0);
    }
  } else if (screen === "player") {
    host.openPlayer(params.mode === "vod" ? "vod" : "live", parseInt(params.vod || "0", 10) || 0);
    if (params.channels === "1") {
      host.openChannels();
    }
  }
  if (params.focus) {
    host.focusSelector(params.focus);
  }
  return true;
}
