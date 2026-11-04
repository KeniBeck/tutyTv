import type { AppState } from "../../runtime/state";

export interface LivePlaybackChannel {
  channelCode?: string;
  streamUrl?: string;
  name?: string;
  [key: string]: unknown;
}

export interface LivePlaybackResponse {
  returnValue?: boolean;
  proxyPath?: string;
  url?: string;
  [key: string]: unknown;
}

export interface PlayerLiveHost {
  state: AppState;
  getCurrentChannel(): LivePlaybackChannel | null;
  getSequence(): number;
  nextSequence(): number;
  resolveDelay(): number;
  resolveLive(
    channel: LivePlaybackChannel,
    done: (error: string | null | undefined, response: LivePlaybackResponse | null | undefined) => void
  ): void;
  notify(message: string): void;
  showInfobar(): void;
  loadSource(url: string): void;
}

let host: PlayerLiveHost | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

export function attachPlayerLive(next: PlayerLiveHost): boolean {
  host = next;
  return true;
}

export function hasPlayerLiveRuntime(): boolean {
  return host !== null;
}

export function resetPlayerLiveRuntime(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  host = null;
}

export function playLiveChannel(
  channel?: LivePlaybackChannel | null,
  immediate = false
): boolean {
  if (!host) {
    return false;
  }
  clearTimer();
  const selected = channel || host.getCurrentChannel();
  if (!selected || (!selected.channelCode && !selected.streamUrl)) {
    return false;
  }
  const target = selected;
  const sequence = host.nextSequence();

  function start(): void {
    if (!host) {
      return;
    }
    host.notify(`Cargando señal ${target.name || ""}…`);
    host.resolveLive(target, (error, response) => {
      if (!host || sequence !== host.getSequence()) {
        return;
      }
      if (error || !response || response.returnValue === false) {
        host.state.streamError = `No se pudo conectar con la señal${error ? `: ${error}` : ""}`;
        host.notify(host.state.streamError);
        return;
      }
      const url = response.proxyPath || response.url;
      if (!url) {
        host.state.streamError = "Señal no disponible";
        host.notify(host.state.streamError);
        return;
      }
      host.notify("");
      host.showInfobar();
      host.loadSource(url);
    });
  }

  if (immediate) {
    start();
  } else {
    timer = setTimeout(start, host.resolveDelay());
  }
  return true;
}

function clearTimer(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}
