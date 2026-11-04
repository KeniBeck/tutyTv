import type { AppState } from "../../runtime/state";
import type { DeepLinkHost } from "../../runtime/deepLink";
import type { LifecycleHost } from "../../runtime/lifecycle";
import type { WebOsKeepAliveHost } from "../../runtime/webOsKeepAlive";
import type { EpisodeBrowserHost } from "./episodeBrowser";
import type { LiveChannelPanelHost } from "./liveChannelPanel";
import type { NextEpisodeAdvanceHost } from "./nextEpisodeAdvance";
import type { NextEpisodePromptHost } from "./nextEpisodePrompt";
import type { PlayerAudioHost } from "./playerAudio";
import type { PlayerInfobarHost } from "./playerInfobar";
import type { PlayerInfoContentHost } from "./playerInfoContent";
import type { PlayerLiveHost } from "./playerLive";
import type { PlayerResolveHost } from "./playerResolve";
import type { PlayerRoutingHost } from "./playerRouting";
import type { PlayerSessionHost } from "./playerSession";
import type { PlayerSubtitleHost } from "./playerSubtitles";
import type { PlayerVideoSettingsHost } from "./playerVideoSettings";
import type { PlaySettingsHost } from "./playSettings";

export interface PlayerRuntimeDeps {
  state: AppState;
  byId(id: string): unknown;
  [key: string]: unknown;
}

export interface PlayerRuntimeHosts {
  playerSession: PlayerSessionHost;
  playerResolve: PlayerResolveHost;
  playerLive: PlayerLiveHost;
  playerRouting: PlayerRoutingHost;
  playerInfobar: PlayerInfobarHost;
  liveChannelPanel: LiveChannelPanelHost;
  playerInfoContent: PlayerInfoContentHost;
  playerSubtitles: PlayerSubtitleHost;
  nextEpisodePrompt: NextEpisodePromptHost;
  nextEpisodeAdvance: NextEpisodeAdvanceHost;
  playerAudio: PlayerAudioHost;
  playSettings: PlaySettingsHost;
  playerVideoSettings: PlayerVideoSettingsHost;
  episodeBrowser: EpisodeBrowserHost;
  appLifecycle: LifecycleHost;
  webOsKeepAlive: WebOsKeepAliveHost;
  deepLink: DeepLinkHost;
}

