import type { AppState } from "../../runtime/state";
import {
  getPlayerPlaybackTotal,
  getPlayerPosition,
  getPlayerRelayBase,
  setPlayerRelayDuration
} from "./playerSource";

export interface PlayerRelayProbeHost {
  state: AppState;
  updateProgress(position: number, total: number): void;
  relayDurationEndpoint(url: string): string;
}

let host: PlayerRelayProbeHost | null = null;

export function attachPlayerRelayProbe(next: PlayerRelayProbeHost): boolean {
  host = next;
  return true;
}

export function hasPlayerRelayProbeRuntime(): boolean {
  return host !== null;
}

export function resetPlayerRelayProbeRuntime(): void {
  host = null;
}

export function probePlayerRelayDuration(source?: string): boolean {
  const activeHost = host;
  if (!activeHost) {
    return false;
  }
  const expected = String(source || getPlayerRelayBase() || "").split("?")[0] || "";
  const endpoint = activeHost.relayDurationEndpoint(expected);
  if (!endpoint || typeof XMLHttpRequest === "undefined") {
    return false;
  }
  let attempts = 0;

  function poll(): void {
    if (!activeHost || getPlayerRelayBase() !== expected) {
      return;
    }
    const request = new XMLHttpRequest();
    request.open("GET", endpoint, true);
    request.timeout = 2000;
    request.onload = function onLoad() {
      if (getPlayerRelayBase() !== expected) {
        return;
      }
      try {
        const data = JSON.parse(request.responseText) as { duration?: unknown };
        const duration = Number(data && data.duration) || 0;
        if (duration > 0) {
          setPlayerRelayDuration(duration);
          if (activeHost.state.playerMode === "vod") {
            activeHost.updateProgress(
              getPlayerPosition(),
              getPlayerPlaybackTotal()
            );
          }
          return;
        }
      } catch {
        // Retry when the duration endpoint returns invalid JSON.
      }
      if (++attempts < 20) {
        setTimeout(poll, 1000);
      }
    };
    request.onerror = request.ontimeout = function onFailure() {
      if (getPlayerRelayBase() === expected && ++attempts < 20) {
        setTimeout(poll, 1000);
      }
    };
    try {
      request.send();
    } catch {
      // Ignore duration probe send failures.
    }
  }

  poll();
  return true;
}
