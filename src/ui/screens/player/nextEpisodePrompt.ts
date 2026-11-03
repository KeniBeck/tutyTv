import type { AppState } from "../../runtime/state";

export interface NextEpisodeItem {
  id?: string | number;
  number?: string | number;
  seriesNumber?: string | number;
  [key: string]: unknown;
}

export interface NextEpisodeSeason {
  id?: string;
  number?: string | number;
  [key: string]: unknown;
}

export interface NextEpisodeTarget {
  kind: "episode" | "season";
  seasonIndex: number;
  episode?: NextEpisodeItem;
  season?: NextEpisodeSeason;
}

export interface NextEpisodePromptNode {
  textContent?: string | null;
  classList: {
    add(name: string): void;
    remove(name: string): void;
  };
  _activate?: (() => void) | null;
}

export interface NextEpisodePromptElements {
  kicker: NextEpisodePromptNode | null;
  title: NextEpisodePromptNode | null;
  play: NextEpisodePromptNode | null;
  cancel: NextEpisodePromptNode | null;
  count: NextEpisodePromptNode | null;
}

export interface NextEpisodePromptHost {
  state: AppState;
  getPrompt(): NextEpisodePromptNode | null;
  getElements(): NextEpisodePromptElements;
  focus(node: NextEpisodePromptNode): void;
  restorePlayerFocus(): void;
  formatTarget(target: NextEpisodeTarget): string;
  startNext(target: NextEpisodeTarget): void;
}

let host: NextEpisodePromptHost | null = null;

export function attachNextEpisodePrompt(next: NextEpisodePromptHost): boolean {
  host = next;
  return true;
}

export function hasNextEpisodePromptRuntime(): boolean {
  return host !== null;
}

export function resetNextEpisodePromptRuntime(): void {
  host = null;
}

export function canOfferNextEpisode(
  state: AppState,
  position: number,
  total: number,
  now: number = Date.now()
): boolean {
  return !state.nextEpisodeDismissed
    && !state.nextEpisodeOpen
    && now >= state.nextEpisodeGuardUntil
    && state.playerMode === "vod"
    && total >= 60
    && position >= 30
    && position >= total - 7;
}

export function closeNextEpisodePrompt(restoreFocus: boolean): boolean {
  if (!host) {
    return false;
  }
  const state = host.state;
  state.nextEpisodeOpen = false;
  if (state.nextEpisodeTimer) {
    clearTimeout(state.nextEpisodeTimer);
    state.nextEpisodeTimer = null;
  }
  host.getPrompt()?.classList.remove("is-active");
  state.nextEpisodeTarget = null;
  if (restoreFocus) {
    host.restorePlayerFocus();
  }
  return true;
}

export function cancelNextEpisodePrompt(): boolean {
  if (!host) {
    return false;
  }
  host.state.nextEpisodeDismissed = true;
  closeNextEpisodePrompt(true);
  return true;
}

export function updateNextEpisodeCountdown(): boolean {
  if (!host) {
    return false;
  }
  const count = host.getElements().count;
  if (count) {
    count.textContent = String(host.state.nextEpisodeCountdown);
  }
  return true;
}

export function confirmNextEpisodePrompt(): boolean {
  if (!host || !host.state.nextEpisodeOpen) {
    return false;
  }
  const target = host.state.nextEpisodeTarget as NextEpisodeTarget | null;
  closeNextEpisodePrompt(false);
  if (target) {
    host.startNext(target);
  }
  return true;
}

export function showNextEpisodePrompt(
  target: NextEpisodeTarget | null | undefined,
  seconds?: number
): boolean {
  if (!host || !target) {
    return false;
  }
  const state = host.state;
  if (state.nextEpisodeOpen || state.nextEpisodeDismissed) {
    return false;
  }
  const prompt = host.getPrompt();
  if (!prompt) {
    host.startNext(target);
    return true;
  }

  state.nextEpisodeOpen = true;
  state.nextEpisodeTarget = target;
  state.nextEpisodeCountdown = Math.max(1, Math.min(7, Math.ceil(Number(seconds) || 7)));

  const elements = host.getElements();
  if (elements.kicker) {
    elements.kicker.textContent = target.kind === "season" ? "Siguiente temporada" : "Siguiente episodio";
  }
  if (elements.title) {
    elements.title.textContent = target.kind === "season"
      ? `Temporada ${(target.season && target.season.number) || target.seasonIndex + 1}`
      : host.formatTarget(target);
  }
  if (elements.play) {
    elements.play._activate = confirmNextEpisodePrompt;
  }
  if (elements.cancel) {
    elements.cancel._activate = cancelNextEpisodePrompt;
  }
  updateNextEpisodeCountdown();
  prompt.classList.add("is-active");
  if (elements.play) {
    host.focus(elements.play);
  }

  function tick(): void {
    if (!host || !host.state.nextEpisodeOpen) {
      return;
    }
    host.state.nextEpisodeCountdown = Math.max(0, host.state.nextEpisodeCountdown - 1);
    updateNextEpisodeCountdown();
    if (host.state.nextEpisodeCountdown) {
      host.state.nextEpisodeTimer = setTimeout(tick, 1000);
    } else {
      confirmNextEpisodePrompt();
    }
  }

  if (state.nextEpisodeTimer) {
    clearTimeout(state.nextEpisodeTimer);
  }
  state.nextEpisodeTimer = setTimeout(tick, 1000);
  return true;
}