export function createPlayerRuntimeHosts(deps: PlayerRuntimeDeps): PlayerRuntimeHosts {
  const playerSession = {
    state: deps.state,
    getMedia: deps.getMedia,
    getDetail: deps.getDetail,
    getStreamUrl: deps.getStreamUrl,
    resetStream: deps.resetStream,
    prepareMediaInfo: deps.prepareMediaInfo,
    resolvePlayback: deps.resolvePlayback,
    loadSource: deps.loadSource,
    notifyStatus: deps.notifyStatus,
    shouldReuse: deps.shouldReuse,
    hasPlaybackSession: deps.hasPlaybackSession,
    currentPosition: deps.currentPosition,
    prepareItem: deps.prepareItem,
    resetPlaybackItem: deps.resetPlaybackItem,
    showFullscreenPlayer: deps.showFullscreenPlayer,
    startPlayback: deps.startPlayback,
    logTransition: deps.logTransition
  } as unknown as PlayerSessionHost;
  const playerResolve = {
    state: deps.state,
    getSequence: deps.getResolveSequence,
    getMediaInfo: deps.getMediaInfo,
    getMediaKey: deps.getMediaKey,
    isAudioOverride: deps.isAudioOverride,
    getAudioIndex: deps.getAudioIndex,
    setAudioIndex: deps.setAudioIndex,
    selectAudioTrack: deps.selectAudioTrack,
    buildRequest: deps.buildRequest,
    isSeries: deps.isSeries,
    shouldLoadEpisodes: deps.shouldLoadEpisodes,
    loadSeriesDetail: deps.loadSeriesDetail,
    resolve: deps.resolve,
    applyResolved: deps.applyResolved,
    setStreamInfo: deps.setStreamInfo,
    notify: deps.notify
  } as unknown as PlayerResolveHost;
  const playerLive = {
    state: deps.state,
    getCurrentChannel: deps.getCurrentChannel,
    getSequence: deps.getLiveSequence,
    nextSequence: deps.nextLiveSequence,
    resolveDelay: deps.resolveDelay,
    resolveLive: deps.resolveLive,
    notify: deps.notify,
    showInfobar: deps.showInfobar,
    loadSource: deps.loadSource
  } as unknown as PlayerLiveHost;
  const playerRouting = {
    state: deps.state,
    ensurePlayerStage: deps.ensurePlayerStage,
    stopPreview: deps.stopPreview,
    resetPlaybackItem: deps.resetPlaybackItem,
    prepareItem: deps.prepareItem,
    applyPlayerMode: deps.applyPlayerMode,
    refreshPlayer: deps.refreshPlayer,
    showPlayerScreen: deps.showPlayerScreen,
    focusPlayer: deps.focusPlayer,
    closeChannelPanels: deps.closeChannelPanels,
    showInfobar: deps.showInfobar,
    playLive: deps.playLive,
    playVod: deps.playVod,
    openFullscreen: deps.openFullscreen
  } as unknown as PlayerRoutingHost;
  const playerInfobar = {
    state: deps.state,
    getVodBar: deps.getVodBar,
    getLiveBar: deps.getLiveBar,
    getOsd: deps.getOsd,
    hideDelayMs: deps.hideDelayMs
  } as unknown as PlayerInfobarHost;
  const liveChannelPanel = {
    state: deps.state,
    getPanel: deps.getPanel,
    getCategories: deps.getCategories,
    getSelectedCategory: deps.getSelectedCategory,
    getChannels: deps.getChannels,
    getPageSize: deps.getPageSize,
    getCategorySignature: deps.getCategorySignature,
    setCategorySignature: deps.setCategorySignature,
    getFocusCategory: deps.getFocusCategory,
    getChannelRows: deps.getChannelRows,
    setChannelRows: deps.setChannelRows,
    el: deps.el,
    clear: deps.clear,
    focus: deps.focus,
    focusAndScroll: deps.focusAndScroll,
    scrollIntoView: deps.scrollIntoView,
    selectCategory: deps.selectCategory,
    openCategories: deps.openPlayerCategories,
    openAddons: deps.openAddons,
    playChannel: deps.playChannel,
    closePanel: deps.closePanel,
    focusCurrentChannel: deps.focusCurrentChannel,
    focusPlayer: deps.focusPlayer
  } as unknown as LiveChannelPanelHost;
  const playerInfoContent = {
    state: deps.state,
    getLiveBar: deps.getLiveBar,
    getVodBar: deps.getVodBar,
    getVodTitle: deps.getVodTitle,
    getVodPoster: deps.getVodPoster,
    getChannels: deps.getChannels,
    getCatalog: deps.getCatalog,
    getVideo: deps.getPlayerVideo,
    isSeries: deps.isSeries,
    syncChannelTabs: deps.syncChannelTabs,
    layoutLiveQuality: deps.layoutLiveQuality,
    updateProgress: deps.updateProgress
  } as unknown as PlayerInfoContentHost;
  const playerSubtitles = {
    getContainer: deps.getSubtitleContainer,
    fetchText: deps.fetchText,
    parseCues: deps.parseCues,
    findCue: deps.findCue
  } as unknown as PlayerSubtitleHost;
  const nextEpisodePrompt = {
    state: deps.state,
    getPrompt: function getPrompt() {
      return deps.byId("next-episode-prompt");
    },
    getElements: function getElements() {
      return {
        kicker: deps.byId("next-episode-kicker"),
        title: deps.byId("next-episode-title"),
        play: deps.byId("next-episode-play"),
        cancel: deps.byId("next-episode-cancel"),
        count: deps.byId("next-episode-count")
      };
    },
    focus: deps.focus,
    restorePlayerFocus: deps.restorePlayerFocus,
    formatTarget: deps.formatTarget,
    startNext: deps.startNext
  } as unknown as NextEpisodePromptHost;
  const nextEpisodeAdvance = {
    state: deps.state,
    isSeries: deps.isSeries,
    seasons: deps.seasons,
    seasonEpisodes: deps.seasonEpisodes,
    findEpisodeIndex: deps.findEpisodeIndex,
    resolveNext: deps.resolveNext,
    refreshSeasons: deps.refreshSeasons,
    resetStream: deps.resetStream,
    showLoading: deps.showLoading,
    hideLoading: deps.hideLoading,
    switchEpisode: deps.switchEpisode,
    loadSeasonEpisodes: deps.loadSeasonEpisodes,
    mergeDetail: deps.mergeDetail,
    notify: deps.notify,
    requestDetail: deps.requestDetail,
    resolveSeason: deps.resolveSeason,
    getPosition: deps.getPosition,
    getTotal: deps.getTotal,
    log: deps.log
  } as unknown as NextEpisodeAdvanceHost;
  const playerAudio = {
    state: deps.state,
    getOptions: deps.getOptions,
    clear: deps.clear,
    getMediaAudio: deps.getMediaAudio,
    isAudioOverride: deps.isAudioOverride,
    getSelectedIndex: deps.getSelectedIndex,
    setSelectedIndex: deps.setSelectedIndex,
    setAudioOverride: deps.setAudioOverride,
    parseTracks: deps.parseTracks,
    describeTrack: deps.describeTrack,
    selectIndex: deps.selectIndex,
    languagePreference: deps.languagePreference,
    savePreferences: deps.savePreferences,
    isPlayerScreen: deps.isPlayerScreen,
    hasMedia: deps.hasMedia,
    getRelaySource: deps.getRelaySource,
    absolutePosition: deps.absolutePosition,
    loadUrl: deps.loadUrl,
    ensureRelayMode: deps.ensureRelayMode,
    reloadResolved: deps.reloadResolved,
    closeSettings: deps.closeSettings,
    el: deps.el
  } as unknown as PlayerAudioHost;
  const playSettings = {
    state: deps.state,
    byId: deps.byId,
    el: deps.el,
    clear: deps.clear,
    focus: deps.focus,
    firstFocus: deps.firstFocus,
    getFocusRow: deps.getFocusRow,
    isSeries: deps.isSeries,
    getSeasons: deps.getSeasons,
    getEpisodeRanges: deps.getEpisodeRanges,
    refreshMediaInfo: deps.refreshMediaInfo,
    playEpisode: deps.playSettingsEpisode,
    refreshStreamModeButtons: deps.refreshStreamModeButtons,
    refreshAspectButtons: deps.refreshAspectButtons,
    hideInfobar: deps.hideInfobar,
    ensureStage: deps.ensureStage,
    focusPlayer: deps.focusPlayer,
    isQuickOpen: deps.isQuickOpen,
    setQuickOpen: deps.setQuickOpen,
    isFullOpen: deps.isFullOpen,
    setFullOpen: deps.setFullOpen,
    canFocus: deps.canFocus,
    getCurrentFocus: deps.getCurrentFocus,
    getCurrentItem: deps.getCurrentItem,
    renderAudioTracks: deps.renderAudioTracks,
    getSubtitleTracks: deps.getSubtitleTracks,
    isSubtitleEnabled: deps.isSubtitleEnabled,
    setSubtitleEnabled: deps.setSubtitleEnabled,
    getCurrentSubtitle: deps.getCurrentSubtitle,
    setCurrentSubtitle: deps.setCurrentSubtitle,
    setSubtitleForced: deps.setSubtitleForced,
    loadSubtitle: deps.loadSubtitle,
    getSubtitleSize: deps.getSubtitleSize,
    getSubtitleStyle: deps.getSubtitleStyle,
    setSubtitleSize: deps.setSubtitleSize,
    setSubtitleStyle: deps.setSubtitleStyle,
    savePlaybackPreferences: deps.savePlaybackPreferences,
    applySubtitleDisplay: deps.applySubtitleDisplay,
    languagePreference: deps.languagePreference,
    formatLanguage: deps.formatLanguage
  } as unknown as PlaySettingsHost;
  const playerVideoSettings = {
    state: deps.state,
    getVideo: deps.getPlayerVideo,
    getRelayButton: deps.getRelayButton,
    getNormalButton: deps.getNormalButton,
    getCheck: deps.getCheck,
    getAspectButtons: deps.getAspectButtons,
    isRelayMode: deps.isRelayMode
  } as unknown as PlayerVideoSettingsHost;
  const episodeBrowser = {
    state: deps.state,
    isSeries: deps.isSeries,
    ensureDom: deps.ensureDom,
    getOverlay: deps.ensureDom,
    getTitle: deps.getEpisodeTitle,
    getSubtitle: deps.getEpisodeSubtitle,
    getSeasonLabel: deps.getSeasonLabel,
    getSeasonsContainer: deps.getSeasonsContainer,
    getEpisodesContainer: deps.getEpisodesContainer,
    el: deps.el,
    clear: deps.clear,
    focus: deps.focus,
    firstFocus: deps.firstFocus,
    querySelector: deps.querySelector,
    querySelectorAll: deps.querySelectorAll,
    getSeasons: deps.getSeasons,
    loadSeasonEpisodes: deps.loadSeasonEpisodes,
    formatEpisode: deps.formatEpisode,
    formatDuration: deps.formatDuration,
    loadDetail: deps.loadDetail,
    notify: deps.notify,
    hideInfobar: deps.hideInfobar,
    closePlaySettingsIfOpen: deps.closePlaySettingsIfOpen,
    focusPlayer: deps.focusPlayer,
    isFocusWithin: deps.isFocusWithin,
    playEpisode: deps.playEpisode
  } as unknown as EpisodeBrowserHost;
  const appLifecycle = {
    isHidden: deps.isHidden,
    getPlayer: deps.getPlayer,
    getPreview: deps.getPreview,
    play: deps.playMedia,
    stopPlayback: deps.stopPlayback,
    cleanup: deps.cleanup
  } as unknown as LifecycleHost;
  const webOsKeepAlive = {
    canUseLuna: deps.canUseLuna,
    getServiceId: deps.getServiceId,
    getBridge: deps.getBridge
  } as unknown as WebOsKeepAliveHost;
  const deepLink = {
    state: deps.state,
    getSearch: deps.getSearch,
    getChannelCount: deps.getChannelCount,
    skipWelcome: deps.skipWelcome,
    selectTab: deps.selectTab,
    focusDefault: deps.focusDefault,
    openDetail: deps.openDeepLinkDetail,
    openSearch: deps.openSearch,
    setSearchQuery: deps.setSearchQuery,
    openSettings: deps.openSettings,
    openSettingsPanel: deps.openSettingsPanel,
    openPlayer: deps.openDeepLinkPlayer,
    openChannels: deps.openChannels,
    focusSelector: deps.focusSelector
  } as unknown as DeepLinkHost;
  return {
    playerSession,
    playerResolve,
    playerLive,
    playerRouting,
    playerInfobar,
    liveChannelPanel,
    playerInfoContent,
    playerSubtitles,
    nextEpisodePrompt,
    nextEpisodeAdvance,
    playerAudio,
    playSettings,
    playerVideoSettings,
    episodeBrowser,
    appLifecycle,
    webOsKeepAlive,
    deepLink
  };
}
