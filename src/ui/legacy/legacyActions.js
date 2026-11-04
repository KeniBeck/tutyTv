import { attachLegacyRuntime } from "./legacyAttach.js";
import { createLegacyBootstrapDeps, startLegacyBootstrap } from "./legacyBootstrap.js";
export function createLegacyActions(ctx) {
    function e(e, t, i) {
        var runtime = window.TutyUI;
        if (runtime && runtime.el)
            return runtime.el(e, t, i);
        var a = document.createElement(e);
        return t && (a.className = t), null != i && (a.textContent = i), a;
    }
    function t(e) {
        var runtime = window.TutyUI;
        return runtime && runtime.byId ? runtime.byId(e) : document.getElementById(e);
    }
    function i(e) {
        var runtime = window.TutyUI;
        if (runtime && runtime.clear)
            return runtime.clear(e);
        for (; e.firstChild;)
            e.removeChild(e.firstChild);
    }
    function a(e, t, i, a, n) {
        var runtime = window.TutyUI;
        if (runtime && runtime.place)
            return runtime.place(e, t, i, a, n);
        return e.style.position = "absolute", e.style.left = t + "px", e.style.top = i + "px", void 0 !== a && (e.style.width = a + "px"), void 0 !== n && (e.style.height = n + "px"), e;
    }
    function n(e, t) {
        var runtime = window.TutyUI;
        if (runtime && runtime.closest)
            return runtime.closest(e, t);
        for (; e && e !== document;) {
            if (1 === e.nodeType && e.matches && e.matches(t))
                return e;
            e = e.parentNode;
        }
        return null;
    }
    function g(e) {
        return ctx.legacyExtractCatalogItems(e);
    }
    function S(e) {
        return ctx.legacyIsSeriesLike(e);
    }
    function _(e, t) {
        return ctx.legacyNormalizeCatalogItem(e, t);
    }
    function I(e, t, i) {
        return ctx.catalogRuntime.selectPage(e, t, i);
    }
    function T() {
        return ctx.catalogRuntime.bundledCatalog();
    }
    function D() {
        return ctx.catalogRuntime.refreshPortal();
    }
    function N() {
        return ctx.catalogRuntime.loadCatalog();
    }
    function R(e, t) {
        return ctx.catalogRuntime.mergeDetail(e, t);
    }
    function U(e, t) {
        return ctx.catalogRuntime.loadDetail(e, t);
    }
    function G(e, t) {
        var _core = window.TutyCore;
        if (_core && _core.storage && typeof _core.storage.read === "function")
            return _core.storage.read(e, t);
        try {
            var i = localStorage.getItem(e);
            return i ? JSON.parse(i) : t;
        }
        catch (e) {
            return t;
        }
    }
    function J(e, t) {
        var _core = window.TutyCore;
        if (_core && _core.storage && typeof _core.storage.write === "function")
            return _core.storage.write(e, t);
        try {
            localStorage.setItem(e, JSON.stringify(t));
        }
        catch (e) { }
    }
    function legacyCanUseLuna() {
        if (!ctx.E())
            return !1;
        var _core = window.TutyCore;
        if (_core && _core.platform && typeof _core.platform.canUseLunaService === "function")
            return _core.platform.canUseLunaService(window.PalmServiceBridge);
        return !!window.PalmServiceBridge;
    }
    function Q(e) {
        return ctx.profileRuntime.savePlayback();
    }
    function K(e) {
        return ctx.profileRuntime.toggleFavorite(e);
    }
    function reminderOn(e) {
        return ctx.profileRuntime.isReminderActive(e);
    }
    function toggleReminder(e) {
        return ctx.profileRuntime.toggleReminder(e);
    }
    function toast(msg) {
        var i = t("app");
        if (i) {
            var a = e("div", "tuty-toast", msg);
            i.appendChild(a), setTimeout(function () {
                a.parentNode && a.parentNode.removeChild(a);
            }, 3500);
        }
    }
    function stopWebMedia() {
        if (!window.TUTYTV_WEB)
            return;
        try {
            ctx.we && ctx.legacyPauseVideo(ctx.we);
        }
        catch (e) { }
        ctx.legacyDestroyHls("__tutyHls");
        try {
            ctx.Et && ctx.legacyPauseVideo(ctx.Et);
        }
        catch (e) { }
        ctx.legacyDestroyHls("__tutyPreviewHls");
        try {
            ctx.q("abortMedia", {}, function () { });
        }
        catch (e) { }
    }
    function checkReminders() {
        return ctx.profileRuntime.checkReminders();
    }
    function Ye(e) {
        var runtime = window.TutyUI;
        return !!(runtime && runtime.canFocusLegacyNode && runtime.canFocusLegacyNode(e));
    }
    function tt(e, i) {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasFocusRuntime && runtime.hasFocusRuntime() && runtime.focusElement)
            return void runtime.focusElement(e, i);
    }
    function handleBrowserHorizontal(code) {
        var r = n(ctx.j.focus, "#pe-seasons"), o = n(ctx.j.focus, "#pe-episodes");
        if (37 === code) {
            if (o && ctx.ea && "none" !== ctx.ea.style.display) {
                var s = ctx.Zi ? ctx.Zi.children[ctx.j.browserSeason] || ctx.it(ctx.Zi) : null;
                s && tt(s);
                return !0;
            }
        }
        else if (39 === code && r) {
            var l = ctx.ta ? ctx.ta.querySelector(".pe-ep.is-current") || ctx.it(ctx.ta) : null;
            l && tt(l);
            return !0;
        }
        return !1;
    }
    function closeSeasonPopupAndFocus() {
        ri();
        var e = ctx.se ? ctx.se.querySelector(".season-arrow") : null;
        e && tt(e);
    }
    function hasDetailSeasonPopup() {
        var runtime = window.TutyUI, modulePopup = !!(runtime && runtime.hasDetailRuntime && runtime.hasDetailRuntime() && runtime.hasSeasonPopup && runtime.hasSeasonPopup());
        return !!(ctx.ni || modulePopup);
    }
    function dt() {
        ctx.Ke && (clearTimeout(ctx.Ke), clearInterval(ctx.Ke), ctx.Ke = null), !(window.TutyUI && window.TutyUI.isHomeTabsBuilt && window.TutyUI.isHomeTabsBuilt()) && ctx.vt(), ctx.nt("home"), ctx.ht(0, !1), tt(ctx.ie);
        var e = t("home-tabs");
        e && (e.classList.remove("is-expanded"), e.classList.add("is-collapsed"));
        var i = document.querySelector(".home-sidebar-bg");
        i && i.classList.remove("is-on");
    }
    function Rt(e) {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasPreviewRuntime && runtime.hasPreviewRuntime() && runtime.previewChannel)
            return runtime.previewChannel(e || ctx.F[ctx.j.channel]);
        return !1;
    }
    function liveIsFav(e) {
        var runtime = window.TutyUI;
        return !!(runtime && runtime.isLiveFavoriteChannel && runtime.isLiveFavoriteChannel(e));
    }
    function liveToggleFav(e) {
        var runtime = window.TutyUI;
        return !!(runtime && runtime.toggleLiveFavoriteChannel && runtime.toggleLiveFavoriteChannel(e));
    }
    function Vt(e, t) {
        return ctx.liveSelectionRuntime.select(e, t);
    }
    function syncLiveFavorites(favorites) {
        return ctx.liveSelectionRuntime.syncFavorites(favorites);
    }
    function liveCatName() {
        return ctx._t && ctx._t.name ? ctx._t.name : "Todos";
    }
    function liveUpdateLabel() {
        var e = t("live-cat-label");
        if (!e)
            return;
        var i = liveCatName(), a = ctx.liveFavFilter ? ctx.Ue.length : ctx.F.length;
        e.textContent = ctx.legacyFormatLiveCategoryLabel(i, ctx.liveFavFilter, a);
    }
    function Yt(e) {
        return ctx.legacyFilterCatalogCategory(ctx.l, e);
    }
    function ei(e) {
        return ctx.detailRuntime.open(e);
    }
    function ei(e) {
        return ctx.detailRuntime.open(e);
    }
    function ti(n) {
        ctx.oe = t("detail-buttons"), ctx.se = t("detail-bottom");
        var runtime = window.TutyUI;
        if (runtime && runtime.hasDetailRuntime && runtime.hasDetailRuntime() && runtime.renderDetail)
            return runtime.renderDetail(n);
        return !1;
    }
    function ii(e) {
        return ctx.legacyBuildEpisodeRanges(e);
    }
    function ri() {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasDetailRuntime && runtime.hasDetailRuntime() && runtime.closeSeasonPopup)
            return void runtime.closeSeasonPopup();
        ctx.ni && ctx.ni.parentNode && (ctx.ni.parentNode.removeChild(ctx.ni), ctx.ni = null);
        var e = ctx.se ? ctx.se.querySelector(".season-arrow") : null;
        e && e.classList.remove("is-open");
    }
    function ki(e) {
        return ctx.legacyFormatPlaybackTime(e);
    }
    function Ti() {
        ctx.Ii && (clearInterval(ctx.Ii), ctx.Ii = null);
    }
    function Ui() {
        return ctx.Ni();
    }
    function ka() {
        ctx.xa = ["normal", "big", "small"][Number(ctx.j.playback.size) || 0] || "normal", ctx.Sa = ["white", "yellow", "black"][Number(ctx.j.playback.style) || 0] || "white", ctx.applyPlayerSubtitlePreference(), ctx.xn(["cover", "contain", "16-9", "4-3"][Number(ctx.j.playback.screen) || 0] || "contain"), Fa();
    }
    function Ta(e, t, i) {
        return ctx.historyRuntime.save(e, t, i);
    }
    function qa(e) {
        return ctx.historyRuntime.sync(e);
    }
    function Oa(e) {
        return ctx.historyRuntime.open(e);
    }
    function Fa() {
        var runtime = window.TutyUI;
        return runtime && runtime.applyPlayerSubtitleStyle ? runtime.applyPlayerSubtitleStyle(ctx.xa, ctx.Sa) : !1;
    }
    function Ba(e) {
        var runtime = window.TutyUI;
        return runtime && runtime.renderPlayerSubtitle ? runtime.renderPlayerSubtitle(e, isPlayerSubtitleEnabled()) : !1;
    }
    function Ha() {
        return "detail" === ctx.j.screen ? ctx.j.detail || null : ctx.j.playerItem || ctx.j.detail || null;
    }
    function resetSubtitles() {
        ctx.ua && (ctx.ua.innerHTML = "");
        var runtime = window.TutyUI;
        runtime && runtime.hasPlayerSubtitleRuntime && runtime.hasPlayerSubtitleRuntime() && runtime.resetPlayerSubtitles && runtime.resetPlayerSubtitles();
    }
    function ja(e) {
        return e && (e.seriesId || e.id) || "";
    }
    function Wa(e) {
        var t = ja(e);
        t && ctx.za.hasOwnProperty(t) ? ctx.j.streamMode = ctx.za[t] ? "smooth" : "normal" : ctx.j.streamMode = "smooth" === ctx.j.playback.streamMode ? "smooth" : "normal";
    }
    function $a(e, t) {
        var i = ja(e);
        ctx.j.streamMode = t ? "smooth" : "normal", i && (ctx.za[i] = !!t), ctx.j.playback.streamModes = ctx.za, Q();
    }
    function Xa() {
        ctx.Va = "", ctx.ga = 0, ctx.ma = !1, ctx.resetPlayerTrackSelection(), resetSubtitles();
    }
    function Ga(e) {
        return e && S(e) ? "player" === ctx.j.screen && ctx.j.playerEpisode ? ctx.j.playerEpisode : ctx.j.detailEpisode ? ctx.j.detailEpisode : e.episodes && e.episodes[0] || null : null;
    }
    function Ja(e) {
        if (!e)
            return "";
        var t = Ga(e);
        return t && t.id ? t.id : e.id || "";
    }
    function isPlayerSubtitleEnabled() {
        var runtime = window.TutyUI;
        return !!(runtime && runtime.isPlayerSubtitleEnabled && runtime.isPlayerSubtitleEnabled());
    }
    function sn(e) {
        return ctx.legacySeasonList(e);
    }
    function ln(e, t, i) {
        return i = i || function () { }, e && t ? t.id === (e.seasonId || e.id) && e.episodes && e.episodes.length ? (t._episodes = e.episodes, i(e.episodes, t._item || null)) : t._episodes ? i(t._episodes, t._item || null) : t._loading ? (t._wait = t._wait || [], void t._wait.push(i)) : (t._loading = !0, t._wait = [i], void ctx.q("detail", {
            contentId: t.id
        }, function (e, response) {
            t._loading = !1;
            var item = !e && response && !1 !== response.returnValue && response.item ? response.item : null, a = !e && response && !1 !== response.returnValue && response.episodes ? response.episodes : [];
            a.length && (t._episodes = a), item && (t._item = item);
            var n = t._wait || [];
            t._wait = [];
            for (var r = 0; r < n.length; r++)
                try {
                    n[r](a, item);
                }
                catch (e) { }
        })) : i([]);
    }
    function dn(e, t, i) {
        return ctx.legacyEpisodeDisplayTitle(e, t, i);
    }
    function cn(e) {
        return ctx.legacyFormatEpisodeDuration(e && e.duration);
    }
    function mn() {
        ctx._e || (ctx._e = t("next-episode-loading")), ctx._e && (ctx._e.classList.remove("is-active"), ctx._e.style.backgroundImage = "");
    }
    function showNextEpisodeLoading(item) {
        ctx._e || (ctx._e = t("next-episode-loading")), ctx._e && (ctx._e.style.backgroundImage = item && (item.backdrop || item.landscape || item.poster) ? 'url("' + String(item.backdrop || item.landscape || item.poster).replace(/"/g, "%22") + '")' : "", ctx._e.classList.add("is-active"));
    }
    function bn(e) {
        if (ctx.se)
            for (var t = ctx.se.querySelectorAll(".detail-episode"), i = 0; i < t.length; i++) {
                var a = !(!t[i]._ep || !ctx.j.detailEpisode || t[i]._ep.id !== ctx.j.detailEpisode.id);
                t[i].classList.toggle("is-playing", a);
            }
    }
    function Mn(e) {
        var _core = window.TutyCore;
        if (_core && typeof _core.describeLanguageLabel === "function")
            return _core.describeLanguageLabel(e);
        var t = (e || "").toLowerCase().trim().split(/[-_]/)[0];
        return /^(spa|esp|es|castellano|latino)$/.test(t) ? "Español" : /^(eng|ing|en)$/.test(t) ? "Inglés" : /^(jpn|jap|ja)$/.test(t) ? "Japonés" : /^(kor|cor|ko)$/.test(t) ? "Coreano" : /^(por|pt)$/.test(t) ? "Portugués" : /^(fra|fre|fr|franc)$/.test(t) ? "Francés" : /^(ita|it)$/.test(t) ? "Italiano" : /^(deu|ger|de)$/.test(t) ? "Alemán" : /^(chi|zho|zh)$/.test(t) ? "Chino" : t ? t.charAt(0).toUpperCase() + t.slice(1) : "Pista";
    }
    function En() {
        var runtime = window.TutyUI;
        if (!runtime || !runtime.buildPlayerStage)
            return;
        var refs = runtime.buildPlayerStage(ctx.getPlayerStageHost());
        ctx.ye = refs.stage, ctx.be = refs.infobar, ctx.Le = refs.vodInfobar, ctx.Ce = refs.channels, ctx.je = refs.categories, ctx.We = refs.categoryGrid, ctx.$e = refs.categorySub;
        ctx.we = refs.video, ctx.Se = refs.status, ctx._e = refs.nextEpisodeLoading, ctx.Ae = refs.osd, ctx.xe = refs.frame;
        ctx.ke = refs.vodPoster, ctx.Me = refs.vodTitle, ctx.Ie = refs.vodCurrent, ctx.Te = refs.vodTotal, ctx.Ee = refs.seekbar, ctx.qe = refs.seekProgress, ctx.Oe = refs.seekBuffered, ctx.De = refs.seekThumb;
        ctx.Fi = refs.playSettingsView, ctx.ji = refs.btnPlayer1, ctx.Wi = refs.btnPlayer2, ctx.Gi = refs.aspectRow;
        ctx.Qi = refs.episodeBrowser, ctx.Ki = refs.episodeTitle, ctx.Yi = refs.episodeSub, ctx.Zi = refs.episodeSeasons, ctx.ea = refs.episodeSeasonsColumn, ctx.ta = refs.episodeEpisodes, ctx.ia = refs.episodeSeasonLabel;
        ctx.aa = refs.audioOptions, ctx.ua = refs.subtitles;
    }
    function $n() {
        ctx.Wn && (clearTimeout(ctx.Wn), ctx.Wn = null);
    }
    function Xn(e) {
        ctx.Wn || ctx.j.streamError || (ctx.Wn = setTimeout(function () {
            ctx.Wn = null, ctx.legacyShouldReportBuffering(ctx.j.streamError, !!ctx.we, ctx.we ? ctx.we.paused : !1, ctx.we ? ctx.we.readyState : 0) && nr(e);
        }, ctx.legacyPlaybackTiming.bufferNoticeMs));
    }
    function er(e) {
        var runtime = window.TutyUI;
        return runtime && runtime.endPlayerScrub ? runtime.endPlayerScrub() : !1;
    }
    function nr(e) {
        ctx.Se || (ctx.Se = t("player-status")), ctx.legacyApplyPlayerStatus(ctx.Se, e);
    }
    function fr() {
        var e = ctx.be.querySelector(".pi-quality"), t = ctx.be.querySelector(".pi-scale"), i = ctx.be.querySelector(".pi-func");
        e && t && i && (e.style.left = "517.5px", t.style.left = e.offsetLeft + e.offsetWidth + 30 + "px", i.style.left = t.offsetLeft + t.offsetWidth + 30 + "px");
    }
    function mr() {
        var e = t("app"), runtime = window.TutyUI;
        if (e && runtime && runtime.fitCanvas)
            return void runtime.fitCanvas(e, window.innerWidth || document.documentElement && document.documentElement.clientWidth || 1920, window.innerHeight || document.documentElement && document.documentElement.clientHeight || 1080);
        if (e) {
            var i = window.innerWidth || document.documentElement && document.documentElement.clientWidth || 1920, a = window.innerHeight || document.documentElement && document.documentElement.clientHeight || 1080, n = Math.min(i / 1920, a / 1080);
            (!isFinite(n) || n <= 0) && (n = 1);
            var r = Math.max(0, Math.round((i - 1920 * n) / 2)), o = Math.max(0, Math.round((a - 1080 * n) / 2));
            e.style.left = r + "px", e.style.top = o + "px", e.style.webkitTransform = "scale(" + n + ")", e.style.transform = "scale(" + n + ")";
        }
    }
    function attachTutyUiRuntime() {
        return attachLegacyRuntime(window.TutyUI, {
            getNavigationStageDeps: ctx.getNavigationStageDeps,
            getUiRuntimeDeps: ctx.getUiRuntimeDeps,
            getPlayerWiringDeps: ctx.getPlayerWiringDeps,
            getFocusHostDeps: ctx.getFocusHostDeps
        });
    }
    function getBootstrapDeps() {
        return createLegacyBootstrapDeps({
            attachRuntime: attachTutyUiRuntime,
            resize: mr,
            installNavigation: ctx.legacyInstallNavigation,
            handleKey: ctx.lt,
            onPopState: ctx.ot,
            closest: n,
            focus: tt,
            setWelcomeTimer: function (timer) {
                ctx.Ke = timer;
            },
            showHome: dt,
            loadCatalogs: N,
            loadLive: ctx.Bt,
            state: ctx.j,
            catalog: ctx.l,
            channels: ctx.F,
            status: ctx.v,
            portal: ctx.f,
            request: ctx.q,
            refreshPortal: D,
            showScreen: ctx.nt,
            selectTab: ctx.ht,
            openDetail: ei,
            openSearch: ctx.li,
            openSettings: ctx.yi,
            openLiveCategories: ctx.lvOpenCats,
            openLiveSearch: ctx.lvOpenSearch,
            toggleLiveFavorites: ctx.lvToggleFav,
            openPlayer: ctx.dr,
            setSearchQuery: ctx.ci,
            openSettingsPanel: ctx.bi
        });
    }
    function yr() {
        return startLegacyBootstrap(window.TutyUI, getBootstrapDeps());
    }
    return { e, t, i, a, n, g, S, _, I, T, D, N, R, U, G, J, legacyCanUseLuna, Q, K, reminderOn, toggleReminder, toast, stopWebMedia, checkReminders, Ye, tt, handleBrowserHorizontal, closeSeasonPopupAndFocus, hasDetailSeasonPopup, dt, Rt, liveIsFav, liveToggleFav, Vt, syncLiveFavorites, liveCatName, liveUpdateLabel, Yt, ei, ei, ti, ii, ri, ki, Ti, Ui, ka, Ta, qa, Oa, Fa, Ba, Ha, resetSubtitles, ja, Wa, $a, Xa, Ga, Ja, isPlayerSubtitleEnabled, sn, ln, dn, cn, mn, showNextEpisodeLoading, bn, Mn, En, $n, Xn, er, nr, fr, mr, attachTutyUiRuntime, getBootstrapDeps, yr };
}
