import type { AppState } from "../../runtime/state";

export type PlaybackOsdKind = "pause" | "forward" | "backward" | "none" | string;

export interface PlayerInfobarBar {
  classList: {
    add(name: string): void;
    remove(name: string): void;
  };
}

export interface PlayerOsd {
  style: {
    backgroundImage: string;
  };
  classList: {
    add(name: string): void;
    remove(name: string): void;
  };
}

export interface PlayerInfobarHost {
  state: AppState;
  getVodBar(): PlayerInfobarBar | null;
  getLiveBar(): PlayerInfobarBar | null;
  getOsd(): PlayerOsd | null;
  hideDelayMs?: number;
  osdDelayMs?: number;
}

let host: PlayerInfobarHost | null = null;
let osdTimer: ReturnType<typeof setTimeout> | null = null;

export function attachPlayerInfobar(next: PlayerInfobarHost): boolean {
  host = next;
  return true;
}

export function hasPlayerInfobarRuntime(): boolean {
  return host !== null;
}

export function resetPlayerInfobarRuntime(): void {
  clearOsdTimer();
  host = null;
}

export function showPlayerInfobar(): boolean {
  if (!host) {
    return false;
  }
  const state = host.state;
  state.infobar = true;
  if (state.playerMode === "vod") {
    host.getVodBar()?.classList.add("is-active");
    host.getLiveBar()?.classList.remove("is-active");
  } else {
    host.getLiveBar()?.classList.add("is-active");
    host.getVodBar()?.classList.remove("is-active");
  }
  schedulePlayerInfobarHide();
  return true;
}

export function refreshPlayerInfobar(): boolean {
  return showPlayerInfobar();
}

export function hidePlayerInfobar(): boolean {
  if (!host) {
    return false;
  }
  const state = host.state;
  if (state.infoTimer) {
    clearTimeout(state.infoTimer);
    state.infoTimer = null;
  }
  state.infobar = false;
  host.getLiveBar()?.classList.remove("is-active");
  host.getVodBar()?.classList.remove("is-active");
  return true;
}

export function schedulePlayerInfobarHide(): boolean {
  if (!host) {
    return false;
  }
  const state = host.state;
  if (state.infoTimer) {
    clearTimeout(state.infoTimer);
    state.infoTimer = null;
  }
  state.infoTimer = setTimeout(() => {
    if (!host) {
      return;
    }
    host.state.infoTimer = null;
    if (host.state.screen !== "player" || host.state.channelsOpen) {
      return;
    }
    hidePlayerInfobar();
  }, host.hideDelayMs || 5000);
  return true;
}

export function showPlaybackOsd(kind: PlaybackOsdKind): boolean {
  if (!host) {
    return false;
  }
  const osd = host.getOsd();
  if (!osd) {
    return true;
  }
  clearOsdTimer();
  if (kind === "pause") {
    osd.style.backgroundImage = "url(assets/original/common/icon_status_pause.png)";
    osd.classList.add("is-active");
    return true;
  }
  if (kind === "forward" || kind === "backward") {
    osd.style.backgroundImage =
      kind === "forward"
        ? "url(assets/original/common/icon_status_forward.png)"
        : "url(assets/original/common/icon_status_backward.png)";
    osd.classList.add("is-active");
    osdTimer = setTimeout(() => {
      osdTimer = null;
      osd.classList.remove("is-active");
    }, host?.osdDelayMs || 900);
    return true;
  }
  osd.classList.remove("is-active");
  return true;
}

function clearOsdTimer(): void {
  if (osdTimer) {
    clearTimeout(osdTimer);
    osdTimer = null;
  }
}
