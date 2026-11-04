import { createLegacyActions } from "./legacyActions.js";
import { createLegacyWiring } from "./legacyWiring.js";
import { createLegacyRuntime } from "./legacyRuntime.js";
import {
  HOME_ICONS,
  HOME_TABS,
  PLAYBACK_KEY,
  PORTAL_ROOTS,
  PROFILE_KEY,
  createInitialProfile,
  createLegacyAppState,
  createLegacyCatalog
} from "./legacyState.js";


export function startLegacyStore() {
    "use strict";

    var legacyContext = {};
    Object.defineProperties(legacyContext, {
        $e: { get: () => $e, set: (value) => { $e = value } }, Ae: { get: () => Ae, set: (value) => { Ae = value } }, Bt: { get: () => Bt, set: (value) => { Bt = value } }, Ce: { get: () => Ce, set: (value) => { Ce = value } }, De: { get: () => De, set: (value) => { De = value } }, E: { get: () => E, set: (value) => { E = value } },
        Ee: { get: () => Ee, set: (value) => { Ee = value } }, Et: { get: () => Et, set: (value) => { Et = value } }, F: { get: () => F, set: (value) => { F = value } }, Fi: { get: () => Fi, set: (value) => { Fi = value } }, Gi: { get: () => Gi, set: (value) => { Gi = value } }, Ie: { get: () => Ie, set: (value) => { Ie = value } },
        Ii: { get: () => Ii, set: (value) => { Ii = value } }, Ke: { get: () => Ke, set: (value) => { Ke = value } }, Ki: { get: () => Ki, set: (value) => { Ki = value } }, Le: { get: () => Le, set: (value) => { Le = value } }, Me: { get: () => Me, set: (value) => { Me = value } }, Ni: { get: () => Ni, set: (value) => { Ni = value } },
        Oe: { get: () => Oe, set: (value) => { Oe = value } }, Qi: { get: () => Qi, set: (value) => { Qi = value } }, Sa: { get: () => Sa, set: (value) => { Sa = value } }, Se: { get: () => Se, set: (value) => { Se = value } }, Te: { get: () => Te, set: (value) => { Te = value } }, Ue: { get: () => Ue, set: (value) => { Ue = value } },
        Va: { get: () => Va, set: (value) => { Va = value } }, We: { get: () => We, set: (value) => { We = value } }, Wi: { get: () => Wi, set: (value) => { Wi = value } }, Wn: { get: () => Wn, set: (value) => { Wn = value } }, Yi: { get: () => Yi, set: (value) => { Yi = value } }, Zi: { get: () => Zi, set: (value) => { Zi = value } },
        _e: { get: () => _e, set: (value) => { _e = value } }, _t: { get: () => _t, set: (value) => { _t = value } }, aa: { get: () => aa, set: (value) => { aa = value } }, applyPlayerSubtitlePreference: { get: () => applyPlayerSubtitlePreference, set: (value) => { applyPlayerSubtitlePreference = value } }, be: { get: () => be, set: (value) => { be = value } }, bi: { get: () => bi, set: (value) => { bi = value } },
        catalogRuntime: { get: () => catalogRuntime, set: (value) => { catalogRuntime = value } }, ci: { get: () => ci, set: (value) => { ci = value } }, detailRuntime: { get: () => detailRuntime, set: (value) => { detailRuntime = value } }, dr: { get: () => dr, set: (value) => { dr = value } }, ea: { get: () => ea, set: (value) => { ea = value } }, f: { get: () => f, set: (value) => { f = value } },
        ga: { get: () => ga, set: (value) => { ga = value } }, getFocusHostDeps: { get: () => getFocusHostDeps, set: (value) => { getFocusHostDeps = value } }, getNavigationStageDeps: { get: () => getNavigationStageDeps, set: (value) => { getNavigationStageDeps = value } }, getPlayerStageHost: { get: () => getPlayerStageHost, set: (value) => { getPlayerStageHost = value } }, getPlayerWiringDeps: { get: () => getPlayerWiringDeps, set: (value) => { getPlayerWiringDeps = value } }, getUiRuntimeDeps: { get: () => getUiRuntimeDeps, set: (value) => { getUiRuntimeDeps = value } },
        historyRuntime: { get: () => historyRuntime, set: (value) => { historyRuntime = value } }, ht: { get: () => ht, set: (value) => { ht = value } }, ia: { get: () => ia, set: (value) => { ia = value } }, ie: { get: () => ie, set: (value) => { ie = value } }, it: { get: () => it, set: (value) => { it = value } }, j: { get: () => j, set: (value) => { j = value } },
        je: { get: () => je, set: (value) => { je = value } }, ji: { get: () => ji, set: (value) => { ji = value } }, ke: { get: () => ke, set: (value) => { ke = value } }, l: { get: () => l, set: (value) => { l = value } }, legacyApplyPlayerStatus: { get: () => legacyApplyPlayerStatus, set: (value) => { legacyApplyPlayerStatus = value } }, legacyBuildEpisodeRanges: { get: () => legacyBuildEpisodeRanges, set: (value) => { legacyBuildEpisodeRanges = value } },
        legacyDestroyHls: { get: () => legacyDestroyHls, set: (value) => { legacyDestroyHls = value } }, legacyEpisodeDisplayTitle: { get: () => legacyEpisodeDisplayTitle, set: (value) => { legacyEpisodeDisplayTitle = value } }, legacyExtractCatalogItems: { get: () => legacyExtractCatalogItems, set: (value) => { legacyExtractCatalogItems = value } }, legacyFilterCatalogCategory: { get: () => legacyFilterCatalogCategory, set: (value) => { legacyFilterCatalogCategory = value } }, legacyFormatEpisodeDuration: { get: () => legacyFormatEpisodeDuration, set: (value) => { legacyFormatEpisodeDuration = value } }, legacyFormatLiveCategoryLabel: { get: () => legacyFormatLiveCategoryLabel, set: (value) => { legacyFormatLiveCategoryLabel = value } },
        legacyFormatPlaybackTime: { get: () => legacyFormatPlaybackTime, set: (value) => { legacyFormatPlaybackTime = value } }, legacyInstallNavigation: { get: () => legacyInstallNavigation, set: (value) => { legacyInstallNavigation = value } }, legacyIsSeriesLike: { get: () => legacyIsSeriesLike, set: (value) => { legacyIsSeriesLike = value } }, legacyNormalizeCatalogItem: { get: () => legacyNormalizeCatalogItem, set: (value) => { legacyNormalizeCatalogItem = value } }, legacyPauseVideo: { get: () => legacyPauseVideo, set: (value) => { legacyPauseVideo = value } }, legacyPlaybackTiming: { get: () => legacyPlaybackTiming, set: (value) => { legacyPlaybackTiming = value } },
        legacySeasonList: { get: () => legacySeasonList, set: (value) => { legacySeasonList = value } }, legacyShouldReportBuffering: { get: () => legacyShouldReportBuffering, set: (value) => { legacyShouldReportBuffering = value } }, li: { get: () => li, set: (value) => { li = value } }, liveFavFilter: { get: () => liveFavFilter, set: (value) => { liveFavFilter = value } }, liveSelectionRuntime: { get: () => liveSelectionRuntime, set: (value) => { liveSelectionRuntime = value } }, lt: { get: () => lt, set: (value) => { lt = value } },
        lvOpenCats: { get: () => lvOpenCats, set: (value) => { lvOpenCats = value } }, lvOpenSearch: { get: () => lvOpenSearch, set: (value) => { lvOpenSearch = value } }, lvToggleFav: { get: () => lvToggleFav, set: (value) => { lvToggleFav = value } }, ma: { get: () => ma, set: (value) => { ma = value } }, ni: { get: () => ni, set: (value) => { ni = value } }, nt: { get: () => nt, set: (value) => { nt = value } },
        oe: { get: () => oe, set: (value) => { oe = value } }, ot: { get: () => ot, set: (value) => { ot = value } }, profileRuntime: { get: () => profileRuntime, set: (value) => { profileRuntime = value } }, q: { get: () => q, set: (value) => { q = value } }, qe: { get: () => qe, set: (value) => { qe = value } }, resetPlayerTrackSelection: { get: () => resetPlayerTrackSelection, set: (value) => { resetPlayerTrackSelection = value } },
        se: { get: () => se, set: (value) => { se = value } }, ta: { get: () => ta, set: (value) => { ta = value } }, ua: { get: () => ua, set: (value) => { ua = value } }, v: { get: () => v, set: (value) => { v = value } }, vt: { get: () => vt, set: (value) => { vt = value } }, we: { get: () => we, set: (value) => { we = value } },
        xa: { get: () => xa, set: (value) => { xa = value } }, xe: { get: () => xe, set: (value) => { xe = value } }, xn: { get: () => xn, set: (value) => { xn = value } }, ye: { get: () => ye, set: (value) => { ye = value } }, yi: { get: () => yi, set: (value) => { yi = value } }, za: { get: () => za, set: (value) => { za = value } }
    });
    var legacyActions = createLegacyActions(legacyContext);
    var {
        e, t, i, a, n, g, S, _,
        I, T, D, N, R, U, G, J,
        legacyCanUseLuna, Q, K, reminderOn, toggleReminder, toast, stopWebMedia, checkReminders,
        Ye, tt, handleBrowserHorizontal, closeSeasonPopupAndFocus, hasDetailSeasonPopup, dt, Rt, liveIsFav,
        liveToggleFav, Vt, syncLiveFavorites, liveCatName, liveUpdateLabel, Yt, ei, ti,
        ii, ri, ki, Ti, Ui, ka, Ta, qa,
        Oa, Fa, Ba, Ha, resetSubtitles, ja, Wa, $a,
        Xa, Ga, Ja, isPlayerSubtitleEnabled, sn, ln, dn, cn,
        mn, showNextEpisodeLoading, bn, Mn, En, $n, Xn, er,
        nr, fr, mr, attachTutyUiRuntime, getBootstrapDeps, yr
    } = legacyActions;

    var F = [],
        B = HOME_ICONS,
        H = HOME_TABS,
        j = createLegacyAppState(),
        W = PROFILE_KEY,
        $ = PLAYBACK_KEY,
        X = createInitialProfile();
    var l = createLegacyCatalog();
    var legacyRuntime = createLegacyRuntime({
        canUseLuna: () => legacyCanUseLuna()
    });
    var {
        p, q, L, E, Nt, Ht, lvFocusList, lvOpenCats,
        lvCloseCats, lvToggleFav, lvOpenSearch, lvCloseSearch, jt, Wt, askResume, closeResume,
        li, ci, pi, openFilter, closeFilter, yi, bi, subtitleEnd,
        Ze, et, it, focusHomeTab, at, nt, ot, lt,
        returnFromPlayer, returnFromDetail, toggleDetailSynopsis, vt, ht, mt, bt, getHomeAddonPresets,
        wt, xt, Ut, Ft, Bt, Xt, Di, Ei,
        qi, Ai, Pi, Ni, Ri, Ua, getMediaInfoByKey, Qa,
        applyPlayerSubtitlePreference, setPlayerSubtitleEnabled, getCurrentPlayerSubtitle, setCurrentPlayerSubtitle, setPlayerSubtitleForced, resetPlayerTrackSelection, Ka, Ya,
        en, tn, an, rn, pn, un, gn, closeNextEpisodePrompt,
        cancelNextEpisodePrompt, startNextEpisode, refreshNextSeasons, maybeShowNextEpisodePrompt, yn, Cn, wn, xn,
        Sn, _n, Ln, Tn, qn, On, Dn, An,
        Pn, Nn, Rn, Qn, resetPlayerSeekState, Oi, getPlayerSourceUrl, getPlayerRelayBase,
        getPlayerRelayOffset, resetPlayerRelayState, clearPlayerSourceUrls, Yn, Zn, probeRelayDuration, tr, ir,
        ar, rr, or, sr, lr, dr, ur, vr,
        hr, gr, handleVisibilityChange, br, legacyNavigationAction, legacyNativeTvPlayback, legacyPauseVideo, legacyPlayVideo,
        legacySetVideoSource, legacyLoadVideo, legacyLoadHls, legacyResolveHistoryEpisode, legacyCurrentPlaybackPosition, legacyShouldLoadSeriesEpisodesBeforePlay, legacyShouldReusePlaybackSession, legacyHasPlaybackSession,
        legacyPlaybackTiming, legacyShouldReportBuffering, legacyResolveLiveResolveDelay, legacyApplyPlaybackSurface, legacyApplyPlayerStatus, legacyApplyDetailPlayerTransition, legacyResetDetailPlayerSurface, legacyApplyPlayerModeClass,
        legacyLanguagePreference, legacyRelayStreamMode, legacyInstallNavigation, legacyNativePreviewHls, legacyPlatformBack, legacyClampLiveChannelIndex, legacyFormatLiveCategoryLabel, legacyLiveListScrollTop,
        legacyFilterCatalogCategory, legacyBuildEpisodeRanges, legacyEpisodeDisplayTitle, legacySeasonList, legacySeasonEpisodes, legacyFindEpisodeIndex, legacyFormatEpisodeDuration, legacyExtractCatalogItems,
        legacyNormalizeCatalogItem, legacyIsSeriesLike, legacyFormatPlaybackTime, legacyParseSubtitleCues, legacyFindSubtitleCue, legacySeekVideo, legacyMediaKey, legacyBuildPlaybackResolveRequest,
        legacyApplyResolvedPlayback, legacyResolveNextPlaybackTarget, legacyResolveDetailSeason, legacyDestroyHls, serviceRuntime
    } = legacyRuntime;

    var v = {
            loading: !1,
            source: "demo",
            error: null
        },
        f = {
            refreshing: !1,
            lastSync: 0,
            roots: 0,
            error: null
        },
        h = PORTAL_ROOTS;

    var catalogRuntime = window.TutyUI.createCatalogRuntime({
        state: j,
        getConfig: () => p,
        getCatalog: () => l,
        getStatus: () => v,
        getPortalState: () => f,
        getRoots: () => h,
        request: (method, params, done) => q(method, params, done),
        requestDev: (url, done, options) => L(url, done, options),
        afterCatalogApplied: function() {
            if (window.TutyUI && window.TutyUI.isHomeTabsBuilt && window.TutyUI.isHomeTabsBuilt()) {
                var e = t("home-tabs"),
                    i = !(!e || !e.classList.contains("is-expanded") || e.classList.contains("is-collapsed")),
                    a = !(!j.focus || void 0 === j.focus._tab),
                    r = !(!j.focus || !n(j.focus, "#home-notify")),
                    o = !(!j.focus || !n(j.focus, ".home-page"));
                if (Ne = [], Re = [], vt(), ht(j.tab, !1), "home" === j.screen) {
                    if (a && Re[j.tab]) tt(Re[j.tab], !0);
                    else if (r) {
                        var s = it(t("home-notify"));
                        s && tt(s, !0)
                    } else if (o) {
                        var l = Ne[H[j.tab].page],
                            d = l ? it(l) : null;
                        d && tt(d, !0)
                    }
                    if (i && e) {
                        e.classList.add("is-expanded"), e.classList.remove("is-collapsed");
                        var c = document.querySelector(".home-sidebar-bg");
                        c && c.classList.add("is-on")
                    }
                }
            }
            j.detail && ti(j.detail)
        },
        checkReminders: checkReminders,
        syncMediaInfo: qa,
        afterDetailLoaded: function(item) {
            if (j.detail === item && "detail" === j.screen) {
                ti(item);
                if (!item._detailPlaybackHandled && (we && we.src && !we.paused || sr(item, j.detailEpisode))) {}
            }
        }
    });

    var profileRuntime = window.TutyUI.createProfileRuntime({
        state: j,
        getProfile: () => X,
        setProfile: function(profile) {
            X = profile
        },
        readStorage: G,
        writeStorage: J,
        getProfileKey: () => W,
        getPlaybackKey: () => $,
        request: (method, params, done) => q(method, params, done),
        toast: toast
    });

    profileRuntime.load();
    var ee, te, ie, ae, oe, se, ye, be, Ce, we, xe, Se, _e, Le, ke, Me, Ie, Te, Ee, qe, Oe, De, Ae,
        Ne = [],
        Re = [],
        tabFocus = [],
        Ue = [],
        Ve = {},
        je = null,
        We = null,
        $e = null,
        Xe = "",
        Ge = 48,
        Ke = null;


    var legacyContext = {};
    Object.defineProperties(legacyContext, {
        $a: { get: () => $a, set: (value) => { $a = value } }, $e: { get: () => $e, set: (value) => { $e = value } }, $n: { get: () => $n, set: (value) => { $n = value } }, Ae: { get: () => Ae, set: (value) => { Ae = value } }, Ai: { get: () => Ai, set: (value) => { Ai = value } }, An: { get: () => An, set: (value) => { An = value } },
        B: { get: () => B, set: (value) => { B = value } }, Ba: { get: () => Ba, set: (value) => { Ba = value } }, Bn: { get: () => Bn, set: (value) => { Bn = value } }, Bt: { get: () => Bt, set: (value) => { Bt = value } }, Ce: { get: () => Ce, set: (value) => { Ce = value } }, Cn: { get: () => Cn, set: (value) => { Cn = value } },
        De: { get: () => De, set: (value) => { De = value } }, Di: { get: () => Di, set: (value) => { Di = value } }, Dn: { get: () => Dn, set: (value) => { Dn = value } }, Ee: { get: () => Ee, set: (value) => { Ee = value } }, Ei: { get: () => Ei, set: (value) => { Ei = value } }, En: { get: () => En, set: (value) => { En = value } },
        Et: { get: () => Et, set: (value) => { Et = value } }, F: { get: () => F, set: (value) => { F = value } }, Fa: { get: () => Fa, set: (value) => { Fa = value } }, Fi: { get: () => Fi, set: (value) => { Fi = value } }, Ft: { get: () => Ft, set: (value) => { Ft = value } }, G: { get: () => G, set: (value) => { G = value } },
        Ga: { get: () => Ga, set: (value) => { Ga = value } }, Ge: { get: () => Ge, set: (value) => { Ge = value } }, Gi: { get: () => Gi, set: (value) => { Gi = value } }, H: { get: () => H, set: (value) => { H = value } }, Ha: { get: () => Ha, set: (value) => { Ha = value } }, Ht: { get: () => Ht, set: (value) => { Ht = value } },
        I: { get: () => I, set: (value) => { I = value } }, Ie: { get: () => Ie, set: (value) => { Ie = value } }, J: { get: () => J, set: (value) => { J = value } }, Ja: { get: () => Ja, set: (value) => { Ja = value } }, K: { get: () => K, set: (value) => { K = value } }, Ka: { get: () => Ka, set: (value) => { Ka = value } },
        Ki: { get: () => Ki, set: (value) => { Ki = value } }, Le: { get: () => Le, set: (value) => { Le = value } }, Ln: { get: () => Ln, set: (value) => { Ln = value } }, Me: { get: () => Me, set: (value) => { Me = value } }, Mn: { get: () => Mn, set: (value) => { Mn = value } }, Ne: { get: () => Ne, set: (value) => { Ne = value } },
        Ni: { get: () => Ni, set: (value) => { Ni = value } }, Nn: { get: () => Nn, set: (value) => { Nn = value } }, Nt: { get: () => Nt, set: (value) => { Nt = value } }, Oa: { get: () => Oa, set: (value) => { Oa = value } }, Oe: { get: () => Oe, set: (value) => { Oe = value } }, Oi: { get: () => Oi, set: (value) => { Oi = value } },
        On: { get: () => On, set: (value) => { On = value } }, Pi: { get: () => Pi, set: (value) => { Pi = value } }, Pn: { get: () => Pn, set: (value) => { Pn = value } }, Pt: { get: () => Pt, set: (value) => { Pt = value } }, Q: { get: () => Q, set: (value) => { Q = value } }, Qa: { get: () => Qa, set: (value) => { Qa = value } },
        Qi: { get: () => Qi, set: (value) => { Qi = value } }, Qn: { get: () => Qn, set: (value) => { Qn = value } }, R: { get: () => R, set: (value) => { R = value } }, Re: { get: () => Re, set: (value) => { Re = value } }, Ri: { get: () => Ri, set: (value) => { Ri = value } }, Rn: { get: () => Rn, set: (value) => { Rn = value } },
        Rt: { get: () => Rt, set: (value) => { Rt = value } }, S: { get: () => S, set: (value) => { S = value } }, Sa: { get: () => Sa, set: (value) => { Sa = value } }, Sn: { get: () => Sn, set: (value) => { Sn = value } }, St: { get: () => St, set: (value) => { St = value } }, T: { get: () => T, set: (value) => { T = value } },
        Ta: { get: () => Ta, set: (value) => { Ta = value } }, Te: { get: () => Te, set: (value) => { Te = value } }, Ti: { get: () => Ti, set: (value) => { Ti = value } }, Tn: { get: () => Tn, set: (value) => { Tn = value } }, U: { get: () => U, set: (value) => { U = value } }, Ua: { get: () => Ua, set: (value) => { Ua = value } },
        Ue: { get: () => Ue, set: (value) => { Ue = value } }, Ui: { get: () => Ui, set: (value) => { Ui = value } }, Ut: { get: () => Ut, set: (value) => { Ut = value } }, Va: { get: () => Va, set: (value) => { Va = value } }, Ve: { get: () => Ve, set: (value) => { Ve = value } }, Vt: { get: () => Vt, set: (value) => { Vt = value } },
        Wa: { get: () => Wa, set: (value) => { Wa = value } }, We: { get: () => We, set: (value) => { We = value } }, Wi: { get: () => Wi, set: (value) => { Wi = value } }, Wt: { get: () => Wt, set: (value) => { Wt = value } }, X: { get: () => X, set: (value) => { X = value } }, Xa: { get: () => Xa, set: (value) => { Xa = value } },
        Xe: { get: () => Xe, set: (value) => { Xe = value } }, Xn: { get: () => Xn, set: (value) => { Xn = value } }, Xt: { get: () => Xt, set: (value) => { Xt = value } }, Ya: { get: () => Ya, set: (value) => { Ya = value } }, Ye: { get: () => Ye, set: (value) => { Ye = value } }, Yi: { get: () => Yi, set: (value) => { Yi = value } },
        Yn: { get: () => Yn, set: (value) => { Yn = value } }, Yt: { get: () => Yt, set: (value) => { Yt = value } }, Ze: { get: () => Ze, set: (value) => { Ze = value } }, Zi: { get: () => Zi, set: (value) => { Zi = value } }, Zn: { get: () => Zn, set: (value) => { Zn = value } }, _: { get: () => _, set: (value) => { _ = value } },
        _i: { get: () => _i, set: (value) => { _i = value } }, _n: { get: () => _n, set: (value) => { _n = value } }, _t: { get: () => _t, set: (value) => { _t = value } }, a: { get: () => a, set: (value) => { a = value } }, aa: { get: () => aa, set: (value) => { aa = value } }, ae: { get: () => ae, set: (value) => { ae = value } },
        an: { get: () => an, set: (value) => { an = value } }, ar: { get: () => ar, set: (value) => { ar = value } }, at: { get: () => at, set: (value) => { at = value } }, be: { get: () => be, set: (value) => { be = value } }, bi: { get: () => bi, set: (value) => { bi = value } }, bn: { get: () => bn, set: (value) => { bn = value } },
        bt: { get: () => bt, set: (value) => { bt = value } }, cancelNextEpisodePrompt: { get: () => cancelNextEpisodePrompt, set: (value) => { cancelNextEpisodePrompt = value } }, ci: { get: () => ci, set: (value) => { ci = value } }, clearPlayerSourceUrls: { get: () => clearPlayerSourceUrls, set: (value) => { clearPlayerSourceUrls = value } }, closeFilter: { get: () => closeFilter, set: (value) => { closeFilter = value } }, closeNextEpisodePrompt: { get: () => closeNextEpisodePrompt, set: (value) => { closeNextEpisodePrompt = value } },
        closeResume: { get: () => closeResume, set: (value) => { closeResume = value } }, closeSeasonPopupAndFocus: { get: () => closeSeasonPopupAndFocus, set: (value) => { closeSeasonPopupAndFocus = value } }, cn: { get: () => cn, set: (value) => { cn = value } }, cr: { get: () => cr, set: (value) => { cr = value } }, dn: { get: () => dn, set: (value) => { dn = value } }, dr: { get: () => dr, set: (value) => { dr = value } },
        dt: { get: () => dt, set: (value) => { dt = value } }, e: { get: () => e, set: (value) => { e = value } }, ee: { get: () => ee, set: (value) => { ee = value } }, ei: { get: () => ei, set: (value) => { ei = value } }, en: { get: () => en, set: (value) => { en = value } }, er: { get: () => er, set: (value) => { er = value } },
        et: { get: () => et, set: (value) => { et = value } }, fa: { get: () => fa, set: (value) => { fa = value } }, focusHomeTab: { get: () => focusHomeTab, set: (value) => { focusHomeTab = value } }, fr: { get: () => fr, set: (value) => { fr = value } }, ga: { get: () => ga, set: (value) => { ga = value } }, getCurrentPlayerSubtitle: { get: () => getCurrentPlayerSubtitle, set: (value) => { getCurrentPlayerSubtitle = value } },
        getHomeAddonPresets: { get: () => getHomeAddonPresets, set: (value) => { getHomeAddonPresets = value } }, getMediaInfoByKey: { get: () => getMediaInfoByKey, set: (value) => { getMediaInfoByKey = value } }, getPlayerRelayBase: { get: () => getPlayerRelayBase, set: (value) => { getPlayerRelayBase = value } }, getPlayerRelayOffset: { get: () => getPlayerRelayOffset, set: (value) => { getPlayerRelayOffset = value } }, getPlayerSourceUrl: { get: () => getPlayerSourceUrl, set: (value) => { getPlayerSourceUrl = value } }, gn: { get: () => gn, set: (value) => { gn = value } },
        gr: { get: () => gr, set: (value) => { gr = value } }, handleBrowserHorizontal: { get: () => handleBrowserHorizontal, set: (value) => { handleBrowserHorizontal = value } }, hasDetailSeasonPopup: { get: () => hasDetailSeasonPopup, set: (value) => { hasDetailSeasonPopup = value } }, hr: { get: () => hr, set: (value) => { hr = value } }, ht: { get: () => ht, set: (value) => { ht = value } }, i: { get: () => i, set: (value) => { i = value } },
        ia: { get: () => ia, set: (value) => { ia = value } }, ie: { get: () => ie, set: (value) => { ie = value } }, ii: { get: () => ii, set: (value) => { ii = value } }, ir: { get: () => ir, set: (value) => { ir = value } }, isPlayerSubtitleEnabled: { get: () => isPlayerSubtitleEnabled, set: (value) => { isPlayerSubtitleEnabled = value } }, it: { get: () => it, set: (value) => { it = value } },
        j: { get: () => j, set: (value) => { j = value } }, ja: { get: () => ja, set: (value) => { ja = value } }, je: { get: () => je, set: (value) => { je = value } }, ji: { get: () => ji, set: (value) => { ji = value } }, jt: { get: () => jt, set: (value) => { jt = value } }, ka: { get: () => ka, set: (value) => { ka = value } },
        ke: { get: () => ke, set: (value) => { ke = value } }, ki: { get: () => ki, set: (value) => { ki = value } }, l: { get: () => l, set: (value) => { l = value } }, legacyApplyDetailPlayerTransition: { get: () => legacyApplyDetailPlayerTransition, set: (value) => { legacyApplyDetailPlayerTransition = value } }, legacyApplyPlaybackSurface: { get: () => legacyApplyPlaybackSurface, set: (value) => { legacyApplyPlaybackSurface = value } }, legacyApplyPlayerModeClass: { get: () => legacyApplyPlayerModeClass, set: (value) => { legacyApplyPlayerModeClass = value } },
        legacyApplyResolvedPlayback: { get: () => legacyApplyResolvedPlayback, set: (value) => { legacyApplyResolvedPlayback = value } }, legacyBuildPlaybackResolveRequest: { get: () => legacyBuildPlaybackResolveRequest, set: (value) => { legacyBuildPlaybackResolveRequest = value } }, legacyCanUseLuna: { get: () => legacyCanUseLuna, set: (value) => { legacyCanUseLuna = value } }, legacyCurrentPlaybackPosition: { get: () => legacyCurrentPlaybackPosition, set: (value) => { legacyCurrentPlaybackPosition = value } }, legacyDestroyHls: { get: () => legacyDestroyHls, set: (value) => { legacyDestroyHls = value } }, legacyFindEpisodeIndex: { get: () => legacyFindEpisodeIndex, set: (value) => { legacyFindEpisodeIndex = value } },
        legacyFindSubtitleCue: { get: () => legacyFindSubtitleCue, set: (value) => { legacyFindSubtitleCue = value } }, legacyHasPlaybackSession: { get: () => legacyHasPlaybackSession, set: (value) => { legacyHasPlaybackSession = value } }, legacyLanguagePreference: { get: () => legacyLanguagePreference, set: (value) => { legacyLanguagePreference = value } }, legacyLoadHls: { get: () => legacyLoadHls, set: (value) => { legacyLoadHls = value } }, legacyLoadVideo: { get: () => legacyLoadVideo, set: (value) => { legacyLoadVideo = value } }, legacyMediaKey: { get: () => legacyMediaKey, set: (value) => { legacyMediaKey = value } },
        legacyNativePreviewHls: { get: () => legacyNativePreviewHls, set: (value) => { legacyNativePreviewHls = value } }, legacyNativeTvPlayback: { get: () => legacyNativeTvPlayback, set: (value) => { legacyNativeTvPlayback = value } }, legacyNavigationAction: { get: () => legacyNavigationAction, set: (value) => { legacyNavigationAction = value } }, legacyParseSubtitleCues: { get: () => legacyParseSubtitleCues, set: (value) => { legacyParseSubtitleCues = value } }, legacyPauseVideo: { get: () => legacyPauseVideo, set: (value) => { legacyPauseVideo = value } }, legacyPlatformBack: { get: () => legacyPlatformBack, set: (value) => { legacyPlatformBack = value } },
        legacyPlayVideo: { get: () => legacyPlayVideo, set: (value) => { legacyPlayVideo = value } }, legacyRelayStreamMode: { get: () => legacyRelayStreamMode, set: (value) => { legacyRelayStreamMode = value } }, legacyResetDetailPlayerSurface: { get: () => legacyResetDetailPlayerSurface, set: (value) => { legacyResetDetailPlayerSurface = value } }, legacyResolveDetailSeason: { get: () => legacyResolveDetailSeason, set: (value) => { legacyResolveDetailSeason = value } }, legacyResolveLiveResolveDelay: { get: () => legacyResolveLiveResolveDelay, set: (value) => { legacyResolveLiveResolveDelay = value } }, legacyResolveNextPlaybackTarget: { get: () => legacyResolveNextPlaybackTarget, set: (value) => { legacyResolveNextPlaybackTarget = value } },
        legacySeasonEpisodes: { get: () => legacySeasonEpisodes, set: (value) => { legacySeasonEpisodes = value } }, legacySeekVideo: { get: () => legacySeekVideo, set: (value) => { legacySeekVideo = value } }, legacySetVideoSource: { get: () => legacySetVideoSource, set: (value) => { legacySetVideoSource = value } }, legacyShouldLoadSeriesEpisodesBeforePlay: { get: () => legacyShouldLoadSeriesEpisodesBeforePlay, set: (value) => { legacyShouldLoadSeriesEpisodesBeforePlay = value } }, legacyShouldReusePlaybackSession: { get: () => legacyShouldReusePlaybackSession, set: (value) => { legacyShouldReusePlaybackSession = value } }, li: { get: () => li, set: (value) => { li = value } },
        liveFastAll: { get: () => liveFastAll, set: (value) => { liveFastAll = value } }, liveFastFav: { get: () => liveFastFav, set: (value) => { liveFastFav = value } }, liveFavFilter: { get: () => liveFavFilter, set: (value) => { liveFavFilter = value } }, liveIsFav: { get: () => liveIsFav, set: (value) => { liveIsFav = value } }, liveToggleFav: { get: () => liveToggleFav, set: (value) => { liveToggleFav = value } }, liveUpdateLabel: { get: () => liveUpdateLabel, set: (value) => { liveUpdateLabel = value } },
        ln: { get: () => ln, set: (value) => { ln = value } }, lr: { get: () => lr, set: (value) => { lr = value } }, lvCloseCats: { get: () => lvCloseCats, set: (value) => { lvCloseCats = value } }, lvCloseSearch: { get: () => lvCloseSearch, set: (value) => { lvCloseSearch = value } }, lvFocusList: { get: () => lvFocusList, set: (value) => { lvFocusList = value } }, lvOpenCats: { get: () => lvOpenCats, set: (value) => { lvOpenCats = value } },
        lvOpenSearch: { get: () => lvOpenSearch, set: (value) => { lvOpenSearch = value } }, lvToggleFav: { get: () => lvToggleFav, set: (value) => { lvToggleFav = value } }, ma: { get: () => ma, set: (value) => { ma = value } }, maybeShowNextEpisodePrompt: { get: () => maybeShowNextEpisodePrompt, set: (value) => { maybeShowNextEpisodePrompt = value } }, mn: { get: () => mn, set: (value) => { mn = value } }, mt: { get: () => mt, set: (value) => { mt = value } },
        n: { get: () => n, set: (value) => { n = value } }, nr: { get: () => nr, set: (value) => { nr = value } }, nt: { get: () => nt, set: (value) => { nt = value } }, oe: { get: () => oe, set: (value) => { oe = value } }, openFilter: { get: () => openFilter, set: (value) => { openFilter = value } }, or: { get: () => or, set: (value) => { or = value } },
        p: { get: () => p, set: (value) => { p = value } }, pi: { get: () => pi, set: (value) => { pi = value } }, pn: { get: () => pn, set: (value) => { pn = value } }, probeRelayDuration: { get: () => probeRelayDuration, set: (value) => { probeRelayDuration = value } }, q: { get: () => q, set: (value) => { q = value } }, qe: { get: () => qe, set: (value) => { qe = value } },
        qi: { get: () => qi, set: (value) => { qi = value } }, qn: { get: () => qn, set: (value) => { qn = value } }, qt: { get: () => qt, set: (value) => { qt = value } }, refreshNextSeasons: { get: () => refreshNextSeasons, set: (value) => { refreshNextSeasons = value } }, reminderOn: { get: () => reminderOn, set: (value) => { reminderOn = value } }, resetPlayerRelayState: { get: () => resetPlayerRelayState, set: (value) => { resetPlayerRelayState = value } },
        resetPlayerSeekState: { get: () => resetPlayerSeekState, set: (value) => { resetPlayerSeekState = value } }, resetSubtitles: { get: () => resetSubtitles, set: (value) => { resetSubtitles = value } }, returnFromDetail: { get: () => returnFromDetail, set: (value) => { returnFromDetail = value } }, returnFromPlayer: { get: () => returnFromPlayer, set: (value) => { returnFromPlayer = value } }, rn: { get: () => rn, set: (value) => { rn = value } }, rr: { get: () => rr, set: (value) => { rr = value } },
        se: { get: () => se, set: (value) => { se = value } }, setCurrentPlayerSubtitle: { get: () => setCurrentPlayerSubtitle, set: (value) => { setCurrentPlayerSubtitle = value } }, setPlayerSubtitleEnabled: { get: () => setPlayerSubtitleEnabled, set: (value) => { setPlayerSubtitleEnabled = value } }, setPlayerSubtitleForced: { get: () => setPlayerSubtitleForced, set: (value) => { setPlayerSubtitleForced = value } }, showNextEpisodeLoading: { get: () => showNextEpisodeLoading, set: (value) => { showNextEpisodeLoading = value } }, sn: { get: () => sn, set: (value) => { sn = value } },
        sr: { get: () => sr, set: (value) => { sr = value } }, startNextEpisode: { get: () => startNextEpisode, set: (value) => { startNextEpisode = value } }, stopWebMedia: { get: () => stopWebMedia, set: (value) => { stopWebMedia = value } }, subtitleEnd: { get: () => subtitleEnd, set: (value) => { subtitleEnd = value } }, syncLiveFavorites: { get: () => syncLiveFavorites, set: (value) => { syncLiveFavorites = value } }, t: { get: () => t, set: (value) => { t = value } },
        ta: { get: () => ta, set: (value) => { ta = value } }, tabFocus: { get: () => tabFocus, set: (value) => { tabFocus = value } }, te: { get: () => te, set: (value) => { te = value } }, ti: { get: () => ti, set: (value) => { ti = value } }, tn: { get: () => tn, set: (value) => { tn = value } }, toast: { get: () => toast, set: (value) => { toast = value } },
        toggleDetailSynopsis: { get: () => toggleDetailSynopsis, set: (value) => { toggleDetailSynopsis = value } }, toggleReminder: { get: () => toggleReminder, set: (value) => { toggleReminder = value } }, tr: { get: () => tr, set: (value) => { tr = value } }, tt: { get: () => tt, set: (value) => { tt = value } }, ua: { get: () => ua, set: (value) => { ua = value } }, un: { get: () => un, set: (value) => { un = value } },
        ur: { get: () => ur, set: (value) => { ur = value } }, va: { get: () => va, set: (value) => { va = value } }, vr: { get: () => vr, set: (value) => { vr = value } }, we: { get: () => we, set: (value) => { we = value } }, wn: { get: () => wn, set: (value) => { wn = value } }, wt: { get: () => wt, set: (value) => { wt = value } },
        xa: { get: () => xa, set: (value) => { xa = value } }, xe: { get: () => xe, set: (value) => { xe = value } }, xn: { get: () => xn, set: (value) => { xn = value } }, xt: { get: () => xt, set: (value) => { xt = value } }, ye: { get: () => ye, set: (value) => { ye = value } }, yi: { get: () => yi, set: (value) => { yi = value } },
        yn: { get: () => yn, set: (value) => { yn = value } }, za: { get: () => za, set: (value) => { za = value } }
    });
    var legacyWiring = createLegacyWiring(legacyContext);
    var { getNavigationStageDeps, getPlayerStageHost, getUiRuntimeDeps, getFocusHostDeps, getPlayerWiringDeps } = legacyWiring;

    var St = [],
        _t = null,
        Et = null,
        qt = null,
        Pt = !1;

    var liveSelectionRuntime = window.TutyUI.createLiveSelectionRuntime({
        state: j,
        getChannels: () => F,
        getRows: () => Ue,
        getContainer: () => ae,
        getLabel: () => ee,
        byId: t,
        getSelectedCategory: () => _t,
        isFavoritesOnly: () => liveFavFilter,
        getPlayerStage: () => ye,
        saveProfile: function() {
            J(W, X)
        },
        setProfileFavorites: function(favorites) {
            X.favs = favorites
        },
        clampIndex: legacyClampLiveChannelIndex,
        formatLabel: legacyFormatLiveCategoryLabel,
        scrollTop: legacyLiveListScrollTop,
        refreshPlayerChannels: vr,
        playChannel: ur,
        previewChannel: Rt,
        selectFromRuntime: function(index, force) {
            var runtime = window.TutyUI;
            if (runtime && runtime.hasLiveListRuntime && runtime.hasLiveListRuntime() && runtime.selectLiveChannel) {
                runtime.selectLiveChannel(index, force);
                return !0
            }
            return !1
        },
        scrollFromRuntime: function() {
            var runtime = window.TutyUI;
            if (runtime && runtime.hasLiveListRuntime && runtime.hasLiveListRuntime() && runtime.scrollLiveList) {
                runtime.scrollLiveList();
                return !0
            }
            return !1
        }
    });





    /* =========================================================================
       LIVE TV MENU (home TV tab): categories + search + favourites.
       The portal exposes 38 live columns; the home page only had the
       prev/next zap and the channel list, so this adds the missing menu.
       ========================================================================= */
    var liveFastAll = null,
        liveFastFav = null,
        liveFavFilter = !1;

    var detailRuntime = window.TutyUI.createDetailRuntime({
        state: j,
        byId: t,
        focus: tt,
        getDetailFocusable: () => oe ? oe.querySelector(".focusable") : null,
        getPlayerStage: () => ye,
        findHistory: (item) => historyRuntime.find(item),
        syncMediaInfo: qa,
        resetPlayerItem: Xa,
        prepareItem: Wa,
        refreshMediaInfo: Qa,
        renderDetail: ti,
        showScreen: nt,
        ensurePlayerStage: function() {
            ye || En()
        },
        notifyStatus: nr,
        loadDetail: (item, done) => U(item, done),
        askResume: (item, episode, position, duration, done) => askResume(item, episode, position, duration, done),
        resetStream: ar,
        startPlayback: sr,
        isSeries: S,
        log: function(message, payload) {
            window.TUTYTV_WEB && window.console && console.log("[TUTYTV] " + message, payload)
        }
    });

    var ni = null;

    var _i = 5e3;

    var Ii = null;

    var Fi = null,
        ji = null,
        Wi = null,
        Gi = null,
        Qi = null,
        Ki = null,
        Yi = null,
        Zi = null,
        ea = null,
        ta = null,
        ia = null,
        aa = null,
        ua = null,
        va = !1,
        fa = !1,
        ga = 0,
        ma = !1,
        xa = "normal",
        Sa = "white";

    var historyRuntime = window.TutyUI.createHistoryRuntime({
        state: j,
        getCatalog: () => l,
        getProfile: () => X,
        saveProfile: function() {
            J(W, X)
        },
        requestSearch: (params, done) => q("search", params, done),
        buildSearchParams: (kind, value) => catalogRuntime.buildParams(kind, value),
        extract: g,
        normalize: _,
        isSeries: S,
        openDetail: ei,
        loadSeasonEpisodes: function(item, season, done) {
            ln(item, season, function(episodes) {
                done(episodes || [])
            })
        },
        renderDetail: ti,
        resolveEpisode: (entry, episodes) => legacyResolveHistoryEpisode(entry, episodes),
        log: function(message, payload) {
            window.TUTYTV_WEB && window.console && console.log("[TUTYTV] " + message, payload)
        }
    });

    var za = j.playback.streamModes && "object" == typeof j.playback.streamModes ? j.playback.streamModes : (j.playback.streamModes = {}),
        Va = "";

    var Bn = 0,
        Wn = null;

    var cr = 0;

    window.addEventListener("beforeunload", br), window.addEventListener("unload", br), document.addEventListener("visibilitychange", handleVisibilityChange), "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", yr) : yr()

}
