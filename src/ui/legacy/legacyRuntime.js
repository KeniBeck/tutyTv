export function createLegacyRuntime(deps) {
    const ui = window.TutyUI;
    const core = window.TutyCore || {};

    var p = window.TUTYTV_API || {},
        u = /[?&]service=([^&]+)/.exec(window.location.search || "");
    u && (p.devServiceUrl = decodeURIComponent(u[1]));
    var serviceRuntime = ui.createServiceRuntime({
        getConfig: () => p,
        canUseLuna: deps.canUseLuna,
        getWebOs: () => window.webOS
    });
    var q = serviceRuntime.request;
    var L = serviceRuntime.requestDev;

    function E() {
        return serviceRuntime.ensureWebOsService()
    }
    var Nt = ui.stopPreview;
    var Ht = ui.renderLiveList;
    var lvFocusList = ui.focusLiveList;
    var lvOpenCats = ui.openCategories;
    var lvCloseCats = ui.closeCategories;
    var lvToggleFav = ui.toggleFavorites;
    var lvOpenSearch = ui.openSearch;
    var lvCloseSearch = ui.closeSearch;
    var jt = ui.openAddons;
    var Wt = ui.closeAddons;
    var askResume = ui.openResume;
    var closeResume = ui.closeResume;
    var li = ui.openSearchScreen;
    var ci = ui.setSearchQuery;
    var pi = ui.resetSearch;
    var openFilter = ui.openFilterPanel;
    var closeFilter = ui.closeFilterPanel;
    var yi = ui.openSettings;
    var bi = ui.selectSettingsTab;
    var subtitleEnd = ui.getPlayerSubtitleEnd;
    var Ze = ui.getLegacyFocusables;
    var et = ui.scrollLegacyFocusIntoView;
    var it = ui.firstLegacyFocus;
    var focusHomeTab = ui.focusHomeTab;
    var at = ui.moveLegacyFocus;
    var nt = ui.showNavigationScreen;
    var ot = ui.handleNavigationBack;
    var lt = ui.handleNavigationKey;
    var returnFromPlayer = ui.returnFromPlayer;
    var returnFromDetail = ui.returnFromDetail;
    var toggleDetailSynopsis = ui.toggleDetailSynopsis;
    var vt = ui.buildHomeTabs;
    var ht = ui.selectHomeTab;
    var mt = ui.scheduleLazyPosters;
    var bt = ui.buildHomePoster;
    var getHomeAddonPresets = ui.getHomeAddonPresets;
    var wt = ui.getHomeAddons;
    var xt = ui.saveHomeAddons;
    var Ut = ui.selectLiveCategory;
    var Ft = ui.loadLiveAddonChannels;
    var Bt = ui.loadLiveChannels;
    var Xt = ui.installAddonList;
    var Di = ui.togglePlayerPlayback;
    var Ei = ui.updatePlayerProgress;
    var qi = ui.showPlaybackOsd;
    var Ai = ui.schedulePlayerInfobarHide;
    var Pi = ui.showPlayerInfobar;
    var Ni = ui.hidePlayerInfobar;
    var Ri = ui.refreshPlayerInfobar;
    var Ua = ui.loadPlayerSubtitle;
    var getMediaInfoByKey = ui.getPlayerMediaInfo;
    var Qa = ui.loadPlayerMediaInfo;
    var applyPlayerSubtitlePreference = ui.applyPlayerSubtitlePreference;
    var setPlayerSubtitleEnabled = ui.setPlayerSubtitleEnabled;
    var getCurrentPlayerSubtitle = ui.getCurrentPlayerSubtitle;
    var setCurrentPlayerSubtitle = ui.setCurrentPlayerSubtitle;
    var setPlayerSubtitleForced = ui.setPlayerSubtitleForced;
    var resetPlayerTrackSelection = ui.resetPlayerTrackSelection;
    var Ka = ui.selectPlayerAudioIndex;
    var Ya = ui.getPlayerSubtitleTracks;
    var en = ui.schedulePlaySettingsClose;
    var tn = ui.openPlaySettings;
    var an = ui.closePlaySettings;
    var rn = ui.syncPlaySettingsRowFocus;
    var pn = ui.openEpisodeBrowser;
    var un = ui.closeEpisodeBrowser;
    var gn = ui.switchPlayerEpisode;
    var closeNextEpisodePrompt = ui.closeNextEpisodePrompt;
    var cancelNextEpisodePrompt = ui.cancelNextEpisodePrompt;
    var startNextEpisode = ui.startNextEpisode;
    var refreshNextSeasons = ui.refreshNextEpisodeSeasons;
    var maybeShowNextEpisodePrompt = ui.maybeShowNextEpisodePrompt;
    var yn = ui.offerNextEpisodeOnEnded;
    var Cn = ui.refreshStreamModeButtons;
    var wn = ui.refreshAspectButtons;
    var xn = ui.applyPlayerAspect;
    var Sn = ui.openPlaySettingsDialog;
    var _n = ui.closePlaySettingsDialog;
    var Ln = ui.renderAudioTracks;
    var Tn = ui.reloadPlayerStream;
    var qn = ui.renderLiveCategories;
    var On = ui.layoutLiveSelectedCategory;
    var Dn = ui.openPlayerLiveCategories;
    var An = ui.closePlayerLiveCategories;
    var Pn = ui.scrollPlayerLiveCategory;
    var Nn = ui.focusLiveChannelRow;
    var Rn = ui.renderLiveChannels;
    var Qn = ui.clearPlayerSeekReset;
    var resetPlayerSeekState = ui.resetPlayerSeekState;
    var Oi = ui.seekPlayerBy;
    var getPlayerSourceUrl = ui.getPlayerSourceUrl;
    var getPlayerRelayBase = ui.getPlayerRelayBase;
    var getPlayerRelayOffset = ui.getPlayerRelayOffset;
    var resetPlayerRelayState = ui.resetPlayerRelayState;
    var clearPlayerSourceUrls = ui.clearPlayerSourceUrls;
    var Yn = ui.getPlayerPosition;
    var Zn = ui.getPlayerPlaybackTotal;
    var probeRelayDuration = ui.probePlayerRelayDuration;
    var tr = ui.startPlayerScrub;
    var ir = ui.stepPlayerScrub;
    var ar = ui.resetPlayerStream;
    var rr = ui.loadPlayerSource;
    var or = ui.resolvePlayerPlayback;
    var sr = ui.startPlayerPlayback;
    var lr = ui.openFullscreenPlayer;
    var dr = ui.openPlayer;
    var ur = ui.playLiveChannel;
    var vr = ui.renderPlayerInfoContent;
    var hr = ui.openLiveChannelPanel;
    var gr = ui.closeLiveChannelPanel;
    var handleVisibilityChange = ui.handleLifecycleVisibilityChange;
    var br = ui.handleLifecycleUnload;
    var legacyNavigationAction = core.mapLegacyKeyToAction;
    var legacyNativeTvPlayback = function(){ return core.platform.prefersNativeTvPlayback(navigator.userAgent || "") };
    var legacyPauseVideo = core.player.pause;
    var legacyPlayVideo = core.player.play;
    var legacySetVideoSource = core.player.setSource;
    var legacyLoadVideo = core.player.reload;
    var legacyLoadHls = core.player.loadHls;
    var legacyResolveHistoryEpisode = core.resolveHistoryEpisode;
    var legacyCurrentPlaybackPosition = core.currentPlaybackPosition;
    var legacyShouldLoadSeriesEpisodesBeforePlay = core.shouldLoadSeriesEpisodesBeforePlay;
    var legacyShouldReusePlaybackSession = core.shouldReusePlaybackSession;
    var legacyHasPlaybackSession = core.hasPlaybackSession;
    var legacyPlaybackTiming = core.playbackTiming;
    var legacyShouldReportBuffering = core.shouldReportBuffering;
    var legacyResolveLiveResolveDelay = core.resolveLiveResolveDelay;
    var legacyApplyPlaybackSurface = core.applyPlaybackSurface;
    var legacyApplyPlayerStatus = core.applyPlayerStatus;
    var legacyApplyDetailPlayerTransition = core.applyDetailPlayerTransition;
    var legacyResetDetailPlayerSurface = core.resetDetailPlayerSurface;
    var legacyApplyPlayerModeClass = core.applyPlayerModeClass;
    var legacyLanguagePreference = core.languagePreferenceIndex;
    var legacyRelayStreamMode = core.isRelayStreamMode;
    var legacyInstallNavigation = core.connectLegacyNavigation;
    var legacyNativePreviewHls = core.platform.canPlayPreviewHls;
    var legacyPlatformBack = function(){ core.platform.back(window) };
    var legacyClampLiveChannelIndex = core.clampLiveChannelIndex;
    var legacyFormatLiveCategoryLabel = core.formatLiveCategoryLabel;
    var legacyLiveListScrollTop = core.liveListScrollTop;
    var legacyFilterCatalogCategory = core.filterCatalogCategory;
    var legacyBuildEpisodeRanges = core.buildEpisodeRanges;
    var legacyEpisodeDisplayTitle = core.episodeDisplayTitle;
    var legacySeasonList = core.seasonList;
    var legacySeasonEpisodes = core.seasonEpisodes;
    var legacyFindEpisodeIndex = core.findEpisodeIndex;
    var legacyFormatEpisodeDuration = core.formatEpisodeDuration;
    var legacyExtractCatalogItems = core.extractCatalogItems;
    var legacyNormalizeCatalogItem = core.normalizeCatalogItem;
    var legacyIsSeriesLike = core.isSeriesLike;
    var legacyFormatPlaybackTime = core.formatPlaybackTime;
    var legacyParseSubtitleCues = core.parseSubtitleCues;
    var legacyFindSubtitleCue = core.findSubtitleCue;
    var legacySeekVideo = core.player && core.player.seekTo;
    var legacyMediaKey = core.mapLegacyMediaKey;
    var legacyBuildPlaybackResolveRequest = core.buildPlaybackResolveRequest;
    var legacyApplyResolvedPlayback = core.applyResolvedPlayback;
    var legacyResolveNextPlaybackTarget = core.resolveNextPlaybackTarget;
    var legacyResolveDetailSeason = core.resolveDetailSeason;
    var legacyDestroyHls = function(slot) {
        core.destroyLegacyHls(window, slot)
    };
    return {
        p,
        q,
        L,
        E,
        Nt,
        Ht,
        lvFocusList,
        lvOpenCats,
        lvCloseCats,
        lvToggleFav,
        lvOpenSearch,
        lvCloseSearch,
        jt,
        Wt,
        askResume,
        closeResume,
        li,
        ci,
        pi,
        openFilter,
        closeFilter,
        yi,
        bi,
        subtitleEnd,
        Ze,
        et,
        it,
        focusHomeTab,
        at,
        nt,
        ot,
        lt,
        returnFromPlayer,
        returnFromDetail,
        toggleDetailSynopsis,
        vt,
        ht,
        mt,
        bt,
        getHomeAddonPresets,
        wt,
        xt,
        Ut,
        Ft,
        Bt,
        Xt,
        Di,
        Ei,
        qi,
        Ai,
        Pi,
        Ni,
        Ri,
        Ua,
        getMediaInfoByKey,
        Qa,
        applyPlayerSubtitlePreference,
        setPlayerSubtitleEnabled,
        getCurrentPlayerSubtitle,
        setCurrentPlayerSubtitle,
        setPlayerSubtitleForced,
        resetPlayerTrackSelection,
        Ka,
        Ya,
        en,
        tn,
        an,
        rn,
        pn,
        un,
        gn,
        closeNextEpisodePrompt,
        cancelNextEpisodePrompt,
        startNextEpisode,
        refreshNextSeasons,
        maybeShowNextEpisodePrompt,
        yn,
        Cn,
        wn,
        xn,
        Sn,
        _n,
        Ln,
        Tn,
        qn,
        On,
        Dn,
        An,
        Pn,
        Nn,
        Rn,
        Qn,
        resetPlayerSeekState,
        Oi,
        getPlayerSourceUrl,
        getPlayerRelayBase,
        getPlayerRelayOffset,
        resetPlayerRelayState,
        clearPlayerSourceUrls,
        Yn,
        Zn,
        probeRelayDuration,
        tr,
        ir,
        ar,
        rr,
        or,
        sr,
        lr,
        dr,
        ur,
        vr,
        hr,
        gr,
        handleVisibilityChange,
        br,
        legacyNavigationAction,
        legacyNativeTvPlayback,
        legacyPauseVideo,
        legacyPlayVideo,
        legacySetVideoSource,
        legacyLoadVideo,
        legacyLoadHls,
        legacyResolveHistoryEpisode,
        legacyCurrentPlaybackPosition,
        legacyShouldLoadSeriesEpisodesBeforePlay,
        legacyShouldReusePlaybackSession,
        legacyHasPlaybackSession,
        legacyPlaybackTiming,
        legacyShouldReportBuffering,
        legacyResolveLiveResolveDelay,
        legacyApplyPlaybackSurface,
        legacyApplyPlayerStatus,
        legacyApplyDetailPlayerTransition,
        legacyResetDetailPlayerSurface,
        legacyApplyPlayerModeClass,
        legacyLanguagePreference,
        legacyRelayStreamMode,
        legacyInstallNavigation,
        legacyNativePreviewHls,
        legacyPlatformBack,
        legacyClampLiveChannelIndex,
        legacyFormatLiveCategoryLabel,
        legacyLiveListScrollTop,
        legacyFilterCatalogCategory,
        legacyBuildEpisodeRanges,
        legacyEpisodeDisplayTitle,
        legacySeasonList,
        legacySeasonEpisodes,
        legacyFindEpisodeIndex,
        legacyFormatEpisodeDuration,
        legacyExtractCatalogItems,
        legacyNormalizeCatalogItem,
        legacyIsSeriesLike,
        legacyFormatPlaybackTime,
        legacyParseSubtitleCues,
        legacyFindSubtitleCue,
        legacySeekVideo,
        legacyMediaKey,
        legacyBuildPlaybackResolveRequest,
        legacyApplyResolvedPlayback,
        legacyResolveNextPlaybackTarget,
        legacyResolveDetailSeason,
        legacyDestroyHls,
        serviceRuntime
    };
}
