import type { AppState } from "../../runtime/state";

export interface PlayerItem {
  id?: string | number;
  title?: string;
  [key: string]: unknown;
}

export interface PlayerEpisode {
  id?: string | number;
  number?: string | number;
  seriesNumber?: string | number;
  [key: string]: unknown;
}

export interface PlayerMedia {
  src?: string;
  currentSrc?: string;
  readyState?: number;
  currentTime?: number;
}

export interface PlayerTransitionLog {
  screen: string;
  sameItem: boolean;
  sameEpisode: boolean;
  hasSession: boolean;
  alreadyFullscreen: boolean;
  reuse: boolean;
  item: string | number | null | undefined;
  episode: string | number | null | undefined;
}

export interface PlayerSessionHost {
  state: AppState;
  getMedia(): PlayerMedia | null;
  getDetail(): PlayerItem | null;
  getStreamUrl(): string;
  resetStream(): void;
  prepareMediaInfo(item: PlayerItem): void;
  resolvePlayback(item: PlayerItem, done: (url: string) => void): void;
  loadSource(url: string): void;
  notifyStatus(message: string): void;
  shouldReuse(
    screen: string,
    hasSource: boolean,
    sameItem: boolean,
    sameEpisode: boolean
  ): boolean;
  hasPlaybackSession(
    source: string,
    currentSource: string,
    streamUrl: string,
    streamError: string
  ): boolean;
  currentPosition(media: PlayerMedia): number;
  prepareItem(item: PlayerItem): void;
  resetPlaybackItem(): void;
  showFullscreenPlayer(): void;
  startPlayback(item: PlayerItem | null, episode: PlayerEpisode | null): void;
  logTransition?(info: PlayerTransitionLog): void;
}

let host: PlayerSessionHost | null = null;
let sourceItem: PlayerItem | null = null;
let sourceEpisode: PlayerEpisode | null = null;

export function attachPlayerSession(next: PlayerSessionHost): boolean {
  host = next;
  return true;
}

export function hasPlayerSessionRuntime(): boolean {
  return host !== null;
}

export function resetPlayerSessionRuntime(): void {
  host = null;
  sourceItem = null;
  sourceEpisode = null;
}

export function samePlaybackItem(
  current: PlayerItem | null | undefined,
  next: PlayerItem | null | undefined
): boolean {
  if (current === next) {
    return true;
  }
  if (!current || !next) {
    return false;
  }
  return current.id !== undefined && next.id !== undefined && String(current.id) === String(next.id);
}

export function samePlaybackEpisode(
  current: PlayerEpisode | null | undefined,
  next: PlayerEpisode | null | undefined
): boolean {
  if (current === next) {
    return true;
  }
  if (!current || !next) {
    return false;
  }
  return current.id !== undefined && next.id !== undefined && String(current.id) === String(next.id);
}

export function markPlayerSessionSource(
  item: PlayerItem | null,
  episode: PlayerEpisode | null
): void {
  sourceItem = item;
  sourceEpisode = episode;
}

export function clearPlayerSessionSource(): void {
  sourceItem = null;
  sourceEpisode = null;
}

export function openFullscreenPlayer(
  item: PlayerItem | null,
  episode: PlayerEpisode | null
): boolean {
  if (!host) {
    return false;
  }
  const state = host.state;
  const media = host.getMedia();
  const currentItem = state.playerItem as PlayerItem | null;
  const currentEpisode = state.playerEpisode as PlayerEpisode | null;
  const sameEpisode =
    !episode || !currentEpisode || samePlaybackEpisode(currentEpisode, episode);
  const sameSource =
    samePlaybackItem(sourceItem, item) && samePlaybackEpisode(sourceEpisode, episode);
  const sameItem =
    sameSource ||
    samePlaybackItem(currentItem, item) ||
    (state.screen === "detail" && samePlaybackItem(host.getDetail(), item));
  const streamUrl = host.getStreamUrl();
  const hasSession = Boolean(
    media &&
      !state.streamError &&
      (sameSource ||
        host.hasPlaybackSession(media.src || "", media.currentSrc || "", streamUrl, "") ||
        (media.readyState || 0) > 0)
  );
  const alreadyFullscreen = Boolean(
    state.screen === "player" &&
      media &&
      !state.streamError &&
      samePlaybackItem(sourceItem, item) &&
      samePlaybackEpisode(sourceEpisode, episode) &&
      (media.src || media.currentSrc || (media.readyState || 0) > 0 || streamUrl)
  );
  const reuse = alreadyFullscreen || host.shouldReuse(state.screen, hasSession, sameItem, sameEpisode);

  host.logTransition?.({
    screen: state.screen,
    sameItem,
    sameEpisode,
    hasSession,
    alreadyFullscreen,
    reuse,
    item: item && item.id,
    episode: episode && episode.id
  });

  if (!reuse && sameItem && sameEpisode && media) {
    const currentPosition = host.currentPosition(media);
    if (currentPosition > 0) {
      state.resumePosition = currentPosition;
    }
  }

  state.playerMode = "vod";
  if (item && state.playerItem !== item) {
    host.resetPlaybackItem();
  }
  if (item) {
    state.playerItem = item;
  }
  if (episode) {
    state.playerEpisode = episode;
    state.playerSeasonIndex = state.detailSeason || 0;
  }
  if (item) {
    host.prepareItem(item);
  }
  state.playerReturn = {
    screen: "detail",
    focus: state.focus
  };
  state.screen = "player";

  host.showFullscreenPlayer();
  if (!reuse) {
    host.startPlayback(
      state.playerItem as PlayerItem | null,
      state.playerEpisode as PlayerEpisode | null
    );
  }
  return true;
}

export function startPlayerPlayback(
  item: PlayerItem | null,
  episode: PlayerEpisode | null
): boolean {
  if (!host) {
    return false;
  }
  const state = host.state;
  if (state.resumeOpen) {
    return true;
  }
  if (item || episode) {
    state.playerMode = "vod";
  }
  if (!host.getMedia()) {
    return true;
  }
  if (episode) {
    state.playerEpisode = episode;
    state.playerSeasonIndex = state.detailSeason || 0;
  }
  if (item) {
    state.playerItem = item;
  }
  const target = (item || state.playerItem) as PlayerItem | null;
  if (target) {
    host.prepareItem(target);
  }
  state.noHistorySave = true;
  host.resetStream();
  state.noHistorySave = false;
  if (!target) {
    return true;
  }

  host.prepareMediaInfo(target);
  if (target._portal) {
    const number = episode && (episode.number || episode.seriesNumber);
    host.notifyStatus(number ? `Cargando capítulo ${number}…` : "Cargando capítulo…");
    host.resolvePlayback(target, (url) => {
      if (url) {
        host?.loadSource(url);
        markPlayerSessionSource(
          target,
          episode || (state.playerEpisode as PlayerEpisode | null) || null
        );
      } else if (!state.streamError) {
        host?.notifyStatus("Sin fuente de reproducción");
      }
    });
    return true;
  }
  if (target.streamUrl) {
    host.loadSource(String(target.streamUrl));
    markPlayerSessionSource(
      target,
      episode || (state.playerEpisode as PlayerEpisode | null) || null
    );
  }
  return true;
}
