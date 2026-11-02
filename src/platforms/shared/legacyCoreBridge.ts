import { createJsonStorageAdapter } from "./jsonStorageAdapter";
import {
  createHtml5PlayerAdapter,
  type HlsLoaderLike,
  type VideoElementLike
} from "./html5PlayerAdapter";
import { createPlatformAdapter, type LegacyPlatformBackEnvironment } from "./platformAdapter";

export { connectLegacyNavigation, mapLegacyKeyToAction, scoreLegacyFocus } from "./navigationAdapter";
export { handleHlsError } from "./hlsRecovery";
export { destroyLegacyHls, scheduleGuardedRetry } from "./playbackCoordinator";

export { normalizeText } from "../../core/text/normalizeText";
export { filterMatches } from "../../core/usecases/catalog/filterMatches";
export { limitSeekPosition } from "../../core/usecases/playback/seekPosition";
export { selectNativeRetry } from "../../core/usecases/playback/nativeRetry";
export {
  applyRelayResumeStart,
  isRelayStreamMode,
  shouldForceRelay
} from "../../core/usecases/playback/streamMode";
export { updatePlaybackHistory } from "../../core/usecases/playback/playbackHistory";
export { mergePlaybackPreferences } from "../../core/usecases/playback/playbackPreferences";
export {
  findTrackIndexByCode,
  languagePreferenceIndex,
  matchesLanguagePreference,
  selectTrackIndexByCodeOrPreference
} from "../../core/usecases/playback/languagePreference";
export { findHistoryEntry, episodeIdExists } from "../../core/usecases/catalog/history";
export { episodeDisplayTitle, formatEpisodeDuration } from "../../core/usecases/catalog/episodeDisplay";
export {
  extractCatalogItems,
  isSeriesLike,
  normalizeCatalogItem,
  parseSeriesSeasonTitle,
  resolveCatalogImage
} from "../../core/usecases/catalog/catalogNormalization";
export { groupCatalogSeries, mergePortalRoots } from "../../core/usecases/catalog/catalogGrouping";
export { combineSearchResults, findLocalSearchMatches } from "../../core/usecases/catalog/catalogSearch";
export { buildEpisodeRanges, filterCatalogCategory, selectCatalogPage } from "../../core/usecases/catalog/catalogSelection";
export { findEpisodeIndex, nextSeasonIndex, seasonEpisodes, seasonList } from "../../core/usecases/catalog/episodeNavigation";
export {
  isLiveFavorite,
  liveFavKey,
  toggleLiveFavorite
} from "../../core/usecases/favorites/liveFavorites";
export { filterLiveChannels, findLiveSearchMatches, selectNewLiveChannels } from "../../core/usecases/live/liveChannels";
export { formatLiveCategoryLabel, normalizeLiveCategories } from "../../core/usecases/live/liveCategories";
export { hasAddonUrl, isM3uAddonUrl, removeAddonAt, upsertM3uAddon } from "../../core/usecases/live/addons";
export { liveListScrollTop } from "../../core/usecases/live/liveFocus";
export { isLegacyFocusVisible } from "../../core/usecases/ui/focusVisibility";
export { computeLegacyScrollAdjustment } from "../../core/usecases/ui/focusScroll";
export { ensureViewerProfile } from "../../core/usecases/storage/viewerProfile";
export {
  buildReminderEntry,
  isReminderActive,
  mergeReminderUpdate,
  reminderCount,
  selectReminderCheckIds,
  shouldCheckReminders,
  toggleReminderEntry
} from "../../core/usecases/reminders/reminders";
export { buildDevServiceUrl, buildQueryString } from "../../core/usecases/api/serviceRequest";
export {
  buildServiceParams,
  describeServiceError,
  hasApiSession,
  normalizeApiSession,
  resolveServiceUrl
} from "../../core/usecases/api/apiSession";
export { mapLegacyMediaKey } from "../../core/usecases/input/mediaKeys";
export { formatPlaybackTime, inferEpisodeDuration, parsePlaybackDuration, playbackPercent, resolvePlaybackDuration } from "../../core/usecases/playback/duration";
export { findSubtitleCue, parseSubtitleCues, parseSubtitleTimestamp } from "../../core/usecases/playback/subtitles";
export { relayDurationEndpoint } from "../../core/usecases/playback/relayDuration";
export {
  currentPlaybackPosition,
  describePlaybackStream,
  resolvePlaybackTotal,
  shouldUseHls
} from "../../core/usecases/playback/playbackSession";
export {
  hasPlaybackSession,
  resolveAbortServiceBase,
  shouldLoadSeriesEpisodesBeforePlay,
  shouldReusePlaybackSession,
  shouldSaveHistoryBeforeReset
} from "../../core/usecases/playback/playbackLifecycle";
export {
  PLAYBACK_TIMING as playbackTiming,
  resolveLiveResolveDelay,
  shouldReportBuffering,
  shouldTickPlayback
} from "../../core/usecases/playback/playbackTiming";
export {
  PLAYBACK_VIDEO_EVENTS as playbackVideoEvents,
  wireHlsPlaybackEvents,
  wirePlaybackVideoEvents
} from "../../core/usecases/playback/playbackEventWiring";
export {
  applyDetailPlayerTransition,
  applyPlaybackSurface,
  applyPlayerModeClass,
  applyPlayerStatus,
  resetDetailPlayerSurface
} from "../../core/usecases/playback/playbackSurface";

export const storage = {
  read<T>(key: string, fallback: T): T {
    try {
      return createJsonStorageAdapter(window.localStorage).getItemOr(key, fallback);
    } catch {
      return fallback;
    }
  },
  write(key: string, value: unknown): void {
    try {
      createJsonStorageAdapter(window.localStorage).setItemQuietly(key, value);
    } catch {
      return;
    }
  }
};

export const platform = {
  prefersNativeTvPlayback(userAgent: string): boolean {
    return createPlatformAdapter({ userAgent }).prefersNativeTvPlayback();
  },
  canUseLunaService(bridge: unknown): boolean {
    return createPlatformAdapter().canUseLunaService(bridge);
  },
  canPlayPreviewHls(video: { canPlayType?: (mime: string) => string }): boolean {
    return createPlatformAdapter().canPlayPreviewHls(video);
  },
  back(environment: LegacyPlatformBackEnvironment): void {
    createPlatformAdapter().platformBack(environment);
  }
};

export const player = {
  play(video: VideoElementLike): Promise<void> | void {
    return createHtml5PlayerAdapter({ video }).playImmediate();
  },
  pause(video: VideoElementLike): void {
    createHtml5PlayerAdapter({ video }).pause();
  },
  seekTo(video: VideoElementLike, seconds: number): void {
    createHtml5PlayerAdapter({ video }).seekTo(seconds);
  },
  setSource(video: VideoElementLike, url: string): void {
    createHtml5PlayerAdapter({ video }).setSource(url);
  },
  reload(video: VideoElementLike): void {
    createHtml5PlayerAdapter({ video }).reload();
  },
  loadHls(video: VideoElementLike, hls: HlsLoaderLike, url: string): void {
    createHtml5PlayerAdapter({ video }).loadExternalHls(hls, url);
  }
};
