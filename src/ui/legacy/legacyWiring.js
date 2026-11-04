export function createLegacyWiring(ctx) {
    function getNavigationStageDeps() {
        return {
            state: ctx.j,
            byId: ctx.t,
            closest: ctx.n,
            el: ctx.e,
            clear: ctx.i,
            focus: ctx.tt,
            canFocus: ctx.Ye,
            moveFocus: ctx.at,
            getTabs: () => ctx.Re,
            getDetailButtons: () => ctx.oe,
            getDetailBottom: () => ctx.se,
            getPlayerFocus: () => ctx.ye,
            getSeekbar: () => ctx.Ee,
            getChannels: () => ctx.F,
            getVideo: () => ctx.we,
            isSeeking: function () {
                var runtime = window.TutyUI;
                return !!(runtime && runtime.isPlayerScrubbing && runtime.isPlayerScrubbing());
            },
            isFullSettingsOpen: () => ctx.fa,
            isQuickSettingsOpen: () => ctx.va,
            isAddonsOpen: () => ctx.Pt,
            hasSeasonPopup: ctx.hasDetailSeasonPopup,
            navigationAction: ctx.legacyNavigationAction,
            mapMediaKey: ctx.legacyMediaKey,
            closeCategoryPicker: ctx.An,
            closeSearch: ctx.pi,
            closeLiveSearch: ctx.lvCloseSearch,
            closeLiveCategories: ctx.lvCloseCats,
            cancelNextEpisodePrompt: ctx.cancelNextEpisodePrompt,
            closeEpisodeBrowser: ctx.un,
            closeAddons: ctx.Wt,
            closeResume: ctx.closeResume,
            closeFilter: ctx.closeFilter,
            closeFullSettings: ctx._n,
            closeQuickSettings: ctx.an,
            closeChannels: ctx.gr,
            closeSeasonPopup: ctx.closeSeasonPopupAndFocus,
            scheduleInfobarHide: ctx.Ai,
            schedulePlaySettingsClose: ctx.en,
            hideInfobar: ctx.Ni,
            hideVodInfobar: ctx.Ui,
            openCategories: ctx.lvOpenCats,
            openQuickSettings: ctx.tn,
            openFullSettings: ctx.Sn,
            openChannels: ctx.hr,
            showScreen: ctx.nt,
            selectTab: ctx.ht,
            platformBack: ctx.legacyPlatformBack,
            returnFromPlayer: ctx.returnFromPlayer,
            returnFromDetail: ctx.returnFromDetail,
            toggleSynopsis: ctx.toggleDetailSynopsis,
            handleBrowserHorizontal: ctx.handleBrowserHorizontal,
            resetStream: ctx.ar,
            resetPlayerSurface: function (node) {
                ctx.legacyResetDetailPlayerSurface(node);
            },
            stopWebMedia: ctx.stopWebMedia,
            playVideo: function () {
                try {
                    ctx.legacyPlayVideo(ctx.we);
                }
                catch (e) { }
            },
            pauseVideo: function () {
                try {
                    ctx.legacyPauseVideo(ctx.we);
                }
                catch (e) { }
            },
            togglePlayPause: ctx.Di,
            playCurrent: function () {
                if (!ctx.we)
                    return;
                try {
                    var e = ctx.legacyPlayVideo(ctx.we);
                    e && e.catch && e.catch(function () { });
                }
                catch (e) { }
            },
            setPlaybackStatus: ctx.qi,
            showInfobar: ctx.Pi,
            vodSeek: ctx.Oi,
            stepSeek: ctx.ir,
            stepVodSeek: ctx.Oi,
            startSeek: ctx.tr,
            closeSeek: function () {
                ctx.er(!1);
            },
            openSeek: ctx.er,
            openPlaySettings: ctx.tn,
            openEpisodeBrowser: ctx.pn,
            setSmooth: function (smooth) {
                ctx.$a(ctx.Ha(), smooth);
            },
            refreshStreamModeButtons: ctx.Cn,
            reloadStreamMode: ctx.Tn,
            applyAspect: ctx.xn,
            applySubtitleDisplay: ctx.Fa,
            savePlaybackPreferences: ctx.ka,
            renderLiveCategories: ctx.qn,
            renderLiveChannels: ctx.Rn,
            toggleFavorite: function (channel) {
                ctx.liveToggleFav(channel);
            },
            refreshLiveList: ctx.Ht,
            isFavoritesOnly: () => ctx.liveFavFilter,
            notifyStatus: ctx.nr,
            selectLiveChannel: ctx.Vt,
            focusLiveChannelRow: ctx.Nn,
            resetSubtitles: ctx.resetSubtitles,
            afterScreenChange: ctx.mt,
            renderDetail: ctx.ti,
            markDetailPlaying: ctx.bn
        };
    }
    function getPlayerStageHost() {
        return window.TutyUI.createPlayerStageHost(getNavigationStageDeps());
    }
    function getUiRuntimeDeps() {
        return {
            state: ctx.j,
            byId: ctx.t,
            el: ctx.e,
            clear: ctx.i,
            place: ctx.a,
            closest: ctx.n,
            focus: ctx.tt,
            canFocus: ctx.Ye,
            firstFocus: ctx.it,
            getChannels: () => ctx.F,
            getLiveFocus: () => ctx.ie,
            getLiveRows: () => ctx.Ue,
            getShellChannels: () => ctx.Ue,
            getShellTabs: () => ctx.H,
            getTabs: () => ctx.Re,
            setTabs: function (tabs) {
                ctx.Re = tabs;
            },
            getPages: () => ctx.Ne,
            setPages: function (pages) {
                ctx.Ne = pages;
            },
            getIcons: () => ctx.B,
            getPageCount: () => ctx.H.length,
            getInitialPage: () => ctx.H[ctx.j.tab] && ctx.H[ctx.j.tab].page >= 0 ? ctx.H[ctx.j.tab].page : 0,
            getTabConfig: (tab) => ctx.H[tab] || null,
            getTabPage: (tab) => ctx.H[tab] ? ctx.H[tab].page : -1,
            getTabFocus: () => ctx.tabFocus,
            getTabItems: () => ctx.Re,
            selectTab: ctx.ht,
            focusHomeTab: ctx.focusHomeTab,
            openSettings: ctx.yi,
            openSearch: ctx.li,
            openLiveSearch: ctx.lvOpenSearch,
            openFilter: ctx.openFilter,
            createVideo: () => document.createElement("video"),
            openCategories: ctx.lvOpenCats,
            toggleFavorites: ctx.lvToggleFav,
            selectChannel: ctx.Vt,
            openPlayer: ctx.dr,
            focusLive: function () {
                ctx.ie && ctx.tt(ctx.ie);
            },
            focusTab: function () {
                ctx.Re[0] && ctx.tt(ctx.Re[0]);
            },
            getCatalog: () => ctx.l,
            filterCategory: ctx.Yt,
            selectPage: ctx.I,
            openDetail: ctx.ei,
            afterBuild: ctx.mt,
            isHomeScreen: () => "home" === ctx.j.screen,
            onHeroLeft: function () {
                ctx.Re[ctx.j.tab] && ctx.tt(ctx.Re[ctx.j.tab]);
            },
            buildShell: function (host) {
                var runtime = window.TutyUI;
                return runtime && runtime.buildHomeShell ? runtime.buildHomeShell(host) : null;
            },
            buildLivePage: function (page, host) {
                var runtime = window.TutyUI;
                return runtime && runtime.buildHomeLivePage ? runtime.buildHomeLivePage(page, host) : null;
            },
            applyLiveRefs: function (refs) {
                ctx.Et = refs.video, ctx.te = refs.container, ctx.qt = refs.status, ctx.ae = refs.list, ctx.ie = refs.focus, ctx.ee = refs.channelLabel;
                ctx.liveFastAll = refs.fastAll, ctx.liveFastFav = refs.fastFav;
                ctx.Ht(!1), ctx.Bt();
            },
            buildVodPage: function (index, page, host) {
                var runtime = window.TutyUI;
                runtime && runtime.buildHomeVodPage && runtime.buildHomeVodPage(index, page, host);
            },
            stopPreview: ctx.Nt,
            previewChannel: ctx.Rt,
            isWeb: () => !!window.TUTYTV_WEB,
            stopWebMedia: ctx.stopWebMedia,
            queryPosters: () => document.querySelectorAll("img[data-poster-src]"),
            getViewport: function () {
                return {
                    width: window.innerWidth || 1920,
                    height: window.innerHeight || 1080
                };
            },
            syncFavorites: ctx.syncLiveFavorites,
            ensureOverlay: () => ctx.je || (ctx.je = ctx.t("player-categories"), ctx.je),
            ensureGrid: () => ctx.We || (ctx.We = ctx.t("pcat-grid"), ctx.We),
            ensureSubtitle: () => ctx.$e || (ctx.$e = ctx.t("pcat-sub"), ctx.$e),
            getCategories: () => ctx.St,
            getSelectedCategory: () => ctx._t,
            setSelectedCategory: function (category) {
                ctx._t = category;
            },
            selectCategory: ctx.Ut,
            getChannelPanel: () => ctx.Ce,
            hideInfobar: ctx.Ni,
            focusPlayer: function () {
                ctx.ye && ctx.tt(ctx.ye);
            },
            layoutSelectedCategory: ctx.On,
            closeChannels: ctx.gr,
            readStorage: ctx.G,
            writeStorage: function (key, value) {
                ctx.J(key, value);
            },
            isLiveFavorite: ctx.liveIsFav,
            getAddons: ctx.wt,
            requestChannels: function (params, done) {
                ctx.q("liveChannels", params, done);
            },
            requestCategories: function (done) {
                ctx.q("liveCategories", {}, done);
            },
            requestM3u: function (url, done) {
                ctx.q("fetchM3u", {
                    url: url
                }, done);
            },
            notify: ctx.nr,
            renderList: ctx.Ht,
            renderPlayerChannels: ctx.Rn,
            refreshPlayerChannels: ctx.vr,
            playPlayerChannel: ctx.ur,
            setChannelLabel: function (name) {
                ctx.ee && (ctx.ee.textContent = name);
            },
            renderCategories: ctx.qn,
            updateCategoryLabel: ctx.liveUpdateLabel,
            queryFocusables: () => document.querySelectorAll(".focusable"),
            isPlaySettingsOpen: () => ctx.fa,
            isPlaySettingViewOpen: () => ctx.va,
            getRows: () => ctx.Ue,
            getListContainer: () => ctx.ae,
            getChannelLabel: () => ctx.ee,
            getFastAll: () => ctx.liveFastAll,
            getFastFav: () => ctx.liveFastFav,
            isFavoritesOnly: () => ctx.liveFavFilter,
            setFavoritesOnly: function (value) {
                ctx.liveFavFilter = value;
            },
            toggleLiveFavorite: ctx.liveToggleFav,
            focusLiveList: ctx.lvFocusList,
            getPlayerFocus: () => ctx.ye,
            updateLabel: ctx.liveUpdateLabel,
            getChannel: () => ctx.F[ctx.j.channel] || null,
            getVideo: () => ctx.Et,
            getContainer: () => ctx.te,
            getStatus: () => ctx.qt,
            resolveLive: function (channel, done) {
                ctx.q("resolveLive", channel.streamUrl ? {
                    streamUrl: channel.streamUrl
                } : {
                    channelCode: channel.channelCode
                }, done);
            },
            play: (video) => ctx.legacyPlayVideo(video),
            pause: function (video) {
                ctx.legacyPauseVideo(video);
            },
            setSource: function (video, url) {
                ctx.legacySetVideoSource(video, url);
            },
            load: function (video) {
                ctx.legacyLoadVideo(video);
            },
            loadHls: function (video, hls, url) {
                ctx.legacyLoadHls(video, hls, url);
            },
            destroyHls: function () {
                ctx.legacyDestroyHls("__tutyPreviewHls");
            },
            setHls: function (hls) {
                window.__tutyPreviewHls = hls;
            },
            createHls: function () {
                return new window.Hls({
                    enableWorker: !0,
                    backBufferLength: 10
                });
            },
            hlsEvents: () => window.Hls && window.Hls.Events || null,
            canUseHls: () => !!(window.Hls && window.Hls.isSupported()),
            nativeTvPlayback: ctx.legacyNativeTvPlayback,
            nativePreviewHls: ctx.legacyNativePreviewHls,
            getPresets: ctx.getHomeAddonPresets,
            saveAddons: ctx.xt,
            installAddon: ctx.Xt,
            reloadChannels: ctx.Ft,
            isChannelsOpen: () => ctx.j.channelsOpen,
            getChannelsPanel: () => ctx.Ce,
            setOpen: function (value) {
                ctx.Pt = value;
            },
            showScreen: ctx.nt,
            getHotSearches: function () {
                for (var source = ctx.T(), items = [], index = 0; index < source.length; index++)
                    -1 !== String(source[index] && source[index].category || "").toLowerCase().indexOf("busqueda") && items.push(ctx._(source[index], index + 1));
                return items.length ? items : ctx.I("busqueda", 10, 0);
            },
            isPortal: () => "portal" === ctx.p.mode,
            searchRemote: function (value, done) {
                ctx.q("search", {
                    value: value
                }, done);
            },
            normalizeItem: ctx._,
            buildPoster: ctx.bt,
            getProfile: () => ctx.X,
            isSeries: ctx.S,
            openHistory: ctx.Oa,
            formatTime: ctx.ki,
            refreshPlayback: function () {
                ctx.ka(), ctx.Q();
            },
            onStreamModeChanged: function () {
                ctx.za = ctx.j.playback.streamModes = {}, ctx.j.playerItem && ctx.Wa(ctx.j.playerItem);
            },
            isFavorite: (item) => !!(item && item.id && ctx.j.favs[String(item.id)]),
            toggleFavorite: ctx.K,
            isReminderActive: ctx.reminderOn,
            toggleReminder: ctx.toggleReminder,
            toast: ctx.toast,
            playItem: ctx.lr,
            playEpisode: ctx.gn,
            startPlayback: ctx.sr,
            openLanguage: ctx.Sn,
            isSmooth: () => "smooth" === ctx.j.streamMode,
            toggleSmooth: function (item) {
                var next = "smooth" !== ctx.j.streamMode;
                return ctx.$a(item, next), "smooth" === ctx.j.streamMode;
            },
            loadSeason: function (item, index, done) {
                var season = item.seasons && item.seasons[index];
                if (!season || !season.id)
                    return void done();
                ctx.nr("Cargando temporada…"), ctx.q("detail", {
                    contentId: season.id
                }, function (error, response) {
                    if (!error && response && !1 !== response.returnValue) {
                        if (response.item)
                            ctx.R(item, response.item);
                        item.episodes = response.episodes || [];
                        item.seasonId = season.id;
                        season._episodes = item.episodes;
                        ctx.j.detailEpisode = item.episodes[0] || null;
                    }
                    done();
                });
            },
            getMedia: () => ctx.we,
            getDetail: () => ctx.j.detail,
            getStreamUrl: () => ctx.getPlayerSourceUrl(),
            resetStream: ctx.ar,
            prepareMediaInfo: function (item) {
                ctx.ma = !1, ctx.ga = 0, ctx.Qa(item);
            },
            resolvePlayback: ctx.or,
            loadSource: ctx.rr,
            notifyStatus: ctx.nr,
            shouldReuse: (screen, hasSource, sameItem, sameEpisode) => ctx.legacyShouldReusePlaybackSession(screen, hasSource, sameItem, sameEpisode),
            hasPlaybackSession: (source, currentSource, streamUrl, streamError) => ctx.legacyHasPlaybackSession(source, currentSource, streamUrl, streamError),
            currentPosition: (media) => ctx.legacyCurrentPlaybackPosition(media.currentTime || 0, ctx.getPlayerRelayBase(), ctx.getPlayerRelayOffset()),
            prepareItem: ctx.Wa,
            resetPlaybackItem: ctx.Xa,
            showFullscreenPlayer: function () {
                var playerScreen = ctx.t("screen-player"), detailScreen = ctx.t("screen-detail");
                ctx.legacyApplyDetailPlayerTransition(playerScreen, detailScreen), ctx.legacyApplyPlayerModeClass(ctx.ye, !0), ctx.vr(), ctx.tt(ctx.ye), ctx.Ri();
            },
            logTransition: function (info) {
                window.TUTYTV_WEB && window.console && console.log("[TUTYTV] fullscreen transition", info);
            },
            getResolveSequence: () => ctx.Bn,
            getMediaInfo: (item) => ctx.getMediaInfoByKey(ctx.Ja(item)),
            getMediaKey: ctx.Ja,
            isAudioOverride: () => ctx.ma,
            getAudioIndex: () => ctx.ga,
            setAudioIndex: function (index) {
                ctx.ga = index;
            },
            selectAudioTrack: ctx.Ka,
            buildRequest: ctx.legacyBuildPlaybackResolveRequest,
            shouldLoadEpisodes: ctx.legacyShouldLoadSeriesEpisodesBeforePlay,
            loadSeriesDetail: ctx.U,
            resolve: function (request, forceRelay, done) {
                ctx.q(forceRelay ? "resolveSmooth" : "resolve", request, done);
            },
            applyResolved: ctx.legacyApplyResolvedPlayback,
            setStreamInfo: function (info) {
                try {
                    window.__tutyStreamInfo = info;
                }
                catch (e) { }
            },
            getCurrentChannel: () => ctx.F[ctx.j.channel] || null,
            getLiveSequence: () => ctx.cr,
            nextLiveSequence: () => ++ctx.cr,
            resolveDelay: () => ctx.legacyResolveLiveResolveDelay(!1),
            showInfobar: function () {
                ctx.Pi();
            },
            ensurePlayerStage: function () {
                ctx.ye || ctx.En();
            },
            applyPlayerMode: function (isVod) {
                ctx.legacyApplyPlayerModeClass(ctx.ye, isVod);
            },
            refreshPlayer: ctx.vr,
            showPlayerScreen: function () {
                ctx.nt("player");
            },
            closeChannelPanels: function () {
                ctx.j.channelsOpen = !1, ctx.be && ctx.be.classList.remove("is-active"), ctx.Ce && ctx.Ce.classList.remove("is-active");
            },
            playLive: function () {
                ctx.ur(ctx.F[ctx.j.channel]);
            },
            playVod: ctx.sr,
            openFullscreen: ctx.lr,
            getVodBar: () => ctx.Le,
            getLiveBar: () => ctx.be,
            getOsd: () => ctx.Ae || (ctx.Ae = ctx.t("player-osd-icon")),
            hideDelayMs: ctx._i,
            getPanel: () => ctx.Ce,
            getPageSize: () => ctx.Ge,
            getCategorySignature: () => ctx.Xe,
            setCategorySignature: function (value) {
                ctx.Xe = value;
            },
            getFocusCategory: () => ctx.j.focus && ctx.j.focus._cat ? ctx.j.focus._cat : null,
            getChannelRows: () => ctx.Ve,
            setChannelRows: function (rows) {
                ctx.Ve = rows;
            },
            focusAndScroll: function (container, node) {
                ctx.tt(node), ctx.Pn(container, node);
            },
            scrollIntoView: ctx.Pn,
            openPlayerCategories: ctx.Dn,
            openAddons: ctx.jt,
            playChannel: ctx.Vt,
            closePanel: ctx.gr,
            focusCurrentChannel: function (index) {
                var row = ctx.Ve[index];
                if (!row)
                    return;
                ctx.tt(row);
                var parent = row.parentNode, top = 111 * index;
                (top < parent.scrollTop || top + 109.5 > parent.scrollTop + parent.clientHeight) && (parent.scrollTop = Math.max(0, top - 120));
            },
            getVodTitle: () => ctx.Me,
            getVodPoster: () => ctx.ke,
            getPlayerVideo: () => ctx.we,
            syncChannelTabs: function () {
                for (var key in ctx.Ve)
                    ctx.Ve.hasOwnProperty(key) && ctx.Ve[key].classList.toggle("is-current", ctx.Ve[key]._channel === ctx.j.channel);
            },
            layoutLiveQuality: ctx.fr,
            updateProgress: function (position, duration) {
                ctx.Ei(position, duration);
            },
            getSubtitleContainer: () => ctx.ua,
            fetchText: function (url, done) {
                try {
                    var request = new XMLHttpRequest;
                    request.open("GET", url, !0), request.onload = function () {
                        done(request.status >= 200 && request.status < 300 ? request.responseText : null);
                    }, request.onerror = function () {
                        done(null);
                    }, request.send();
                }
                catch (e) {
                    done(null);
                }
            },
            parseCues: (text) => ctx.legacyParseSubtitleCues(text),
            findCue: (list, position) => ctx.legacyFindSubtitleCue(list, position),
            restorePlayerFocus: function () {
                ctx.ye && ctx.tt(ctx.ye);
            },
            formatTarget: (target) => ctx.dn(ctx.j.playerItem, target.episode) || "Episodio siguiente",
            startNext: ctx.startNextEpisode,
            seasons: ctx.sn,
            seasonEpisodes: ctx.legacySeasonEpisodes,
            findEpisodeIndex: ctx.legacyFindEpisodeIndex,
            resolveNext: ctx.legacyResolveNextPlaybackTarget,
            refreshSeasons: ctx.refreshNextSeasons,
            showLoading: ctx.showNextEpisodeLoading,
            hideLoading: ctx.mn,
            switchEpisode: ctx.gn,
            loadSeasonEpisodes: function (item, season, done) {
                ctx.ln(item, season, function (episodes, detail) {
                    done(episodes || [], detail);
                });
            },
            mergeDetail: ctx.R,
            requestDetail: function (itemId, done) {
                ctx.q("detail", {
                    contentId: itemId
                }, done);
            },
            resolveSeason: (seasons, item) => ctx.legacyResolveDetailSeason(seasons, item.id, item.seasonId, item.title || item.alias),
            getPosition: ctx.Yn,
            getTotal: ctx.Zn,
            log: function (message, payload) {
                window.TUTYTV_WEB && window.console && console.log("[TUTYTV] " + message, payload);
            },
            getOptions: () => ctx.aa,
            getMediaAudio: function () {
                var media = ctx.getMediaInfoByKey(ctx.Ja(ctx.Ha()));
                return media && media.audio;
            },
            getSelectedIndex: () => ctx.ga,
            setSelectedIndex: function (index) {
                ctx.ga = index;
            },
            setAudioOverride: function (value) {
                ctx.ma = value;
            },
            parseTracks: function (audio) {
                var core = window.TutyCore;
                if (core && typeof core.parseAudioTracks === "function")
                    return core.parseAudioTracks(audio);
                for (var tracks = [], parts = String(audio || "").split(/[,\/]/), index = 0; index < parts.length; index++) {
                    var code = parts[index].trim();
                    code && tracks.push({
                        index: index,
                        code: code,
                        label: ctx.Mn(code)
                    });
                }
                return tracks;
            },
            describeTrack: ctx.Mn,
            selectIndex: (audio) => ctx.Ka(audio),
            languagePreference: ctx.legacyLanguagePreference,
            savePreferences: ctx.Q,
            isPlayerScreen: () => "player" === ctx.j.screen,
            hasMedia: () => !!ctx.we,
            getRelaySource: () => ctx.getPlayerRelayBase(),
            absolutePosition: () => Math.floor(ctx.getPlayerRelayOffset() + (ctx.we ? ctx.we.currentTime || 0 : 0)),
            loadUrl: ctx.rr,
            ensureRelayMode: function () {
                "relay" !== ctx.j.streamMode && "smooth" !== ctx.j.streamMode && (ctx.j.streamMode = "relay", ctx.Cn());
            },
            reloadResolved: ctx.Tn,
            closeSettings: ctx.en,
            getFocusRow: () => ctx.j.focus ? ctx.n(ctx.j.focus, ".psv-row") : null,
            getSeasons: ctx.sn,
            getEpisodeRanges: ctx.ii,
            refreshMediaInfo: ctx.Qa,
            playSettingsEpisode: function (episode, seasonIndex) {
                var runtime = window.TutyUI;
                runtime && runtime.playEpisodeSelection && runtime.playEpisodeSelection(episode, seasonIndex);
            },
            refreshStreamModeButtons: ctx.Cn,
            refreshAspectButtons: ctx.wn,
            ensureStage: function () {
                ctx.Fi || ctx.En();
            },
            isQuickOpen: () => ctx.va,
            setQuickOpen: function (value) {
                ctx.va = value;
            },
            isFullOpen: () => ctx.fa,
            setFullOpen: function (value) {
                ctx.fa = value;
            },
            getCurrentFocus: () => ctx.j.focus || null,
            getCurrentItem: ctx.Ha,
            renderAudioTracks: ctx.Ln,
            getSubtitleTracks: () => ctx.Ya(ctx.getMediaInfoByKey(ctx.Ja(ctx.Ha()))),
            isSubtitleEnabled: ctx.isPlayerSubtitleEnabled,
            setSubtitleEnabled: ctx.setPlayerSubtitleEnabled,
            getCurrentSubtitle: ctx.getCurrentPlayerSubtitle,
            setCurrentSubtitle: ctx.setCurrentPlayerSubtitle,
            setSubtitleForced: ctx.setPlayerSubtitleForced,
            loadSubtitle: ctx.Ua,
            getSubtitleSize: () => ctx.xa,
            getSubtitleStyle: () => ctx.Sa,
            setSubtitleSize: function (value) {
                ctx.xa = value;
            },
            setSubtitleStyle: function (value) {
                ctx.Sa = value;
            },
            savePlaybackPreferences: ctx.Q,
            applySubtitleDisplay: ctx.Fa,
            formatLanguage: ctx.Mn,
            getRelayButton: () => ctx.ji,
            getNormalButton: () => ctx.Wi,
            getCheck: (button) => button && button.querySelector(".psv-check"),
            getAspectButtons: () => ctx.Gi ? ctx.Gi.querySelectorAll(".psv-btn") : [],
            isRelayMode: ctx.legacyRelayStreamMode,
            ensureDom: () => ctx.Qi || (ctx.En(), ctx.Qi),
            getEpisodeTitle: () => ctx.Ki,
            getEpisodeSubtitle: () => ctx.Yi,
            getSeasonLabel: () => ctx.ia,
            getSeasonsContainer: () => ctx.Zi,
            getEpisodesContainer: () => ctx.ta,
            querySelector: (root, selector) => root && root.querySelector ? root.querySelector(selector) : null,
            querySelectorAll: (root, selector) => root && root.querySelectorAll ? root.querySelectorAll(selector) : [],
            formatEpisode: ctx.dn,
            formatDuration: ctx.cn,
            loadDetail: ctx.U,
            closePlaySettingsIfOpen: function () {
                ctx.va && ctx.an();
            },
            isFocusWithin: (id) => !!ctx.n(ctx.j.focus, "#" + id),
            isHidden: () => !!document.hidden,
            getPlayer: () => ctx.we,
            getPreview: () => ctx.Et,
            playMedia: (media) => ctx.legacyPlayVideo(media),
            stopPlayback: ctx.ar,
            cleanup: ctx.pi,
            canUseLuna: ctx.legacyCanUseLuna,
            getServiceId: () => ctx.p.serviceId || "com.webosflux.xuptertv.fidelity.service",
            getBridge: () => window.webOS && window.webOS.service ? window.webOS.service : null,
            getSearch: () => location.search || "",
            getChannelCount: () => ctx.F.length,
            skipWelcome: ctx.dt,
            focusDefault: function () {
                ctx.tt(ctx.ie);
            },
            openDeepLinkDetail: function (index) {
                ctx.ei(ctx.l[index]);
            },
            setSearchQuery: ctx.ci,
            openSettingsPanel: function (index) {
                ctx.bi(index, !0);
            },
            openDeepLinkPlayer: function (mode, index) {
                ctx.dr(mode, ctx.l[index] || null);
            },
            openChannels: ctx.hr,
            focusSelector: function (selector) {
                var element = document.querySelector(selector);
                element && ctx.tt(element);
            },
        };
    }
    function getFocusHostDeps() {
        return {
            state: ctx.j,
            byId: ctx.t,
            getFocusables: ctx.Ze,
            getTabFocus: () => ctx.tabFocus,
            getTabItems: () => ctx.Re,
            scrollIntoView: ctx.et,
            onFocusChanged: ctx.rn,
            afterFocus: ctx.mt
        };
    }
    function getPlayerWiringDeps() {
        return {
            state: ctx.j,
            getVideo: () => ctx.we,
            getPosition: ctx.Yn,
            getAudioIndex: () => ctx.ga,
            getMediaKey: ctx.Ja,
            getEpisode: ctx.Ga,
            requestMediaInfo: function (params, done) {
                ctx.q("mediaInfo", params, done);
            },
            loadSubtitle: ctx.Ua,
            resetStream: ctx.ar,
            closeNextEpisodePrompt: ctx.closeNextEpisodePrompt,
            refreshPlayerChannels: function () {
                ctx.ye && ctx.be && ctx.vr();
            },
            renderDetailEpisodes: ctx.bn,
            notify: ctx.nr,
            startPlayback: ctx.sr,
            saveHistory: ctx.Ta,
            resetPlaybackState: function () {
                ctx.j.streamError = "", ctx.$n(), ctx.nr(""), ctx.qi("none"), ctx.Ti(), ctx.resetPlayerSeekState(), ctx.resetPlayerRelayState(), ctx.Bn++;
            },
            abortMedia: function (base) {
                if (base)
                    try {
                        var request = new XMLHttpRequest;
                        request.open("GET", base + "/media/abort", !0), request.send();
                    }
                    catch (e) { }
                try {
                    ctx.q("abortMedia", {}, function () { });
                }
                catch (e) { }
            },
            destroyHls: function () {
                ctx.legacyDestroyHls("__tutyHls");
            },
            clearVideo: function (video) {
                ctx.clearPlayerSourceUrls();
                try {
                    video.onerror = null;
                }
                catch (e) { }
                try {
                    ctx.legacyPauseVideo(video);
                }
                catch (e) { }
                try {
                    ctx.legacySeekVideo(video, 0);
                }
                catch (e) { }
                video.removeAttribute("src");
                try {
                    ctx.legacySetVideoSource(video, "");
                }
                catch (e) { }
                for (; video.firstChild;)
                    video.removeChild(video.firstChild);
                ctx.legacyApplyPlaybackSurface(video, ctx.xe, !1);
            },
            clearSessionSource: function () {
                var runtime = window.TutyUI;
                runtime && runtime.clearPlayerSessionSource && runtime.clearPlayerSessionSource();
            },
            resolveTarget: ctx.or,
            loadSource: ctx.rr,
            seekVideoPosition: function (position) {
                ctx.legacySeekVideo(ctx.we, position);
            },
            getSeekbar: () => ctx.Ee,
            getCurrentNode: () => ctx.Ie,
            getTotalNode: () => ctx.Te,
            getProgressNode: () => ctx.qe,
            getBufferedNode: () => ctx.Oe,
            getThumbNode: () => ctx.De,
            getSubtitleEnd: ctx.subtitleEnd,
            clearInfobarTimer: function () {
                ctx.j.infoTimer && (clearTimeout(ctx.j.infoTimer), ctx.j.infoTimer = null);
            },
            playVideo: ctx.legacyPlayVideo,
            pauseVideo: ctx.legacyPauseVideo,
            setTransport: ctx.qi,
            showInfobar: ctx.Pi,
            scheduleInfobarHide: ctx.Ai,
            focus: ctx.tt,
            focusPlayer: function () {
                ctx.tt(ctx.ye);
            },
            seekVideo: function (video, position) {
                ctx.legacySeekVideo(video, position);
            },
            updateProgress: ctx.Ei,
            probeRelayDuration: ctx.probeRelayDuration,
            clearBufferingNotice: ctx.$n,
            clearSeekReset: ctx.Qn,
            hideLoading: ctx.mn,
            scheduleBufferingNotice: ctx.Xn,
            updateHistory: ctx.Ba,
            maybeShowNextEpisodePrompt: function (position, total) {
                ctx.maybeShowNextEpisodePrompt(position, total);
            },
            stopHistoryTimer: ctx.Ti,
            handleEnded: ctx.yn,
            getLiveSequence: () => ctx.cr,
            getSmoothRetryMarker: () => ctx.Va,
            setSmoothRetryMarker: function (key) {
                ctx.Va = key;
            },
            markCompatibleVod: function (item) {
                ctx.$a(item, !0);
            },
            reloadStream: ctx.Tn,
            applyPlaybackSurface: function (video, active) {
                ctx.legacyApplyPlaybackSurface(video, ctx.xe, active);
            },
            nativeTvPlayback: ctx.legacyNativeTvPlayback,
            isHlsSupported: () => !!(window.Hls && window.Hls.isSupported()),
            pause: ctx.legacyPauseVideo,
            createHls: (options) => new window.Hls(options),
            setActiveHls: function (hls) {
                window.__tutyHls = hls;
            },
            getHlsEvents: () => window.Hls.Events,
            getHlsErrorTypes: () => window.Hls.ErrorTypes,
            loadHls: ctx.legacyLoadHls,
            createSourceElement: () => document.createElement("source"),
            setVideoSource: ctx.legacySetVideoSource,
            load: ctx.legacyLoadVideo,
            play: ctx.legacyPlayVideo,
            getSourceMediaKey: ctx.ja
        };
    }
    return { getNavigationStageDeps, getPlayerStageHost, getUiRuntimeDeps, getFocusHostDeps, getPlayerWiringDeps };
}
