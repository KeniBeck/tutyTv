import type { AppState } from "../../runtime/state";

export interface SwitchEpisode {
  id?: string | number;
  [key: string]: unknown;
}

export interface SwitchItem {
  id?: string | number;
  [key: string]: unknown;
}

export interface PlayerEpisodeSwitchHost {
  state: AppState;
  resetStream(): void;
  closeNextEpisodePrompt(restoreFocus: boolean): void;
  refreshPlayerChannels(): void;
  renderDetailEpisodes(item: SwitchItem): void;
  notify(message: string): void;
  startPlayback(item: SwitchItem, episode: SwitchEpisode): void;
}

let host: PlayerEpisodeSwitchHost | null = null;
let switchTimer: ReturnType<typeof setTimeout> | null = null;
let switchSequence = 0;

export function attachPlayerEpisodeSwitch(next: PlayerEpisodeSwitchHost): boolean {
  host = next;
  return true;
}

export function hasPlayerEpisodeSwitchRuntime(): boolean {
  return host !== null;
}

export function resetPlayerEpisodeSwitchRuntime(): void {
  host = null;
  resetPlayerEpisodeSwitch();
}

export function resetPlayerEpisodeSwitch(): void {
  switchSequence += 1;
  if (switchTimer) {
    clearTimeout(switchTimer);
    switchTimer = null;
  }
}

export function switchPlayerEpisode(
  item: SwitchItem | null,
  episode: SwitchEpisode | null,
  saveHistory?: boolean
): boolean {
  if (!host || !item || !episode) {
    return false;
  }
  const state = host.state;
  host.closeNextEpisodePrompt(false);
  state.nextEpisodeDismissed = false;
  state.nextEpisodeGuardUntil = Date.now() + 3000;
  if (saveHistory !== false) {
    host.resetStream();
  }
  state.playerItem = item as never;
  state.playerEpisode = episode as never;
  state.detailEpisode = episode as never;
  state.playerSeasonIndex = state.detailSeason || 0;
  host.refreshPlayerChannels();
  host.renderDetailEpisodes(item);
  resetPlayerEpisodeSwitch();
  const sequence = switchSequence;
  host.notify("Cambiando capítulo…");
  switchTimer = setTimeout(function onEpisodeSwitch() {
    switchTimer = null;
    if (!host || sequence !== switchSequence) {
      return;
    }
    if (state.screen !== "player" && state.screen !== "detail") {
      return;
    }
    state.resumePosition = 0;
    host.startPlayback(item, episode);
  }, 600);
  return true;
}
