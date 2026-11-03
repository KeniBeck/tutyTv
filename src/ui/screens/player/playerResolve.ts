import type { AppState } from "../../runtime/state";

export interface ResolveItem {
  id?: string | number;
  audio?: string;
  [key: string]: unknown;
}

export interface ResolveEpisode {
  id?: string | number;
  number?: string | number;
  [key: string]: unknown;
}

export interface ResolveRequestOptions {
  streamMode: string;
  resumePosition: number;
  trackIndex: number;
  audioTrack: number;
  isSeries: boolean;
}

export interface ResolveBuildResult {
  request: Record<string, unknown> & { forceRelay?: boolean };
  episode: ResolveEpisode | null;
  resumePosition: number;
  missingEpisodes?: boolean;
}

export interface ResolveApplied {
  url: string;
  resumePosition: number;
  streamInfo: unknown;
}

export interface ResolveMediaInfo {
  audio?: string;
  [key: string]: unknown;
}

export interface PlayerResolveHost {
  state: AppState;
  getSequence(): number;
  getMediaInfo(item: ResolveItem): ResolveMediaInfo | null;
  getMediaKey(item: ResolveItem): string;
  isAudioOverride(): boolean;
  getAudioIndex(): number;
  setAudioIndex(index: number): void;
  selectAudioTrack(audio: string | undefined): number;
  buildRequest(
    item: ResolveItem,
    episode: ResolveEpisode | null,
    options: ResolveRequestOptions
  ): ResolveBuildResult;
  isSeries(item: ResolveItem): boolean;
  shouldLoadEpisodes(item: ResolveItem, episode: ResolveEpisode | null): boolean;
  loadSeriesDetail(item: ResolveItem, done: () => void): void;
  resolve(
    request: Record<string, unknown> & { forceRelay?: boolean },
    forceRelay: boolean,
    done: (error: string | null | undefined, response: Record<string, unknown> | null | undefined) => void
  ): void;
  applyResolved(
    item: ResolveItem,
    episode: ResolveEpisode | null,
    response: Record<string, unknown>,
    resumeAt: number
  ): ResolveApplied;
  setStreamInfo(info: unknown): void;
  notify(message: string): void;
}

let host: PlayerResolveHost | null = null;

export function attachPlayerResolve(next: PlayerResolveHost): boolean {
  host = next;
  return true;
}

export function hasPlayerResolveRuntime(): boolean {
  return host !== null;
}

export function resetPlayerResolveRuntime(): void {
  host = null;
}

export function resolvePlayerPlayback(
  item: ResolveItem | null,
  done: (url: string) => void
): boolean {
  if (!host || !item) {
    return false;
  }
  const state = host.state;
  const sequence = host.getSequence();
  const target = item;

  function run(): void {
    if (!host) {
      return;
    }
    const resumeAt = Number(state.resumePosition) || 0;
    const media = host.getMediaInfo(target);
    if (media && !host.isAudioOverride()) {
      host.setAudioIndex(host.selectAudioTrack(media.audio));
    }
    const built = host.buildRequest(target, state.playerEpisode as ResolveEpisode | null, {
      streamMode: state.streamMode,
      resumePosition: resumeAt,
      trackIndex: state.trackIndex || 0,
      audioTrack: host.getAudioIndex() || 0,
      isSeries: host.isSeries(target)
    });
    if (built.missingEpisodes) {
      done("");
      return;
    }
    state.playerEpisode = built.episode;
    state.resumePosition = built.resumePosition;
    const request = built.request;

    function complete(
      error: string | null | undefined,
      response: Record<string, unknown> | null | undefined
    ): void {
      if (!host || sequence !== host.getSequence()) {
        return;
      }
      if (error || !response || response.returnValue === false) {
        state.resumePosition = 0;
        state.streamError = `No se pudo resolver el título${error ? `: ${error}` : ""}`;
        host.notify(state.streamError);
        done("");
        return;
      }
      const applied = host.applyResolved(
        target,
        state.playerEpisode as ResolveEpisode | null,
        response,
        resumeAt
      );
      host.setStreamInfo(applied.streamInfo);
      state.resumePosition = applied.resumePosition;
      done(applied.url);
    }

    function resolveCall(forceRelay: boolean): void {
      if (!host) {
        return;
      }
      host.resolve(request, forceRelay, (error, response) => {
        if (error && forceRelay) {
          request.forceRelay = false;
          resolveCall(false);
          return;
        }
        complete(error, response);
      });
    }
    resolveCall(Boolean(request.forceRelay));
  }

  if (host.shouldLoadEpisodes(target, state.playerEpisode as ResolveEpisode | null)) {
    host.notify("Cargando capítulos…");
    host.loadSeriesDetail(target, () => {
      if (host && sequence === host.getSequence()) {
        run();
      }
    });
    return true;
  }
  run();
  return true;
}
