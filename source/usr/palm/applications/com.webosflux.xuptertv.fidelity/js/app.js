! function() {
    "use strict";

    function e(e, t, i) {
        var a = document.createElement(e);
        return t && (a.className = t), null != i && (a.textContent = i), a
    }

    function t(e) {
        return document.getElementById(e)
    }

    function i(e) {
        for (; e.firstChild;) e.removeChild(e.firstChild)
    }

    function a(e, t, i, a, n) {
        return e.style.position = "absolute", e.style.left = t + "px", e.style.top = i + "px", void 0 !== a && (e.style.width = a + "px"), void 0 !== n && (e.style.height = n + "px"), e
    }

    function n(e, t) {
        for (; e && e !== document;) {
            if (1 === e.nodeType && e.matches && e.matches(t)) return e;
            e = e.parentNode
        }
        return null
    }

    function r(e) {
        return e < 10 ? "0" + e : "" + e
    }

    function o(e) {
        return (e = String(e).toLowerCase()).normalize && (e = e.normalize("NFD").replace(/[\u0300-\u036f]/g, "")), e
    }
    var s = ["Acción", "Drama", "Comedia", "Suspenso", "Aventura", "Animación", "Familiar", "Ciencia ficción"],
        l = [],
        d = {
            Destacado: "destacado",
            "Película": "pelicula",
            Serie: "serie",
            Gratis: "gratis",
            Infantil: "infantil",
            UHD: "uhd",
            Extra: "extra"
        };

    function c(e, t, i) {
        for (var a = 1; a <= t; a++) {
            var n = s[(i + a) % s.length],
                o = s[(i + a + 3) % s.length];
            l.push({
                id: l.length + 1,
                title: e + " demo " + r(a),
                category: d[e] || "",
                score: (7.9 + (i + a) % 16 / 10).toFixed(1),
                year: 2018 + (i + a) % 7,
                duration: 1 + (i + a) % 2 + " h " + (10 + (7 * i + 5 * a) % 45) + " min",
                genres: n === o ? [n] : [n, o],
                director: "Director demo " + r(a),
                actors: "Actor demo " + r(a) + ", Actriz demo " + r(a + 1),
                synopsis: "Sinopsis de demostración para " + e.toLowerCase() + " demo " + r(a) + '. Este texto sólo existe para comprobar el recorte a dos líneas, el interlineado y la sangría de la etiqueta "Sinopsis :" definidos en activity_voddetails.',
                kind: e.toLowerCase()
            })
        }
    }
    c("Destacado", 5, 1), c("Película", 7, 2), c("Serie", 7, 3), c("Gratis", 5, 4), c("Infantil", 8, 5), c("UHD", 4, 6), c("Extra", 4, 7);
    var p = window.TUTYTV_API || {},
        u = /[?&]service=([^&]+)/.exec(window.location.search || "");
    u && (p.devServiceUrl = decodeURIComponent(u[1]));
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
        h = ["featured", "movies", "series", "anime", "kids", "free"];

    function g(e) {
        return legacyExtractCatalogItems(e)
    }

    function m(e) {
        var _core = window.TutyCore;
        if (_core && typeof _core.resolveServiceUrl === "function") return _core.resolveServiceUrl(p, e);
        var t = p[e + "Url"];
        if (t) return String(t);
        var i = String(p.baseUrl || "").replace(/\/$/, ""),
            a = String(p[e + "Path"] || "");
        return i && a ? i + ("/" === a.charAt(0) ? a : "/" + a) : ""
    }

    function y() {
        var _core = window.TutyCore;
        if (_core && typeof _core.normalizeApiSession === "function") return _core.normalizeApiSession(p.session);
        var e = p.session || {};
        return {
            userId: String(e.userId || ""),
            userToken: String(e.userToken || ""),
            portalCode: String(e.portalCode || ""),
            homePageCode: String(e.homePageCode || ""),
            version: String(e.version || "4.34.4")
        }
    }

    function b() {
        var _core = window.TutyCore;
        if (_core && typeof _core.hasApiSession === "function") return _core.hasApiSession(y());
        var e = y();
        return !!(e.userId && e.userToken && e.portalCode)
    }

    function C(e, t) {
        var _core = window.TutyCore;
        if (_core && typeof _core.buildServiceParams === "function") return _core.buildServiceParams(e, t, y());
        var i = y();
        return "catalog" === e ? {
            userId: i.userId,
            userToken: i.userToken,
            portalCode: i.portalCode,
            homePageCode: i.homePageCode,
            version: i.version
        } : "search" === e ? {
            userToken: i.userToken,
            userId: i.userId,
            portalCode: i.portalCode,
            columnId: "",
            value: t || "",
            type: "",
            pageSize: 20,
            pageNum: 1,
            filter: ""
        } : {
            userToken: i.userToken,
            userId: i.userId,
            portalCode: i.portalCode,
            programId: t
        }
    }

    function w(e) {
        return e ? (e = String(e), /^https?:\/\//i.test(e) || 0 === e.indexOf("data:") ? e : p.imageBaseUrl ? String(p.imageBaseUrl).replace(/\/$/, "") + "/" + e.replace(/^\//, "") : e) : ""
    }

    function x(e, t) {
        return null == e || "" === e ? t : String(e)
    }

    function S(e) {
        return legacyIsSeriesLike(e)
    }

    function _(e, t) {
        return legacyNormalizeCatalogItem(e, t)
    }

    function L(e, t, i) {
        i = i || {};
        var a = new XMLHttpRequest,
            n = !1,
            r = parseInt(p.timeoutMs, 10) || 1e4;

        function o(e, i) {
            n || (n = !0, t(e, i))
        }
        a.open(i.method || "GET", e, !0), a.timeout = r;
        var s = p.headers || {};
        for (var l in s) Object.prototype.hasOwnProperty.call(s, l) && a.setRequestHeader(l, s[l]);
        void 0 === i.body || s["Content-Type"] || s["content-type"] || a.setRequestHeader("Content-Type", "application/json;charset=utf-8"), a.onreadystatechange = function() {
            if (4 === a.readyState)
                if (a.status < 200 || a.status >= 300) o("HTTP " + a.status);
                else try {
                    o(null, JSON.parse(a.responseText))
                } catch (e) {
                    o("La API no devolvió JSON válido")
                }
        }, a.onerror = function() {
            o("Error de red o CORS")
        }, a.ontimeout = function() {
            o("Tiempo de espera agotado")
        };
        try {
            a.send(void 0 === i.body ? null : JSON.stringify(i.body))
        } catch (e) {
            o(e.message || "No se pudo iniciar la petición")
        }
    }

    function k(e) {
        return legacyParseSeriesSeasonTitle(e)
    }

    function M(e, i, a) {
        if (!e.length) return !1;
        for (var r = {}, s = 0; s < l.length; s++) r[String(l[s].id)] = l[s];
        l.splice(0, l.length);
        for (var d = [], c = 0; c < e.length; c++) {
            var p = _(e[c], c + 1);
            a && !1 !== e[c].portal && (p._portal = !0);
            var u = r[String(p.id)];
            u && (u.episodes && (p.episodes = u.episodes), u.seasons && (p.seasons = u.seasons), u._detailsLoaded && (p._detailsLoaded = !0), !p.streamUrl && u.streamUrl && (p.streamUrl = u.streamUrl)), d.push(p)
        }
        for (var f = legacyGroupCatalogSeries(d), h = 0; h < f.length; h++) l.push(f[h]);
        if (j.detail) {
            for (var g = !1, m = 0; m < l.length; m++)
                if (String(l[m].id) === String(j.detail.id)) {
                    j.detail = l[m], g = !0;
                    break
                } g || (j.detail = l[0])
        }
        return setTimeout(checkReminders, 1500), v.source = i, v.error = null,
            function() {
                if (Pe) {
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
                le && (oi(), j.searchQuery && ui());
                j.detail && ti(j.detail)
            }(), !0
    }

    function I(e, t, i) {
        return legacySelectCatalogPage(l, e, t, i)
    }

    function T() {
        var e = window.TUTYTV_CATALOG;
        return e ? g(e) : []
    }

    function E() {
        return !window.PalmServiceBridge || window.webOS && window.webOS.service || (window.webOS = window.webOS || {}, window.webOS.service = {
            request: function(e, t) {
                t = t || {};
                var i = new window.PalmServiceBridge;
                i.onservicecallback = function(e) {
                    var i;
                    try {
                        i = JSON.parse(e)
                    } catch (t) {
                        i = {
                            returnValue: !1,
                            errorText: e
                        }
                    }!1 === i.returnValue ? t.onFailure && t.onFailure(i) : t.onSuccess && t.onSuccess(i)
                };
                var a = t.method ? e.replace(/\/$/, "") + "/" + t.method : e;
                return i.call(a, JSON.stringify(t.parameters || {})), i
            }
        }), !!(window.webOS && window.webOS.service && window.webOS.service.request)
    }

    function q(e, t, i) {
        var a = p.serviceId || "com.webosflux.xuptertv.fidelity.service",
            n = !1;

        function r(e, t) {
            n || (n = !0, i(e, t))
        }
        if (legacyCanUseLuna()) try {
            return window.webOS.service.request("luna://" + a, {
                method: e,
                parameters: t || {},
                timeout: parseInt(p.timeoutMs, 10) || 2e4,
                onSuccess: function(e) {
                    r(null, e)
                },
                onFailure: function(e) {
                    r(e && e.errorText || "Error del servicio TutyTV", null)
                }
            }), !0
        } catch (e) {
            if (!p.devServiceUrl) return r("Error comunicando con el servicio: " + (e.message || e), null), !1
        }
        return p.devServiceUrl ? (L(legacyDevServiceUrl(p.devServiceUrl, e, t || {}), function(e, t) {
            r(e, t)
        }, null), !0) : (r("El servicio TutyTV no está disponible", null), !1)
    }

    function O(e) {
        var merged = legacyMergePortalRoots(e, h, T());
        merged.length && M(merged, "portal", !0)
    }

    function D() {
        if (!f.refreshing) {
            f.refreshing = !0, f.error = null;
            var e = {},
                t = 0;
            ! function i() {
                if (t >= h.length) return f.refreshing = !1, f.lastSync = Date.now(), void O(e);
                var a = h[t++];
                q("home", {
                    root: a
                }, function(t, n) {
                    !t && n && !1 !== n.returnValue && n.items && n.items.length ? (e[a] = n.items, f.roots++) : t && (f.error = t), i()
                })
            }()
        }
    }

    function A() {
        var e, t = (e = window.TUTYTV_PORTAL) ? g(e) : [];
        t.length && M(t, "portal-snapshot", !0), !1 !== p.refresh ? D() : t.length || (v.error = "Sin snapshot del portal")
    }

    function P(e, t) {
        return M(T(), e || "bundled") ? (t && (v.error = t), !0) : (v.error = t || "No hay catálogo local ni remoto", !1)
    }

    function N() {
        if (p.enabled)
            if ("portal" !== p.mode)
                if ("static" !== p.mode) {
                    var e = m("catalog");
                    "xuper" !== p.mode || b() ? e ? (v.loading = !0, L(e, function(e, t) {
                        v.loading = !1;
                        var i = legacyDescribeServiceError(t);
                        if (e || i || !M(g(t), "api")) {
                            var a = e || i || "La API no devolvió películas";
                            P("bundled-fallback", a) || (v.error = a)
                        }
                    }, "xuper" === p.mode ? {
                        method: "POST",
                        body: C("catalog")
                    } : null)) : p.useBundledCatalog ? P("bundled", null) : v.error = "Falta baseUrl/catalogUrl del catálogo autorizado" : v.error = "Falta la sesión TutyTV (userId, userToken y portalCode)"
                } else P("bundled", null);
        else A()
    }

    function R(e, t) {
        return legacyMergeCatalogDetail(e, t)
    }

    function U(e, t) {
        if (t = t || function() {}, !e) return t(null);
        if (e._detailsLoaded) return t(e);
        if (e._detailLoading) return e._detailWait = e._detailWait || [], void e._detailWait.push(t);
        if ("portal" === p.mode && e._portal) return e._detailLoading = !0, e._detailWait = [t], void q("detail", {
            contentId: e.id
        }, function(t, i) {
            if (e._detailLoading = !1, !t && i && !1 !== i.returnValue && i.item) {
                if (R(e, i.item), e.episodes = i.episodes || [], e.seasons = e._catalogSeasons || i.seasons || [], e.seasonId || (e.seasonId = e.id), e.seasons && e.seasons.length && e.seasons.sort(function(e, t) {
                        return (parseInt(e.number, 10) || 0) - (parseInt(t.number, 10) || 0)
                    }), (!e.seasons || !e.seasons.length) && S(e)) {
                    var a = 1,
                        n = /S(\d+)/i.exec(e.alias || "") || /T(\d+)/i.exec(e.title || "");
                    n && (a = parseInt(n[1], 10) || 1), e.seasons = [{
                        id: e.id,
                        number: a
                    }]
                }
                if (e.seasons && e.seasons.length) {
                    for (var r = 0, o = 0; o < e.seasons.length; o++)
                        if (e.seasons[o].id === e.id) {
                            r = o;
                            break
                        } j.detailSeason = r
                }
                e.episodes && e.episodes.length && !j.detailEpisode && (j.detailEpisode = e.episodes[0]), qa(e), e._detailsLoaded = !0
            }
            var s = e._detailWait || [];
            e._detailWait = [];
            for (var l = 0; l < s.length; l++) s[l](e);
            j.detail === e && "detail" === j.screen && (ti(e), !e._detailPlaybackHandled && (we && we.src && !we.paused || sr(e, j.detailEpisode)))
        });
        var i = m("detail");
        return p.enabled && i && ("xuper" !== p.mode || b()) ? (e._detailLoading = !0, void L(i.replace("{id}", encodeURIComponent(e.id)), function(i, a) {
            if (e._detailLoading = !1, !i) {
                var n = g(a),
                    r = n.length ? n[0] : a && (a.item || a.movie || a);
                r && "object" == typeof r && (R(e, r), e._detailsLoaded = !0, j.detail === e && "detail" === j.screen && (ti(e), !e._detailPlaybackHandled && (we && we.src && !we.paused || sr(e, j.detailEpisode))))
            }
            t(e)
        }, "xuper" === p.mode ? {
            method: "POST",
            body: C("detail", e.id)
        } : null)) : t(e)
    }
    var F = [],
        B = {
            tv: '<svg viewBox="0 0 33 33"><rect x="3.5" y="7" width="26" height="17" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M11 24.5v3h11v-3" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
            thumb: '<svg viewBox="0 0 33 33"><path d="M12 15.5V28H7.6A2.6 2.6 0 0 1 5 25.4v-7.3a2.6 2.6 0 0 1 2.6-2.6H12z" fill="currentColor"/><path d="M14 15.6l4.3-9.2a2.2 2.2 0 0 1 4 1.6V13h5.6a2.9 2.9 0 0 1 2.8 3.6l-2 9A3.4 3.4 0 0 1 25.4 28H14z" fill="currentColor"/></svg>',
            film: '<svg viewBox="0 0 33 33"><circle cx="16.5" cy="16.5" r="11.5" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="16.5" cy="16.5" r="2.4" fill="currentColor"/><circle cx="16.5" cy="9.5" r="2.1" fill="currentColor"/><circle cx="16.5" cy="23.5" r="2.1" fill="currentColor"/><circle cx="9.5" cy="16.5" r="2.1" fill="currentColor"/><circle cx="23.5" cy="16.5" r="2.1" fill="currentColor"/></svg>',
            strip: '<svg viewBox="0 0 33 33"><rect x="4" y="7" width="25" height="19" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M9 7v19M24 7v19" stroke="currentColor" stroke-width="1.8"/><rect x="5.6" y="9" width="2.4" height="2.6" fill="currentColor"/><rect x="5.6" y="15.2" width="2.4" height="2.6" fill="currentColor"/><rect x="5.6" y="21.4" width="2.4" height="2.6" fill="currentColor"/><rect x="25" y="9" width="2.4" height="2.6" fill="currentColor"/><rect x="25" y="15.2" width="2.4" height="2.6" fill="currentColor"/><rect x="25" y="21.4" width="2.4" height="2.6" fill="currentColor"/></svg>',
            kids: '<svg viewBox="0 0 33 33"><circle cx="8.6" cy="8.6" r="4" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="24.4" cy="8.6" r="4" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="16.5" cy="18" r="9.6" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="13" cy="17" r="1.5" fill="currentColor"/><circle cx="20" cy="17" r="1.5" fill="currentColor"/><ellipse cx="16.5" cy="21.6" rx="2.4" ry="1.7" fill="currentColor"/></svg>',
            anime: '<svg viewBox="0 0 33 33"><circle cx="8.5" cy="9" r="4.5" fill="currentColor"/><circle cx="24.5" cy="9" r="4.5" fill="currentColor"/><path d="M16.5 9c5.8 0 10.5 4.6 10.5 10.3 0 5.7-4.7 9.7-10.5 9.7S6 25 6 19.3C6 13.6 10.7 9 16.5 9z" fill="currentColor"/><circle cx="12.5" cy="18" r="1.6" fill="#0b0b0b"/><circle cx="20.5" cy="18" r="1.6" fill="#0b0b0b"/><ellipse cx="16.5" cy="23" rx="3" ry="2" fill="#0b0b0b"/></svg>',
            compass: '<svg viewBox="0 0 33 33"><circle cx="16.5" cy="16.5" r="11.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M22 11l-3.2 7.8L11 22l3.2-7.8z" fill="currentColor"/></svg>'
        },
        H = [{
            label: "TV",
            page: 0,
            icon: "tv"
        }, {
            label: "DESTACADOS",
            page: 1,
            icon: "thumb"
        }, {
            label: "PELICULA",
            page: 2,
            icon: "film"
        }, {
            label: "SERIES",
            page: 3,
            icon: "strip"
        }, {
            label: "KIDS",
            page: 4,
            icon: "kids"
        }, {
            label: "ANIME",
            page: 5,
            icon: "anime"
        }, {
            label: "EXPLORAR",
            page: 6,
            icon: "compass"
        }],
        z = [{
            id: "profile",
            label: "Mi cuenta"
        }, {
            id: "history",
            label: "Mi lista"
        }, {
            id: "share",
            label: "Compartir APP"
        }, {
            id: "parent",
            label: "Bloqueo"
        }, {
            id: "playback",
            label: "Configuración global"
        }, {
            id: "feedback",
            label: "Ayuda y Feedback"
        }, {
            id: "about",
            label: "Sobre nosotros"
        }],
        V = {
            profile: '<svg viewBox="0 0 32 32"><circle cx="16" cy="10" r="5"/><path d="M6 27c.7-6 4.3-9 10-9s9.3 3 10 9"/></svg>',
            history: '<svg viewBox="0 0 32 32"><rect x="4" y="4" width="9" height="9"/><rect x="19" y="4" width="9" height="9"/><rect x="4" y="19" width="9" height="9"/><rect x="19" y="19" width="9" height="9"/></svg>',
            share: '<svg viewBox="0 0 32 32"><circle cx="8" cy="16" r="3"/><circle cx="24" cy="7" r="3"/><circle cx="24" cy="25" r="3"/><path d="M10.6 14.5l10.8-6M10.6 17.5l10.8 6"/></svg>',
            parent: '<svg viewBox="0 0 32 32"><rect x="7" y="14" width="18" height="14" rx="2"/><path d="M11 14V10a5 5 0 0 1 10 0v4"/><path d="M16 19v4"/></svg>',
            playback: '<svg viewBox="0 0 32 32"><rect x="4" y="6" width="24" height="20" rx="3"/><path d="M13 11l8 5-8 5z"/></svg>',
            feedback: '<svg viewBox="0 0 32 32"><path d="M6 4h15l5 5v19H6z"/><path d="M20 4v6h6M10 16h12M10 21h8"/></svg>',
            about: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12"/><path d="M16 14v8M16 10h.1"/></svg>'
        },
        j = {
            screen: "welcome",
            tab: 0,
            channel: 0,
            focus: null,
            detail: null,
            detailReturn: null,
            detailRange: 0,
            detailSeason: 0,
            detailNeedsRebuild: !1,
            playerReturn: null,
            playerMode: "live",
            playerItem: null,
            playerEpisode: null,
            playerSeasonIndex: 0,
            nextEpisodeOpen: !1,
            nextEpisodeTimer: null,
            nextEpisodeTarget: null,
            nextEpisodeSeq: 0,
            nextEpisodeCountdown: 7,
            nextEpisodeDismissed: !1,
            episodeBrowserOpen: !1,
            categoryPickerOpen: !1,
            liveCategoriesOpen: !1,
            liveSearchOpen: !1,
            filterOpen: !1,
            filterReturn: null,
            resumeOpen: !1,
            resumeReturn: null,
            resumePosition: 0,
            resumeOpenedAt: 0,
            noHistorySave: !1,
            browserSeason: 0,
            streamError: "",
            streamMode: "normal",
            trackIndex: 0,
            channelsOpen: !1,
            infobar: !0,
            infoTimer: null,
            searchQuery: "",
            searchNumeric: !1,
            searchSeq: 0,
            searchFocus: null,
            playback: {
                streamMode: "normal",
                screen: 0,
                audio: 0,
                audioCode: "",
                subLang: 0,
                subCode: "",
                size: 0,
                style: 0,
                subtitle: !0
            },
            crOn: !1,
            favs: {}
        },
        W = "xuper_local_profile_v1",
        $ = "xuper_global_playback_v1",
        X = {
            id: "",
            createdAt: 0,
            history: [],
            reminders: {},
            reminderCheckAt: 0
        };

    function G(e, t) {
        var _core = window.TutyCore;
        if (_core && _core.storage && typeof _core.storage.read === "function") return _core.storage.read(e, t);
        try {
            var i = localStorage.getItem(e);
            return i ? JSON.parse(i) : t
        } catch (e) {
            return t
        }
    }

    function J(e, t) {
        var _core = window.TutyCore;
        if (_core && _core.storage && typeof _core.storage.write === "function") return _core.storage.write(e, t);
        try {
            localStorage.setItem(e, JSON.stringify(t))
        } catch (e) {}
    }

    function legacyNavigationAction(e) {
        var _core = window.TutyCore;
        if (_core && typeof _core.mapLegacyKeyToAction === "function") return _core.mapLegacyKeyToAction(e);
        var code = e.keyCode || e.which, key = e.key || "";
        return 461 === code || 27 === code || 8 === code || "Back" === key || "GoBack" === key || "Escape" === key ? "back" : 37 === code ? "left" : 38 === code ? "up" : 39 === code ? "right" : 40 === code ? "down" : 13 === code || 32 === code ? "enter" : null
    }

    function legacyNativeTvPlayback() {
        var _core = window.TutyCore, agent = navigator.userAgent || "";
        if (_core && _core.platform && typeof _core.platform.prefersNativeTvPlayback === "function") return _core.platform.prefersNativeTvPlayback(agent);
        return /webOS|SmartTV|Large Screen/i.test(agent)
    }

    function legacyPauseVideo(video) {
        var _core = window.TutyCore;
        if (_core && _core.player && typeof _core.player.pause === "function") return _core.player.pause(video);
        return video.pause()
    }

    function legacyPlayVideo(video) {
        var _core = window.TutyCore;
        if (_core && _core.player && typeof _core.player.play === "function") return _core.player.play(video);
        return video.play()
    }

    function legacySeekVideo(video, seconds) {
        var _core = window.TutyCore;
        if (_core && _core.player && typeof _core.player.seekTo === "function") return _core.player.seekTo(video, seconds);
        video.currentTime = seconds
    }

    function legacySetVideoSource(video, url) {
        var _core = window.TutyCore;
        if (_core && _core.player && typeof _core.player.setSource === "function") return _core.player.setSource(video, url);
        video.src = url
    }

    function legacyLoadVideo(video) {
        var _core = window.TutyCore;
        if (_core && _core.player && typeof _core.player.reload === "function") return _core.player.reload(video);
        return video.load()
    }

    function legacyLoadHls(video, hls, url) {
        var _core = window.TutyCore;
        if (_core && _core.player && typeof _core.player.loadHls === "function") return _core.player.loadHls(video, hls, url);
        hls.loadSource(url), hls.attachMedia(video)
    }

    function legacyLimitSeek(position, duration, relay) {
        var _core = window.TutyCore;
        if (_core && typeof _core.limitSeekPosition === "function") return _core.limitSeekPosition(position, duration, relay);
        if (relay) return duration > 0 && position > duration - 2 ? Math.max(0, duration - 2) : position;
        return position < 0 && (position = 0), duration > 0 && position > duration - 1 && (position = duration - 1), position
    }

    function legacyNativeRetry(code, mode, streamMode, hls, nativeHls, hasItem) {
        var _core = window.TutyCore;
        if (_core && typeof _core.selectNativeRetry === "function") return _core.selectNativeRetry(code, mode, streamMode, hls, nativeHls, hasItem);
        return 4 === code && "live" === mode && hls && !nativeHls ? "native-hls" : 4 === code && "vod" === mode && "normal" === streamMode && hasItem ? "compatible-vod" : null
    }

    function legacyEnsureViewerProfile(base, stored, now) {
        var _core = window.TutyCore;
        if (_core && typeof _core.ensureViewerProfile === "function") return _core.ensureViewerProfile(base, stored, now);
        if (stored && stored.id) return (stored.history && stored.history.length) || (stored.history = []), {
            profile: stored,
            created: !1
        };
        return base.id = "TV-" + String(now).slice(-8), base.createdAt = now, (base.history && base.history.length) || (base.history = []), {
            profile: base,
            created: !0
        }
    }

    function legacyMergePlaybackPreferences(current, stored) {
        var _core = window.TutyCore;
        if (_core && typeof _core.mergePlaybackPreferences === "function") return _core.mergePlaybackPreferences(current, stored);
        if (stored)
            for (var k in current) current.hasOwnProperty(k) && void 0 !== stored[k] && (current[k] = stored[k]);
        return current
    }

    function legacyMediaKey(code, key) {
        var _core = window.TutyCore;
        if (_core && typeof _core.mapLegacyMediaKey === "function") return _core.mapLegacyMediaKey(code, key);
        var name = key || "";
        return 415 === code || "MediaPlay" === name || "Play" === name ? "play" : 19 === code || "MediaPause" === name || "Pause" === name ? "pause" : 10252 === code || "MediaPlayPause" === name ? "playpause" : 417 === code || "MediaFastForward" === name || "FastForward" === name ? "forward" : 412 === code || "MediaRewind" === name || "Rewind" === name ? "rewind" : 413 === code || "MediaStop" === name || "Stop" === name ? "stop" : 457 === code || 93 === code || 467 === code || "Menu" === name || "ContextMenu" === name ? "menu" : null
    }

    function legacyNormalizeApiSession(session) {
        var _core = window.TutyCore;
        if (_core && typeof _core.normalizeApiSession === "function") return _core.normalizeApiSession(session);
        var source = session || {};
        return {
            userId: String(source.userId || ""),
            userToken: String(source.userToken || ""),
            portalCode: String(source.portalCode || ""),
            homePageCode: String(source.homePageCode || ""),
            version: String(source.version || "4.34.4")
        }
    }

    function legacyHasApiSession(session) {
        var _core = window.TutyCore;
        if (_core && typeof _core.hasApiSession === "function") return _core.hasApiSession(session);
        var normalized = legacyNormalizeApiSession(session);
        return !!(normalized.userId && normalized.userToken && normalized.portalCode)
    }

    function legacyBuildServiceParams(kind, value, session) {
        var _core = window.TutyCore;
        if (_core && typeof _core.buildServiceParams === "function") return _core.buildServiceParams(kind, value, session);
        var normalized = legacyNormalizeApiSession(session);
        return "catalog" === kind ? {
            userId: normalized.userId,
            userToken: normalized.userToken,
            portalCode: normalized.portalCode,
            homePageCode: normalized.homePageCode,
            version: normalized.version
        } : "search" === kind ? {
            userToken: normalized.userToken,
            userId: normalized.userId,
            portalCode: normalized.portalCode,
            columnId: "",
            value: value || "",
            type: "",
            pageSize: 20,
            pageNum: 1,
            filter: ""
        } : {
            userToken: normalized.userToken,
            userId: normalized.userId,
            portalCode: normalized.portalCode,
            programId: value
        }
    }

    function legacyResolveServiceUrl(config, method) {
        var _core = window.TutyCore;
        if (_core && typeof _core.resolveServiceUrl === "function") return _core.resolveServiceUrl(config, method);
        var explicit = config[method + "Url"];
        if (explicit) return String(explicit);
        var base = String(config.baseUrl || "").replace(/\/$/, ""),
            path = String(config[method + "Path"] || "");
        return base && path ? base + ("/" === path.charAt(0) ? path : "/" + path) : ""
    }

    function legacyDescribeServiceError(payload) {
        var _core = window.TutyCore;
        if (_core && typeof _core.describeServiceError === "function") return _core.describeServiceError(payload);
        if (!payload || "object" != typeof payload) return "";
        var code = payload.returnCode || payload.code || payload.errorCode || "",
            message = payload.errorMessage || payload.message || payload.msg || "";
        return !code && !message ? "" : (code ? String(code) + ": " : "") + (message ? String(message) : "La API rechazó la petición")
    }

    function legacyIsReminderActive(itemId, reminders) {
        var _core = window.TutyCore;
        if (_core && typeof _core.isReminderActive === "function") return _core.isReminderActive(itemId, reminders);
        return !!(itemId && reminders && reminders[String(itemId)])
    }

    function legacyToggleReminderEntry(reminders, item, now) {
        var _core = window.TutyCore;
        if (_core && typeof _core.toggleReminderEntry === "function") return _core.toggleReminderEntry(reminders, item, now);
        if (!item || !item.id) return {
            reminders: reminders,
            active: !1
        };
        var id = String(item.id),
            active = !reminders[id],
            next = {};
        for (var key in reminders) next[key] = reminders[key];
        return active ? next[id] = {
            id: id,
            title: String(item.title || "Contenido"),
            poster: String(item.poster || item.cover || ""),
            count: item.episodes && item.episodes.length ? item.episodes.length : parseInt(item.updateCount || item.volumeCount || 0, 10) || 0,
            createdAt: now
        } : delete next[id], {
            reminders: next,
            active: active
        }
    }

    function legacyShouldCheckReminders(reminders, lastCheckAt, now) {
        var _core = window.TutyCore;
        if (_core && typeof _core.shouldCheckReminders === "function") return _core.shouldCheckReminders(reminders, lastCheckAt, now);
        if (!reminders) return !1;
        var ids = Object.keys(reminders);
        return ids.length > 0 && !(lastCheckAt && now - lastCheckAt < 216e5)
    }

    function legacySelectReminderCheckIds(reminders) {
        var _core = window.TutyCore;
        if (_core && typeof _core.selectReminderCheckIds === "function") return _core.selectReminderCheckIds(reminders);
        return reminders ? Object.keys(reminders).slice(0, 10) : []
    }

    function legacyMergeReminderUpdate(reminder, response) {
        var _core = window.TutyCore;
        if (_core && typeof _core.mergeReminderUpdate === "function") return _core.mergeReminderUpdate(reminder, response);
        var item = response && response.item || {},
            episodes = response && response.episodes,
            count = episodes && episodes.length ? episodes.length : parseInt(item.updateCount || item.volumeCount || 0, 10) || 0,
            increased = count > 0 && reminder.count > 0 && count > reminder.count,
            next = {};
        for (var key in reminder) next[key] = reminder[key];
        return count > 0 && (next.count = count), next.title = String(item.title || reminder.title), next.poster = String(item.poster || item.posterUrl || reminder.poster), {
            reminder: next,
            increased: increased
        }
    }

    function legacySelectCatalogPage(items, category, limit, offset) {
        var _core = window.TutyCore;
        if (_core && typeof _core.selectCatalogPage === "function") return _core.selectCatalogPage(items, category, limit, offset);
        var key = o(category),
            selected = [],
            index;
        if (key)
            for (index = 0; index < items.length; index++) -1 !== o(items[index].category || "").split(",").indexOf(key) && selected.push(items[index]);
        if (selected.length || (selected = items.slice(offset, offset + limit)), selected.length || (selected = items.slice(0, limit)), selected.length < limit && items.length) {
            var seen = {};
            for (index = 0; index < selected.length; index++) seen[String(selected[index].id)] = !0;
            for (var guard = 0; selected.length < limit && guard < 2 * items.length;) {
                var item = items[guard % items.length];
                guard++, seen[String(item.id)] || (selected.push(item), seen[String(item.id)] = !0)
            }
        }
        return selected
    }

    function legacyFilterCatalogCategory(items, category) {
        var _core = window.TutyCore;
        if (_core && typeof _core.filterCatalogCategory === "function") return _core.filterCatalogCategory(items, category);
        var key = o(category),
            selected = [],
            index;
        if (key)
            for (index = 0; index < items.length; index++) {
                var item = items[index],
                    kind = o(item.kind || "");
                (-1 !== o(item.category || "").split(",").indexOf(key) || kind && -1 !== kind.indexOf(key)) && selected.push(item)
            }
        return selected.length ? selected : items.slice()
    }

    function legacyBuildEpisodeRanges(total) {
        var _core = window.TutyCore;
        if (_core && typeof _core.buildEpisodeRanges === "function") return _core.buildEpisodeRanges(total);
        for (var ranges = [], start = 0; start < total; start += 20) ranges.push({
            start: start,
            end: Math.min(total, start + 20)
        });
        return ranges
    }

    function legacyShouldPersistPlaybackHistory(position, itemId, now, lastSavedAt, force) {
        var _core = window.TutyCore;
        if (_core && typeof _core.shouldPersistPlaybackHistory === "function") return _core.shouldPersistPlaybackHistory(position, itemId, now, lastSavedAt, force);
        return !!(itemId && position >= 3 && (force || !(now - lastSavedAt < 15e3)))
    }

    function legacyResolvePlaybackTotalWithRelay(input) {
        var _core = window.TutyCore;
        if (_core && typeof _core.resolvePlaybackTotalWithRelay === "function") return _core.resolvePlaybackTotalWithRelay(input);
        var video = Number(input.videoDuration) || 0;
        if (input.hasRelay) {
            if (input.probedDuration > 0) return input.probedDuration;
            var meta = input.episodeDuration || input.itemDuration || input.inferredDuration;
            return meta || (isFinite(video) && video > 0 ? input.relayBase + video : 0)
        }
        var total = isFinite(video) && video > 0 ? video : 0;
        return total || (total = input.episodeDuration) || (total = input.itemDuration) || (total = input.inferredDuration) || 0
    }

    function legacyRelaySeekTarget(relayBase, currentTime, pendingDelta, duration) {
        var _core = window.TutyCore;
        if (_core && typeof _core.relaySeekTarget === "function") return _core.relaySeekTarget(relayBase, currentTime, pendingDelta, duration);
        var target = Math.max(0, (Number(relayBase) || 0) + (Number(currentTime) || 0) + (Number(pendingDelta) || 0));
        return Math.floor(legacyLimitSeek(target, Number(duration) || 0, !0))
    }

    function legacyLocalSeekTarget(currentTime, pendingDelta, duration) {
        var _core = window.TutyCore;
        if (_core && typeof _core.localSeekTarget === "function") return _core.localSeekTarget(currentTime, pendingDelta, duration);
        return legacyLimitSeek((Number(currentTime) || 0) + (Number(pendingDelta) || 0), Number(duration) || 0, !1)
    }

    function legacyResolveResumePlan(history, currentEpisode, episodeCount, itemIsSeries, episodeExists) {
        var _core = window.TutyCore;
        if (_core && typeof _core.resolveResumePlan === "function") return _core.resolveResumePlan(history, currentEpisode, episodeCount, itemIsSeries, episodeExists);
        var position = history ? Number(history.position) || 0 : 0,
            duration = history ? Number(history.duration) || 0 : 0,
            isSeries = !!(history && ("boolean" == typeof history.series ? history.series : itemIsSeries)),
            mismatchReset = !1;
        episodeCount > 1 && history && history.episodeId && currentEpisode && String(history.episodeId) !== String(currentEpisode.id) && episodeExists && (position = 0, mismatchReset = !0);
        return {
            position: position,
            duration: duration,
            isSeries: isSeries,
            episodeCount: episodeCount,
            mismatchReset: mismatchReset,
            shouldPrompt: position > 2
        }
    }

    function legacyResolveHistoryEpisode(history, episodes) {
        var _core = window.TutyCore;
        if (_core && typeof _core.resolveHistoryEpisode === "function") return _core.resolveHistoryEpisode(history, episodes);
        if (!history || !history.episodeId) return null;
        for (var index = 0; index < episodes.length; index++)
            if (String(episodes[index].id) === String(history.episodeId)) return episodes[index];
        return {
            id: history.episodeId,
            number: history.episodeNumber,
            title: history.episodeTitle || "",
            duration: history.duration || 0
        }
    }

    function legacyMergeCatalogDetail(item, detail) {
        var _core = window.TutyCore;
        if (_core && typeof _core.mergeCatalogDetail === "function") return _core.mergeCatalogDetail(item, detail);
        var seriesId = item && item._seriesGroup ? item.id : null,
            seriesTitle = item && item._seriesGroup ? item._seriesTitle : null,
            normalized = _(detail, item && item.id);
        for (var key in normalized) Object.prototype.hasOwnProperty.call(normalized, key) && "—" !== normalized[key] && "" !== normalized[key] && "Sin sinopsis disponible." !== normalized[key] && (item[key] = normalized[key]);
        return null !== seriesId && (item.id = seriesId, item.title = seriesTitle, item.alias = seriesTitle, item.seasons = item._catalogSeasons || item.seasons), item
    }

    function legacyToggleCatalogFavorite(favorites, itemId) {
        var _core = window.TutyCore;
        if (_core && typeof _core.toggleCatalogFavorite === "function") return _core.toggleCatalogFavorite(favorites, itemId);
        if (!itemId) return {
            favorites: favorites,
            active: !1
        };
        var id = String(itemId),
            active = !favorites[id],
            next = {};
        for (var key in favorites) next[key] = favorites[key];
        return active ? next[id] = !0 : delete next[id], {
            favorites: next,
            active: active
        }
    }

    function legacyBuildPlaybackResolveRequest(item, episode, options) {
        var _core = window.TutyCore;
        if (_core && typeof _core.buildPlaybackResolveRequest === "function") return _core.buildPlaybackResolveRequest(item, episode, options);
        var resumeAt = Number(options.resumePosition) || 0,
            request = {
                contentId: item.id,
                playbackMode: options.streamMode,
                forceRelay: legacyForceRelay(options.streamMode, resumeAt),
                trackIndex: options.trackIndex || 0,
                audioTrack: options.audioTrack || 0
            },
            nextEpisode = episode;
        if (options.isSeries) {
            var seasonId = item.seasonId || item.id;
            if (nextEpisode && nextEpisode.id) request.contentId = nextEpisode.id, request.seriesContentId = seasonId;
            else {
                if (!item.episodes || !item.episodes.length) return {
                    request: request,
                    episode: nextEpisode,
                    resumePosition: resumeAt,
                    missingEpisodes: !0
                };
                nextEpisode = item.episodes[0], request.contentId = nextEpisode && nextEpisode.id, request.seriesContentId = seasonId
            }
        }
        return {
            request: request,
            episode: nextEpisode,
            resumePosition: resumeAt,
            missingEpisodes: !1
        }
    }

    function legacyApplyResolvedPlayback(item, episode, response, resumeAt) {
        var _core = window.TutyCore;
        if (_core && typeof _core.applyResolvedPlayback === "function") return _core.applyResolvedPlayback(item, episode, response, resumeAt);
        var target = item,
            duration = Number(response.duration) || 0;
        target.streamMime = response.mime || "", target.streamCodec = response.codec || "", duration > 0 ? (target.duration = duration, episode && (episode.duration = duration)) : target.duration = target.duration || 0, target.subtitles = response.subtitles || [], target.streamAudioInfo = response.audio || "", target.isHls = !!response.isHls;
        var relayResume = legacyRelayResumeStart(String(response.proxyPath || response.url || ""), Number(resumeAt) || 0);
        return {
            url: relayResume.url,
            resumePosition: relayResume.consumed ? 0 : Number(resumeAt) || 0,
            streamInfo: {
                selectedTrack: response.selectedTrack || {},
                availableTracks: response.availableTracks || []
            }
        }
    }

    function legacyResolveNextPlaybackTarget(seasons, preferredSeasonIndex, fallbackSeasonIndex, currentEpisodes, currentEpisode) {
        var _core = window.TutyCore;
        if (_core && typeof _core.resolveNextPlaybackTarget === "function") return _core.resolveNextPlaybackTarget(seasons, preferredSeasonIndex, fallbackSeasonIndex, currentEpisodes, currentEpisode);
        var seasonIndex = preferredSeasonIndex,
            episodes = currentEpisodes,
            episodeIndex = legacyFindEpisodeIndex(episodes, currentEpisode);
        if (episodeIndex < 0 && fallbackSeasonIndex !== seasonIndex) {
            var fallbackEpisodes = legacySeasonEpisodes({
                seasons: seasons,
                seasonId: seasons[fallbackSeasonIndex] && seasons[fallbackSeasonIndex].id,
                episodes: []
            }, fallbackSeasonIndex);
            var fallbackEpisodeIndex = legacyFindEpisodeIndex(fallbackEpisodes, currentEpisode);
            fallbackEpisodeIndex >= 0 && (seasonIndex = fallbackSeasonIndex, episodes = fallbackEpisodes, episodeIndex = fallbackEpisodeIndex)
        }
        if (episodeIndex < 0) return null;
        if (episodeIndex + 1 < episodes.length) return {
            kind: "episode",
            seasonIndex: seasonIndex,
            episode: episodes[episodeIndex + 1]
        };
        var nextIndex = legacyNextSeasonIndex(seasons, seasonIndex);
        return nextIndex < 0 ? null : {
            kind: "season",
            seasonIndex: nextIndex,
            season: seasons[nextIndex]
        }
    }

    function legacyFormatPlaybackTime(value) {
        var _core = window.TutyCore;
        if (_core && typeof _core.formatPlaybackTime === "function") return _core.formatPlaybackTime(value);
        var total = Math.max(0, Math.floor(value || 0)),
            h = Math.floor(total / 3600),
            m = Math.floor(total % 3600 / 60),
            s = total % 60;
        return r(h) + ":" + r(m) + ":" + r(s)
    }

    function legacyParsePlaybackDuration(value) {
        var _core = window.TutyCore;
        if (_core && typeof _core.parsePlaybackDuration === "function") return _core.parsePlaybackDuration(value);
        if ("number" == typeof value && isFinite(value) && value > 0) return value;
        if ("string" != typeof value) return 0;
        var text = value.trim();
        if (!text || "—" === text || "-" === text) return 0;
        var hours = text.match(/(\d+)\s*h(?:our|ora|s)?/i),
            minutes = text.match(/(\d+)\s*m(?:in|uto|s)?/i),
            seconds = text.match(/(\d+)\s*s(?:ec|eg)?/i);
        if (hours || minutes || seconds) return 3600 * (hours ? parseInt(hours[1], 10) : 0) + 60 * (minutes ? parseInt(minutes[1], 10) : 0) + (seconds ? parseInt(seconds[1], 10) : 0);
        if (-1 !== text.indexOf(":")) {
            var parts = text.split(":");
            if (2 === parts.length) {
                var first = Number(parts[0]),
                    second = Number(parts[1]);
                if (isFinite(first) && isFinite(second) && first >= 0 && second >= 0) return 60 * first + second
            } else if (3 === parts.length) {
                first = Number(parts[0]), second = Number(parts[1]);
                var third = Number(parts[2]);
                if (isFinite(first) && isFinite(second) && isFinite(third) && first >= 0 && second >= 0 && third >= 0) return 3600 * first + 60 * second + third
            }
        }
        var direct = Number(text);
        return isFinite(direct) && direct > 0 ? direct : 0
    }

    function legacyRelayDurationEndpoint(url) {
        var _core = window.TutyCore;
        if (_core && typeof _core.relayDurationEndpoint === "function") return _core.relayDurationEndpoint(url);
        var match = /^(https?:\/\/[^\/]+)\/s\/([0-9a-fA-F]+)\.mp4(?:[?#].*)?$/.exec(String(url || ""));
        return match ? match[1] + "/duration/" + match[2] : null
    }

    function legacyInferEpisodeDuration(episodes, current) {
        var _core = window.TutyCore;
        if (_core && typeof _core.inferEpisodeDuration === "function") return _core.inferEpisodeDuration(episodes, current);
        var counts = {},
            best = 0,
            bestCount = 0,
            list = episodes || [];
        for (var i = 0; i < list.length; i++) {
            var episode = list[i];
            if (!episode || episode === current) continue;
            var parsed = Mi(episode.duration);
            parsed > 0 && (counts[parsed] = (counts[parsed] || 0) + 1)
        }
        for (var duration in counts)
            if (Object.prototype.hasOwnProperty.call(counts, duration)) {
                var value = Number(duration),
                    count = counts[duration];
                (count > bestCount || count === bestCount && value > best) && (best = value, bestCount = count)
            }
        return best
    }

    function legacyPlaybackPercent(value, total) {
        var _core = window.TutyCore;
        if (_core && typeof _core.playbackPercent === "function") return _core.playbackPercent(value, total);
        return total > 0 ? Math.min(100, Math.max(0, value / total * 100)) : 0
    }

    function legacyParseSubtitleTimestamp(value) {
        var _core = window.TutyCore;
        if (_core && typeof _core.parseSubtitleTimestamp === "function") return _core.parseSubtitleTimestamp(value);
        var parts = String(value || "").replace(",", ".").split(":");
        return 3 === parts.length ? 3600 * parseFloat(parts[0]) + 60 * parseFloat(parts[1]) + parseFloat(parts[2]) : 0
    }

    function legacyParseSubtitleCues(source) {
        var _core = window.TutyCore;
        if (_core && typeof _core.parseSubtitleCues === "function") return _core.parseSubtitleCues(source);
        if (!source) return [];
        for (var blocks = String(source).replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n\n"), cues = [], i = 0; i < blocks.length; i++) {
            var lines = blocks[i].trim().split("\n");
            if (lines.length >= 2) {
                var timeIndex = -1 !== (lines[0] || "").indexOf("--\x3e") ? 0 : 1,
                    timeLine = lines[timeIndex] || "";
                if (-1 !== timeLine.indexOf("--\x3e")) {
                    var parts = timeLine.split("--\x3e"),
                        start = legacyParseSubtitleTimestamp(parts[0] && parts[0].trim()),
                        end = legacyParseSubtitleTimestamp(parts[1] && parts[1].trim()),
                        textLines = 0 === timeIndex ? lines.slice(1) : lines.slice(2),
                        text = textLines.join("<br>").replace(/<font[^>]*>/gi, "").replace(/<\/font>/gi, "").trim();
                    text && cues.push({
                        start: start,
                        end: end,
                        text: text
                    })
                }
            }
        }
        return cues
    }

    function legacyFindSubtitleCue(cues, time) {
        var _core = window.TutyCore;
        if (_core && typeof _core.findSubtitleCue === "function") return _core.findSubtitleCue(cues, time);
        for (var i = 0, list = cues || []; i < list.length; i++)
            if (time >= list[i].start && time <= list[i].end) return list[i];
        return null
    }

    function legacyEpisodeDisplayTitle(series, episode, index) {
        var _core = window.TutyCore;
        if (_core && typeof _core.episodeDisplayTitle === "function") return _core.episodeDisplayTitle(series, episode, index);
        var item = episode || {},
            number = void 0 !== item.number && null !== item.number ? item.number : index + 1,
            name = String(item.title || item.name || "").trim(),
            seriesTitle = String(series && series.title || "").trim().replace(/[\s\-–_]*[TtSs]\d+$/, "");
        seriesTitle && 0 === name.indexOf(seriesTitle) && (name = name.substring(seriesTitle.length)), name = name.replace(/^[\s\-–_:.]+/, "").trim();
        (!name || /^(?:[TtSs]?\d+[\s\-–_.:]*)+$/.test(name)) && (name = "Episodio " + number);
        return name
    }

    function legacySeasonList(item) {
        var _core = window.TutyCore;
        if (_core && typeof _core.seasonList === "function") return _core.seasonList(item);
        var value = item || {};
        return value.seasons && value.seasons.length ? value.seasons : [{
            id: value.id || "",
            number: 1
        }]
    }

    function legacySeasonEpisodes(item, seasonIndex) {
        var _core = window.TutyCore;
        if (_core && typeof _core.seasonEpisodes === "function") return _core.seasonEpisodes(item, seasonIndex);
        var value = item || {},
            seasons = legacySeasonList(value),
            season = seasons[seasonIndex] || seasons[0];
        return season ? season.id === (value.seasonId || value.id) && value.episodes && value.episodes.length ? value.episodes : season._episodes || [] : []
    }

    function legacyFindEpisodeIndex(episodes, current) {
        var _core = window.TutyCore;
        if (_core && typeof _core.findEpisodeIndex === "function") return _core.findEpisodeIndex(episodes, current);
        for (var i = 0, list = episodes || []; i < list.length; i++)
            if (current && (list[i].id === current.id || list[i].number === current.number)) return i;
        return -1
    }

    function legacyNextSeasonIndex(seasons, currentIndex) {
        var _core = window.TutyCore;
        if (_core && typeof _core.nextSeasonIndex === "function") return _core.nextSeasonIndex(seasons, currentIndex);
        var list = seasons || [],
            current = list[currentIndex],
            currentNumber = Number(current && current.number);
        if (!isFinite(currentNumber)) return currentIndex + 1 < list.length ? currentIndex + 1 : -1;
        for (var bestIndex = -1, bestNumber = Infinity, i = 0; i < list.length; i++) {
            var number = Number(list[i] && list[i].number);
            isFinite(number) && number > currentNumber && number < bestNumber && (bestIndex = i, bestNumber = number)
        }
        return bestIndex
    }

    function legacyFormatEpisodeDuration(value) {
        var _core = window.TutyCore;
        if (_core && typeof _core.formatEpisodeDuration === "function") return _core.formatEpisodeDuration(value);
        var text = String(value || "").trim(),
            match = /^(\d+):(\d+)(?::(\d+))?$/.exec(text);
        return match ? match[3] ? (parseInt(match[1], 10) || 0) + " h " + (parseInt(match[2], 10) || 0) + " min" : (parseInt(match[1], 10) || 0) + " min" : text
    }

    function legacyIsSeriesLike(item) {
        var _core = window.TutyCore;
        if (_core && typeof _core.isSeriesLike === "function") return _core.isSeriesLike(item);
        var e = item;
        return !!e && ("teleplay" === e.type || "series" === e.type || "serie" === e.kind || e.category && -1 !== e.category.indexOf("serie") || e.episodes && e.episodes.length > 0 || e.seasons && e.seasons.length > 0 || e.volumeCount && parseInt(e.volumeCount, 10) > 1)
    }

    function legacyParseSeriesSeasonTitle(item) {
        var _core = window.TutyCore;
        if (_core && typeof _core.parseSeriesSeasonTitle === "function") return _core.parseSeriesSeasonTitle(item);
        var e = item;
        if (!e || !legacyIsSeriesLike(e)) return null;
        var t = String(e.title || e.alias || "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, ""),
            i = /^(.*?)(?:\s*[-–:|]?\s*(?:temporada|season)\s*(\d+)|\s*[-–:|]?\s*[st]\s*0?(\d+))\s*$/i.exec(t);
        if (!i || !i[1]) return null;
        var a = parseInt(i[2] || i[3], 10);
        return !a || a > 99 ? null : {
            title: i[1].replace(/\s+$/, ""),
            number: a
        }
    }

    function legacyExtractCatalogItems(payload) {
        var _core = window.TutyCore;
        if (_core && typeof _core.extractCatalogItems === "function") return _core.extractCatalogItems(payload);
        var e = payload;
        if ("[object Array]" === Object.prototype.toString.call(e)) return e;
        if (!e) return [];
        for (var t = ["items", "movies", "results", "recommendList", "movieList", "totalMovieList", "programList", "data"], i = 0; i < t.length; i++) {
            if ("[object Array]" === Object.prototype.toString.call(e[t[i]])) return e[t[i]];
            if (e[t[i]] && "object" == typeof e[t[i]]) {
                var a = legacyExtractCatalogItems(e[t[i]]);
                if (a.length) return a
            }
        }
        return []
    }

    function legacyNormalizeCatalogItem(item, index) {
        var _core = window.TutyCore;
        if (_core && typeof _core.normalizeCatalogItem === "function") return _core.normalizeCatalogItem(item, index, {
            imageBaseUrl: p ? p.imageBaseUrl : "",
            portalMode: !!(p && "portal" === p.mode)
        });
        var e = item,
            t = index,
            i = (e = e || {}).genres || e.genre || [];
        "string" == typeof i && (i = i.split(",")), "[object Array]" !== Object.prototype.toString.call(i) && (i = []);
        for (var a = [], n = 0; n < i.length; n++) a.push("string" == typeof i[n] ? i[n] : i[n].name || "");
        var r = e.duration || e.runtime || e.runtimeMinutes || "";
        "number" == typeof r && (r = Math.floor(r / 60) + " h " + r % 60 + " min");
        var s = x(e.type || e.programType, ""),
            l = "teleplay" === s || "series" === s || "serie" === o(x(e.kind || "", "")) || -1 !== o(x(e.category || "", "")).indexOf("serie") || e.episodes && e.episodes.length > 0 || e.seasons && e.seasons.length > 0 || e.volumeCount && parseInt(e.volumeCount, 10) > 1 || e.volumnCount && parseInt(e.volumnCount, 10) > 1;
        return {
            id: x(e.id || e.vodId || e.programId || e.program_id || e.tmdb_id, "api-" + t),
            title: x(e.title || e.name || e.programName || e.programTitle || e.original_title, "Sin título"),
            category: o(x(e.category || e.section || e.collection || e.homeSection, "")),
            score: x(e.score || e.vote_average || e.rating || e.movieRate || e.programScore, "—"),
            year: x(e.year || e.release_year || e.programYear || (e.releaseDate || e.releaseTime || e.release_date || "").slice(0, 4), "—"),
            duration: x(r, "—"),
            genres: a.length ? a : ["Sin clasificar"],
            director: x(e.director, "—"),
            actors: x(e.actors || e.actorDisplay || e.cast, "—"),
            synopsis: x(e.synopsis || e.overview || e.description || e.programUpdateContent, "Sin sinopsis disponible."),
            kind: l ? "serie" : x(e.kind || e.media_type, "película"),
            poster: w(e.posterUrl || e.poster_url || e.poster || e.poster_path || e.image || e.imageUrl || e.cover || e.coverUrl || e.programPoster || e.programImage),
            landscape: w(e.landscapeUrl || e.landscape_url || e.landscape || e.wideImage || e.bannerImage),
            backdrop: w(e.backdropUrl || e.backdrop_url || e.backdrop || e.backdrop_path),
            streamUrl: e.streamUrl || e.stream_url || "",
            type: s || (l ? "teleplay" : "movie"),
            row: x(e.row, ""),
            alias: x(e.alias, ""),
            country: x(e.country || e.originalCountry, ""),
            releaseDate: x(e.releaseDate || e.releaseTime, ""),
            tagline: x(e.tagline || e.viewPoint, ""),
            volumeCount: parseInt(e.volumeCount || e.volumnCount, 10) || 0,
            updateCount: parseInt(e.updateCount, 10) || 0,
            episodes: e.episodes || [],
            seasons: e.seasons || [],
            moreAudio: void 0 !== e.moreAudio ? e.moreAudio : 0,
            moreSubtitle: void 0 !== e.moreSubtitle ? e.moreSubtitle : 0,
            _portal: !0 === e.portal || !0 === e._portal || p && "portal" === p.mode && String(e.id || "").length > 10
        }
    }

    function legacyGroupCatalogSeries(items) {
        var _core = window.TutyCore;
        if (_core && typeof _core.groupCatalogSeries === "function") return _core.groupCatalogSeries(items);
        for (var e = items, t = {}, i = [], a = 0; a < e.length; a++) {
            var n = k(e[a]);
            if (n) {
                var key = o(n.title);
                t[key] || (t[key] = {
                    title: n.title,
                    items: []
                }), t[key].items.push({
                    item: e[a],
                    number: n.number
                })
            } else i.push(e[a])
        }
        for (var name in t)
            if (t.hasOwnProperty(name)) {
                var s = t[name];
                if (s.items.length < 2) i.push(s.items[0].item);
                else {
                    s.items.sort(function(e, t) {
                        return e.number - t.number
                    });
                    var l = s.items[0].item,
                        d = {};
                    l._catalogSeasons = [], l._seriesGroup = !0, l._seriesTitle = s.title, l.title = s.title, l.alias = s.title, l.seasons = [];
                    for (var c = 0; c < s.items.length; c++) {
                        for (var p = s.items[c], u = String(p.item.category || "").split(","), v = 0; v < u.length; v++) u[v] && (d[u[v]] = !0);
                        var f = {
                            id: p.item.id,
                            number: p.number,
                            title: s.title
                        };
                        l._catalogSeasons.push(f), l.seasons.push(f)
                    }
                    l.category = Object.keys(d).join(","), i.push(l)
                }
            } return i
    }

    function legacyMergePortalRoots(roots, rootKeys, bundled) {
        var _core = window.TutyCore;
        if (_core && typeof _core.mergePortalRoots === "function") return _core.mergePortalRoots(roots, rootKeys, bundled);
        var e = roots,
            t = {},
            i = [],
            a = {};

        function n(item) {
            if (item && item.id) {
                var id = String(item.id);
                if (t[id]) {
                    var target = t[id];
                    for (var key in item) Object.prototype.hasOwnProperty.call(item, key) && "" !== item[key] && "—" !== item[key] && null !== item[key] && void 0 !== item[key] && (target[key] = item[key])
                } else t[id] = item, i.push(id);
                var categories = String(item.category || "").split(",");
                a[id] = a[id] || {};
                for (var c = 0; c < categories.length; c++) categories[c] && (a[id][categories[c]] = !0)
            }
        }
        for (var r = 0; r < rootKeys.length; r++)
            for (var items = e[rootKeys[r]] || [], s = 0; s < items.length; s++) items[s].portal = !0, n(items[s]);
        if (!i.length) return [];
        for (var l = [], d = 0; d < i.length; d++) {
            var item = t[i[d]];
            item.category = Object.keys(a[i[d]]).join(","), l.push(item)
        }
        for (var b = 0; b < bundled.length; b++) {
            var source = bundled[b];
            if (source && source.streamUrl) {
                var copy = {};
                for (var key in source) Object.prototype.hasOwnProperty.call(source, key) && (copy[key] = source[key]);
                copy.category = "demo", copy.portal = !1, l.push(copy)
            }
        }
        return l
    }

    function legacyFindLocalSearchMatches(items, query) {
        var _core = window.TutyCore;
        if (_core && typeof _core.findLocalSearchMatches === "function") return _core.findLocalSearchMatches(items, query);
        var t = o(String(query || "").trim());
        if (!t) return [];
        for (var i = [], a = 0; a < items.length; a++) {
            var n = o(items[a].title || ""),
                r = items[a].alias ? o(items[a].alias) : "";
            (-1 !== n.indexOf(t) || r && -1 !== r.indexOf(t)) && i.push(items[a])
        }
        return i
    }

    function legacyCombineSearchResults(localItems, remoteItems, normalizeRemote) {
        var _core = window.TutyCore;
        if (_core && typeof _core.combineSearchResults === "function") return _core.combineSearchResults(localItems, remoteItems, normalizeRemote);
        for (var a = localItems.slice(), n = {}, r = 0; r < a.length; r++) n[String(a[r].id)] = !0;
        for (var o = 0; o < remoteItems.length; o++) {
            var l = normalizeRemote(remoteItems[o], a.length + 1);
            n[String(l.id)] || (n[String(l.id)] = !0, a.push(l))
        }
        return a
    }

    function legacyResolvePlaybackDuration(candidates, series, position) {
        var _core = window.TutyCore;
        if (_core && typeof _core.resolvePlaybackDuration === "function") return _core.resolvePlaybackDuration(candidates, series, position);
        for (var i = 0; i < candidates.length; i++) {
            var parsed = Mi(candidates[i]);
            if (parsed) return parsed
        }
        var fallback = series ? 2700 : 6300;
        return position > fallback && (fallback = Math.round(1.15 * position)), fallback
    }

    function legacyCurrentPlaybackPosition(currentTime, relay, relayBase) {
        var _core = window.TutyCore;
        if (_core && typeof _core.currentPlaybackPosition === "function") return _core.currentPlaybackPosition(currentTime, relay, relayBase);
        var current = Number(currentTime) || 0;
        return relay ? (Number(relayBase) || 0) + current : current
    }

    function legacyResolvePlaybackTotal(videoDuration, episodeDuration, itemDuration) {
        var _core = window.TutyCore;
        if (_core && typeof _core.resolvePlaybackTotal === "function") return _core.resolvePlaybackTotal(videoDuration, episodeDuration, itemDuration);
        var video = Number(videoDuration) || 0;
        if (isFinite(video) && video > 0) return video;
        return Number(episodeDuration) || Number(itemDuration) || 0
    }

    function legacyDescribePlaybackStream(url, mime, itemIsHls) {
        var _core = window.TutyCore;
        if (_core && typeof _core.describePlaybackStream === "function") return _core.describePlaybackStream(url, mime, itemIsHls);
        var source = String(url || ""),
            streamMime = String(mime || ""),
            isHls = -1 !== source.indexOf(".m3u8") || -1 !== streamMime.indexOf("mpegurl") || !!itemIsHls;
        return {
            isHls: isHls,
            contentType: isHls ? "application/vnd.apple.mpegurl" : -1 !== source.indexOf(".mp4") || -1 !== streamMime.indexOf("mp4") ? "video/mp4" : "video/mp2t"
        }
    }

    function legacyShouldUseHls(isHls, nativeHls, nativeTv, hlsSupported) {
        var _core = window.TutyCore;
        if (_core && typeof _core.shouldUseHls === "function") return _core.shouldUseHls(isHls, nativeHls, nativeTv, hlsSupported);
        return !!(isHls && !nativeHls && !nativeTv && hlsSupported)
    }

    function legacyShouldSaveHistoryBeforeReset(mode, hasVideo) {
        var _core = window.TutyCore;
        if (_core && typeof _core.shouldSaveHistoryBeforeReset === "function") return _core.shouldSaveHistoryBeforeReset(mode, hasVideo);
        return "vod" === mode && !!hasVideo
    }

    function legacyResolveAbortServiceBase(directBase, streamUrl) {
        var _core = window.TutyCore;
        if (_core && typeof _core.resolveAbortServiceBase === "function") return _core.resolveAbortServiceBase(directBase, streamUrl);
        if (directBase) return String(directBase);
        if (!streamUrl || -1 === String(streamUrl).indexOf("127.0.0.1")) return "";
        var match = /^(http:\/\/127\.0\.0\.1:\d+)/.exec(String(streamUrl));
        return match ? match[1] : ""
    }

    function legacyShouldLoadSeriesEpisodesBeforePlay(item, episode) {
        var _core = window.TutyCore;
        if (_core && typeof _core.shouldLoadSeriesEpisodesBeforePlay === "function") return _core.shouldLoadSeriesEpisodesBeforePlay(item, episode);
        return !!item && legacyIsSeriesLike(item) && !episode && (!item.episodes || !item.episodes.length) && !item._detailsLoaded
    }

    function legacyShouldReusePlaybackSession(screen, hasSource, sameItem, sameEpisode) {
        var _core = window.TutyCore;
        if (_core && typeof _core.shouldReusePlaybackSession === "function") return _core.shouldReusePlaybackSession(screen, hasSource, sameItem, sameEpisode);
        return "detail" === screen && !!hasSource && !!sameItem && !!sameEpisode
    }

    function legacyHasPlaybackSession(source, currentSource, streamUrl, streamError) {
        var _core = window.TutyCore;
        if (_core && typeof _core.hasPlaybackSession === "function") return _core.hasPlaybackSession(source, currentSource, streamUrl, streamError);
        return !streamError && !!(source || currentSource || streamUrl)
    }

    function legacyPlaybackTiming() {
        var _core = window.TutyCore;
        if (_core && _core.playbackTiming) return _core.playbackTiming;
        return {
            bufferNoticeMs: 700,
            seekCommitMs: 800,
            liveResolveMs: 180,
            historyTickMs: 500,
            relaySeekResetMs: 12e3
        }
    }

    function legacyShouldReportBuffering(streamError, hasVideo, paused, readyState) {
        var _core = window.TutyCore;
        if (_core && typeof _core.shouldReportBuffering === "function") return _core.shouldReportBuffering(streamError, hasVideo, paused, readyState);
        return !streamError && !!hasVideo && !paused && (Number(readyState) || 0) < 3
    }

    function legacyShouldTickPlayback(screen, mode, hasVideo, paused) {
        var _core = window.TutyCore;
        if (_core && typeof _core.shouldTickPlayback === "function") return _core.shouldTickPlayback(screen, mode, hasVideo, paused);
        return "player" === screen && "vod" === mode && !!hasVideo && !paused
    }

    function legacyResolveLiveResolveDelay(immediate) {
        var _core = window.TutyCore;
        if (_core && typeof _core.resolveLiveResolveDelay === "function") return _core.resolveLiveResolveDelay(immediate);
        return immediate ? 0 : 180
    }

    function legacyWirePlaybackVideoEvents(target, handlers) {
        var _core = window.TutyCore;
        if (_core && typeof _core.wirePlaybackVideoEvents === "function") return _core.wirePlaybackVideoEvents(target, handlers);
        for (var events = ["error", "loadeddata", "canplay", "loadedmetadata", "durationchange", "playing", "ended", "timeupdate", "pause", "play", "waiting", "stalled", "seeking", "seeked", "progress"], i = 0; i < events.length; i++) target["on" + events[i]] = handlers[events[i]]
    }

    function legacyWireHlsPlaybackEvents(hls, events, onError, onManifestParsed) {
        var _core = window.TutyCore;
        if (_core && typeof _core.wireHlsPlaybackEvents === "function") return _core.wireHlsPlaybackEvents(hls, events, onError, onManifestParsed);
        hls.on(events.ERROR, onError), hls.on(events.MANIFEST_PARSED, onManifestParsed)
    }

    function legacyApplyPlaybackSurface(video, poster, active) {
        var _core = window.TutyCore;
        if (_core && typeof _core.applyPlaybackSurface === "function") return _core.applyPlaybackSurface(video, poster, active);
        video && video.classList && (active ? video.classList.add("is-active") : video.classList.remove("is-active")), poster && poster.style && (poster.style.display = active ? "none" : "block")
    }

    function legacyApplyPlayerStatus(element, message) {
        var _core = window.TutyCore;
        if (_core && typeof _core.applyPlayerStatus === "function") return _core.applyPlayerStatus(element, message);
        element && (message ? (element.textContent = String(message), element.classList.add("is-active")) : (element.textContent = "", element.classList.remove("is-active")))
    }

    function legacyApplyDetailPlayerTransition(playerScreen, detailScreen) {
        var _core = window.TutyCore;
        if (_core && typeof _core.applyDetailPlayerTransition === "function") return _core.applyDetailPlayerTransition(playerScreen, detailScreen);
        playerScreen && playerScreen.classList && (playerScreen.classList.remove("is-mini"), playerScreen.classList.add("is-active")), detailScreen && detailScreen.classList && detailScreen.classList.remove("is-active")
    }

    function legacyResetDetailPlayerSurface(playerScreen) {
        var _core = window.TutyCore;
        if (_core && typeof _core.resetDetailPlayerSurface === "function") return _core.resetDetailPlayerSurface(playerScreen);
        playerScreen && playerScreen.classList && (playerScreen.classList.remove("is-mini"), playerScreen.classList.remove("is-active"))
    }

    function legacyApplyPlayerModeClass(element, isVod) {
        var _core = window.TutyCore;
        if (_core && typeof _core.applyPlayerModeClass === "function") return _core.applyPlayerModeClass(element, isVod);
        element && element.classList && (isVod ? element.classList.add("is-vod") : element.classList.remove("is-vod"))
    }

    function legacyDevServiceUrl(base, method, parameters) {
        var _core = window.TutyCore;
        if (_core && typeof _core.buildDevServiceUrl === "function") return _core.buildDevServiceUrl(base, method, parameters);
        var query = [];
        for (var key in parameters) Object.prototype.hasOwnProperty.call(parameters, key) && query.push(encodeURIComponent(key) + "=" + encodeURIComponent(parameters[key]));
        return String(base).replace(/\/$/, "") + "/" + method + "?" + query.join("&")
    }

    function legacyLanguagePreference(code, fallback) {
        var _core = window.TutyCore;
        if (_core && typeof _core.languagePreferenceIndex === "function") return _core.languagePreferenceIndex(code, fallback);
        var value = String(code || "").toLowerCase();
        return /^(es|spa|esp)|espa/.test(value) ? 0 : /^(pt|por)|portu/.test(value) ? 1 : /^(en|eng|ing)|ingl/.test(value) ? 2 : fallback
    }

    function legacySelectTrackIndex(codes, preferredCode, preference) {
        var _core = window.TutyCore;
        if (_core && typeof _core.selectTrackIndexByCodeOrPreference === "function") return _core.selectTrackIndexByCodeOrPreference(codes, preferredCode, preference);
        var target = String(preferredCode || "").trim().toLowerCase();
        if (target)
            for (var i = 0; i < codes.length; i++)
                if (String(codes[i] || "").trim().toLowerCase() === target) return i;
        for (var a = 0; a < codes.length; a++)
            if (Ia(codes[a], ["es", "pt", "en"][Number(preference) || 0] || "es")) return a;
        return -1
    }

    function legacyRelayStreamMode(mode) {
        var _core = window.TutyCore;
        if (_core && typeof _core.isRelayStreamMode === "function") return _core.isRelayStreamMode(mode);
        return "relay" === mode || "smooth" === mode
    }

    function legacyForceRelay(mode, resumeAt) {
        var _core = window.TutyCore;
        if (_core && typeof _core.shouldForceRelay === "function") return _core.shouldForceRelay(mode, resumeAt);
        return "relay" === mode || "smooth" === mode || resumeAt > 0
    }

    function legacyRelayResumeStart(url, resumeAt) {
        var _core = window.TutyCore;
        if (_core && typeof _core.applyRelayResumeStart === "function") return _core.applyRelayResumeStart(url, resumeAt);
        return resumeAt > 0 && /\/s\/[0-9a-f]+\.mp4/i.test(url) ? {
            url: url + (-1 !== url.indexOf("?") ? "&" : "?") + "start=" + Math.floor(resumeAt),
            consumed: !0
        } : {
            url: url,
            consumed: !1
        }
    }

    function legacyDestroyHls(slot) {
        var _core = window.TutyCore;
        if (_core && typeof _core.destroyLegacyHls === "function") return _core.destroyLegacyHls(window, slot);
        window[slot] && (function() {
            try {
                window[slot].destroy()
            } catch (e) {}
        })(), window[slot] = null
    }

    function legacySchedulePlaybackRetry(guard, retry) {
        var _core = window.TutyCore;
        if (_core && typeof _core.scheduleGuardedRetry === "function") return _core.scheduleGuardedRetry(function(callback) {
            return setTimeout(callback, 0)
        }, guard, retry);
        setTimeout(function() {
            guard() && retry()
        }, 0)
    }

    function legacyInstallNavigation(target, handler) {
        var _core = window.TutyCore;
        if (_core && typeof _core.connectLegacyNavigation === "function") return _core.connectLegacyNavigation(target, handler);
        target.addEventListener("keydown", handler, !1), target.addEventListener("keyup", function(e) {
            461 !== (e.keyCode || e.which) && "Back" !== e.key && "GoBack" !== e.key || handler(e)
        }, !1)
    }

    function legacyCanUseLuna() {
        if (!E()) return !1;
        var _core = window.TutyCore;
        if (_core && _core.platform && typeof _core.platform.canUseLunaService === "function") return _core.platform.canUseLunaService(window.PalmServiceBridge);
        return !!window.PalmServiceBridge
    }

    function legacyNativePreviewHls(video) {
        var _core = window.TutyCore;
        if (_core && _core.platform && typeof _core.platform.canPlayPreviewHls === "function") return _core.platform.canPlayPreviewHls(video);
        return !!(video.canPlayType && video.canPlayType("application/vnd.apple.mpegurl"))
    }

    function legacyPlatformBack() {
        var _core = window.TutyCore;
        if (_core && _core.platform && typeof _core.platform.back === "function") return _core.platform.back(window);
        window.webOSTV && window.webOSTV.platformBack ? window.webOSTV.platformBack() : window.PalmSystem && window.PalmSystem.platformBack && window.PalmSystem.platformBack()
    }

    function Q() {
        J($, j.playback)
    }

    function K(e) {
        if (!e || !e.id) return !1;
        var result = legacyToggleCatalogFavorite(j.favs, e.id);
        return j.favs = result.favorites, X.favs = j.favs, J(W, X), result.active
    }

    function reminderOn(e) {
        return legacyIsReminderActive(e && e.id, X.reminders)
    }

    function toggleReminder(e) {
        if (!e || !e.id) return !1;
        var result = legacyToggleReminderEntry(X.reminders, e, Date.now());
        return X.reminders = result.reminders, J(W, X), result.active
    }

    function toast(msg) {
        var i = t("app");
        if (i) {
            var a = e("div", "tuty-toast", msg);
            i.appendChild(a), setTimeout(function() {
                a.parentNode && a.parentNode.removeChild(a)
            }, 3500)
        }
    }

    function stopWebMedia() {
        if (!window.TUTYTV_WEB) return;
        try {
            we && legacyPauseVideo(we)
        } catch (e) {}
        legacyDestroyHls("__tutyHls");
        try {
            Et && legacyPauseVideo(Et)
        } catch (e) {}
        legacyDestroyHls("__tutyPreviewHls");
        try {
            q("abortMedia", {}, function() {})
        } catch (e) {}
    }

    function checkReminders() {
        var now = Date.now();
        if (!legacyShouldCheckReminders(X.reminders, X.reminderCheckAt, now)) return;
        var t = legacySelectReminderCheckIds(X.reminders);
        if (!t.length) return;
        X.reminderCheckAt = now, J(W, X);
        for (var i = [], a = 0, n = 0; n < t.length; n++)(function(e) {
            q("detail", {
                contentId: e
            }, function(n, r) {
                if (a++, !n && r && !1 !== r.returnValue) {
                    var l = X.reminders[e];
                    if (l) {
                        var merged = legacyMergeReminderUpdate(l, r);
                        merged.increased && i.push(merged.reminder.title || "Una serie"), X.reminders[e] = merged.reminder, J(W, X)
                    }
                }
                a === t.length && i.length && toast("Nuevos episodios: " + i.slice(0, 3).join(", "))
            })
        })(t[n])
    }! function() {
        var e = G($, null);
        if (e) legacyMergePlaybackPreferences(j.playback, e);
        var r = legacyEnsureViewerProfile(X, G(W, null), Date.now());
        X = r.profile, r.created && J(W, X), X.favs || (X.favs = {}), X.reminders || (X.reminders = {}), j.favs = X.favs
    }();
    var Y, Z, ee, te, ie, ae, ne, re, oe, se, le, de, ce, pe, ue, ve, fe, he, ge, me, ye, be, Ce, we, xe, Se, _e, Le, ke, Me, Ie, Te, Ee, qe, Oe, De, Ae, Pe = !1,
        Ne = [],
        Re = [],
        tabFocus = [],
        Ue = [],
        Fe = [],
        Be = {},
        He = [],
        ze = "history",
        Ve = {},
        je = null,
        We = null,
        $e = null,
        Xe = "",
        Ge = 48,
        Je = !1,
        Qe = 0,
        Ke = null;

    function legacyFocusScrollAdjustment(rect, container, metrics) {
        var _core = window.TutyCore;
        if (_core && typeof _core.computeLegacyScrollAdjustment === "function") return _core.computeLegacyScrollAdjustment(rect, container, metrics);
        var sx = metrics.offsetWidth ? (container.right - container.left) / metrics.offsetWidth : 1,
            sy = metrics.offsetHeight ? (container.bottom - container.top) / metrics.offsetHeight : 1;
        (!isFinite(sx) || sx <= 0) && (sx = 1), (!isFinite(sy) || sy <= 0) && (sy = 1);
        var l = (rect.left - container.left) / sx,
            r = (rect.right - container.right) / sx,
            u = (rect.top - container.top) / sy,
            d = (rect.bottom - container.bottom) / sy,
            top = u < 0 ? u - 12 : d > 0 ? d + 12 : 0,
            left = 0;
        return (metrics.scrollWidth || 0) > (metrics.clientWidth || 0) + 1 && (l < 0 ? left = l - 12 : r > 0 && (left = r + 12)), {
            top: top,
            left: left
        }
    }

    function legacyFocusVisible(element) {
        var _core = window.TutyCore;
        if (_core && typeof _core.isLegacyFocusVisible === "function") return _core.isLegacyFocusVisible({
            closest: function(selector) {
                var node = n(element, selector);
                return node ? {
                    hasClass: function(name) {
                        return node.classList.contains(name)
                    }
                } : null
            }
        }, {
            episodeBrowserOpen: !!j.episodeBrowserOpen,
            categoryPickerOpen: !!j.categoryPickerOpen,
            liveCategoriesOpen: !!j.liveCategoriesOpen,
            liveSearchOpen: !!j.liveSearchOpen,
            resumeOpen: !!j.resumeOpen,
            filterOpen: !!j.filterOpen,
            playSettingsOpen: !!fa,
            playSettingViewOpen: !!va,
            nextEpisodeOpen: !!j.nextEpisodeOpen
        });
        if (j.episodeBrowserOpen) return !!n(element, "#player-episodes");
        if (j.categoryPickerOpen) return !!n(element, "#player-categories");
        if (j.liveCategoriesOpen) return !!n(element, "#live-categories");
        if (j.liveSearchOpen) return !!n(element, "#live-search");
        if (j.resumeOpen) return !!n(element, "#dialog-resume");
        if (j.filterOpen) return !!n(element, "#filter-panel");
        if (fa) return !!n(element, "#dialog-playsettings");
        if (va) return !!n(element, "#player-playsetting-view");
        var i = n(element, ".home-page");
        if (i && !i.classList.contains("is-current")) return !1;
        var a = n(element, ".settings-panel");
        if (a && !a.classList.contains("is-active")) return !1;
        var r = n(element, ".search-hot");
        if (r && r.classList.contains("is-hidden")) return !1;
        var o = n(element, ".search-results");
        if (o && !o.classList.contains("is-active")) return !1;
        var s = n(element, ".player-channels");
        if (s && !s.classList.contains("is-active")) return !1;
        var l = n(element, ".player-infobar");
        return !(l && !l.classList.contains("is-active"))
    }

    function Ye(e) {
        if (!e || !e.getBoundingClientRect) return !1;
        if (null === e.offsetParent) return !1;
        var t = e.getBoundingClientRect();
        return t.width < 1 || t.height < 1 ? !1 : legacyFocusVisible(e)
    }

    function Ze() {
        for (var e = document.querySelectorAll(".focusable"), t = [], i = 0; i < e.length; i++) Ye(e[i]) && t.push(e[i]);
        return t
    }

    function et(e) {
        for (var t = n(e, ".scrollable"); t;) {
            var i = e.getBoundingClientRect(),
                a = t.getBoundingClientRect(),
                adjustment = legacyFocusScrollAdjustment(i, a, {
                    offsetWidth: t.offsetWidth,
                    offsetHeight: t.offsetHeight,
                    scrollWidth: t.scrollWidth,
                    clientWidth: t.clientWidth
                });
            t.scrollTop += adjustment.top, t.scrollLeft += adjustment.left, t = n(t.parentNode, ".scrollable")
        }
    }

    function tt(e, i) {
        if (e)
            if (j.focus !== e) {
                j.focus && "home" === j.screen && n(j.focus, ".home-page") && (tabFocus[j.tab] = j.focus), j.focus && j.focus.classList.remove("is-focused"), j.focus = e, e.classList.add("is-focused"), e._onFocus && e._onFocus(), rn();
                var a = t("home-tabs");
                if (a && "home" === j.screen) {
                    var r = n(e, ".home-tabs");
                    a.classList.toggle("is-expanded", !!r), a.classList.toggle("is-collapsed", !r);
                    var o = document.querySelector(".home-sidebar-bg");
                    o && o.classList.toggle("is-on", !!r)
                }
                i || et(e), mt()
            } else i || et(e)
    }

    function it(e) {
        for (var t = e.querySelectorAll(".focusable"), i = 0; i < t.length; i++)
            if (Ye(t[i])) return t[i];
        return null
    }

    function focusHomeTab(tab) {
        var saved = tabFocus[tab];
        if (saved && saved.parentNode && Ye(saved)) return tt(saved);
        var page = H[tab] && H[tab].page,
            first = page >= 0 && Ne[page] ? it(Ne[page]) : null;
        first ? tt(first) : Re[tab] && tt(Re[tab])
    }

    function at(e) {
        if (j.focus) {
            if (!j.focus._onMove || !j.focus._onMove(e)) {
                for (var t = "home" === j.screen && n(j.focus, ".home-page"), i = "home" === j.screen && n(j.focus, ".home-tabs"), a = Ze(), r = j.focus.getBoundingClientRect(), o = r.left + r.width / 2, s = r.top + r.height / 2, l = null, d = 1e9, c = 0; c < a.length; c++) {
                    var p = a[c];
                    if (p !== j.focus && ((!t || !n(p, ".home-tabs")) && (!i || n(p, ".home-tabs")))) {
                        var u, v, f, h = p.getBoundingClientRect(),
                            g = h.left + h.width / 2 - o,
                            m = h.top + h.height / 2 - s;
                        var _core = window.TutyCore;
                        if (_core && typeof _core.scoreLegacyFocus === "function") {
                            var _score = _core.scoreLegacyFocus(e, r, h);
                            null !== _score && _score < d && (d = _score, l = p);
                            continue
                        }
                        if ("left" === e) {
                            if (g > -4) continue;
                            u = Math.max(0, r.left - h.right), v = Math.abs(m), f = h.bottom > r.top + 2 && h.top < r.bottom - 2
                        } else if ("right" === e) {
                            if (g < 4) continue;
                            u = Math.max(0, h.left - r.right), v = Math.abs(m), f = h.bottom > r.top + 2 && h.top < r.bottom - 2
                        } else if ("up" === e) {
                            if (m > -4) continue;
                            u = Math.max(0, r.top - h.bottom), v = Math.abs(g), f = h.right > r.left + 2 && h.left < r.right - 2
                        } else {
                            if (m < 4) continue;
                            u = Math.max(0, h.top - r.bottom), v = Math.abs(g), f = h.right > r.left + 2 && h.left < r.right - 2
                        }
                        var y = u + 0.5 * v + (f ? 0 : 320);
                        y < d && (d = y, l = p)
                    }
                }
                l ? tt(l) : "left" === e && t && Re[j.tab] && tt(Re[j.tab])
            }
        } else {
            var b = Ze();
            b.length && tt(b[0])
        }
    }

    function nt(e) {
        for (var i = document.querySelectorAll(".screen"), a = 0; a < i.length; a++) i[a].classList.remove("is-active");
        var n = t("screen-" + e);
        if (n && n.classList.add("is-active"), j.screen = e, "player" !== e && j.nextEpisodeOpen && closeNextEpisodePrompt(!1), "player" !== e && j.episodeBrowserOpen && un(!0), "player" !== e && j.categoryPickerOpen && An(!0), "home" !== e && j.liveCategoriesOpen && lvCloseCats(!0), "home" !== e && j.liveSearchOpen && lvCloseSearch(!0), "player" !== e && "detail" !== e) {
            fa && _n(), va && an();
            var r = t("screen-player");
            legacyResetDetailPlayerSurface(r), ar(), wa++, Da = [], ua && (ua.innerHTML = "")
        }
        window.TUTYTV_WEB && "player" !== e && "detail" !== e && stopWebMedia(), mt()
    }
    var rt = 0;

    function ot() {
        var e = Date.now();
        if (!(e - rt < 250))
            if (rt = e, fa) _n();
            else {
                if ("player" === j.screen) return Je ? void er(!1) : j.categoryPickerOpen ? (rt = Date.now(), void An()) : j.episodeBrowserOpen ? (rt = Date.now(), void un()) : va ? void an() : void(j.channelsOpen ? gr() : j.infobar ? Ni() : j.vodInfobarVisible ? Ui() : function() {
                    Ni(), Ui();
                    var e = j.playerReturn;
                    if (e && "detail" === e.screen) {
                        var i = t("screen-player"),
                            a = t("screen-detail");
                        i && (i.classList.add("is-mini"), i.classList.add("is-active")), a && a.classList.add("is-active"), j.screen = "detail";
                        var n = !1;
                        if (j.detailNeedsRebuild && j.detail) {
                            j.detailNeedsRebuild = !1, ti(j.detail), n = !0;
                            var r = se ? se.querySelector(".detail-season") : null;
                            r && tt(r)
                        } else j.detail && bn(j.detail);
                        if (!n)
                            if (e.focus && Ye(e.focus)) tt(e.focus);
                            else {
                                var o = oe ? oe.querySelector(".focusable") : null;
                                o && tt(o)
                            }
                    } else {
                        ar();
                        var s = t("screen-player");
                        legacyResetDetailPlayerSurface(s), e && "search" === e.screen ? (nt("search"), tt(e.focus)) : (nt("home"), ht(j.tab, !1), e && e.focus && Ye(e.focus) ? tt(e.focus) : Re[j.tab] && tt(Re[j.tab]))
                    }
                }());
                if ("detail" !== j.screen) {
                    if ("search" === j.screen) return pi(), nt("home"), ht(j.tab, !1), void(Re[j.tab] && tt(Re[j.tab]));
                    if ("settings" === j.screen) return nt("home"), ht(j.tab, !1), void(Re[j.tab] && tt(Re[j.tab]));
                    if ("home" === j.screen) {
                        if (0 !== j.tab) return ht(0, !0), void(Re[0] && tt(Re[0]));
                        legacyPlatformBack()
                    }
                } else {
                    if (ni) {
                        ri();
                        var i = se ? se.querySelector(".detail-season") : null;
                        return void(i && tt(i))
                    }
                    var a = t("screen-detail");
                    if (a && a.classList.contains("is-synopsis-open")) return void
                    function() {
                        var e = t("screen-detail");
                        if (!e) return;
                        var i = !e.classList.contains("is-synopsis-open");
                        e.classList.toggle("is-synopsis-open", i);
                        var a = document.querySelector(".detail-more");
                        a && (a.textContent = i ? "Menos" : "Más")
                    }();
                    ar();
                    var n = t("screen-player");
                    legacyResetDetailPlayerSurface(n);
                    var r = j.detailReturn;
                    r && "search" === r.screen ? (nt("search"), tt(r.focus)) : (nt("home"), ht(j.tab, !1), r && r.focus && Ye(r.focus) ? tt(r.focus) : Re[j.tab] && tt(Re[j.tab]))
                }
            }
    }

    function st() {
        j.focus && j.focus._activate && j.focus._activate()
    }

    function lt(e) {
        var t = e.keyCode || e.which,
            i = e.key || "",
            _action = legacyNavigationAction(e),
            a = !0;
        if ("back" === _action) return j.categoryPickerOpen ? (An(), e.preventDefault && e.preventDefault(), void(e.stopPropagation && e.stopPropagation())) : j.liveSearchOpen ? (lvCloseSearch(), e.preventDefault && e.preventDefault(), void(e.stopPropagation && e.stopPropagation())) : j.liveCategoriesOpen ? (lvCloseCats(), e.preventDefault && e.preventDefault(), void(e.stopPropagation && e.stopPropagation())) : j.nextEpisodeOpen ? (cancelNextEpisodePrompt(), e.preventDefault && e.preventDefault(), void(e.stopPropagation && e.stopPropagation())) : j.episodeBrowserOpen ? (un(), e.preventDefault && e.preventDefault(), void(e.stopPropagation && e.stopPropagation())) : Pt ? (rt = Date.now(), Wt(), e.preventDefault && e.preventDefault(), void(e.stopPropagation && e.stopPropagation())) : j.resumeOpen ? (closeResume(), e.preventDefault && e.preventDefault(), void(e.stopPropagation && e.stopPropagation())) : j.filterOpen ? (closeFilter(), e.preventDefault && e.preventDefault(), void(e.stopPropagation && e.stopPropagation())) : fa ? (rt = Date.now(), _n(), e.preventDefault && e.preventDefault(), void(e.stopPropagation && e.stopPropagation())) : va ? (rt = Date.now(), an(), e.preventDefault && e.preventDefault(), void(e.stopPropagation && e.stopPropagation())) : (ot(), e.preventDefault && e.preventDefault(), void(e.stopPropagation && e.stopPropagation()));
        if (j.resumeOpen) return 37 === t ? at("left") : 38 === t ? at("up") : 39 === t ? at("right") : 40 === t ? at("down") : 13 === t || 32 === t ? st() : a = !1, void(a && e.preventDefault && e.preventDefault());
        if (j.filterOpen) return 37 === t ? at("left") : 38 === t ? at("up") : 39 === t ? at("right") : 40 === t ? at("down") : 13 === t || 32 === t ? st() : a = !1, void(a && e.preventDefault && e.preventDefault());
        if (j.categoryPickerOpen) return 37 === t ? at("left") : 38 === t ? at("up") : 39 === t ? at("right") : 40 === t ? at("down") : 13 === t || 32 === t ? st() : a = !1, void(a && e.preventDefault && e.preventDefault());
        if (j.liveSearchOpen || j.liveCategoriesOpen) return 37 === t ? at("left") : 38 === t ? at("up") : 39 === t ? at("right") : 40 === t ? at("down") : 13 === t || 32 === t ? st() : a = !1, void(a && e.preventDefault && e.preventDefault());
        if (j.nextEpisodeOpen) return 37 === t ? at("left") : 38 === t ? at("up") : 39 === t ? at("right") : 40 === t ? at("down") : 13 === t || 32 === t ? st() : a = !1, void(a && e.preventDefault && e.preventDefault());
        if (j.episodeBrowserOpen) {
            var r = n(j.focus, "#pe-seasons"),
                o = n(j.focus, "#pe-episodes");
            if (37 === t) {
                if (o && ea && "none" !== ea.style.display) {
                    var s = Zi ? Zi.children[j.browserSeason] || it(Zi) : null;
                    s && tt(s)
                }
            } else if (39 === t) {
                if (r) {
                    var l = ta ? ta.querySelector(".pe-ep.is-current") || it(ta) : null;
                    l && tt(l)
                }
            } else 38 === t ? at("up") : 40 === t ? at("down") : 13 === t || 32 === t ? st() : a = !1;
            a && e.preventDefault && e.preventDefault()
        } else {
            var mediaAction = legacyMediaKey(t, i),
                d = "play" === mediaAction,
                c = "pause" === mediaAction,
                p = "playpause" === mediaAction,
                u = "forward" === mediaAction,
                v = "rewind" === mediaAction,
                f = "stop" === mediaAction;            if ("player" === j.screen) {
                if (d) {
                    if (we && we.paused) {
                        try {
                            legacyPlayVideo(we)
                        } catch (e) {}
                        qi("none"), Pi()
                    }
                    return void(e.preventDefault && e.preventDefault())
                }
                if (c) {
                    if (we && !we.paused) {
                        try {
                            legacyPauseVideo(we)
                        } catch (e) {}
                        qi("pause"), Pi()
                    }
                    return void(e.preventDefault && e.preventDefault())
                }
                if (p) return Di(), void(e.preventDefault && e.preventDefault());
                if (u) return Oi(15), void(e.preventDefault && e.preventDefault());
                if (v) return Oi(-15), void(e.preventDefault && e.preventDefault());
                if (f) return ot(), void(e.preventDefault && e.preventDefault())
            }
            var h = "menu" === mediaAction;
            if ("player" === j.screen && "vod" === j.playerMode && h) return fa ? _n() : va ? an() : tn(), void(e.preventDefault && e.preventDefault());
            if ("home" === j.screen && 0 === j.tab && h && !j.liveCategoriesOpen && !j.liveSearchOpen) return lvOpenCats(), void(e.preventDefault && e.preventDefault());
            if ("player" === j.screen && (37 === t || 38 === t || 39 === t || 40 === t)) {
                if (fa) return 37 === t ? at("left") : 38 === t ? at("up") : 39 === t ? at("right") : 40 === t && at("down"), void(e.preventDefault && e.preventDefault());
                if (va) return en(), 37 === t ? at("left") : 38 === t ? at("up") : 39 === t ? at("right") : 40 === t && at("down"), void(e.preventDefault && e.preventDefault());
                if ("vod" === j.playerMode) {
                    if (j.focus === Ee && Je) {
                        if (37 === t) return ir(-1), void(e.preventDefault && e.preventDefault());
                        if (39 === t) return ir(1), void(e.preventDefault && e.preventDefault());
                        if (38 === t || 40 === t) return er(!1), void(e.preventDefault && e.preventDefault())
                    }
                    if (37 === t) return Oi(-10), void(e.preventDefault && e.preventDefault());
                    if (39 === t) return Oi(10), void(e.preventDefault && e.preventDefault());
                    if (40 === t) return tn(), void(e.preventDefault && e.preventDefault());
                    if (38 === t) return tr(), void(e.preventDefault && e.preventDefault())
                } else {
                    var g = j.focus && n(j.focus, ".player-channels");
                    if (j.channelsOpen || g) {
                        if (j.focus && j.focus.classList && j.focus.classList.contains("pc-cat-pill")) return 37 === t ? at("left") : 38 === t ? at("up") : 39 === t ? at("right") : 40 === t && at("down"), void(e.preventDefault && e.preventDefault());
                        if (38 === t) {
                            if (0 === (y = j.focus && void 0 !== j.focus._channel ? j.focus._channel : j.channel)) {
                                var m = Ce ? Ce.querySelector(".pc-cat-pill.is-selected") || Ce.querySelector(".pc-cat-pill") : null;
                                m && tt(m)
                            } else {
                                Nn(y - 1)
                            }
                            return void(e.preventDefault && e.preventDefault())
                        }
                        if (40 === t) {
                            var y = j.focus && void 0 !== j.focus._channel ? j.focus._channel : j.channel;
                            return Nn(Math.min(F.length - 1, y + 1)), void(e.preventDefault && e.preventDefault())
                        }
                        if (39 === t) return gr(), void(e.preventDefault && e.preventDefault())
                    } else {
                        if (38 === t) return j.channel > 0 ? Vt(j.channel - 1, !1) : F.length && Vt(F.length - 1, !1), Pi(), void(e.preventDefault && e.preventDefault());
                        if (40 === t) return j.channel < F.length - 1 ? Vt(j.channel + 1, !1) : F.length && Vt(0, !1), Pi(), void(e.preventDefault && e.preventDefault());
                        if (37 === t) return hr(), void(e.preventDefault && e.preventDefault());
                        j.infobar ? Ai() : Pi()
                    }
                }
            }
            if ("left" === _action) at("left");
            else if ("up" === _action) at("up");
            else if ("right" === _action) at("right");
            else if ("down" === _action) at("down");
            else if ("enter" === _action) {
                if (j.episodeBrowserOpen) return void st();
                if (fa) st();
                else if (va) en(), st();
                else if ("player" === j.screen && "vod" === j.playerMode && j.focus === Ee && Je) er(!0);
                else if ("player" === j.screen && j.streamError && we && we.src && !n(j.focus, ".player-channels")) {
                    var b = legacyPlayVideo(we);
                    b && b.catch && b.catch(function() {}), j.streamError = "", nr("")
                } else "player" === j.screen && "vod" === j.playerMode ? Di() : st()
            } else a = !1;
            a && e.preventDefault && e.preventDefault()
        }
    }

    function dt() {
        Ke && (clearTimeout(Ke), clearInterval(Ke), Ke = null), Pe || vt(), nt("home"), ht(0, !1), tt(ie);
        var e = t("home-tabs");
        e && (e.classList.add("is-expanded"), e.classList.remove("is-collapsed"));
        var i = document.querySelector(".home-sidebar-bg");
        i && i.classList.add("is-on")
    }
    var ct = [function(t) {
            te = e("div", "live-main"), (Et = document.createElement("video")).className = "live-preview-video", Et.preload = "auto", Et.muted = !0, Et.volume = 0, Et.setAttribute("muted", "muted"), Et.setAttribute("playsinline", ""), Et.setAttribute("webkit-playsinline", ""), te.appendChild(Et), te.appendChild(e("div", "live-frame")), te.appendChild(e("div", "live-logo")), qt = e("div", "live-preview-status"), te.appendChild(qt), t.appendChild(te);
            var i = e("div", "live-info"),
                cat = e("div", "live-category");
            cat.id = "live-cat-label", i.appendChild(cat), (ee = e("div", "live-channel")).style.right = "112.5px", i.appendChild(ee);
            var a = e("div", "live-fullscreen");
            a._activate = function() {
                dr("live")
            }, i.appendChild(a), te.appendChild(i);
            var n = e("div", "live-arrow-up"),
                r = e("div", "live-arrow-down");
            t.appendChild(n), t.appendChild(r), ae = e("div", "live-list scrollable"), t.appendChild(ae);
            var fast = e("div", "live-fast live-fast-right"),
                fastList = [];

            function fastBtn(cls, id, label) {
                var n = e("div", "fast-btn focusable " + cls);
                return n.id = id, n._label = label, fast.appendChild(n), fastList.push(n), n
            }

            function fastMove(idx) {
                return function(t) {
                    if ("left" === t) return idx > 0 && (tt(fastList[idx - 1]), !0), !0;
                    if ("right" === t) return idx < fastList.length - 1 ? (tt(fastList[idx + 1]), !0) : !0;
                    if ("up" === t) return ie ? (tt(ie), !0) : !1;
                    if ("down" === t) {
                        for (var i = null, a = 0; a < Ue.length; a++)
                            if (Ue[a]._channel === j.channel) {
                                i = Ue[a];
                                break
                            }
                        return !i && Ue.length && (i = Ue[0]), i && Ye(i) ? (tt(i), !0) : !1
                    }
                    return !1
                }
            }
            liveFastAll = fastBtn("f-all", "live-btn-all", "Categorías"), liveFastFav = fastBtn("f-fav", "live-btn-fav", "Favoritos"), liveFastSrch = fastBtn("f-srch", "live-btn-srch", "Buscar"), liveFastAll._activate = function() {
                lvOpenCats()
            }, liveFastFav._activate = function() {
                lvToggleFav()
            }, liveFastSrch._activate = function() {
                lvOpenSearch()
            }, liveFastAll._onMove = fastMove(0), liveFastFav._onMove = fastMove(1), liveFastSrch._onMove = fastMove(2), lvSyncFav(), t.appendChild(fast), Ht(!1), Bt(), (ie = e("div", "live-focus focusable"))._onMove = function(e) {
                if ("up" === e) return j.channel > 0 && Vt(j.channel - 1), !0;
                if ("down" === e) return j.channel < F.length - 1 && Vt(j.channel + 1), !0;
                if ("right" === e) {
                    var t = Ue.filter(function(e) {
                        return e._channel === j.channel
                    })[0];
                    return t ? tt(t) : Ue.length ? tt(Ue[0]) : liveFastAll && tt(liveFastAll), !0
                }
                return "left" === e && (Re[0] && tt(Re[0]), !0)
            }, ie._activate = function() {
                dr("live")
            }, t.appendChild(ie)
        }, function(e) {
            var t = Yt("destacado"),
                i = t.slice(0, 9),
                a = !(!i[0] || !i[0]._portal);
            Kt(e, i, {
                titles: a,
                dots: a ? 4 : 0,
                shade: a
            });
            var n = t.slice(9);
            n.length && Zt(e, n, 860, "Títulos destacados")
        }, function(e) {
            var t = Yt("pelicula"),
                i = t.slice(0, 9),
                a = !(!i[0] || !i[0]._portal);
            Kt(e, i, {
                titles: a,
                dots: a ? 4 : 0,
                shade: a
            });
            var n = t.slice(9);
            n.length && Zt(e, n, 860, "Más películas")
        }, function(e) {
            var t = Yt("serie"),
                i = t.slice(0, 9),
                a = !(!i[0] || !i[0]._portal);
            Kt(e, i, {
                titles: a,
                dots: a ? 3 : 2,
                shade: a
            });
            var n = t.slice(9);
            n.length && Zt(e, n, 860, "Más series")
        }, function(t) {
            var i = I("infantil", 12, 0);
            i.length || (i = l);
            var n = !(!i[0] || !i[0]._portal);
            Kt(t, i.slice(0, 9), {
                titles: n,
                shade: n
            });
            var rest = i.slice(9);
            rest.length && Zt(t, rest, 860, "Más para niños")
        }, function(e) {
            var t = Yt("anime"),
                i = t.slice(0, 9),
                a = !(!i[0] || !i[0]._portal);
            Kt(e, i, {
                titles: a,
                dots: a ? 3 : 2,
                shade: a
            });
            var n = t.slice(9);
            n.length && Zt(e, n, 860, "Anime y animación")
        }, function(t) {
            var i = l.length ? l : [];
            Kt(t, i.slice(0, 9), {
                titles: false,
                shade: true
            });
            for (var explore = [{
                    key: "pelicula",
                    label: "Películas"
                }, {
                    key: "serie",
                    label: "Series"
                }, {
                    key: "anime",
                    label: "Anime y animación"
                }, {
                    key: "infantil",
                    label: "Infantil"
                }, {
                    key: "gratis",
                    label: "Gratis"
                }], exploreY = 811.5, exploreIndex = 0; exploreIndex < explore.length; exploreIndex++) {
                var categoryItems = Yt(explore[exploreIndex].key).slice(0, 6);
                categoryItems.length && (Zt(t, categoryItems, exploreY, explore[exploreIndex].label), exploreY += 490)
            }
        }],
        pt = {};

    function ut(e) {
        !pt[e] && Ne[e] && ct[e] && (pt[e] = !0, ct[e](Ne[e]))
    }

    function vt() {
        Pe = !0, Y = t("home-pages"), Z = t("home-notify"), i(Y), Ne = [], pt = {};
        for (var a = 0; a < ct.length; a++) {
            var n = e("div", "home-page scrollable");
            0 === a && n.classList.add("is-current"), Y.appendChild(n), Ne.push(n)
        }
        ut(H[j.tab] && H[j.tab].page >= 0 ? H[j.tab].page : 0),
            function() {
                var a = t("home-tabs");
                i(a), a.classList.add("scrollable"), a.classList.add("is-expanded"), Re = [];
                for (var n = 0; n < H.length; n++) {
                    var r = e("div", "tab-item focusable");
                    r.appendChild(e("div", "tab-pill"));
                    var o = e("div", "tab-icon");
                    o.innerHTML = B[H[n].icon] || "", r.appendChild(o);
                    var s = e("div", "tab-title", H[n].label);
                    r.appendChild(s), r._tab = n, r._activate = function(e) {
                        return function() {
                            if (ht(e, !1), 0 === e) {
                                var t = Ue.filter(function(e) {
                                    return e._channel === j.channel
                                })[0];
                                t ? tt(t) : Ue.length ? tt(Ue[0]) : ie && tt(ie)
                            } else if (H[e].page >= 0) focusHomeTab(e)
                        }
                    }(n), r._onMove = function(e) {
                        return function(t) {
                            if ("up" === t) return e > 0 && Re[e - 1] && (tt(Re[e - 1]), ht(e - 1, !1)), !0;
                            if ("down" === t) return e < Re.length - 1 && Re[e + 1] && (tt(Re[e + 1]), ht(e + 1, !1)), !0;
                            if ("left" === t) return !0;
                            if ("right" === t) {
                                if (ht(e, !1), 0 === e) {
                                    var i = Ue.filter(function(e) {
                                        return e._channel === j.channel
                                    })[0];
                                    i ? tt(i) : Ue.length ? tt(Ue[0]) : ie && tt(ie)
                                } else if (H[e].page >= 0) focusHomeTab(e)
                                return !0
                            }
                            return !1
                        }
                    }(n), a.appendChild(r), Re.push(r)
                }
            }(),
            function() {
                i(Z);
                for (var t = [{
                        cls: "search",
                        icon: "assets/original/home/icon_notify_search.png",
                        small: !0
                    }, {
                        cls: "filter",
                        icon: "assets/original/search/icon_category_filter_n.png",
                        small: !0
                    }, {
                        cls: "personal",
                        icon: "assets/original/home/icon_notify_personal.png",
                        small: !0
                    }], a = 0; a < t.length; a++) {
                    var n = t[a],
                        r = e("div", "notify-item focusable " + n.cls + (n.small ? " is-small" : "")),
                        o = e("div", "n-normal");
                    o.style.backgroundImage = "url(" + n.icon + ")", r.appendChild(o), "personal" === n.cls ? r._activate = function() {
                        yi()
                    } : "search" === n.cls ? r._activate = function() {
                        li()
                    } : "filter" === n.cls ? r._activate = function() {
                        openFilter()
                    } : r._activate = function() {}, Z.appendChild(r)
                }
                var s = e("div", "notify-divider");
                Z.appendChild(s);
                var l = e("div", "notify-wifi");
                l.innerHTML = '<svg viewBox="0 0 30 22"><path d="M15 19.5a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2z" fill="currentColor"/><path d="M8.4 12.2a9.6 9.6 0 0 1 13.2 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M4.2 7.6a15.6 15.6 0 0 1 21.6 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>', Z.appendChild(l);
                var d = e("div", "notify-time");
                d.id = "notify-time", Z.appendChild(d), ft(), setInterval(ft, 3e4)
            }()
    }

    function ft() {
        var e = t("notify-time");
        if (e) {
            var i = new Date,
                a = i.getHours(),
                n = a >= 12 ? "PM" : "AM";
            0 === (a %= 12) && (a = 12);
            var o = i.getMinutes();
            e.textContent = a + ":" + r(o) + " " + n
        }
    }

    function ht(e, t) {
        var i = H[e];
        window.TUTYTV_WEB && "player" !== j.screen && "detail" !== j.screen && stopWebMedia();
        if (i.page < 0) yi();
        else {
            var a = H[j.tab] ? H[j.tab].page : i.page;
            j.tab = e;
            for (var n = 0; n < Re.length; n++) Re[n].classList.toggle("is-selected", n === e);
            i.page >= 0 && ut(i.page), 0 === i.page ? Rt(F[j.channel]) : Nt();
            for (var r = 0; r < Ne.length; r++) Ne[r].classList.remove("is-entering", "from-left", "from-right"), Ne[r].classList.toggle("is-current", r === i.page);
            if (i.page !== a && Ne[i.page]) {
                var o = Ne[i.page];
                o.classList.add("is-entering", i.page > a ? "from-right" : "from-left"), setTimeout(function() {
                    o.classList.remove("is-entering", "from-left", "from-right")
                }, 320)
            }
            if (t)
                if (0 === i.page) {
                    var s = Ue.filter(function(e) {
                        return e._channel === j.channel
                    })[0];
                    s ? tt(s) : Ue.length ? tt(Ue[0]) : ie && tt(ie)
                } else focusHomeTab(e); mt()
        }
    }
    var gt = null;

    function mt() {
        gt && clearTimeout(gt), gt = setTimeout(function() {
            gt = null,
                function() {
                    for (var e = document.querySelectorAll("img[data-poster-src]"), t = window.innerWidth || 1920, i = window.innerHeight || 1080, a = 0; a < e.length; a++) {
                        var r = e[a],
                            o = n(r, ".poster, .bento"),
                            s = o && o.getBoundingClientRect ? o.getBoundingClientRect() : null;
                        if (yt(r) && s && s.bottom > -420 && s.top < i + 420 && s.right > -320 && s.left < t + 320) r.getAttribute("src") || (r.style.display = "", r.src = r.getAttribute("data-poster-src"));
                        else if (r.getAttribute("src")) {
                            r.removeAttribute("src");
                            try {
                                r.src = ""
                            } catch (e) {}
                        }
                    }
                }()
        }, 80)
    }

    function yt(e) {
        if ("home" === j.screen) {
            var t = n(e, ".home-page");
            return !(!t || !t.classList.contains("is-current"))
        }
        if ("search" === j.screen) {
            var i = n(e, ".search-results");
            return !(!i || !i.classList.contains("is-active"))
        }
        if ("detail" === j.screen) {
            var a = n(e, "#screen-detail");
            return !(!a || !a.classList.contains("is-active"))
        }
        return !1
    }

    function bt(t, i, n, r, o, s) {
        var l = e("div", "poster focusable" + ((s = s || {}).gold ? " gold" : "") + (s.type3 ? " type3" : ""));
        if (a(l, i, n, r, o), t.poster) {
            var d = e("img", "p-img");
            d.setAttribute("data-poster-src", t.poster), d.onerror = function() {
                this.style.display = "none"
            }, l.appendChild(d)
        }
        return s.gold || (l.appendChild(e("div", "p-shade")), l.appendChild(e("div", "p-title", t.title))), l._item = t, l._activate = function() {
            ei(t)
        }, mt(), l
    }
    var Ct = [{
        id: "es_tdt",
        name: "España - Canales Nacionales y TDT",
        url: "https://iptv-org.github.io/iptv/countries/es.m3u",
        desc: "320+ canales: La 1, La 2, Antena 3, Telecinco, laSexta, autonómicas"
    }, {
        id: "latam_spa",
        name: "Latinoamérica y Deportes (Hispano)",
        url: "https://iptv-org.github.io/iptv/languages/spa.m3u",
        desc: "Canales en español de Colombia, México, Argentina, Chile y Perú"
    }, {
        id: "sports_iptv",
        name: "Deportes Internacionales",
        url: "https://iptv-org.github.io/iptv/categories/sports.m3u",
        desc: "Transmisiones deportivas y canales de competiciones"
    }, {
        id: "movies_iptv",
        name: "Cine y Series 24/7",
        url: "https://iptv-org.github.io/iptv/categories/movies.m3u",
        desc: "Cine clásico, cine de acción y canales continuos de series"
    }];

    function wt() {
        var e = G("xuper_m3u_addons", null),
            result = legacySelectInitialAddons(e, Ct);
        return result.persist && J("xuper_m3u_addons", result.addons), result.addons
    }

    function xt(e) {
        J("xuper_m3u_addons", e || [])
    }
    var St = [],
        _t = null,
        Lt = !1,
        kt = !1,
        Mt = !1,
        It = 0,
        Tt = null,
        Et = null,
        qt = null,
        Ot = 0,
        Dt = null,
        At = "",
        Pt = !1;

    function Nt() {
        if (Ot++, At = "", Dt && (clearTimeout(Dt), Dt = null), te && te.classList.remove("is-preview-playing", "is-preview-loading"), qt && (qt.textContent = ""), Et) {
            legacyDestroyHls("__tutyPreviewHls");
            try {
                legacyPauseVideo(Et)
            } catch (e) {}
            Et.removeAttribute("src");
            try {
                legacySetVideoSource(Et, ""), legacyLoadVideo(Et)
            } catch (e) {}
        }
    }

    function Rt(e) {
        Dt && clearTimeout(Dt), Dt = setTimeout(function() {
            Dt = null,
                function(e) {
                    if (Et && e && (e.channelCode || e.streamUrl) && "home" === j.screen && 0 === j.tab) {
                        var t = e.channelCode || e.streamUrl;
                        if (t !== At || !te || !te.classList.contains("is-preview-loading") && !te.classList.contains("is-preview-playing")) {
                            Nt(), At = t;
                            var i = ++Ot;
                            te.classList.add("is-preview-loading"), qt && (qt.textContent = "Cargando " + (e.name || "canal") + "…"), q("resolveLive", e.streamUrl ? {
                                streamUrl: e.streamUrl
                            } : {
                                channelCode: e.channelCode
                            }, function(e, t) {
                                if (i === Ot && "home" === j.screen && 0 === j.tab) {
                                    var a = !e && t && !1 !== t.returnValue && (t.proxyPath || t.url),
                                        previewHls = !!(!e && t && (t.isHls || /\.m3u8(?:\?|$)/i.test(a || "")));
                                    if (!a) return te.classList.remove("is-preview-loading"), void(qt && (qt.textContent = ""));
                                    Et.onloadeddata = function() {
                                        i === Ot && (te.classList.remove("is-preview-loading"), te.classList.add("is-preview-playing"), qt && (qt.textContent = ""))
                                    }, Et.onerror = function() {
                                        i === Ot && (te.classList.remove("is-preview-loading", "is-preview-playing"), qt && (qt.textContent = ""))
                                    };
                                    var useHlsPreview = previewHls && !legacyNativeTvPlayback() && window.Hls && window.Hls.isSupported() && !legacyNativePreviewHls(Et);
                                    if (useHlsPreview) {
                                        legacyDestroyHls("__tutyPreviewHls");
                                        var phls = new window.Hls({
                                            enableWorker: !0,
                                            backBufferLength: 10
                                        });
                                        window.__tutyPreviewHls = phls, phls.on(window.Hls.Events.MANIFEST_PARSED, function() {
                                            if (i === Ot) try {
                                                var e = legacyPlayVideo(Et);
                                                e && e.catch && e.catch(function() {})
                                            } catch (e) {}
                                        }), phls.on(window.Hls.Events.ERROR, function(e, t) {
                                            t && t.fatal && i === Ot && (te.classList.remove("is-preview-loading", "is-preview-playing"), qt && (qt.textContent = ""))
                                        }), legacyLoadHls(Et, phls, a)
                                    } else try {
                                        legacySetVideoSource(Et, a), legacyLoadVideo(Et);
                                        var n = legacyPlayVideo(Et);
                                        n && n.catch && n.catch(function() {})
                                    } catch (e) {
                                        te.classList.remove("is-preview-loading")
                                    }
                                }
                            })
                        }
                    }
                }(e || F[j.channel])
        }, 220)
    }

    function Ut(e, t, complete) {
        e && (_t = e, qn(), e.isAddon ? Ft(function() {
            t && t(), complete && complete()
        }) : Bt(e.id, function() {
            t && t()
        }, complete))
    }

    /* Local live favourites survive category changes and app restarts.  Portal
       channels expose channelCode, addon channels only a name, so key on both. */
    function liveFavKey(e) {
        var _core = window.TutyCore;
        if (_core && _core.liveFavKey) return _core.liveFavKey(e);
        return "live:" + (e && (e.channelCode || e.id || e.name) || "")
    }

    function liveIsFav(e) {
        var _core = window.TutyCore;
        if (_core && _core.isLiveFavorite) return _core.isLiveFavorite(e, j.favs);
        return !!(e && (e.fav || j.favs && j.favs[liveFavKey(e)]))
    }

    function liveToggleFav(e) {
        if (!e) return !1;
        var _core = window.TutyCore;
        if (_core && _core.toggleLiveFavorite) {
            var _result = _core.toggleLiveFavorite(e, j.favs);
            return j.favs = _result.favorites, X.favs = j.favs, J(W, X), e.fav = _result.favorite, _result.favorite
        }
        var t = liveFavKey(e),
            i = !j.favs[t];
        return i ? j.favs[t] = !0 : delete j.favs[t], X.favs = j.favs, J(W, X), e.fav = i, i
    }

    function legacyFilterLiveChannels(channels, favoritesOnly, isFavorite) {
        var _core = window.TutyCore;
        if (_core && _core.filterLiveChannels) return _core.filterLiveChannels(channels, favoritesOnly, isFavorite);
        for (var result = [], index = 0; index < channels.length; index++) !favoritesOnly || isFavorite(channels[index]) ? result.push({
            channel: channels[index],
            index: index
        }) : 0;
        return result
    }

    function legacyFindLiveSearchMatches(channels, categories, query) {
        var _core = window.TutyCore;
        if (_core && _core.findLiveSearchMatches) return _core.findLiveSearchMatches(channels, categories, query);
        var needle = o(query),
            channelMatches = [],
            categoryMatches = [],
            index = 0;
        for (index = 0; index < categories.length && categoryMatches.length < 8; index++)(!needle || o(categories[index].name || "").indexOf(needle) >= 0) && categoryMatches.push(categories[index]);
        for (index = 0; index < channels.length && channelMatches.length < 250; index++) {
            var channel = channels[index];
            channel && (!needle || o(channel.name || "").indexOf(needle) >= 0) && channelMatches.push({
                channel: channel,
                index: index
            })
        }
        return {
            channels: channelMatches,
            categories: categoryMatches
        }
    }

    function legacySelectInitialAddons(stored, presets) {
        var _core = window.TutyCore;
        if (_core && typeof _core.selectInitialAddons === "function") return _core.selectInitialAddons(stored, presets);
        return Array.isArray(stored) && stored.length ? {
            addons: stored,
            persist: !1
        } : {
            addons: presets.length ? [presets[0]] : [],
            persist: !0
        }
    }

    function legacyPrepareAddonChannels(channels, isFavorite) {
        var _core = window.TutyCore;
        if (_core && typeof _core.prepareAddonChannels === "function") return _core.prepareAddonChannels(channels, isFavorite);
        for (var prepared = [], index = 0; index < channels.length; index++) {
            var channel = channels[index],
                copy = {};
            for (var key in channel) copy[key] = channel[key];
            copy.index = index + 1, copy.fav = isFavorite(channel), prepared.push(copy)
        }
        return prepared
    }

    function legacyClampLiveChannelIndex(index, length) {
        var _core = window.TutyCore;
        if (_core && typeof _core.clampLiveChannelIndex === "function") return _core.clampLiveChannelIndex(index, length);
        return index < 0 && (index = 0), index > length - 1 && (index = length - 1), index
    }

    function legacySelectNewLiveChannels(current, incoming) {
        var _core = window.TutyCore;
        if (_core && _core.selectNewLiveChannels) return _core.selectNewLiveChannels(current, incoming);
        for (var seen = {}, result = [], index = 0; index < current.length; index++) current[index] && current[index].channelCode && (seen[current[index].channelCode] = !0);
        for (index = 0; index < incoming.length; index++) {
            var channel = incoming[index];
            if (!channel) continue;
            if (channel.channelCode && seen[channel.channelCode]) continue;
            channel.channelCode && (seen[channel.channelCode] = !0), result.push(channel)
        }
        return result
    }

    function legacyNormalizeLiveCategories(categories) {
        var _core = window.TutyCore;
        if (_core && _core.normalizeLiveCategories) return _core.normalizeLiveCategories(categories);
        var result = [];
        if (categories && categories.length)
            for (var index = 0; index < categories.length; index++) {
                var category = categories[index],
                    name = category.name;
                "ChannelList" !== name && 76182 !== category.id || (name = "Todos"), result.push({
                    id: category.id,
                    name: name,
                    code: category.code,
                    isAddon: !1
                })
            }
        else result = [{
            id: 76182,
            name: "Todos",
            isAddon: !1
        }, {
            id: 76206,
            name: "Deportes",
            isAddon: !1
        }, {
            id: 76205,
            name: "Cine y Series",
            isAddon: !1
        }, {
            id: 76188,
            name: "Colombia",
            isAddon: !1
        }, {
            id: 76191,
            name: "España",
            isAddon: !1
        }, {
            id: 76197,
            name: "México",
            isAddon: !1
        }];
        return result.push({
            id: "addons",
            name: "➕ Addons M3U",
            isAddon: !0
        }), result
    }

    function legacyIsAddonUrl(value) {
        var _core = window.TutyCore;
        if (_core && _core.isM3uAddonUrl) return _core.isM3uAddonUrl(value);
        return /^https?:\/\//i.test(String(value).trim())
    }

    function legacyUpsertM3uAddon(addons, entry, count) {
        var _core = window.TutyCore;
        if (_core && _core.upsertM3uAddon) return _core.upsertM3uAddon(addons, entry, count);
        for (var next = addons.slice(), index = 0; index < next.length; index++)
            if (next[index].url === entry.url) {
                var updated = {};
                for (var key in next[index]) updated[key] = next[index][key];
                return updated.count = count, next[index] = updated, next
            }
        return next.push({
            id: entry.id || "addon_" + Date.now(),
            name: entry.name || "Lista M3U",
            url: entry.url,
            count: count
        }), next
    }

    function legacyFormatLiveCategoryLabel(categoryName, favoritesOnly, count) {
        var _core = window.TutyCore;
        if (_core && _core.formatLiveCategoryLabel) return _core.formatLiveCategoryLabel(categoryName, favoritesOnly, count);
        var unit = 1 === count ? " canal" : " canales";
        return "TV en vivo · " + (favoritesOnly ? "Favoritos" : String(categoryName || "Todos")) + (count ? " · " + count + unit : "")
    }

    function legacyLiveListScrollTop(rowIndex, scrollTop, scrollHeight, clientHeight) {
        var _core = window.TutyCore;
        if (_core && _core.liveListScrollTop) return _core.liveListScrollTop(rowIndex, scrollTop, scrollHeight, clientHeight);
        var rowTop = 120 * rowIndex,
            next = scrollTop;
        rowTop < next && (next = rowTop), rowTop + 100.5 > next + clientHeight && (next = rowTop + 100.5 - clientHeight);
        return Math.max(0, Math.min(Math.max(0, scrollHeight - clientHeight), next))
    }

    function legacyHasAddonUrl(addons, url) {
        var _core = window.TutyCore;
        if (_core && _core.hasAddonUrl) return _core.hasAddonUrl(addons, url);
        for (var index = 0; index < addons.length; index++)
            if (addons[index].url === url) return !0;
        return !1
    }

    function legacyRemoveAddonAt(addons, index) {
        var _core = window.TutyCore;
        if (_core && _core.removeAddonAt) return _core.removeAddonAt(addons, index);
        var next = addons.slice();
        return next.splice(index, 1), next
    }

    function Ft(e) {
        var t = wt();
        if (!t || !t.length) return F.splice(0, F.length), Ht(!1), Rn(), void(e && e());
        nr("Cargando canales de Addon…");
        for (var i = [], a = t.length, n = 0; n < t.length; n++)(function(t) {
            q("fetchM3u", {
                url: t.url
            }, function(t, n) {
                if (n && n.channels && n.channels.length)
                    for (var r = 0; r < n.channels.length; r++) i.push(n.channels[r]);
                if (--a <= 0) {
                    var ready = legacyPrepareAddonChannels(i, liveIsFav);
                    nr(""), F.splice(0, F.length);
                    for (var o = 0; o < ready.length; o++) F.push(ready[o]);
                    j.channel = 0, Ht(!1), Rn(), F[0] && ee && (ee.textContent = F[0].name), "player" === j.screen && "live" === j.playerMode && (vr(), ur(F[0], !0)), e && e()
                }
            })
        })(t[n])
    }

    function Bt(e, t, complete) {
        var i = e || 76182;
        if (!Mt || Tt !== i) {
            var a = ++It;
            Tt = i, Mt = !0, kt = !1, F.splice(0, F.length), j.channel = 0, Ht(!1), Rn();
            var n = 1,
                r = !1;
            ! function e() {
                q("liveChannels", {
                    columnId: i,
                    pageNum: n,
                    pageSize: 20
                }, function(o, s) {
                    if (a === It) {
                        var l = s && s.channels ? s.channels : [];
                        if (!o && l.length) {
                            for (var d = legacySelectNewLiveChannels(F, l), p = 0; p < d.length; p++) {
                                var u = d[p];
                                u.fav = liveIsFav(u), F.push(u)
                            }
                            kt = !0, Ht(!1), Rn(), j.channel >= F.length && (j.channel = 0), F[j.channel] && ee && (ee.textContent = F[j.channel].name), "player" === j.screen && "live" === j.playerMode ? vr() : Rt(F[j.channel])
                        }
                        if (r || (r = !0, Lt || function(e) {
                                Lt && St.length ? e && e(null, St) : q("liveCategories", {}, function(t, i) {
                                    var a = legacyNormalizeLiveCategories(i && i.categories);
                                    St = a, Lt = !0, _t || (_t = St[0]), qn(), liveUpdateLabel(), e && e(null, St)
                                })
                            }(), t && t(o, s)), !o && s && s.hasMore && l.length) return n++, void setTimeout(e, 25);
                        Mt = !1, !o && complete && complete(), o && !kt && setTimeout(function() {
                            a === It && Bt(i, null, complete)
                        }, 2500)
                    }
                })
            }()
        }
    }

    function Ht(t) {
        if (ae) {
            /* Pagination rebuilds the whole list.  Keep the focused row (and its
               channel) so multi-page categories do not steal focus mid-load. */
            var keepRow = j.focus && j.focus._channel !== void 0 && j.focus.parentNode === ae,
                keepChannel = keepRow ? j.focus._channel : -1;
            i(ae), Ue = [];
            var favOnly = !!t || liveFavFilter,
                visibleChannels = legacyFilterLiveChannels(F, favOnly, liveIsFav);
            if (F.length) {
                for (var v = 0; v < visibleChannels.length; v++) {
                    var a = visibleChannels[v].index,
                        channel = visibleChannels[v].channel,
                        n = e("div", "live-row focusable");
                    n._channel = a;
                    var r = e("div", "row-icon");
                    channel.logo && (r.style.backgroundImage = "url(" + channel.logo + ")", r.style.backgroundSize = "contain", r.style.backgroundRepeat = "no-repeat", r.style.backgroundPosition = "center");
                    var o = e("div", "row-play"),
                        s = e("div", "row-name", channel.name),
                        rowIndex = Ue.length,
                        favBtn = e("div", "live-row-fav focusable" + (liveIsFav(channel) ? " is-fav" : ""), "♥");
                    favBtn._channel = a, n._favBtn = favBtn, favBtn._activate = function(channel, heart, index) {
                        return function() {
                            liveToggleFav(channel);
                            var favorite = liveIsFav(channel);
                            if (heart.classList.toggle("is-fav", favorite), liveFavFilter && !favorite) {
                                Ht(!0);
                                for (var next = null, k = 0; k < Ue.length; k++)
                                    if (Ue[k]._channel >= index) {
                                        next = Ue[k];
                                        break
                                    }
                                next = next || Ue[0], next ? tt(next) : lvFocusList()
                            }
                        }
                    }(channel, favBtn, a), favBtn._onMove = function(row, index) {
                        return function(action) {
                            if ("left" === action) return tt(row), !0;
                            if ("up" === action || "down" === action) {
                                var target = Ue["up" === action ? index - 1 : index + 1];
                                return target && target._favBtn ? (tt(target._favBtn), !0) : !0
                            }
                            return !0
                        }
                    }(n, rowIndex), n.appendChild(r), n.appendChild(o), n.appendChild(s), n.appendChild(favBtn), a === j.channel && n.classList.add("is-current"), n._activate = function(e) {
                        return function() {
                            Vt(e, !0), dr("live")
                        }
                    }(a), n._onMove = function(e, row) {
                        return function(t) {
                            if ("left" === t) return ie ? tt(ie) : Re[0] && tt(Re[0]), !0;
                            if ("right" === t) return row._favBtn ? (tt(row._favBtn), !0) : !1;
                            if ("up" === t) return e > 0 && Ue[e - 1] ? (tt(Ue[e - 1]), !0) : liveFastAll ? (tt(liveFastAll), !0) : !1;
                            if ("down" === t) return e < Ue.length - 1 && Ue[e + 1] ? (tt(Ue[e + 1]), !0) : !1;
                            return !1
                        }
                    }(rowIndex, n), ae.appendChild(n), Ue.push(n)
                }
                !Ue.length && favOnly && ae.appendChild(e("div", "live-list-status", "No tienes canales favoritos en esta categoría")), F[j.channel] && ee && (ee.textContent = F[j.channel].name), zt()
            } else ae.appendChild(e("div", "live-list-status", kt ? favOnly ? "No tienes canales favoritos" : "No se encontraron canales" : "Cargando canales…"));
            if (keepRow && Ue.length)
                for (var k = 0; k < Ue.length; k++)
                    if (Ue[k]._channel === keepChannel) {
                        tt(Ue[k]);
                        break
                    }
            liveUpdateLabel()
        }
    }

    function zt() {
        if (Ue.length) {
            var e = Ue.filter(function(e) {
                return e._channel === j.channel
            })[0];
            if (e) ae.scrollTop = legacyLiveListScrollTop(Ue.indexOf(e), ae.scrollTop, ae.scrollHeight, ae.clientHeight)
        }
    }

    function Vt(e, t) {
        e = legacyClampLiveChannelIndex(e, F.length), j.channel = e;
        for (var i = 0; i < Ue.length; i++) Ue[i].classList.toggle("is-current", Ue[i]._channel === e);
        F[e] && ee && (ee.textContent = F[e].name), zt(), "player" === j.screen ? (! function() {
            if (!ye) return;
            vr()
        }(), "live" === j.playerMode && ur(F[e], !!t)) : "home" === j.screen && 0 === j.tab && Rt(F[e])
    }

    /* =========================================================================
       LIVE TV MENU (home TV tab): categories + search + favourites.
       The portal exposes 38 live columns; the home page only had the
       prev/next zap and the channel list, so this adds the missing menu.
       ========================================================================= */
    var liveFastAll = null,
        liveFastFav = null,
        liveFastSrch = null,
        liveKbEdit = null,
        liveSearchBuilt = !1,
        liveSearchQuery = "",
        liveSearchReturn = null,
        liveCatReturn = null,
        liveFavFilter = !1;

    function liveCatName() {
        return _t && _t.name ? _t.name : "Todos"
    }

    function liveUpdateLabel() {
        var e = t("live-cat-label");
        if (!e) return;
        var i = liveCatName(),
            a = liveFavFilter ? Ue.length : F.length;
        e.textContent = legacyFormatLiveCategoryLabel(i, liveFavFilter, a)
    }

    function lvSyncFav() {
        liveFastFav && liveFastFav.classList.toggle("is-active", liveFavFilter)
    }

    function lvFocusList() {
        for (var e = null, i = 0; i < Ue.length; i++)
            if (Ue[i]._channel === j.channel) {
                e = Ue[i];
                break
            }
        if (!e && Ue.length && (e = Ue[0]), e && Ye(e)) return void tt(e);
        liveFastAll && Ye(liveFastAll) ? tt(liveFastAll) : ie && Ye(ie) && tt(ie)
    }

    function lvBuildCats() {
        var grid = t("live-cat-grid");
        if (!grid) return;
        i(grid);
        var sub = t("live-cat-sub"),
            cats = St && St.length ? St : [{
                id: 76182,
                name: "Todos"
            }, {
                id: 76206,
                name: "Deportes"
            }, {
                id: 76205,
                name: "Cine y Series"
            }, {
                id: 76188,
                name: "Colombia"
            }, {
                id: 76191,
                name: "España"
            }, {
                id: 76197,
                name: "México"
            }],
            close = t("live-cat-close");
        if (sub) sub.textContent = cats.length + " categorías disponibles · elige una para cargar sus canales";
        if (close) close._activate = function() {
            lvCloseCats()
        };
        var fav = e("div", "pcat-tile focusable");
        fav.appendChild(e("div", "pcat-name", "❤ Favoritos"));
        fav._special = "fav";
        liveFavFilter && fav.classList.add("is-selected");
        fav._activate = function() {
            liveFavFilter = !0, lvSyncFav(), lvCloseCats(!0), Ht(!0), liveUpdateLabel(), lvFocusList()
        };
        grid.appendChild(fav);
        var search = e("div", "pcat-tile focusable");
        search.appendChild(e("div", "pcat-name", "🔍 Buscar canal o categoría"));
        search._special = "search";
        search._activate = function() {
            lvCloseCats(!0), lvOpenSearch()
        };
        grid.appendChild(search);
        for (var k = 0; k < cats.length; k++)(function(cat) {
            var tile = e("div", "pcat-tile focusable");
            tile.appendChild(e("div", "pcat-name", cat.name));
            _t && _t.id === cat.id && tile.classList.add("is-selected");
            tile._liveCat = cat;
            tile._activate = function() {
                liveFavFilter = !1, lvSyncFav(), lvCloseCats(!0), ie && tt(ie), Ut(cat, function() {
                    liveUpdateLabel(), lvFocusList()
                })
            };
            grid.appendChild(tile)
        })(cats[k])
    }

    function lvOpenCats() {
        j.liveSearchOpen && lvCloseSearch(!0), j.liveCategoriesOpen = !0, j.liveCatReturn = j.focus;
        var e = t("live-categories");
        if (e) {
            lvBuildCats(), e.classList.add("is-active");
            var i = e.querySelector(".pcat-tile.is-selected") || e.querySelector(".pcat-tile") || it(e);
            i && tt(i)
        }
    }

    function lvCloseCats(e) {
        j.liveCategoriesOpen = !1;
        var i = t("live-categories");
        i && i.classList.remove("is-active");
        if (!e) {
            var a = j.liveCatReturn;
            a && Ye(a) ? tt(a) : lvFocusList()
        }
    }

    function lvToggleFav() {
        liveFavFilter = !liveFavFilter, lvSyncFav(), Ht(liveFavFilter), liveUpdateLabel(), liveFavFilter && !Ue.length ? liveFastFav && tt(liveFastFav) : lvFocusList()
    }

    function lvUpdateQuery() {
        liveKbEdit && (liveSearchQuery ? (liveKbEdit.textContent = liveSearchQuery, liveKbEdit.classList.remove("is-placeholder")) : (liveKbEdit.textContent = "Buscar canal o categoría…", liveKbEdit.classList.add("is-placeholder")))
    }

    function lvRenderResults() {
        var list = t("live-search-list");
        if (list) {
            i(list);
            var sub = t("live-search-sub"),
                q = o(liveSearchQuery),
                cats = St && St.length ? St : [],
                search = legacyFindLiveSearchMatches(F, cats, liveSearchQuery),
                catMatches = search.categories,
                matches = search.channels;
            if (sub) sub.textContent = q ? matches.length + (1 === matches.length ? " canal" : " canales") + " · " + catMatches.length + (1 === catMatches.length ? " categoría" : " categorías") : "Escribe para filtrar los " + F.length + " canales de " + liveCatName() + " o busca otra categoría";
            for (var c = 0; c < catMatches.length; c++)(function(cat) {
                var row = e("div", "live-sr-row live-sr-cat focusable");
                row.appendChild(e("div", "live-sr-icon live-sr-icon-cat", "TV"));
                row.appendChild(e("div", "live-sr-name", "Categoría: " + cat.name));
                row.appendChild(e("div", "live-sr-badge", "CATEGORÍA"));
                row._activate = function() {
                    liveFavFilter = !1, lvSyncFav(), liveSearchQuery = "", lvUpdateQuery();
                    var focusResults = function() {
                        lvRenderResults(), liveUpdateLabel();
                        var list = t("live-search-list"),
                            first = list ? list.querySelector(".live-sr-row:not(.live-sr-cat)") || list.querySelector(".live-sr-row") : null;
                        first && tt(first)
                    };
                    _t && _t.id === cat.id ? (Ht(!1), focusResults()) : Ut(cat, focusResults, focusResults)
                };
                list.appendChild(row)
            })(catMatches[c]);
            for (var m = 0; m < matches.length; m++)(function(item) {
                var row = e("div", "live-sr-row focusable"),
                    icon = e("div", "live-sr-icon");
                item.channel.logo && (icon.style.backgroundImage = "url(" + item.channel.logo + ")", icon.style.backgroundSize = "contain", icon.style.backgroundRepeat = "no-repeat", icon.style.backgroundPosition = "center");
                row.appendChild(icon);
                row.appendChild(e("div", "live-sr-name", item.channel.name || "Canal"));
                row.appendChild(e("div", "live-sr-badge", "EN VIVO"));
                row._activate = function() {
                    lvCloseSearch(!0), Vt(item.index, !0), dr("live")
                };
                list.appendChild(row)
            })(matches[m]);
            catMatches.length || matches.length || list.appendChild(e("div", "live-sr-empty", q ? 'No hay canales que coincidan con "' + liveSearchQuery + '"' : "No hay canales en esta categoría"))
        }
    }

    function lvType(e) {
        liveSearchQuery.length < 40 && (liveSearchQuery += e, lvUpdateQuery(), lvRenderResults())
    }

    function lvBackspace() {
        liveSearchQuery = liveSearchQuery.slice(0, -1), lvUpdateQuery(), lvRenderResults()
    }

    function lvClear() {
        liveSearchQuery = "", lvUpdateQuery(), lvRenderResults()
    }

    function lvSearchGo() {
        var e = t("live-search-list"),
            i = e ? e.querySelector(".live-sr-row:not(.live-sr-cat)") || e.querySelector(".live-sr-row") : null;
        i && Ye(i) && tt(i)
    }

    function lvBuildKb() {
        var i = t("live-search-kb");
        if (i) {
            liveKbEdit = e("div", "kb-edit focusable"), liveKbEdit._activate = function() {}, i.appendChild(liveKbEdit);
            for (var a = e("div", "kb-actions"), n = [{
                    cls: "clear",
                    w: 100.5
                }, {
                    cls: "del",
                    w: 100.5
                }, {
                    cls: "go",
                    w: 120
                }], r = 0; r < n.length; r++) {
                var s = e("div", "kb-action focusable " + n[r].cls);
                s.style.width = n[r].w + "px", "go" === n[r].cls ? s.textContent = "Buscar" : s.appendChild(e("div", "ico")), s._activate = function(e) {
                    return function() {
                        "clear" === e ? lvClear() : "del" === e ? lvBackspace() : lvSearchGo()
                    }
                }(n[r].cls), a.appendChild(s)
            }
            i.appendChild(a);
            for (var l = [
                    ["A", "Á", "B", "C", "D", "E", "É"],
                    ["F", "G", "H", "I", "Í", "J", "K"],
                    ["L", "M", "N", "Ñ", "O", "Ó", "P"],
                    ["Q", "R", "S", "T", "U", "Ú", "Ü"],
                    ["V", "W", "X", "Y", "Z", " "],
                    ["1", "2", "3", "4", "5", "6", "7"],
                    ["8", "9", "0", "+", "-", "/", "."]
                ], d = 0; d < l.length; d++) {
                var c = e("div", "kb-row");
                c.style.top = 264 + 88.5 * d + "px";
                for (var p = 0; p < l[d].length; p++) {
                    var u = e("div", "kb-key focusable" + (" " === l[d][p] ? " space" : ""), " " === l[d][p] ? "" : l[d][p]);
                    u._char = l[d][p], u._activate = function(e) {
                        return function() {
                            lvType(e)
                        }
                    }(l[d][p]), c.appendChild(u)
                }
                i.appendChild(c)
            }
            var v = e("div", "kb-feedback focusable", "Cerrar búsqueda");
            v._activate = function() {
                lvCloseSearch()
            }, i.appendChild(v)
        }
    }

    function lvOpenSearch() {
        j.liveCategoriesOpen && lvCloseCats(!0), j.liveSearchOpen = !0, j.liveSearchReturn = j.focus;
        var e = t("live-search");
        if (e) {
            liveSearchBuilt || (lvBuildKb(), liveSearchBuilt = !0), liveSearchQuery = "", lvUpdateQuery(), lvRenderResults(), e.classList.add("is-active");
            var i = e.querySelector(".kb-key") || it(e);
            i && tt(i)
        }
    }

    function lvCloseSearch(e) {
        j.liveSearchOpen = !1;
        var i = t("live-search");
        if (i && i.classList.remove("is-active"), !e) {
            var a = j.liveSearchReturn;
            a && Ye(a) ? tt(a) : lvFocusList()
        }
    }

    function jt() {
        Pt = !0;
        var e = t("dialog-addons");
        if (e) {
            e.classList.add("is-active"), $t();
            var i = e.querySelector(".focusable");
            i && tt(i)
        }
    }

    function Wt() {
        Pt = !1;
        var e = t("dialog-addons");
        if (e && (e.classList.remove("is-active"), j.channelsOpen)) {
            var i = Ce ? Ce.querySelector("#pc-btn-addons") : null;
            tt(i || ye)
        }
    }

    function $t() {
        var a = t("da-presets-list"),
            n = t("da-installed-list"),
            r = wt();
        if (a) {
            i(a);
            for (var l = 0; l < Ct.length; l++)(function(t) {
                var i = e("div", "da-preset-item"),
                    n = e("div", "da-preset-info");
                n.appendChild(e("div", "da-preset-name", t.name)), n.appendChild(e("div", "da-preset-desc", t.desc)), i.appendChild(n);
                var installed = legacyHasAddonUrl(r, t.url),
                    s = e("button", "da-preset-btn focusable" + (installed ? " is-installed" : ""), installed ? "✔ Instalado" : "+ Instalar");
                s._activate = function() {
                    installed || (s.textContent = "Instalando…", Xt(t, function(e, t) {
                        e ? (s.textContent = "Error", setTimeout(function() {
                            s.textContent = "+ Instalar"
                        }, 2e3)) : ($t(), _t && _t.isAddon && Ft())
                    }))
                }, i.appendChild(s), a.appendChild(i)
            })(Ct[l])
        }
        if (n)
            if (i(n), r.length)
                for (var d = 0; d < r.length; d++)(function(t, i) {
                    var a = e("div", "da-installed-item"),
                        o = e("div", "da-installed-info"),
                        s = e("div", "da-preset-name", t.name),
                        l = e("div", "da-preset-desc", (t.count ? t.count + " canales • " : "") + t.url);
                    o.appendChild(s), o.appendChild(l), a.appendChild(o);
                    var d = e("button", "da-del-btn focusable", "Eliminar");
                    d._activate = function() {
                        r = legacyRemoveAddonAt(r, i), xt(r), $t(), _t && _t.isAddon && Ft()
                    }, a.appendChild(d), n.appendChild(a)
                })(r[d], d);
            else n.appendChild(e("div", "da-installed-empty", "No hay addons personalizados instalados aún. Instala una lista recomendada arriba o escribe una URL."));
        var c = t("da-btn-add-custom");
        c && (c._activate = function() {
            var e = t("da-custom-url"),
                i = e ? (e.value || "").trim() : "";
            i && legacyIsAddonUrl(i) ? (c.textContent = "Descargando…", Xt({
                id: "custom_" + Date.now(),
                name: "Lista Personalizada",
                url: i
            }, function(t, i) {
                c.textContent = "Agregar", t ? alert("No se pudo cargar la lista M3U: " + t) : (e && (e.value = ""), $t(), _t && _t.isAddon && Ft())
            })) : alert("Por favor introduce una URL válida (http:// o https://)")
        });
        var p = t("da-btn-exit");
        p && (p._activate = function() {
            Wt()
        })
    }

    function Xt(e, t) {
        q("fetchM3u", {
            url: e.url
        }, function(i, a) {
            if (!i && a && a.channels && a.channels.length) {
                xt(legacyUpsertM3uAddon(wt(), e, a.channels.length)), t && t(null, a.channels.length)
            } else t && t(i || "No se encontraron canales en la lista")
        })
    }
    var Gt = {
        bigW: 831,
        bigH: 534,
        bigY: 38.5,
        smallW: 413,
        smallH: 222,
        smallY: 578.5,
        bigX: [192, 1029],
        smallX: [192, 609, 1028, 1446]
    };

    function Jt(t, i, n, r, o, s) {
        s = s || {};
        var l = e("div", "bento focusable");
        a(l, i, n, r, o);
        var d = t ? t.landscape || t.poster : "";
        if (d) {
            var c = e("img", "bento-img");
            c.setAttribute("data-poster-src", d), c.onerror = function() {
                this.style.display = "none"
            }, l.appendChild(c)
        }
        return s.shade && l.appendChild(e("div", "bento-shade")), s.title && t && l.appendChild(e("div", "bento-title", t.title)), s.badge && l.appendChild(e("div", "bento-badge", s.badge)), l._item = t, t && (l._activate = function() {
            ei(t)
        }), mt(), l
    }

    function Qt(t, i, n, r) {
        var o = e("div", "bento-dots");
        a(o, t, i, 21 + 40 * Math.max(0, n - 1), 11);
        for (var s = 0; s < n; s++) o.appendChild(e("span", "bento-dot" + (s === r ? " is-active" : "")));
        return o
    }

    function Kt(pageEl, t, i) {
        i = i || {};
        var list = t.length ? t : l;
        if (!list.length) return;
        pageEl._bentoTimer && (clearInterval(pageEl._bentoTimer), pageEl._bentoTimer = null);
        var heroItems = list.slice(0, 4),
            heroIndex = 0,
            hero = Jt(heroItems[0], Gt.bigX[0], Gt.bigY, Gt.bigW, Gt.bigH, {
                shade: !1 !== i.shade,
                title: i.titles
            });
        pageEl.appendChild(hero);
        hero._activate = function() {
            ei(hero._item)
        }, hero._onMove = function(direction) {
            if ("left" === direction && Re[j.tab]) return tt(Re[j.tab]), !0;
            return !1
        };
        pageEl.appendChild(Jt(list[4] || list[0], Gt.bigX[1], Gt.bigY, Gt.bigW, Gt.bigH, {
            shade: !1 !== i.shade,
            title: i.titles
        }));
        for (var n = 0; n < 4; n++) pageEl.appendChild(Jt(list[5 + n] || list[(5 + n) % list.length], Gt.smallX[n], Gt.smallY, Gt.smallW, Gt.smallH, {}));
        if (heroItems.length > 1) pageEl._bentoTimer = setInterval(function() {
            if (!hero.parentNode || !pageEl.classList.contains("is-current") || "home" !== j.screen) return;
            heroIndex = (heroIndex + 1) % heroItems.length;
            var item = heroItems[heroIndex],
                previous = hero.querySelector(".bento-img"),
                source = item.landscape || item.poster || "",
                next = e("img", "bento-img");
            hero._item = item, next.setAttribute("data-poster-src", source), source ? next.src = source : next.style.display = "none", next.style.transition = "opacity .55s ease", next.style.opacity = "0", next.style.zIndex = "2", hero.appendChild(next), previous && (previous.style.transition = "opacity .55s ease", previous.style.zIndex = "1"), setTimeout(function() {
                next.style.opacity = "1", previous && (previous.style.opacity = "0")
            }, 20), setTimeout(function() {
                previous && previous.parentNode && previous.parentNode.removeChild(previous), next.style.opacity = "", next.style.transition = "", next.style.zIndex = ""
            }, 650);
            var title = hero.querySelector(".bento-title");
            title && setTimeout(function() {
                title.textContent = item.title || ""
            }, 260)
        }, 5e3)
    }

    function Yt(e) {
        return legacyFilterCatalogCategory(l, e)
    }

    function Zt(t, i, n, r) {
        if (i && i.length) {
            var o = n || 860,
                s = e("div", "kids-subtitle", r || "Catálogo");
            a(s, 192, o, 1249, 40), t.appendChild(s), o += 50;
            for (var l = Math.min(i.length, 60), d = 0; d < l; d++) {
                var c = 192 + 276 * (d % 6),
                    p = o + 390 * Math.floor(d / 6);
                t.appendChild(bt(i[d], c, p, 250, 360, {
                    gold: !0
                }))
            }
        }
    }

    function ei(e) {
        if (j.screen === "detail" && j.detail === e && (j.resumeOpen || e._detailPlaybackHandled)) {
            if (!j.resumeOpen) {
                var f = oe ? oe.querySelector(".focusable") : null;
                f && tt(f)
            }
            return
        }
        e._seriesId = e._seriesId || e.id;
        if (j.detail = e, j.detailReturn = {
                screen: j.screen,
                focus: j.focus
            }, j.detailRange = 0, j.detailSeason = 0, j.detailEpisode = null, j.playerEpisode = null, e.seasons && e.seasons.length)
            for (var i = 0; i < e.seasons.length; i++)
                if (e.seasons[i].id === e.id) {
                    j.detailSeason = i;
                    break
                } e.episodes && e.episodes.length && (j.detailEpisode = e.episodes[0]), qa(e), Xa(), Wa(e), Qa(e), ti(e), nt("detail"), ye || En();
        var a = t("screen-player");
        a && (a.classList.add("is-mini"), a.classList.add("is-active"));
        var n = oe ? oe.querySelector(".focusable") : null;
        e._detailPlaybackHandled = !1, n && tt(n), e._detailsLoaded ? startDetail(e) : (nr("Preparando la reproducción…"), U(e, function(e) {
            e && "detail" === j.screen && j.detail === e && (qa(e), startDetail(e))
        }))
    }

    function findHistory(e) {
        var _core = window.TutyCore;
        if (_core && _core.findHistoryEntry) return _core.findHistoryEntry(X.history, e);
        if (!e || !e.id) return null;
        for (var t = X.history || [], i = 0; i < t.length; i++)
            if (String(t[i].id) === String(e.id)) return t[i];
        return null
    }

    function episodeIdExists(item, id) {
        var _core = window.TutyCore;
        if (_core && _core.episodeIdExists) return _core.episodeIdExists(item, id);
        if (!item || !item.episodes || !id) return !1;
        for (var i = 0; i < item.episodes.length; i++)
            if (String(item.episodes[i].id) === String(id)) return !0;
        return !1
    }

    function askResume(item, episode, pos, dur, cb) {
        j.resumeOpen = !0, j.resumeReturn = j.focus, j.resumeOpenedAt = Date.now();
        var root = t("app"),
            dialog = t("dialog-resume");
        dialog || (dialog = document.createElement("div"), dialog.id = "dialog-resume", dialog.className = "resume-overlay", root.appendChild(dialog)), i(dialog), dialog.classList.add("is-active");
        var card = document.createElement("div");
        card.className = "resume-card";
        var poster = item.poster || item.landscape || item.backdrop || item.cover || "assets/original/common/bg_placehoder_vertical.png",
            posterBox = document.createElement("div");
        posterBox.className = "resume-poster";
        var img = document.createElement("img");
        img.src = poster, img.alt = "", posterBox.appendChild(img), posterBox.appendChild(e("div", "resume-poster-shade"));
        var body = document.createElement("div");
        body.className = "resume-body", body.appendChild(e("div", "resume-kicker", "CONTINUAR VIENDO")), body.appendChild(e("div", "resume-title", item.title || "Contenido"));
        var sub = episode && (episode.number || episode.seriesNumber) ? "Episodio " + (episode.number || episode.seriesNumber) : (item.type === "teleplay" || item.kind === "serie" ? "Serie" : "Película");
        body.appendChild(e("div", "resume-sub", sub));
        if (dur > 0) {
            var prog = document.createElement("div"),
                bar = document.createElement("div");
            prog.className = "resume-progress", bar.className = "resume-progress-bar", bar.style.width = Math.min(100, Math.max(0, pos / dur * 100)).toFixed(1) + "%", prog.appendChild(bar), body.appendChild(prog), body.appendChild(e("div", "resume-time", "Te quedaste en " + ki(pos)))
        }
        var actions = document.createElement("div");
        actions.className = "resume-actions";
        var cont = document.createElement("div");
        cont.className = "focusable resume-btn resume-continue", cont.appendChild(e("span", "resume-play")), cont.appendChild(document.createTextNode("Reanudar · " + ki(pos))), cont._activate = function() {
            Date.now() - j.resumeOpenedAt < 300 || (closeResume(), cb(!0))
        };
        var restart = e("div", "focusable resume-btn resume-restart", "Empezar desde el principio");
        restart._activate = function() {
            Date.now() - j.resumeOpenedAt < 300 || (closeResume(), cb(!1))
        }, actions.appendChild(cont), actions.appendChild(restart), body.appendChild(actions);
        var close = e("div", "focusable resume-close", "×");
        close._activate = function() {
            closeResume()
        }, card.appendChild(posterBox), card.appendChild(body), card.appendChild(close), dialog.appendChild(card), tt(cont)
    }

    function closeResume() {
        j.resumeOpen = !1;
        var dialog = t("dialog-resume");
        dialog && dialog.classList.remove("is-active");
        var back = j.resumeReturn;
        back && Ye(back) && tt(back), j.resumeReturn = null
    }

    function startDetail(item) {
        item._detailPlaybackHandled = !0;
        var hist = findHistory(item),
            plan = legacyResolveResumePlan(hist, j.detailEpisode, item && item.episodes ? item.episodes.length : 0, S(item), hist && hist.episodeId ? episodeIdExists(item, hist.episodeId) : !1),
            pos = plan.position,
            dur = plan.duration,
            isSeries = plan.isSeries,
            epLen = plan.episodeCount,
            mismatchReset = plan.mismatchReset;
        j.resumePosition = 0;
        window.TUTYTV_WEB && window.console && console.log("[TUTYTV] resume", item && item.id, "pos", hist && hist.position, "dur", dur, "series", isSeries, "eps", epLen, "histEp", hist && hist.episodeId, "curEp", j.detailEpisode && j.detailEpisode.id, "reset", mismatchReset, "show", plan.shouldPrompt);
        if (plan.shouldPrompt) {
            ar();
            try {
                askResume(item, j.detailEpisode, pos, dur, function(cont) {
                    j.resumePosition = cont ? pos : 0, sr(item, j.detailEpisode)
                })
            } catch (err) {
                window.TUTYTV_WEB && window.console && console.error("[TUTYTV] resume modal error", err), j.resumePosition = 0, sr(item, j.detailEpisode)
            }
            return
        }
        sr(item, j.detailEpisode)
    }

    function ti(n) {
        ne = t("detail-left"), re = t("detail-player"), oe = t("detail-buttons"), se = t("detail-bottom"), i(ne), i(oe), i(se);
        var r, o = e("div", "detail-titlewrap");
        if (o.appendChild(e("div", "detail-title", n.title)), o.appendChild(e("div", "detail-score", n.score)), ne.appendChild(o), n.country || n.releaseDate || n.tagline) {
            var s = [];
            n.country && s.push(n.country), n.releaseDate && s.push(n.releaseDate), n.tagline && s.push(n.tagline), r = s.join(" | ")
        } else {
            var d = [];
            n.year && "—" !== n.year && d.push(n.year), n.duration && "—" !== n.duration && d.push(n.duration), d.push("HD"), r = d.join("  ·  ")
        }
        if (ne.appendChild(e("div", "detail-meta", r)), S(n)) {
            var c = 0,
                p = /S(\d+)/i.exec(n.alias || "") || /T(\d+)/i.exec(n.title || "");
            if (p && (c = parseInt(p[1], 10) || 0), !c && n.seasons && n.seasons.length) {
                var u = n.seasons[j.detailSeason] || n.seasons[0];
                c = u && u.number || 1
            }
            c || (c = 1);
            var v = n.updateCount || n.volumeCount || (n.episodes ? n.episodes.length : 0);
            v && ne.appendChild(e("div", "detail-update", "T" + c + " - E" + v))
        }
        var f = e("div", "detail-genres");
        f.appendChild(e("span", "label", "Género : "));
        for (var h = 0; h < n.genres.length; h++) {
            var g = e("div", "chip", n.genres[h]);
            f.appendChild(g)
        }
        ne.appendChild(f);
        var m = e("div", "detail-row");
        m.appendChild(document.createTextNode("Director : "));
        var y = e("span", "val", n.director);
        m.appendChild(y), ne.appendChild(m);
        var b = e("div", "detail-row");
        b.appendChild(document.createTextNode("Actors : "));
        var C = e("span", "val", n.actors);
        b.appendChild(C), ne.appendChild(b);
        var w = e("div", "detail-synopsis");
        w.appendChild(e("span", "label", "Sinopsis : ")), w.appendChild(e("div", "text", n.synopsis));
        var x = e("div", "detail-more", "Más");
        w.appendChild(x), ne.appendChild(w), i(re), re.classList.add("focusable"), re._activate = function() {
            lr(n, j.detailEpisode)
        }, re._onMove = function() {
            return !1
        };
        var _ = [{
            icon: "icon_detail_fullscreen.png",
            label: "Pantalla completa",
            kind: "fullscreen"
        }, {
            icon: "icon_detail_subtitle_audio.png",
            label: "Idioma",
            kind: "language"
        }, {
            icon: "icon_detail_favorite.png",
            label: "Favorito",
            kind: "favorite"
        }];
        S(n) && _.push({
            icon: "icon_detail_subscribe.png",
            label: "Recordatorios",
            kind: "subscribe"
        });
        for (var L = 0; L < _.length; L++) {
            var k = e("div", "detail-btn focusable"),
                M = e("img");
            M.src = "assets/original/vod/" + _[L].icon, M.alt = "", k.appendChild(M), k.appendChild(e("span", null, _[L].label)), k._kind = _[L].kind, "favorite" === _[L].kind && j.favs[String(n.id)] ? (k.classList.add("is-selected"), k.querySelector("span").textContent = "En favoritos") : "subscribe" === _[L].kind && reminderOn(n) && (k.classList.add("is-selected"), k.querySelector("span").textContent = "En recordatorios", M.src = "assets/original/vod/icon_detail_subscribed.png"), k._activate = function(e, t) {
                return function() {
                    if ("fullscreen" === e) lr(t, j.detailEpisode);
                    else if ("language" === e) Sn(t);
                    else if ("favorite" === e) {
                        var i = K(t);
                        this.classList.toggle("is-selected", i);
                        var a = this.querySelector("span");
                        a && (a.textContent = i ? "En favoritos" : "Favorito")
                    } else if ("subscribe" === e) {
                        var img = this.querySelector("img"),
                            on = toggleReminder(t);
                        img && (img.src = "assets/original/vod/icon_detail_" + (on ? "subscribed" : "subscribe") + ".png"), this.classList.toggle("is-selected", on);
                        var lbl = this.querySelector("span");
                        lbl && (lbl.textContent = on ? "En recordatorios" : "Recordatorios"), toast(on ? "Recordatorio activado" : "Recordatorio eliminado")
                    }
                }
            }(_[L].kind, n), oe.appendChild(k)
        }
        var I = e("div", "detail-btn focusable"),
            T = e("img");
        T.src = "assets/original/vod/icon_detail_quality.png", T.alt = "", I.appendChild(T);
        var E = e("span", null, "smooth" === j.streamMode ? "Modo fluido: Sí" : "Modo fluido: No");
        I.appendChild(E), I._activate = function() {
                $a(n, "smooth" !== j.streamMode), E.textContent = "smooth" === j.streamMode ? "Modo fluido: Sí" : "Modo fluido: No"
            }, oe.appendChild(I),
            function(t) {
                var i = S(t) && t.episodes ? t.episodes : [],
                    n = i.length > 0,
                    r = ii(i.length);
                j.detailRange >= r.length && (j.detailRange = 0);
                if (S(t)) {
                    var o = e("div", "detail-season focusable");
                    a(o, 80, 42, 280, 53), o.appendChild(e("span", "season-text", function(e) {
                        var t = 0;
                        if (e.seasons && e.seasons.length > 0) {
                            var i = e.seasons[j.detailSeason] || e.seasons[0];
                            t = i && i.number ? i.number : j.detailSeason + 1
                        }
                        if (!t) {
                            var a = /S(\d+)/i.exec(e.alias || "") || /T(\d+)/i.exec(e.title || "");
                            a && (t = parseInt(a[1], 10) || 0)
                        }
                        return "Temporada " + (t || 1)
                    }(t)));
                    var s = e("img", "season-arrow");
                    s.src = "assets/original/vod/ic_down_icon.png", s.alt = "▼", o.appendChild(s), o._activate = function() {
                        !t.seasons || t.seasons.length < 2 || function(t, i) {
                            if (ni) return void ri();
                            if (!i.seasons || i.seasons.length < 2) return;
                            var n = t.querySelector(".season-arrow");
                            n && n.classList.add("is-open");
                            a(ni = e("div", "season-popup"), 80, 100, 280, Math.min(320, 54 * i.seasons.length));
                            for (var r = 0; r < i.seasons.length; r++)(function(t) {
                                var a = i.seasons[t],
                                    n = e("div", "season-popup-item focusable" + (t === j.detailSeason ? " is-selected" : "")),
                                    r = "Temporada " + (a.number || t + 1);
                                n.appendChild(e("span", "season-item-text", r));
                                var o = e("img", "season-item-check");
                                o.src = "assets/original/vod/icon_nation_selected.png", o.alt = "", n.appendChild(o), n._activate = function() {
                                    if (ri(), j.detailSeason !== t) {
                                        j.detailSeason = t, j.detailRange = 0, j.detailEpisode = null;
                                        var e = i.seasons[t];
                                        e && e.id && (nr("Cargando temporada…"), q("detail", {
                                            contentId: e.id
                                        }, function(t, a) {
                                            !t && a && !1 !== a.returnValue && (a.item && R(i, a.item), i.episodes = a.episodes || [], i.seasonId = e.id, e._episodes = i.episodes, j.detailEpisode = i.episodes[0] || null), ti(i), j.detailEpisode && sr(i, j.detailEpisode);
                                            var n = se ? se.querySelector(".detail-season") : null;
                                            n && tt(n)
                                        }))
                                    } else {
                                        var a = se ? se.querySelector(".detail-season") : null;
                                        a && tt(a)
                                    }
                                }, ni.appendChild(n)
                            })(r);
                            se.appendChild(ni);
                            var o = ni.children[j.detailSeason] || ni.children[0];
                            o && tt(o)
                        }(o, t)
                    }, se.appendChild(o)
                }
                if (n && i.length > 20) {
                    var d = e("div", "detail-ranges");
                    a(d, 398, 51, 1522, 46);
                    for (var c = 0; c < r.length; c++)(function(i) {
                        var n = e("div", "detail-range focusable" + (i === j.detailRange ? " is-selected" : ""), r[i].start + 1 + "-" + r[i].end);
                        a(n, 160 * i, 0, 150, 46), n._activate = function() {
                            ai(i, t)
                        }, d.appendChild(n)
                    })(c);
                    se.appendChild(d)
                }
                if (n) {
                    var p = r[j.detailRange] || {
                            start: 0,
                            end: i.length
                        },
                        u = e("div", "detail-episodes scrollable");
                    a(u, 80, 149, 1840, 65);
                    for (var v = p.start; v < p.end; v++)(function(i, n) {
                        var r = e("div", "detail-episode focusable" + (j.detailEpisode && (j.detailEpisode.id === i.id || j.detailEpisode === i) ? " is-playing" : ""));
                        a(r, 160 * n, 0, 150, 65);
                        var o = void 0 !== i.number && null !== i.number ? String(i.number) : String(v + 1);
                        r.appendChild(e("span", "ep-num", o)), r._ep = i, r._activate = function() {
                            gn(t, i)
                        }, u.appendChild(r)
                    })(i[v], v - p.start);
                    se.appendChild(u)
                }
                var f = n ? 240 : 25,
                    h = n ? 290 : 91,
                    g = e("div", "detail-related", "Quizás te guste");
                a(g, 80, f, 400, 44), se.appendChild(g);
                var m = e("div", "detail-grid scrollable");
                a(m, 72, h - 8, 1750, 388);
                var y = parseInt(t.id, 10);
                if (isNaN(y)) {
                    y = 0;
                    for (var b = 0; b < l.length; b++)
                        if (l[b] === t) {
                            y = b;
                            break
                        }
                }
                for (var C = 3 * y % Math.max(1, l.length - 6), w = 0; w < 16; w++) {
                    var x = l[(C + w) % l.length];
                    if (x) {
                        var _ = e("div", "cell");
                        _.appendChild(bt(x, 0, 0, 210, 308, {
                            gold: !0
                        })), _.appendChild(e("div", "d-name", x.title)), m.appendChild(_)
                    }
                }
                se.appendChild(m)
            }(n)
    }

    function ii(e) {
        return legacyBuildEpisodeRanges(e)
    }

    function ai(e, t) {
        j.detailRange = e, ti(t);
        var i = se.querySelector(".detail-range.is-selected");
        i && tt(i)
    }
    var ni = null;

    function ri() {
        ni && ni.parentNode && (ni.parentNode.removeChild(ni), ni = null);
        var e = se ? se.querySelector(".season-arrow") : null;
        e && e.classList.remove("is-open")
    }

    function oi() {
        le = t("search-keyboard"), de = t("search-hot"), ce = t("search-results"), pe = t("search-empty"), ue = t("search-hot-grid"), ve = t("search-result-grid"), he = t("search-nav"), i(le), i(ue), i(ve), ce && ce.classList.add("scrollable"), (fe = e("div", "kb-edit focusable"))._activate = function() {}, le.appendChild(fe);
        for (var a = e("div", "kb-actions"), n = [{
                cls: "switch",
                w: 100.5
            }, {
                cls: "clear",
                w: 100.5
            }, {
                cls: "del",
                w: 100.5
            }, {
                cls: "go",
                w: 120
            }], r = 0; r < n.length; r++) {
            var o = e("div", "kb-action focusable " + n[r].cls);
            o.style.width = n[r].w + "px", "go" === n[r].cls ? o.textContent = "Busca" : o.appendChild(e("div", "ico")), o._kind = n[r].cls, o._activate = function(e) {
                return function() {
                    "switch" === e ? gi() : "clear" === e ? ci("") : "del" === e ? ci(j.searchQuery.slice(0, -1)) : ui()
                }
            }(n[r].cls), a.appendChild(o)
        }
        le.appendChild(a), Fe = [];
        for (var s = [
                ["A", "Á", "B", "C", "D", "E", "É"],
                ["F", "G", "H", "I", "Í", "J", "K"],
                ["L", "M", "N", "Ñ", "O", "Ó", "P"],
                ["Q", "R", "S", "T", "U", "Ú", "Ü"],
                ["V", "W", "X", "Y", "Z", " "]
            ], l = 0; l < s.length; l++) {
            var d = e("div", "kb-row");
            d.style.top = 264 + 88.5 * l + "px";
            for (var c = 0; c < s[l].length; c++) {
                var p = e("div", "kb-key focusable" + (" " === s[l][c] ? " space" : ""), " " === s[l][c] ? "" : s[l][c]);
                p._char = s[l][c], p._activate = function(e) {
                    return function() {
                        ci(j.searchQuery + e)
                    }
                }(s[l][c]), d.appendChild(p), Fe.push(p)
            }
            le.appendChild(d)
        }
        var u = e("div", "kb-feedback focusable", "Feedback");
        u._activate = function() {}, le.appendChild(u);
        var v = function() {
            for (var e = T(), t = [], i = 0; i < e.length; i++) - 1 !== String(e[i] && e[i].category || "").toLowerCase().indexOf("busqueda") && t.push(_(e[i], i + 1));
            return t
        }();
        v.length || (v = I("busqueda", 10, 0));
        for (var f = 0; f < v.length; f++) ue.appendChild(si(v[f], f));
        ce.classList.remove("is-active"), pe.classList.remove("is-active"), de.classList.remove("is-hidden"), di()
    }

    function si(t, i) {
        var n = e("div", "search-cell");
        return a(n, i % 5 * 246, 437 * Math.floor(i / 5), 246, 437), n.appendChild(bt(t, 0, 0, 222, 329, {
            gold: !0
        })), n.appendChild(e("div", "s-name", t.title)), n
    }

    function li() {
        le || oi();
        var e = t("screen-search");
        e && e.classList.remove("is-filter-results");
        var i = t("search-keyboard"),
            a = t("search-hot");
        i && (i.style.display = ""), a && (a.style.display = ""), nt("search"), tt(fe)
    }

    function di() {
        fe && (j.searchQuery ? (fe.textContent = j.searchQuery, fe.classList.remove("is-placeholder")) : (fe.textContent = "Buscar películas, series, directores y actores.", fe.classList.add("is-placeholder")))
    }

    function ci(e) {
        j.searchQuery = e, di(), ui()
    }

    function pi() {
        j.searchTimer && (clearTimeout(j.searchTimer), j.searchTimer = null), j.searchQuery = "", di(), ve && i(ve), j.searchMatches = [], j.searchPage = 0, he && (he.textContent = ""), ce && ce.classList.remove("is-active"), pe && pe.classList.remove("is-active"), de && de.classList.remove("is-hidden")
    }

    function ui() {
        var e = j.searchQuery || "",
            t = o(e.trim());
        if (t) {
            var i = legacyFindLocalSearchMatches(l, e);
            if (fi(i), j.searchTimer && clearTimeout(j.searchTimer), "portal" === p.mode && t.length >= 2) {
                var s = ++j.searchSeq;
                j.searchTimer = setTimeout(function() {
                    q("search", {
                        value: e.trim()
                    }, function(e, t) {
                        if (s === j.searchSeq && !e && t && !1 !== t.returnValue && t.items && t.items.length) {
                            fi(legacyCombineSearchResults(i, t.items, function(item, index) {
                                return _(item, index)
                            }))
                        }
                    })
                }, 350)
            }
        } else pi()
    }
    var vi = 10;

    function fi(e) {
        j.searchMatches = e || [], j.searchPage = 0, hi(0, -1)
    }

    function filterMatches(item, value) {
        var _core = window.TutyCore;
        if (_core && _core.filterMatches) return _core.filterMatches(item, value);
        if ("*" === value) return !0;
        if (0 === value.indexOf("cat:")) {
            for (var cat = value.slice(4), cats = String(item.category || "").split(","), i = 0; i < cats.length; i++)
                if (o(cats[i]) === o(cat)) return !0;
            return o(item.kind || "") === o(cat)
        }
        if (0 === value.indexOf("gen:")) {
            for (var gen = value.slice(4), gs = item.genres || [], j = 0; j < gs.length; j++)
                if (o(gs[j]) === o(gen)) return !0
        }
        return !1
    }

    function openFilter() {
        if ("home" !== j.screen) return;
        j.filterOpen = !0, j.filterReturn = j.focus;
        var root = t("app"),
            panel = t("filter-panel");
        panel || (panel = e("div", "filter-panel"), panel.id = "filter-panel", root.appendChild(panel)), i(panel), panel.classList.add("is-active");
        var head = e("div", "pcat-head");
        head.appendChild(e("div", "pcat-title", "Filtrar contenido")), head.appendChild(e("div", "pcat-sub", "Elige una categoría o género para ver solo esos títulos")), panel.appendChild(head);
        var close = e("div", "filter-close focusable", "Cerrar");
        close._activate = function() {
            closeFilter()
        }, panel.appendChild(close);
        var grid = e("div", "pcat-grid");
        panel.appendChild(grid);
        for (var vals = [{
                label: "Todos",
                value: "*"
            }, {
                label: "Destacados",
                value: "cat:destacado"
            }, {
                label: "Películas",
                value: "cat:pelicula"
            }, {
                label: "Series",
                value: "cat:serie"
            }, {
                label: "Gratis",
                value: "cat:gratis"
            }, {
                label: "Infantil",
                value: "cat:infantil"
            }, {
                label: "UHD",
                value: "cat:uhd"
            }, {
                label: "Extra",
                value: "cat:extra"
            }], seen = {}, v = 0; v < vals.length; v++) seen[o(vals[v].label)] = !0;
        var counts = {},
            order = [];
        for (var ci = 0; ci < l.length; ci++)
            for (var gs = l[ci].genres || [], gj = 0; gj < gs.length; gj++) {
                var name = gs[gj];
                if (!name) continue;
                var key = o(name);
                counts[key] || (counts[key] = {
                    name: name,
                    n: 0
                }, order.push(key)), counts[key].n++
            }
        order.sort(function(e, t) {
            return counts[t].n - counts[e].n
        });
        for (var oi = 0; oi < order.length && vals.length < 34; oi++) {
            var genre = counts[order[oi]];
            !genre || seen[o(genre.name)] || (seen[o(genre.name)] = !0, vals.push({
                label: genre.name,
                value: "gen:" + genre.name
            }))
        }
        for (var k = 0; k < vals.length; k++) {
            var tile = e("div", "pcat-tile focusable");
            tile.appendChild(e("div", "pcat-name", vals[k].label)), tile._filterValue = vals[k].value, tile._filterLabel = vals[k].label, tile._activate = function() {
                applyFilter(this._filterLabel, this._filterValue)
            }, grid.appendChild(tile)
        }
        var first = panel.querySelector(".pcat-tile") || it(panel);
        first && tt(first)
    }

    function closeFilter() {
        j.filterOpen = !1;
        var panel = t("filter-panel");
        panel && panel.classList.remove("is-active");
        var back = j.filterReturn;
        if (back && Ye(back)) tt(back);
        else {
            var notify = t("home-notify"),
                first = notify ? it(notify) : null;
            first && tt(first)
        }
    }

    function applyFilter(label, value) {
        j.filterOpen = !1;
        var panel = t("filter-panel");
        panel && panel.classList.remove("is-active");
        for (var items = [], i = 0; i < l.length; i++) filterMatches(l[i], value) && items.push(l[i]);
        le || oi(), j.searchMatches = items, j.searchPage = 0;
        var screen = t("screen-search");
        screen && screen.classList.add("is-filter-results");
        var kb = t("search-keyboard"),
            hot = t("search-hot");
        kb && (kb.style.display = "none"), hot && (hot.style.display = "none"), nt("search"), hi(0, -1), he && (he.textContent = "Filtro: " + label + " · " + items.length + " títulos");
        var first = ve ? it(ve) : null;
        first && tt(first)
    }

    function hi(e, t) {
        var a = j.searchMatches || [];
        if (de.classList.add("is-hidden"), ce.classList.add("is-active"), i(ve), 0 === a.length) return pe.classList.add("is-active"), void(he && (he.textContent = ""));
        pe.classList.remove("is-active");
        var r = Math.ceil(a.length / vi),
            o = Math.max(0, Math.min(r - 1, e || 0));
        j.searchPage = o;
        var s = o * vi,
            l = Math.min(a.length, s + vi);
        he && (he.textContent = "Resultados " + (s + 1) + "-" + l + " de " + a.length + (r > 1 ? "  ·  Página " + (o + 1) + "/" + r : ""));
        for (var d = s; d < l; d++) {
            var c = d - s,
                p = si(_(a[d], d + 1), c),
                u = p.querySelector(".poster");
            u && function(e, t) {
                u._onMove = function(i) {
                    return "down" === i && e >= 5 && l < a.length ? (hi(o + 1, t), !0) : "up" === i && e < 5 && s > 0 && (hi(o - 1, 5 + t), !0)
                }
            }(c, c % 5), ve.appendChild(p)
        }
        if (ve.style.height = "874px", t >= 0) {
            var v = ve.querySelectorAll(".poster.focusable")[t];
            v || (v = it(ve)), v && tt(v)
        } else if ("search" === j.screen && (n(j.focus, ".search-hot") || n(j.focus, ".search-results"))) {
            var f = it(ve);
            f && tt(f)
        }
    }

    function gi() {
        j.searchNumeric = !j.searchNumeric;
        var t = le.querySelector(".kb-action.switch .ico");
        t && (t.style.backgroundImage = "url(assets/original/search/" + (j.searchNumeric ? "ic_vod_search_abc.png" : "ic_vod_search_123.png") + ")");
        var i = le.querySelectorAll(".kb-row:not(.kb-row-num)");
        if (j.searchNumeric) {
            for (var a = 0; a < i.length; a++) i[a].classList.add("hidden");
            if (!le.querySelector(".kb-row-num"))
                for (var n = [
                        ["1", "2", "3", "4", "5", "6", "7"],
                        ["8", "9", "0", " "]
                    ], r = 0; r < n.length; r++) {
                    var o = e("div", "kb-row kb-row-num");
                    o.style.top = 264 + 88.5 * r + "px";
                    for (var s = 0; s < n[r].length; s++) {
                        var l = e("div", "kb-key focusable" + (" " === n[r][s] ? " space" : ""), " " === n[r][s] ? "" : n[r][s]);
                        l._activate = function(e) {
                            return function() {
                                ci(j.searchQuery + e)
                            }
                        }(n[r][s]), o.appendChild(l)
                    }
                    le.appendChild(o)
                }
            for (var d = le.querySelectorAll(".kb-row-num"), c = 0; c < d.length; c++) d[c].classList.remove("hidden")
        } else {
            for (var p = 0; p < i.length; p++) i[p].classList.remove("hidden");
            Fe.forEach(function(e) {
                e.classList.remove("hidden")
            });
            for (var u = le.querySelectorAll(".kb-row-num"), v = 0; v < u.length; v++) u[v].classList.add("hidden")
        }
    }

    function mi() {
        ge = t("settings-menu"), me = t("settings-right"), i(ge), i(me), He = [];
        for (var n = 0; n < z.length; n++) {
            var r = e("div", "settings-item focusable");
            r.innerHTML = '<span class="settings-icon">' + (V[z[n].id] || "") + '</span><span class="settings-label">' + z[n].label + "</span>", r._index = n, r._activate = function(e) {
                return function() {
                    bi(e, !0)
                }
            }(n), r._onMove = function(e) {
                if ("right" === e) {
                    var t = it(me.querySelector(".settings-panel.is-active"));
                    return t && tt(t), !0
                }
                return !1
            }, ge.appendChild(r), He.push(r)
        }
        var o;
        for (var s in (Be = {}).profile = xi(), Be.history = Si(), Be.share = ((o = Ci("Compartir APP")).appendChild(e("div", "sp-hr")), o.appendChild(e("div", "share-copy", "Instala TutyTV en otro televisor desde tu propia IPK. El historial de este perfil permanece privado en este TV.")), o), Be.playback = function() {
                var t = Ci("Configuración global de reproducción");
                t.appendChild(e("div", "sp-hr")), t.appendChild(e("div", "sp-global-note", "Estas preferencias se aplican automáticamente a todas las películas y series nuevas.")), wi(t, 198, "Reproductor", ["Normal (directo)", "Modo fluido"], "streamMode", "smooth" === j.playback.streamMode ? 1 : 0), wi(t, 307, "Formato de pantalla", ["Pantalla completa", "Normal", "16:9", "4:3"], "screen", j.playback.screen), wi(t, 416, "Audio preferido", ["Español", "Portugués", "Inglés"], "audio", j.playback.audio), t.appendChild(a(e("div", "sp-hr"), 0, 535, 1498, 1)), t.appendChild(e("div", "sp-subtitle-h", "Subtitulos"));
                var i = e("div", "sp-switch focusable " + (j.playback.subtitle ? "on" : "off"));
                return i._activate = function() {
                        j.playback.subtitle = !j.playback.subtitle, i.className = "sp-switch focusable " + (j.playback.subtitle ? "on" : "off"), Q(), tt(i)
                    }, t.appendChild(i), wi(t, 680, "Idioma", ["Español", "Portugués", "Inglés"], "subLang", j.playback.subLang), wi(t, 793, "Tamaño", ["Normal", "Grande", "Pequeño"], "size", j.playback.size),
                    function(t, i) {
                        var a = e("div", "pb-row");
                        a.style.top = i + "px", a.appendChild(e("div", "pb-label", "Estilo"));
                        for (var n = ["#ffffff", "#f6e33f", "#ffffff"], r = 0; r < 3; r++) {
                            var o = e("div", "pb-opt focusable" + (r === j.playback.style ? " is-checked" : ""));
                            o.style.marginLeft = (0 === r ? 0 : 28) + "px", o.appendChild(e("div", "radio"));
                            var s = e("span", null, "Aa");
                            s.style.color = n[r], 2 === r && (s.style.background = "#000000", s.style.display = "inline-block", s.style.width = "94px", s.style.height = "50px", s.style.lineHeight = "50px", s.style.fontSize = "28px"), o.appendChild(s), o._group = "style", o._index = r, o._activate = function() {
                                j.playback.style = this._index, ka(), Q();
                                for (var e = t.querySelectorAll(".pb-opt"), i = 0; i < e.length; i++) "style" === e[i]._group && e[i].classList.toggle("is-checked", e[i]._index === this._index)
                            }, a.appendChild(o)
                        }
                        t.appendChild(a)
                    }(t, 906), t
            }(), Be.parent = function() {
                var t = e("div", "settings-panel");
                t.appendChild(e("div", "pl-title", "Configuraciones del Control Parental")), t.appendChild(e("div", "pl-tip", "Ingrese la contraseña de cuatro dígitos e ingrese viendo el programa de bloqueo.")), t.appendChild(e("div", "pl-label", "Contraseña inicial:"));
                for (var i = e("div", "pl-boxes"), a = 0; a < 4; a++) {
                    var n = e("div", "pl-box focusable");
                    n._activate = function() {}, i.appendChild(n), a < 3 && i.appendChild(e("div", "pl-sep"))
                }
                t.appendChild(i), t.appendChild(e("div", "pl-note", ""));
                var r = e("div", "pl-ok focusable", "OK");
                return r._activate = function() {}, t.appendChild(r), t
            }(), Be.feedback = function() {
                var t = e("div", "settings-panel");
                t.appendChild(e("div", "fb-title", "Ayuda y Feedback")), t.appendChild(e("div", "fb-hr")), t.appendChild(e("div", "fb-contact", "Si tiene alguna duda, puede ponerse en contacto con nosotros a través de los siguientes medios:")), t.appendChild(e("div", "fb-qr-note", "Escanee el código QR para enviar sugerencias o comentarios."));
                var i = e("div", "fb-qr");
                t.appendChild(i);
                var a = e("div", "fb-help focusable", "Ayuda");
                return a._activate = function() {}, t.appendChild(a), t
            }(), Be.about = function() {
                var t = e("div", "settings-panel");
                t.appendChild(e("div", "sp-title plain", "Sobre nosotros")), t.appendChild(a(e("div", "sp-hr soft"), 0, 165, 1498, 1)), t.appendChild(e("div", "sp-about-body", "TutyTV se dedica a ofrecer a los usuarios una amplia variedad de recursos de alta calidad. Aquí encontrarás miles de películas, series, animes y canales en vivo, todo reunido en un solo lugar. Brindamos una experiencia estable, diversa y siempre actualizada, además de contenidos gratuitos para disfrutar.")), t.appendChild(e("div", "sp-about-port", "Port para LG webOS realizado por CristiancoDEV"));
                var i = e("div", "sp-about-mail"),
                    n = e("img");
                return n.src = "assets/original/settings/vod_email_icon.png", n.alt = "", i.appendChild(n), i.appendChild(e("span", null, "escuchamos-tv@outlook.com")), t.appendChild(i), t
            }(), Be) Be.hasOwnProperty(s) && me.appendChild(Be[s])
    }

    function yi() {
        ge || mi(), nt("settings"), bi(0, !1), tt(He[0])
    }

    function bi(e, i) {
        var a = z[e] && z[e].id || "profile",
            n = t("screen-settings");
        if (n && n.classList.toggle("is-history-view", "history" === a), "profile" === a && Be.profile && me) {
            var r = xi();
            me.replaceChild(r, Be.profile), Be.profile = r
        } else if ("history" === a && Be.history && me) {
            var o = Si();
            me.replaceChild(o, Be.history), Be.history = o
        }
        for (var s = 0; s < He.length; s++) He[s].classList.toggle("is-selected", s === e);
        for (var l in Be) Be.hasOwnProperty(l) && Be[l].classList.toggle("is-active", l === a);
        i && tt(it(Be[a]) || He[e])
    }

    function Ci(t) {
        var i = e("div", "settings-panel");
        return i.appendChild(e("div", "sp-title", t)), i
    }

    function wi(t, i, a, n, r, o) {
        var s = e("div", "pb-row");
        s.style.top = i + "px", s.appendChild(e("div", "pb-label", a));
        for (var l = 0; l < n.length; l++) {
            var d = e("div", "pb-opt focusable" + (l === o ? " is-checked" : ""));
            d.style.marginLeft = (0 === l ? 0 : 28) + "px", d.appendChild(e("div", "radio")), d.appendChild(e("span", null, n[l])), d._group = r, d._index = l, d._activate = function() {
                "streamMode" === this._group ? (j.playback.streamMode = 1 === this._index ? "smooth" : "normal", za = {}, j.playerItem && Wa(j.playerItem)) : (j.playback[this._group] = this._index, "audio" === this._group ? j.playback.audioCode = "" : "subLang" === this._group && (j.playback.subCode = "")), ka(), Q();
                for (var e = t.querySelectorAll(".pb-opt"), i = 0; i < e.length; i++) e[i]._group === this._group && e[i].classList.toggle("is-checked", e[i]._index === this._index)
            }, s.appendChild(d)
        }
        t.appendChild(s)
    }

    function xi() {
        var t = e("div", "settings-panel account-panel"),
            i = e("div", "account-avatar");
        i.innerHTML = V.profile, t.appendChild(i), t.appendChild(e("div", "account-number", X.id)), t.appendChild(e("div", "account-type", "Perfil local de este televisor"));
        var a = e("div", "account-card");
        a.appendChild(e("div", "account-card-title", "Tu cuenta está lista")), a.appendChild(e("div", "account-card-text", "Las preferencias, el historial y el capítulo que estabas viendo se guardan automáticamente en este TV.")), t.appendChild(a);
        var n = e("div", "account-history-btn focusable", "Ver mi lista");
        n._activate = function() {
            bi(1, !0)
        }, t.appendChild(n);
        var r = e("div", "account-card account-card-small");
        return r.appendChild(e("div", "account-card-title", "Sin registro ni contraseña")), r.appendChild(e("div", "account-card-text", "Este perfil no envía tus datos a ningún servidor.")), t.appendChild(r), t
    }

    function Si() {
        for (var t = e("div", "settings-panel history-panel"), i = e("div", "history-tabs"), a = [{
                id: "history",
                label: "Historia"
            }, {
                id: "favs",
                label: "Mi favoritos"
            }, {
                id: "reminders",
                label: "Recordatorios"
            }], n = 0; n < a.length; n++)(function(t) {
            var a = e("div", "history-tab focusable" + (ze === t.id ? " is-selected" : ""), t.label);
            a._activate = function() {
                ze = t.id, bi(1, !0)
            }, i.appendChild(a)
        })(a[n]);
        t.appendChild(i), t.appendChild(e("div", "history-rule"));
        var r = [];
        if ("history" === ze) r = X.history || [];
        else if ("favs" === ze)
            for (var o = 0; o < l.length; o++) j.favs && j.favs[l[o].id] && r.push({
                id: l[o].id,
                title: l[o].title,
                poster: l[o].poster || l[o].cover,
                series: S(l[o]),
                position: 0
            });
        else if ("reminders" === ze) {
            for (var seenR = {}, ro = 0; ro < l.length; ro++)
                if (X.reminders && X.reminders[String(l[ro].id)]) {
                    seenR[String(l[ro].id)] = !0, r.push({
                        id: l[ro].id,
                        title: l[ro].title,
                        poster: l[ro].poster || l[ro].cover,
                        series: !0,
                        reminder: !0,
                        position: 0
                    })
                } for (var rid in X.reminders)
                if (X.reminders.hasOwnProperty(rid) && !seenR[rid]) {
                    var rec = X.reminders[rid];
                    r.push({
                        id: rid,
                        title: rec.title || "Contenido",
                        poster: rec.poster || "",
                        series: !0,
                        reminder: !0,
                        position: 0
                    })
                }
        }
        var s = e("div", "history-total", "Total ");
        s.appendChild(e("span", null, String(r.length))), t.appendChild(s);
        var d = e("div", "history-grid");
        if (r.length)
            for (var c = 0; c < r.length && c < 15; c++)(function(t) {
                var i = e("div", "history-card focusable"),
                    a = document.createElement("img");
                a.className = "history-poster", a.alt = "", a.src = t.poster || "assets/original/common/bg_placehoder_vertical.png", i.appendChild(a);
                var n = t.reminder ? "Recordatorio activo" : t.series ? "Ya miró " + (t.episodeNumber ? "epis. " + t.episodeNumber : "un episodio") + (t.position ? " · " + ki(t.position) : "") : "Ya miró hasta " + ki(t.position || 0);
                i.appendChild(e("div", "history-progress", n)), i.appendChild(e("div", "history-card-title", t.title || "Contenido")), i._activate = function() {
                    Oa(t)
                }, d.appendChild(i)
            })(r[c]);
        else d.appendChild(e("div", "history-grid-empty", "No hay títulos para mostrar todavía."));
        return t.appendChild(d), t
    }
    var _i = 5e3,
        Li = null;

    function ki(e) {
        return legacyFormatPlaybackTime(e)
    }

    function Mi(e) {
        return legacyParsePlaybackDuration(e)
    }
    var Ii = null;

    function Ti() {
        Ii && (clearInterval(Ii), Ii = null)
    }

    function Ei(e, t) {
        if (Ie && Te && qe) {
            Je && (jn || Vn) && (e = Qe);
            e = Number(e) || 0;
            var i = legacyResolvePlaybackDuration(Hn ? [
                Hd,
                j.playerEpisode && j.playerEpisode.duration,
                j.playerItem && j.playerItem.duration,
                we && isFinite(we.duration) && we.duration > 0 ? zn + we.duration : 0,
                t,
                legacyInferEpisodeDuration(j.playerItem && j.playerItem.episodes, j.playerEpisode),
                Da && Da.length && Da[Da.length - 1] && Da[Da.length - 1].end > 0 ? Math.round(Da[Da.length - 1].end + 60) : 0
            ] : [
                t,
                j.playerEpisode && j.playerEpisode.duration,
                j.playerItem && j.playerItem.duration,
                we && isFinite(we.duration) && we.duration > 0 ? we.duration : 0,
                legacyInferEpisodeDuration(j.playerItem && j.playerItem.episodes, j.playerEpisode),
                Da && Da.length && Da[Da.length - 1] && Da[Da.length - 1].end > 0 ? Math.round(Da[Da.length - 1].end + 60) : 0
            ], S(j.playerItem), e);
            Ie.textContent = ki(e), Te.textContent = ki(i);
            var n = legacyPlaybackPercent(e, i);
            if (qe.style.width = n.toFixed(2) + "%", De && (De.style.left = n.toFixed(2) + "%"), we && we.buffered && we.buffered.length > 0) try {
                var r = we.buffered.end(we.buffered.length - 1);
                Hn && (r += zn);
                var o = legacyPlaybackPercent(r, i);
                Oe && (Oe.style.width = o.toFixed(2) + "%")
            } catch (e) {}
        }
    }

    function qi(e) {
        Ae || (Ae = t("player-osd-icon")), Ae && (Li && (clearTimeout(Li), Li = null), "pause" === e ? (Ae.style.backgroundImage = "url(assets/original/common/icon_status_pause.png)", Ae.classList.add("is-active")) : "forward" === e ? (Ae.style.backgroundImage = "url(assets/original/common/icon_status_forward.png)", Ae.classList.add("is-active"), Li = setTimeout(function() {
            Ae.classList.remove("is-active")
        }, 900)) : "backward" === e ? (Ae.style.backgroundImage = "url(assets/original/common/icon_status_backward.png)", Ae.classList.add("is-active"), Li = setTimeout(function() {
            Ae.classList.remove("is-active")
        }, 900)) : Ae.classList.remove("is-active"))
    }

    function Oi(e) {
        if (we) {
            var t = we.duration;
            (isNaN(t) || t <= 0) && (t = 86400);
            var i = we.currentTime || 0,
                a = Math.max(0, Math.min(t, i + e));
            try {
                legacySeekVideo(we, a)
            } catch (e) {}
            Ei(a, we.duration), Pi(), qi(e > 0 ? "forward" : "backward")
        }
    }

    function Di() {
        if (we)
            if (we.paused) {
                try {
                    var e = legacyPlayVideo(we);
                    e && e.catch && e.catch(function() {})
                } catch (e) {}
                qi("none"), Pi()
            } else {
                try {
                    legacyPauseVideo(we)
                } catch (e) {}
                qi("pause"), Pi()
            }
    }

    function Ai() {
        j.infoTimer && clearTimeout(j.infoTimer), j.infoTimer = setTimeout(function() {
            j.infoTimer = null, "player" !== j.screen || j.channelsOpen || Ni()
        }, _i)
    }

    function Pi() {
        j.infobar = !0, "vod" === j.playerMode ? (Le && Le.classList.add("is-active"), be && be.classList.remove("is-active")) : (be && be.classList.add("is-active"), Le && Le.classList.remove("is-active")), Ai()
    }

    function Ni() {
        j.infoTimer && (clearTimeout(j.infoTimer), j.infoTimer = null), j.infobar = !1, be && be.classList.remove("is-active"), Le && Le.classList.remove("is-active")
    }

    function Ri() {
        Pi()
    }

    function Ui() {
        Ni()
    }
    var Fi = null,
        Bi = null,
        Hi = null,
        zi = null,
        Vi = null,
        ji = null,
        Wi = null,
        $i = null,
        Xi = null,
        Gi = null,
        Ji = null,
        Qi = null,
        Ki = null,
        Yi = null,
        Zi = null,
        ea = null,
        ta = null,
        ia = null,
        aa = null,
        na = null,
        ra = null,
        oa = null,
        sa = null,
        la = null,
        da = null,
        ca = null,
        pa = null,
        ua = null,
        va = !1,
        fa = !1,
        ha = null,
        ga = 0,
        ma = !1,
        ya = null,
        ba = !1,
        Ca = !1,
        wa = 0,
        xa = "normal",
        Sa = "white",
        _a = "contain",
        La = 0;

    function ka() {
        xa = ["normal", "big", "small"][Number(j.playback.size) || 0] || "normal", Sa = ["white", "yellow", "black"][Number(j.playback.style) || 0] || "white", Ca || (ba = !!j.playback.subtitle), xn(["cover", "contain", "16-9", "4-3"][Number(j.playback.screen) || 0] || "contain"), Fa()
    }

    function Ma() {
        return ["es", "pt", "en"][Number(j.playback.subLang) || 0] || "es"
    }

    function Ia(e, t) {
        var _core = window.TutyCore;
        if (_core && typeof _core.matchesLanguagePreference === "function") return _core.matchesLanguagePreference(e, t);
        var i = String(e || t || "").toLowerCase(),
            a = t || "es";
        return "es" === a ? /^(es|spa|esp)|espa/.test(i) : "pt" === a ? /^(pt|por)|portu/.test(i) : "en" === a && /^(en|eng|ing)|ingl/.test(i)
    }

    function Ta(e, t, i) {
        var a = j.playerItem,
            n = Date.now();
        if (!j.noHistorySave && legacyShouldPersistPlaybackHistory(e, a && a.id, n, La, i)) {
            La = n;
            var _core = window.TutyCore,
                    _seriesId = String(a._seriesId || a.id),
                    _seasonId = String(a.seasonId || a.id);
                if (_core && typeof _core.updatePlaybackHistory === "function") {
                    var _episode = j.playerEpisode, _series = !!S(a),
                        _context = {
                            seriesId: _seriesId,
                            seasonId: _seasonId
                        };
                    return X.history = _core.updatePlaybackHistory(X.history || [], a, _episode, e, t, n, _series, _context), void J(W, X)
                }
                for (var r = j.playerEpisode, o = String(a.id), s = [{
                        id: o,
                        title: a.title || a.name || "Contenido",
                        poster: a.poster || a.cover || "",
                        series: !!S(a),
                        seriesId: _seriesId,
                        seasonId: _seasonId,
                        episodeId: r && r.id ? String(r.id) : "",
                        episodeNumber: r && (r.number || r.seriesNumber) || "",
                        episodeTitle: r && (r.title || r.name) || "",
                        position: Math.floor(e),
                        duration: Math.floor(t || a.duration || 0),
                        updatedAt: n
                    }], l = X.history || [], d = 0; d < l.length && s.length < 30; d++) {
                        var entry = l[d],
                            entrySeries = entry.seriesId ? String(entry.seriesId) : String(entry.id);
                        String(entry.id) !== o && entrySeries !== _seriesId && s.push(entry)
                    }
                X.history = s, J(W, X)
        }
    }
    function qa(e) {
        var t = findHistory(e);
        if (!t || !e || !t.episodeId) return;
        var targetSeason = t.seasonId ? String(t.seasonId) : "",
            seasons = e.seasons || [],
            index = -1;
        if (targetSeason)
            for (var i = 0; i < seasons.length; i++)
                if (String(seasons[i].id) === targetSeason) {
                    index = i;
                    break
                }
        if (index >= 0) {
            var season = seasons[index];
            j.detailSeason = index;
            if (String(season.id) !== String(e.seasonId || "")) {
                if (season._episodes) e.seasonId = season.id, e.episodes = season._episodes;
                else ln(e, season, function(episodes) {
                    e.seasonId = season.id, e.episodes = episodes, season._episodes = episodes;
                    if (j.playerEpisode && String(j.playerEpisode.id) === String(t.episodeId))
                        for (var a = 0; a < episodes.length; a++)
                            if (String(episodes[a].id) === String(t.episodeId)) {
                                j.detailEpisode = episodes[a], j.playerEpisode = episodes[a];
                                break
                            }
                    j.detail === e && "detail" === j.screen && ti(e)
                })
            }
        }
        t.seriesId && (e._seriesId = t.seriesId), t.title && (e.title = t.title), t.poster && (e.poster = t.poster), t.id && (e.id = t.id);
        var episode = legacyResolveHistoryEpisode(t, e.episodes || []);
        j.detailEpisode = episode, j.playerEpisode = episode
    }

    function Oa(e) {
        if (!e || !e.id) return;
        for (var t = 0; t < l.length; t++)
            if (String(l[t].id) === String(e.id)) {
                var item = l[t];
                item._detailsLoaded || (item._portal = !0);
                return void ei(item)
            }
        var title = o(e.title || "");
        if (title)
            for (var index = 0; index < l.length; index++)
                if (o(l[index].title || "") === title || o(l[index].alias || "") === title) {
                    var matched = l[index];
                    matched._detailsLoaded || (matched._portal = !0);
                    return void ei(matched)
                }
        var i = _(e, 0);
        i._portal = !0, ei(i)
    }
    var Da = [],
        Aa = {},
        Pa = {},
        Na = null;

    function Ra(e) {
        return legacyParseSubtitleTimestamp(e)
    }

    function Ua(e) {
        var t = ++wa;
        if (!e || !e.url) return Da = [], void(ua && (ua.innerHTML = ""));
        try {
            var i = new XMLHttpRequest;
            i.open("GET", e.url, !0), i.onload = function() {
                t === wa && i.status >= 200 && i.status < 300 && (Da = legacyParseSubtitleCues(i.responseText))
            }, i.send()
        } catch (e) {}
    }

    function Fa() {
        ua && (ua.classList.remove("size-small", "size-normal", "size-big"), ua.classList.add("size-" + xa), ua.classList.remove("color-white", "color-yellow", "color-black"), ua.classList.add("color-" + Sa))
    }

    function Ba(e) {
        if (ua)
            if (ba && Da && Da.length) {
                var t = legacyFindSubtitleCue(Da, e);
                if (t) {
                    var a = '<span class="player-subtitles-text">' + t.text + "</span>";
                    ua.innerHTML !== a && (ua.innerHTML = a)
                } else "" !== ua.innerHTML && (ua.innerHTML = "")
            } else "" !== ua.innerHTML && (ua.innerHTML = "")
    }

    function Ha() {
        return "detail" === j.screen ? j.detail || null : j.playerItem || j.detail || null
    }
    var za = {},
        Va = "";

    function ja(e) {
        return e && (e.seriesId || e.id) || ""
    }

    function Wa(e) {
        var t = ja(e);
        t && za.hasOwnProperty(t) ? j.streamMode = za[t] ? "smooth" : "normal" : j.streamMode = "smooth" === j.playback.streamMode ? "smooth" : "normal"
    }

    function $a(e, t) {
        var i = ja(e);
        j.streamMode = t ? "smooth" : "normal", i && (za[i] = !!t)
    }

    function Xa() {
        Va = "", ga = 0, ma = !1, ya = null, ba = !1, Ca = !1, wa++, j.trackIndex = 0, Da = [], ua && (ua.innerHTML = "")
    }

    function Ga(e) {
        return e && S(e) ? "player" === j.screen && j.playerEpisode ? j.playerEpisode : j.detailEpisode ? j.detailEpisode : e.episodes && e.episodes[0] || null : null
    }

    function Ja(e) {
        if (!e) return "";
        var t = Ga(e);
        return t && t.id ? t.id : e.id || ""
    }

    function Qa(e, t) {
        if (t = t || function() {}, !e) return t(null);
        var i = Ja(e);
        if (!i) return t(null);
        if (Aa[i]) return Za(Aa[i]), t(Aa[i]);
        if (Pa[i]) Pa[i].push(t);
        else {
            Pa[i] = [t];
            var a = Ga(e),
                n = {
                    contentId: i
                },
                r = e.seasonId || e.id;
            a && a.id && r && a.id !== r && (n.seriesContentId = r), q("mediaInfo", n, function(e, t) {
                var a = Pa[i] || [];
                delete Pa[i];
                var n = !e && t && !1 !== t.returnValue ? t : null;
                n && (Aa[i] = n, Za(n));
                for (var r = 0; r < a.length; r++) try {
                    a[r](n)
                } catch (e) {}
            })
        }
    }

    function Ka(e) {
        var _core = window.TutyCore;
        if (_core && typeof _core.selectAudioTrackIndex === "function") return _core.selectAudioTrackIndex(e, j.playback.audioCode, j.playback.audio);
        var t = (e || "").split(/[,\/]/).map(function(code) {
                return String(code).trim()
            }),
            i = legacySelectTrackIndex(t, j.playback.audioCode, j.playback.audio);
        return i >= 0 ? i : 0
    }

    function Ya(e) {
        var _core = window.TutyCore;
        if (_core && typeof _core.normalizeSubtitleTracks === "function") return _core.normalizeSubtitleTracks(e);
        for (var t = [], i = e && e.subtitles || [], a = 0; a < i.length; a++) t.push({
            lang: i[a].lang,
            url: i[a].url,
            format: i[a].format
        });
        return t.sort(function(e, t) {
            return (/^(es|spa|esp)$/i.test(e.lang || "") ? 0 : 1) - (/^(es|spa|esp)$/i.test(t.lang || "") ? 0 : 1)
        }), t
    }

    function Za(e) {
        var t = Ya(e);
        if (Ca) {
            if (ba) {
                if (!t.length) return ba = !1, ya = null, void Ua(null);
                var i = !1;
                if (ya)
                    for (var a = 0; a < t.length; a++)
                        if (t[a].url === ya.url) {
                            ya = t[a], i = !0;
                            break
                        } i || Ua(ya = t[0])
            }
        } else {
            if (!j.playback.subtitle) return ba = !1, ya = null, void Ua(null);
            if (!t.length) return ba = !1, ya = null, void Ua(null);
            ba = !0;
            var _core = window.TutyCore,
                _chosen = _core && typeof _core.chooseSubtitleTrack === "function" ? _core.chooseSubtitleTrack(t, j.playback.subCode, j.playback.subLang) : function() {
                    var n = legacySelectTrackIndex(t.map(function(item) {
                        return item.lang || ""
                    }), j.playback.subCode, j.playback.subLang);
                    return n >= 0 ? t[n] : t[0]
                }();
            ya = _chosen, Ua(ya)
        }
    }

    function en() {
        ha && clearTimeout(ha), ha = setTimeout(function() {
            an()
        }, 8e3)
    }

    function tn() {
        if (Fi || En(), Fi) {
            va = !0, fa = !1, Ni(), nn(), Fi.classList.add("is-active"), ua && ua.classList.add("shift-up"), Qa(j.playerItem, function() {
                va && nn()
            }), en();
            var e = j.playerItem;
            if (S(e) && zi) {
                var t = zi.querySelector(".psv-ep-btn");
                if (t) return void tt(t)
            }
            S(e) && Ji ? tt(Ji) : Vi && tt(Vi)
        }
    }

    function an() {
        ha && (clearTimeout(ha), ha = null), va = !1, Fi && Fi.classList.remove("is-active"), ua && ua.classList.remove("shift-up"), "player" !== j.screen || fa || tt(ye)
    }

    function nn() {
        var e = j.focus ? n(j.focus, ".psv-row") : null,
            t = e ? e.id : "",
            i = e && j.focus ? j.focus.textContent : "";
        if (on(), function() {
                if (!$i) return;
                $i.classList.remove("is-hidden")
            }(), Cn(), wn(), rn(), va && t && Fi)
            for (var a = Fi.querySelectorAll(".psv-row"), r = 0; r < a.length; r++)
                if (a[r].id === t) {
                    for (var o = a[r].querySelectorAll(".focusable"), s = null, l = 0; l < o.length; l++)
                        if (o[l].textContent === i) {
                            s = o[l];
                            break
                        } var d = s || it(a[r]);
                    d && tt(d, !0);
                    break
                }
    }

    function rn() {
        if (Fi) {
            for (var e = Fi.querySelectorAll(".psv-row"), t = 0; t < e.length; t++) e[t].classList.remove("is-row-focused");
            var i = j.focus ? n(j.focus, ".psv-row") : null;
            i && i.classList.add("is-row-focused")
        }
    }

    function on() {
        if (Hi) {
            var t = j.playerItem;
            if (t && S(t)) {
                if (Hi.style.display = "block", zi) {
                    i(zi);
                    var a = sn(t),
                        n = a[j.playerSeasonIndex] || a[0],
                        r = n && n.id === (t.seasonId || t.id) && t.episodes && t.episodes.length ? t.episodes : n && n._episodes || t.episodes || [];
                    if (r.length) {
                        for (var o = 0, s = 0; s < r.length; s++)
                            if (j.playerEpisode && (r[s].id === j.playerEpisode.id || r[s].number === j.playerEpisode.number)) {
                                o = s;
                                break
                            } var l = ii(r.length);
                        (void 0 === j.playerEpisodeRange || j.playerEpisodeRange >= l.length) && (j.playerEpisodeRange = Math.floor(o / 20));
                        for (var d = l[j.playerEpisodeRange] || l[0], c = e("div", "psv-episode-numbers"), p = d.start; p < d.end; p++)(function(t, i) {
                            var a = i === o ? "▶" : String(void 0 !== t.number && null !== t.number ? t.number : i + 1),
                                n = e("button", "psv-ep-btn focusable" + (i === o ? " is-selected" : ""), a);
                            n._activate = function() {
                                hn(t)
                            }, c.appendChild(n)
                        })(r[p], p);
                        zi.appendChild(c);
                        for (var u = e("div", "psv-episode-ranges"), v = 0; v < l.length; v++)(function(t, i) {
                            var a = e("button", "psv-range-btn focusable" + (t === j.playerEpisodeRange ? " is-selected" : ""), i.start + 1 + "-" + i.end);
                            a._activate = function() {
                                j.playerEpisodeRange = t, on();
                                var e = zi.querySelector(".psv-ep-btn");
                                e && tt(e)
                            }, u.appendChild(a)
                        })(v, l[v]);
                        zi.appendChild(u)
                    } else zi.appendChild(e("div", "psv-selection-empty", "Temporadas y episodios"))
                }
            } else Hi.style.display = "none"
        }
    }

    function sn(e) {
        return legacySeasonList(e)
    }

    function ln(e, t, i) {
        return i = i || function() {}, e && t ? t.id === (e.seasonId || e.id) && e.episodes && e.episodes.length ? (t._episodes = e.episodes, i(e.episodes, t._item || null)) : t._episodes ? i(t._episodes, t._item || null) : t._loading ? (t._wait = t._wait || [], void t._wait.push(i)) : (t._loading = !0, t._wait = [i], void q("detail", {
            contentId: t.id
        }, function(e, response) {
            t._loading = !1;
            var item = !e && response && !1 !== response.returnValue && response.item ? response.item : null,
                a = !e && response && !1 !== response.returnValue && response.episodes ? response.episodes : [];
            a.length && (t._episodes = a), item && (t._item = item);
            var n = t._wait || [];
            t._wait = [];
            for (var r = 0; r < n.length; r++) try {
                n[r](a, item)
            } catch (e) {}
        })) : i([])
    }

    function dn(e, t, i) {
        return legacyEpisodeDisplayTitle(e, t, i)
    }

    function cn(e) {
        return legacyFormatEpisodeDuration(e && e.duration)
    }

    function pn() {
        var t = j.playerItem;
        if (t && S(t) && (va && an(), Qi || En(), Qi)) {
            if (!(t.episodes && t.episodes.length || t._detailsLoaded)) return nr("Cargando capítulos…"), void U(t, function() {
                "player" === j.screen && (!j.playerEpisode && t.episodes && t.episodes.length && (j.playerEpisode = t.episodes[0], j.detailEpisode = t.episodes[0]), pn())
            });
            !j.playerEpisode && t.episodes && t.episodes.length && (j.playerEpisode = t.episodes[0], j.detailEpisode = t.episodes[0], j.playerSeasonIndex = j.detailSeason || 0), j.episodeBrowserOpen = !0, j.browserSeason = j.playerSeasonIndex || 0, Qi.classList.add("is-active"), Ui(),
                function() {
                    var t = j.playerItem;
                    if (!t || !Qi) return;
                    var a = sn(t);
                    j.browserSeason >= a.length && (j.browserSeason = 0);
                    j.browserSeason < 0 && (j.browserSeason = 0);
                    var n = a[j.browserSeason],
                        r = a[j.playerSeasonIndex] || a[0],
                        o = j.playerEpisode;
                    Ki && (Ki.textContent = t.title || "");
                    if (Yi)
                        if (o) {
                            var s = [];
                            r && r.number && s.push("T" + r.number), o.number && s.push("E" + o.number), Yi.textContent = "Reproduciendo " + s.join(" ") + " · " + dn(t, o)
                        } else Yi.textContent = "Elige un episodio";
                    ia && (ia.textContent = "Episodios · Temporada " + (n && n.number || j.browserSeason + 1));
                    (function(t, a) {
                        if (!Zi || !ea) return;
                        i(Zi), ea.style.display = "flex";
                        for (var n = 0; n < a.length; n++)(function(t) {
                            var i = e("div", "pe-season focusable", "Temporada " + (a[t].number || t + 1));
                            t === j.browserSeason && i.classList.add("is-selected"), i._onFocus = function() {
                                j.browserSeason !== t && fn(t, !1)
                            }, i._activate = function() {
                                fn(t, !0)
                            }, Zi.appendChild(i)
                        })(n)
                    })(0, a), vn(t, n)
                }();
            var a = (ta ? ta.querySelector(".pe-ep.is-current") : null) || (ta ? it(ta) : null) || (ea && "none" !== ea.style.display ? it(Zi) : null);
            a && tt(a)
        }
    }

    function un(e) {
        Qi && j.episodeBrowserOpen && (j.episodeBrowserOpen = !1, Qi.classList.remove("is-active"), !e && "player" === j.screen && ye && tt(ye))
    }

    function vn(t, a) {
        if (ta && a) {
            i(ta);
            var r = a.id === (t.seasonId || t.id) && t.episodes && t.episodes.length ? t.episodes : a._episodes || [];
            if (!r.length) return ta.appendChild(e("div", "pe-loading", "Cargando episodios…")), void ln(t, a, function(e) {
                if (j.episodeBrowserOpen && (sn(t)[j.browserSeason] === a && (vn(t, a), n(j.focus, "#pe-episodes")))) {
                    var i = ta.querySelector(".pe-ep.is-current") || it(ta);
                    i && tt(i)
                }
            });
            for (var o = Math.min(r.length, 24), s = 0; s < o; s++)(function(i, a) {
                var n = e("div", "pe-ep focusable"),
                    r = void 0 !== i.number && null !== i.number ? i.number : a + 1;
                n.appendChild(e("div", "pe-num", String(r)));
                var o = e("div", "pe-thumb"),
                    s = e("div", "pe-thumb-play", "▶");
                o.appendChild(s), n.appendChild(o);
                var l = e("div", "pe-info");
                l.appendChild(e("div", "pe-name", dn(t, i, a)));
                var d = [],
                    c = cn(i);
                c && d.push(c), i.quality && d.push(String(i.quality).split(",")[0].toUpperCase()), l.appendChild(e("div", "pe-meta", d.join("   ·   "))), i.description && l.appendChild(e("div", "pe-desc", i.description)), n.appendChild(l);
                var p = j.playerEpisode && (j.playerEpisode.id === i.id || void 0 !== j.playerEpisode.number && j.playerEpisode.number === i.number);
                n.appendChild(e("div", "pe-badge", "▶ REPRODUCIENDO")), p && n.classList.add("is-current"), n._activate = function() {
                    hn(i)
                }, ta.appendChild(n)
            })(r[s], s);
            r.length > o && ta.appendChild(e("div", "pe-loading", "Mostrando los primeros " + o + " capítulos"))
        }
    }

    function fn(e, t) {
        var i = j.playerItem,
            a = sn(i);
        if (a[e] && (j.browserSeason = e, function() {
                if (Zi)
                    for (var e = Zi.children, t = 0; t < e.length; t++) e[t].classList.toggle("is-selected", t === j.browserSeason)
            }(), ia && (ia.textContent = "Episodios · Temporada " + (a[e].number || e + 1)), vn(i, a[e]), t)) {
            var n = ta ? ta.querySelector(".pe-ep.is-current") || it(ta) : null;
            n && tt(n)
        }
    }

    function hn(e) {
        var t = j.playerItem;
        if (t && e) {
            var i = sn(t),
                a = i[j.playerSeasonIndex];
            a && a.id === (t.seasonId || t.id) && t.episodes && t.episodes.length && (a._episodes = t.episodes);
            var n = void 0 !== j.playerSeasonIndex && null !== j.playerSeasonIndex ? j.playerSeasonIndex : j.browserSeason || 0,
                r = i[n];
            r && (j.detailSeason !== n && (j.detailSeason = n, j.detailNeedsRebuild = !0), r.id && (t.seasonId = r.id), r._episodes && (t.episodes = r._episodes)), un(), va && an(), gn(t, e)
        }
    }

    function gn(e, t, saveHistory) {
        if (e && t) {
            !1 !== saveHistory && ar(), j.playerItem = e, j.playerEpisode = t, j.detailEpisode = t, j.playerSeasonIndex = j.detailSeason || 0, ye && be && vr(), bn(e), j.episodeSwitchTimer && clearTimeout(j.episodeSwitchTimer), j.episodeSwitchSeq = (j.episodeSwitchSeq || 0) + 1;
            var i = j.episodeSwitchSeq;
            nr("Cambiando capítulo…"), j.episodeSwitchTimer = setTimeout(function() {
                j.episodeSwitchTimer = null, i === j.episodeSwitchSeq && ("player" === j.screen || "detail" === j.screen) && (j.resumePosition = 0, sr(e, t))
            }, 600)
        }
    }

    function mn() {
        _e || (_e = t("next-episode-loading")), _e && (_e.classList.remove("is-active"), _e.style.backgroundImage = "")
    }

    function showNextEpisodeLoading(item) {
        _e || (_e = t("next-episode-loading")), _e && (_e.style.backgroundImage = item && (item.backdrop || item.landscape || item.poster) ? 'url("' + String(item.backdrop || item.landscape || item.poster).replace(/"/g, "%22") + '")' : "", _e.classList.add("is-active"))
    }

    function closeNextEpisodePrompt(restoreFocus) {
        j.nextEpisodeOpen = !1, j.nextEpisodeTimer && (clearTimeout(j.nextEpisodeTimer), j.nextEpisodeTimer = null);
        var prompt = t("next-episode-prompt");
        prompt && prompt.classList.remove("is-active"), j.nextEpisodeTarget = null, restoreFocus && ye && tt(ye)
    }

    function cancelNextEpisodePrompt() {
        j.nextEpisodeDismissed = !0, closeNextEpisodePrompt(!0)
    }

    function updateNextEpisodeCountdown() {
        var count = t("next-episode-count");
        count && (count.textContent = String(j.nextEpisodeCountdown))
    }

    function startNextEpisode(target) {
        var item = j.playerItem;
        if (!item || !target) return;
        var seq = ++j.nextEpisodeSeq;
        window.TUTYTV_WEB && window.console && console.log("[TUTYTV] next target", {
            kind: target.kind,
            seasonIndex: target.seasonIndex,
            seasonId: target.season && target.season.id,
            episodeId: target.episode && target.episode.id
        }), ar(), showNextEpisodeLoading(item);
        if ("episode" === target.kind) return j.detailSeason = target.seasonIndex, j.playerSeasonIndex = target.seasonIndex, void gn(item, target.episode, !1);
        var seasons = sn(item),
            season = target.season;
        if (!season) return void mn();
        ln(item, season, function(episodes, detail) {
            if (seq !== j.nextEpisodeSeq || j.playerItem !== item || "player" !== j.screen) return;
            window.TUTYTV_WEB && window.console && console.log("[TUTYTV] next season loaded", {
                seasonId: season.id,
                episodes: episodes && episodes.length
            });
            if (!episodes || !episodes.length) return void mn();
            detail && R(item, detail), item.seasons = seasons, j.detailSeason = target.seasonIndex, j.playerSeasonIndex = target.seasonIndex, item.seasonId = season.id || item.seasonId, item.episodes = episodes, season._episodes = episodes, j.detail === item && (j.detailNeedsRebuild = !0), gn(item, episodes[0], !1)
        })
    }

    function confirmNextEpisodePrompt() {
        if (!j.nextEpisodeOpen) return;
        var target = j.nextEpisodeTarget;
        closeNextEpisodePrompt(!1), startNextEpisode(target)
    }

    function showNextEpisodePrompt(target, seconds) {
        if (!target || j.nextEpisodeOpen || j.nextEpisodeDismissed) return;
        var prompt = t("next-episode-prompt");
        if (!prompt) return void startNextEpisode(target);
        j.nextEpisodeOpen = !0, j.nextEpisodeTarget = target, j.nextEpisodeCountdown = Math.max(1, Math.min(7, Math.ceil(Number(seconds) || 7)));
        var item = j.playerItem,
            kicker = t("next-episode-kicker"),
            title = t("next-episode-title"),
            play = t("next-episode-play"),
            cancel = t("next-episode-cancel");
        kicker && (kicker.textContent = "season" === target.kind ? "Siguiente temporada" : "Siguiente episodio"), title && (title.textContent = "season" === target.kind ? "Temporada " + (target.season && target.season.number || target.seasonIndex + 1) : dn(item, target.episode) || "Episodio siguiente");
        play && (play._activate = confirmNextEpisodePrompt), cancel && (cancel._activate = cancelNextEpisodePrompt), updateNextEpisodeCountdown(), prompt.classList.add("is-active"), play && tt(play);

        function tick() {
            if (!j.nextEpisodeOpen) return;
            j.nextEpisodeCountdown = Math.max(0, j.nextEpisodeCountdown - 1), updateNextEpisodeCountdown(), j.nextEpisodeCountdown ? j.nextEpisodeTimer = setTimeout(tick, 1e3) : confirmNextEpisodePrompt()
        }
        j.nextEpisodeTimer && clearTimeout(j.nextEpisodeTimer), j.nextEpisodeTimer = setTimeout(tick, 1e3)
    }

    function findNextPlaybackTarget() {
        var item = j.playerItem;
        if (!item || !S(item) || "player" !== j.screen) return null;
        var seasons = sn(item),
            preferred = Number(j.playerSeasonIndex) || 0,
            targetId = String(item.seasonId || item.id || ""),
            fallback = Number(j.detailSeason) || 0;
        if (seasons[preferred] && targetId && String(seasons[preferred].id || "") !== targetId)
            for (var index = 0; index < seasons.length; index++)
                if (String(seasons[index].id || "") === targetId) {
                    preferred = index;
                    break
                }
        var episodes = legacySeasonEpisodes(item, preferred);
        if (legacyFindEpisodeIndex(episodes, j.playerEpisode) < 0 && fallback !== preferred) {
            var fallbackEpisodes = legacySeasonEpisodes(item, fallback);
            legacyFindEpisodeIndex(fallbackEpisodes, j.playerEpisode) >= 0 && (preferred = fallback, episodes = fallbackEpisodes)
        }
        var target = legacyResolveNextPlaybackTarget(seasons, preferred, fallback, episodes, j.playerEpisode);
        window.TUTYTV_WEB && window.console && !target && console.log("[TUTYTV] next target not found", {
            item: item && item.id,
            seasonId: item && item.seasonId,
            preferred: preferred,
            fallback: fallback,
            episodes: episodes.length,
            episode: j.playerEpisode && j.playerEpisode.id
        });
        return target
    }

    function maybeShowNextEpisodePrompt(position, total) {
        if (j.nextEpisodeDismissed || j.nextEpisodeOpen || "vod" !== j.playerMode || !(total > 0) || position < total - 7) return;
        var target = findNextPlaybackTarget();
        target && showNextEpisodePrompt(target, total - position)
    }

    function yn() {
        var item = j.playerItem;
        if (item && S(item) && "player" === j.screen) {
            if (j.nextEpisodeDismissed) return void mn();
            var target = findNextPlaybackTarget();
            target ? showNextEpisodePrompt(target) : mn()
        }
    }

    function bn(e) {
        if (se)
            for (var t = se.querySelectorAll(".detail-episode"), i = 0; i < t.length; i++) {
                var a = !(!t[i]._ep || !j.detailEpisode || t[i]._ep.id !== j.detailEpisode.id);
                t[i].classList.toggle("is-playing", a)
            }
    }

    function Cn() {
        var e = legacyRelayStreamMode(j.streamMode);
        if (ji) {
            ji.classList.toggle("is-selected", e);
            var t = ji.querySelector(".psv-check");
            t && (t.style.display = e ? "block" : "none")
        }
        if (Wi) {
            Wi.classList.toggle("is-selected", !e);
            var i = Wi.querySelector(".psv-check");
            i && (i.style.display = e ? "none" : "block")
        }
    }

    function wn() {
        if (Gi)
            for (var e = Gi.querySelectorAll(".psv-btn"), t = 0; t < e.length; t++) {
                var i = e[t].getAttribute("data-aspect") === _a;
                e[t].classList.toggle("is-selected", i);
                var a = e[t].querySelector(".psv-check");
                a && (a.style.display = i ? "block" : "none")
            }
    }

    function xn(e) {
        _a = e || "contain", we && (we.classList.remove("aspect-cover", "aspect-contain", "aspect-16-9", "aspect-4-3"), we.classList.add("aspect-" + _a)), wn()
    }

    function Sn(e) {
        if (Bi || En(), Bi) {
            ha && (clearTimeout(ha), ha = null), fa = !0, Na = j.focus;
            var t = e || Ha();
            "detail" === j.screen && (t = j.detail || t), Ln(), kn(), Fa(), Bi.classList.add("is-active"), Qa(t, function() {
                fa && (Ln(), kn())
            });
            var i = aa && aa.querySelector(".focusable") || na || pa;
            i && tt(i)
        }
    }

    function _n() {
        fa = !1, Bi && Bi.classList.remove("is-active"), va ? (Vi && tt(Vi), en()) : Na && Ye(Na) ? tt(Na) : "player" === j.screen && tt(ye), Na = null
    }

    function Ln() {
        if (aa) {
            i(aa);
            var t = Aa[Ja(Ha())];
            t && !ma && (ga = Ka(t.audio));
            var _core = window.TutyCore,
                a = _core && typeof _core.parseAudioTracks === "function" ? _core.parseAudioTracks(t && t.audio) : function(e) {
                    for (var t = [], i = (e && e.audio || "").split(/[,\/]/), a = 0; a < i.length; a++) {
                        var n = i[a].trim();
                        n && t.push({
                            index: a,
                            code: n,
                            label: Mn(n)
                        })
                    }
                    return t
                }(t);
            a.length || (a = [{
                index: ga || 0,
                label: "Español"
            }]);
            for (var n = 0; n < a.length; n++)(function(t) {
                var i = e("button", "dps-btn focusable");
                i.textContent = t.label, ga === t.index && i.classList.add("is-selected"), i._activate = function() {
                    In(t.index, t.code), Ln(), en()
                }, aa.appendChild(i)
            })(a[n])
        }
    }

    function kn() {
        var t = Ya(Aa[Ja(Ha())]);
        if (na) {
            var a = na.parentNode;
            a && a.classList.toggle("is-hidden", !t.length), na.classList.toggle("is-on", ba);
            var n = na.querySelector(".dps-switch-text");
            n && (n.textContent = ba ? "ON" : "OFF")
        }
        if (ra && ra.classList.toggle("is-visible", ba && t.length > 0), oa && oa.classList.toggle("is-visible", ba && t.length > 0), sa && sa.classList.toggle("is-visible", ba && t.length > 0), ba) {
            if (la) {
                i(la);
                for (var r = 0; r < t.length; r++)(function(t) {
                    var i = e("button", "dps-btn focusable");
                    i.textContent = Mn(t.lang || "Sub"), ya && ya.url === t.url && i.classList.add("is-selected"), i._activate = function() {
                        ya = t, ba = !0, Ca = !0, j.playback.subtitle = !0, j.playback.subCode = t.lang || "", j.playback.subLang = legacyLanguagePreference(t.lang, j.playback.subLang), Q(), Ua(t), kn(), en()
                    }, la.appendChild(i)
                })(t[r])
            }
            if (da)
                for (var o = da.querySelectorAll(".dps-btn"), s = 0; s < o.length; s++) {
                    var l = o[s].getAttribute("data-size");
                    o[s].classList.toggle("is-selected", l === xa)
                }
            if (ca)
                for (var d = ca.querySelectorAll(".dps-btn"), c = 0; c < d.length; c++) {
                    var p = d[c].getAttribute("data-style");
                    d[c].classList.toggle("is-selected", p === Sa)
                }
        }
    }

    function Mn(e) {
        var _core = window.TutyCore;
        if (_core && typeof _core.describeLanguageLabel === "function") return _core.describeLanguageLabel(e);
        var t = (e || "").toLowerCase().trim().split(/[-_]/)[0];
        return /^(spa|esp|es|castellano|latino)$/.test(t) ? "Español" : /^(eng|ing|en)$/.test(t) ? "Inglés" : /^(jpn|jap|ja)$/.test(t) ? "Japonés" : /^(kor|cor|ko)$/.test(t) ? "Coreano" : /^(por|pt)$/.test(t) ? "Portugués" : /^(fra|fre|fr|franc)$/.test(t) ? "Francés" : /^(ita|it)$/.test(t) ? "Italiano" : /^(deu|ger|de)$/.test(t) ? "Alemán" : /^(chi|zho|zh)$/.test(t) ? "Chino" : t ? t.charAt(0).toUpperCase() + t.slice(1) : "Pista"
    }

    function In(e, code) {
        ga = e, ma = !0, j.playback.audioCode = code || "", j.playback.audio = legacyLanguagePreference(code, j.playback.audio), Q(), "player" === j.screen && we && (Hn ? rr(Hn + "?start=" + Math.floor(zn + (we.currentTime || 0)) + "&a=" + e) : ("relay" !== j.streamMode && "smooth" !== j.streamMode && (j.streamMode = "relay", Cn()), Tn()))
    }

    function Tn() {
        if (we) {
            var e = Hn ? zn + (we.currentTime || 0) : we.currentTime || 0,
                t = j.playerItem;
            ar(), nr("Cambiando reproductor…"), or(t, function(t) {
                if (t) {
                    if (/\/s\/[0-9a-f]+\.mp4/i.test(t)) {
                        var i = t + "?start=" + Math.floor(e);
                        ga && (i += "&a=" + ga), rr(i)
                    } else if (rr(t), e > 0) try {
                        legacySeekVideo(we, e)
                    } catch (e) {}
                } else j.streamError || nr("Sin fuente de reproducción")
            })
        }
    }

    function En() {
        if (ye = t("player-stage"), be = t("player-infobar"), Le = t("player-vod-infobar"), Ce = t("player-channels"), je = t("player-categories"), We = t("pcat-grid"), $e = t("pcat-sub"), we = t("player-video"), Se = t("player-status"), _e = t("next-episode-loading"), Ae = t("player-osd-icon"), xe = ye ? ye.querySelector(".player-frame") : null, ke = t("vod-infobar-poster"), Me = t("vod-infobar-title"), Ie = t("vod-time-current"), Te = t("vod-time-total"), Ee = t("vod-seekbar"), qe = t("vod-seek-progress"), Oe = t("vod-seek-buffered"), De = t("vod-seek-thumb"), Ee && (Ee.classList.add("focusable"), Ee._activate = function() {
                er(!0)
            }, Ee._onMove = function(e) {
                return "left" === e ? (ir(-1), !0) : "right" === e ? (ir(1), !0) : ("down" === e || "up" === e) && (er(!1), !0)
            }), Fi = t("player-playsetting-view"), Hi = t("psv-sec-selection"), zi = t("psv-episodes-row"), Ji = t("psv-btn-episodes"), Vi = t("psv-btn-config"), ji = t("psv-btn-p1"), Wi = t("psv-btn-p2"), $i = t("psv-sec-audio"), t("psv-sec-quality"), t("psv-quality-row"), t("psv-sec-aspect"), t("psv-sec-player"), Xi = t("psv-btn-feedback"), Gi = t("psv-aspect-row"), Qi = t("player-episodes"), Ki = t("pe-title"), Yi = t("pe-sub"), Zi = t("pe-seasons"), ea = t("pe-seasons-col"), ta = t("pe-episodes"), ia = t("pe-season-label"), Ji && (Ji._activate = function() {
                pn()
            }), Xi && (Xi._activate = function() {
                en()
            }), Vi && (Vi._activate = function() {
                Sn()
            }), ji && (ji._activate = function() {
                $a(Ha(), !0), Cn(), en(), Tn()
            }), Wi && (Wi._activate = function() {
                $a(Ha(), !1), Cn(), en(), Tn()
            }), Gi)
            for (var a = Gi.querySelectorAll(".psv-btn"), n = 0; n < a.length; n++)(function(e) {
                e._activate = function() {
                    xn(e.getAttribute("data-aspect"))
                }
            })(a[n]);
        if (Bi = t("dialog-playsettings"), aa = t("dps-audio-options"), na = t("dps-sub-switch"), ra = t("dps-row-lang"), oa = t("dps-row-size"), sa = t("dps-row-style"), la = t("dps-lang-options"), da = t("dps-size-options"), ca = t("dps-style-options"), pa = t("dps-btn-exit"), ua = t("player-subtitles"), na && (na._activate = function() {
                if (Ca = !0, ba = !ba) {
                    var e = Ya(Aa[Ja(Ha())]);
                    !ya && e.length && (ya = e[0]), ya && Ua(ya)
                } else Ua(null);
                j.playback.subtitle = ba, Q(), kn(), en()
            }), da)
            for (var r = da.querySelectorAll(".dps-btn"), o = 0; o < r.length; o++)(function(e) {
                e._activate = function() {
                    var value = e.getAttribute("data-size") || "normal";
                    xa = value, j.playback.size = Math.max(0, ["normal", "big", "small"].indexOf(value)), Q(), Fa(), kn()
                }
            })(r[o]);
        if (ca)
            for (var s = ca.querySelectorAll(".dps-btn"), l = 0; l < s.length; l++)(function(e) {
                e._activate = function() {
                    var value = e.getAttribute("data-style") || "white";
                    Sa = value, j.playback.style = Math.max(0, ["white", "yellow", "black"].indexOf(value)), Q(), Fa(), kn()
                }
            })(s[l]);
        pa && (pa._activate = function() {
            _n()
        }), Fa(), ka(), i(be), i(Ce), ye.classList.add("focusable"), ye._onMove = function(e) {
            return "vod" === j.playerMode ? "left" === e ? (Oi(-10), !0) : "right" === e ? (Oi(10), !0) : "down" === e ? (tn(), !0) : "up" === e && (tr(), !0) : "left" === e ? (hr(), !0) : "right" === e ? (gr(), !0) : "up" === e ? (Vt(j.channel - 1), !0) : "down" === e && (Vt(j.channel + 1), !0)
        }, ye._activate = function() {
            "vod" !== j.playerMode ? j.infobar ? Ni() : Pi() : Di()
        }, be.appendChild(e("div", "pi-logo")), be.appendChild(e("div", "pi-index"));
        var d = e("div", "pi-namerow"),
            c = e("div", "pi-name");
        d.appendChild(c);
        var p = e("div", "pi-uhd");
        p.style.left = "20px", d.appendChild(p), be.appendChild(d), be.appendChild(e("div", "pi-date")), be.appendChild(e("div", "pi-range")), be.appendChild(e("div", "pi-now")), be.appendChild(e("div", "pi-next"));
        var u = e("div", "pi-seek");
        u.appendChild(e("div", "bar")), be.appendChild(u), be.appendChild(e("div", "pi-menu", "info")), be.appendChild(e("div", "pi-quality", "HD")), be.appendChild(e("div", "pi-scale", "Normal")), be.appendChild(e("div", "pi-func", "Selecion de función"));
        for (var v = e("div", "pi-actions"), f = [{
                label: "Pip",
                right: 446,
                w: 67,
                hidden: !0
            }, {
                label: "HD",
                right: 389,
                w: 67
            }, {
                label: "Anterior",
                right: 333,
                w: 67
            }, {
                label: "Formato",
                right: 249,
                w: 120
            }, {
                label: "Favorito",
                right: 219,
                w: 67
            }, {
                label: "Reproductor 1",
                right: 151,
                w: 90
            }, {
                label: "Bloquear",
                right: 107,
                w: 67
            }, {
                label: "Feedback",
                right: 50,
                w: 67
            }], h = 0; h < f.length; h++) {
            var g = f[h];
            if (!g.hidden) {
                var m = e("div", "pi-act focusable", g.label);
                m.style.width = 1.5 * g.w + "px", m.style.left = 1920 - 1.5 * g.right - 1.5 * g.w + "px", m._kind = g.label, m._activate = function(e) {
                    return function() {
                        if ("Anterior" === e) Vt(j.channel - 1);
                        else if ("Formato" === e) {
                            var t = be.querySelector(".pi-scale");
                            t.textContent = "Normal" === t.textContent ? "16:9" : "16:9" === t.textContent ? "4:3" : "Normal", fr()
                        } else if ("Favorito" === e) {
                            var i = F[j.channel];
                            i && (liveToggleFav(i), Ht(liveFavFilter))
                        }
                    }
                }(g.label), v.appendChild(m)
            }
        }
        be.appendChild(v);
        var y = e("div", "pc-header");
        y.appendChild(e("div", "pc-title", "Canales de TV")), Ce.appendChild(y);
        var b = e("div", "pc-categories scrollable");
        b.id = "pc-categories", Ce.appendChild(b), Ce.appendChild(e("div", "pc-div"));
        var C = e("div", "pc-list scrollable");
        Ce.appendChild(C), qn(), Rn();
        var w = e("div", "pc-menu");
        w.appendChild(e("div", "ic")), w.appendChild(e("div", "l1", "Presione [OK] para reproducir")), w.appendChild(e("div", "l2", "(Arriba: Categorías · OK: Filtrar)")), Ce.appendChild(w)
    }

    function qn() {
        if (Ce) {
            var t = Ce.querySelector(".pc-categories");
            if (t) {
                for (var a = St && St.length ? St : [{
                        id: 76182,
                        name: "Todos"
                    }, {
                        id: 76206,
                        name: "Deportes"
                    }, {
                        id: 76205,
                        name: "Cine y Series"
                    }, {
                        id: 76188,
                        name: "Colombia"
                    }, {
                        id: 76191,
                        name: "España"
                    }, {
                        id: 76197,
                        name: "México"
                    }, {
                        id: "addons",
                        name: "➕ Addons M3U",
                        isAddon: !0
                    }], n = "", r = 0; r < a.length; r++) n += a[r].id + "|";
                var o = j.focus && j.focus._cat ? j.focus._cat : null;
                if (n !== Xe) {
                    i(t);
                    for (var s = [], l = 0; l < a.length; l++) {
                        var d = a[l],
                            c = e("button", "pc-cat-pill focusable", d.name);
                        c._cat = d, c._idx = l, c._activate = function(e) {
                            return function() {
                                Ut(e)
                            }
                        }(d), c._onMove = function(e) {
                            return function(i) {
                                if ("left" === i) return e > 0 && s[e - 1] && (tt(s[e - 1]), Pn(t, s[e - 1])), !0;
                                if ("right" === i) return e < s.length - 1 && s[e + 1] ? (tt(s[e + 1]), Pn(t, s[e + 1])) : tt(ye), !0;
                                if ("up" === i) return Dn(), !0;
                                if ("down" === i) {
                                    var a = Ce.querySelector(".pc-row-addon-promo");
                                    if (a) return tt(a), !0;
                                    if (F.length) return Nn(j.channel), !0
                                }
                                return !1
                            }
                        }(l), t.appendChild(c), s.push(c)
                    }
                    t._pills = s, Xe = n
                }
                for (var p = _t || a[0], u = t._pills || [], v = 0; v < u.length; v++) {
                    var f = u[v];
                    f._cat && p && f._cat.id === p.id ? f.classList.add("is-selected") : f.classList.remove("is-selected")
                }
                if (o) {
                    for (var h = null, g = 0; g < u.length; g++)
                        if (u[g]._cat && u[g]._cat.id === o.id) {
                            h = u[g];
                            break
                        } h && (j.focus !== h && tt(h), Pn(t, h))
                }
            }
        }
    }

    function On() {
        if (Ce) {
            var e = Ce.querySelector(".pc-categories"),
                t = e ? e.querySelector(".pc-cat-pill.is-selected") : null;
            e && t && Pn(e, t)
        }
    }

    function Dn() {
        if (je || (je = t("player-categories"), We = t("pcat-grid"), $e = t("pcat-sub")), je && We) {
            j.categoryPickerOpen = !0, je.classList.add("is-active"), Ni(),
                function() {
                    if (!We) return;
                    var t = St && St.length ? St : [];
                    i(We), $e && ($e.textContent = t.length ? t.length + " categorías · elige una para filtrar los canales" : "Cargando categorías…");
                    for (var a = 0; a < t.length; a++)(function(t) {
                        var i = e("div", "pcat-tile focusable");
                        i.appendChild(e("div", "pcat-name", t.name)), _t && _t.id === t.id && i.classList.add("is-selected"), i._cat = t, i._activate = function() {
                            Ut(t), An(!0);
                            var e = Ce ? Ce.querySelector(".pc-cat-pill.is-selected") : null;
                            e ? (tt(e), On()) : gr()
                        }, We.appendChild(i)
                    })(t[a])
                }();
            var a = We.querySelector(".pcat-tile.is-selected") || it(We);
            a && tt(a)
        }
    }

    function An(e) {
        if (je && j.categoryPickerOpen && (j.categoryPickerOpen = !1, je.classList.remove("is-active"), !e)) {
            var t = Ce ? Ce.querySelector(".pc-cat-pill.is-selected") : null;
            t ? (tt(t), On()) : "player" === j.screen && ye && tt(ye)
        }
    }

    function Pn(e, t) {
        if (e && t) {
            var i = t.offsetLeft,
                a = t.offsetWidth,
                n = e.scrollLeft,
                r = e.clientWidth;
            i < n ? e.scrollLeft = i - 20 : i + a > n + r && (e.scrollLeft = i + a - r + 20)
        }
    }

    function Nn(e) {
        F.length && (e = Math.max(0, Math.min(F.length - 1, Number(e) || 0)), Ve[e] || Rn(e), Ve[e] && tt(Ve[e]))
    }

    function Rn(t) {
        if (Ce) {
            var a = Ce.querySelector(".pc-list");
            if (a) {
                if (i(a), Ve = {}, _t && _t.isAddon) {
                    var n = e("div", "pc-row-addon-promo focusable");
                    n.appendChild(e("div", "promo-icon", "⚙️"));
                    var o = e("div", "promo-info");
                    o.appendChild(e("div", "promo-text", "➕ Administrar Addons y Listas M3U")), o.appendChild(e("div", "promo-sub", "Instala listas recomendadas o agrega tu enlace")), n.appendChild(o), n._activate = function() {
                        jt()
                    }, n._onMove = function(e) {
                        if ("up" === e) {
                            var t = Ce.querySelector(".pc-cat-pill.is-selected") || Ce.querySelector(".pc-cat-pill");
                            return t && tt(t), !0
                        }
                        return "down" === e ? (F.length && Nn(0), !0) : "right" === e && (tt(ye), !0)
                    }, a.appendChild(n)
                }
                if (!F.length) {
                    var s = e("div", "pc-empty-channels", "No hay canales disponibles en esta categoría");
                    return s.style.padding = "30px", s.style.color = "#888", s.style.fontSize = "20px", void a.appendChild(s)
                }
                t = Number(t), isFinite(t) || (t = j.channel), t = Math.max(0, Math.min(F.length - 1, t || 0));
                for (var l = Math.max(0, t - Math.floor(Ge / 2)), d = Math.min(F.length, l + Ge), c = l = Math.max(0, d - Ge); c < d; c++) {
                    var p = e("div", "pc-row focusable");
                    p._channel = c;
                    var u = e("div", "ic");
                    F[c].logo && (u.style.backgroundImage = "url(" + F[c].logo + ")", u.style.backgroundSize = "contain", u.style.backgroundRepeat = "no-repeat", u.style.backgroundPosition = "center");
                    var v = e("div", "num", r(F[c].index || c + 1)),
                        f = e("div", "nm", F[c].name),
                        h = e("div", "epg", F[c].now || "En vivo");
                    p.appendChild(u), p.appendChild(v), p.appendChild(f), p.appendChild(h), c === j.channel && p.classList.add("is-current"), p._activate = function(e) {
                        return function() {
                            Vt(e, !0), gr(), tt(ye)
                        }
                    }(c), p._onMove = function(e) {
                        return function(t) {
                            if ("right" === t) return tt(ye), !0;
                            if ("up" === t) {
                                if (e > 0) Nn(e - 1);
                                else if (0 === e) {
                                    var i = Ce.querySelector(".pc-row-addon-promo");
                                    if (i) tt(i);
                                    else {
                                        var a = Ce.querySelector(".pc-cat-pill.is-selected") || Ce.querySelector(".pc-cat-pill");
                                        a && tt(a)
                                    }
                                }
                                return !0
                            }
                            return "down" === t && (e < F.length - 1 && Nn(e + 1), !0)
                        }
                    }(c), a.appendChild(p), Ve[c] = p
                }
            }
        }
    }
    var Un = "",
        Fn = "",
        Bn = 0,
        Hn = "",
        zn = 0,
        Hd = 0,
        Vn = 0,
        jn = null,
        Wn = null;

    function $n() {
        Wn && (clearTimeout(Wn), Wn = null)
    }

    function Xn(e) {
        Wn || j.streamError || (Wn = setTimeout(function() {
            Wn = null, legacyShouldReportBuffering(j.streamError, !!we, we ? we.paused : !1, we ? we.readyState : 0) && nr(e)
        }, legacyPlaybackTiming().bufferNoticeMs))
    }
    var Gn = !1,
        Jn = null;

    function Qn() {
        Gn = !1, Jn && (clearTimeout(Jn), Jn = null)
    }

    function Kn() {
        if (jn = null, we && Vn) {
            if (Hn) {
                if (Gn) return void(Vn = 0);
                Gn = !0;
                var i = j.playerItem && j.playerItem.duration || we.duration || 0;
                zn = legacyRelaySeekTarget(zn, we.currentTime || 0, Vn, i);
                Vn = 0, Qe = zn;
                var a = Hn + "?start=" + zn;
                return Jn = setTimeout(Qn, legacyPlaybackTiming().relaySeekResetMs), void rr(a)
            }
            var n = legacyLocalSeekTarget(we.currentTime || 0, Vn, we.duration || 0);
            Vn = 0, Qe = n;
            try {
                legacySeekVideo(we, n)
            } catch (e) {}
        } else Vn = 0
    }

    function Oi(e) {
        we && (Vn += e, jn && clearTimeout(jn), jn = setTimeout(Kn, legacyPlaybackTiming().seekCommitMs), qi(e > 0 ? "forward" : "backward"), setTimeout(function() {
            qi("none")
        }, 600))
    }

    function Yn() {
        return we ? legacyCurrentPlaybackPosition(we.currentTime || 0, Hn, zn) : 0
    }

    function Zn() {
        var video = we && isFinite(we.duration) && we.duration > 0 ? we.duration : 0,
            episode = j.playerEpisode && j.playerEpisode.duration ? Mi(j.playerEpisode.duration) : 0,
            item = j.playerItem && j.playerItem.duration ? Mi(j.playerItem.duration) : 0,
            inferred = legacyInferEpisodeDuration(j.playerItem && j.playerItem.episodes, j.playerEpisode);
        return legacyResolvePlaybackTotalWithRelay({
            hasRelay: !!Hn,
            relayBase: zn,
            probedDuration: Hd,
            videoDuration: video,
            episodeDuration: episode,
            itemDuration: item,
            inferredDuration: inferred
        })
    }

    function probeRelayDuration(source) {
        var expected = String(source || "").split("?")[0],
            endpoint = legacyRelayDurationEndpoint(source),
            attempts = 0;
        if (!endpoint || "undefined" == typeof XMLHttpRequest) return;

        function poll() {
            if (Hn !== expected) return;
            var xhr = new XMLHttpRequest;
            xhr.open("GET", endpoint, !0), xhr.timeout = 2e3, xhr.onload = function() {
                if (Hn !== expected) return;
                try {
                    var data = JSON.parse(xhr.responseText),
                        duration = Number(data && data.duration) || 0;
                    if (duration > 0) return Hd = duration, void("vod" === j.playerMode && Ei(Yn(), Zn()))
                } catch (e) {}
                ++attempts < 20 && setTimeout(poll, 1e3)
            }, xhr.onerror = xhr.ontimeout = function() {
                Hn === expected && ++attempts < 20 && setTimeout(poll, 1e3)
            };
            try {
                xhr.send()
            } catch (e) {}
        }
        poll()
    }

    function er(e) {
        if (Je) {
            Je = !1, Ee && Ee.classList.remove("is-scrubbing"), Ei(jn || Vn ? Qe : Yn(), Zn()), tt(ye), Ai()
        }
    }

    function tr() {
        var e = Zn();
        Ee && e ? (Qe = Math.max(0, Math.min(e - 1, Yn())), Je = !0, Ee.classList.add("is-scrubbing"), Pi(), j.infoTimer && (clearTimeout(j.infoTimer), j.infoTimer = null), Ei(Qe, e), tt(Ee)) : Pi()
    }

    function ir(e) {
        var t = Zn();
        if (Je && t) {
            Qe = Math.max(0, Math.min(t - 1, (jn || Vn ? Qe : Yn()) + 10 * e)), Ei(Qe, t), Oi(10 * e)
        }
    }

    function ar() {
        legacyShouldSaveHistoryBeforeReset(j.playerMode, !!we) && Ta(legacyCurrentPlaybackPosition(we.currentTime || 0, Hn, zn), legacyResolvePlaybackTotal(we.duration, j.playerEpisode && j.playerEpisode.duration ? Mi(j.playerEpisode.duration) : 0, j.playerItem && j.playerItem.duration ? Mi(j.playerItem.duration) : 0), !0);
        j.streamError = "", $n(), nr(""), qi("none"), Ti(), jn && (clearTimeout(jn), jn = null, Vn = 0), Qn(), Hn = "", zn = 0, Hd = 0, Bn++;
        var e = legacyResolveAbortServiceBase(Un, Fn);
        if (e) try {
            var i = new XMLHttpRequest;
            i.open("GET", e + "/media/abort", !0), i.send()
        } catch (e) {}
        try {
            q("abortMedia", {}, function() {})
        } catch (e) {}
        legacyDestroyHls("__tutyHls");
        if (Fn = "", Un = "", we) {
            try {
                we.onerror = null
            } catch (e) {}
            try {
                legacyPauseVideo(we)
            } catch (e) {}
            try {
                legacySeekVideo(we, 0)
            } catch (e) {}
            we.removeAttribute("src");
            try {
                legacySetVideoSource(we, "")
            } catch (e) {}
            for (; we.firstChild;) we.removeChild(we.firstChild);
            legacyApplyPlaybackSurface(we, xe, !1)
        }
    }

    function nr(e) {
        Se || (Se = t("player-status")), legacyApplyPlayerStatus(Se, e)
    }

    function rr(e, t) {
        if (we && e) {
            var i = !!(t = t || {}).nativeHls,
                resumeAt = Number(j.resumePosition) || 0;
            j.resumePosition = 0;
            var applyResume = function() {
                if (resumeAt > 0) {
                    try {
                        legacySeekVideo(we, resumeAt)
                    } catch (e) {}
                    resumeAt = 0
                }
            };
            j.noHistorySave = !0, ar(), j.noHistorySave = !1, j.nextEpisodeDismissed = !1, Fn = e;
            var a = /^(http:\/\/127\.0\.0\.1:\d+)/.exec(e);
            if (a && (Un = a[1]), /\/s\/[0-9a-f]+\.mp4/i.test(e)) {
                Hn = e.split("?")[0];
                var n = /[?&]start=(\d+)/.exec(e);
                zn = n ? parseInt(n[1], 10) : 0, Hd = 0, probeRelayDuration(Hn)
            } else Hn = "", zn = 0;
            nr("Conectando con el vídeo…"), j.streamError = "";
            try {
                we.preload = "auto"
            } catch (e) {}
            var descriptor = legacyDescribePlaybackStream(e, j.playerItem && j.playerItem.streamMime || "", j.playerItem && j.playerItem.isHls),
                o = descriptor.isHls,
                s = descriptor.contentType;
            legacyWirePlaybackVideoEvents(we, {
                error: function() {
                mn(), Qn();
                var t = we.error && we.error.code,
                    retry = legacyNativeRetry(t, j.playerMode, j.streamMode, o, i, !!j.playerItem);
                if ("native-hls" === retry) {
                    var a = cr;
                    return nr("Reintentando señal con compatibilidad webOS…"), void legacySchedulePlaybackRetry(function() {
                        return "live" === j.playerMode && cr === a
                    }, function() {
                        rr(e, {
                            nativeHls: !0
                        })
                    })
                }
                if ("compatible-vod" === retry) {
                    var n = j.playerItem,
                        r = ja(n);
                    if (Va !== r) return Va = r, $a(n, !0), nr("Reintentando película en modo compatible…"), void legacySchedulePlaybackRetry(function() {
                        return "vod" === j.playerMode && j.playerItem === n && "smooth" === j.streamMode
                    }, function() {
                        Tn()
                    })
                }
                j.streamError = "No se pudo abrir el stream (código " + (t || "error") + ")", legacyApplyPlaybackSurface(we, xe, !1), nr(j.streamError)
            },
                loadeddata: v,
                canplay: function() {
                Qn(), v()
            },
                loadedmetadata: function() {
                if (v(), "vod" === j.playerMode) {
                    var e = Hn ? zn : we.currentTime || 0,
                        t = we && isFinite(we.duration) && we.duration > 0 ? we.duration : 0,
                        i = j.playerEpisode && j.playerEpisode.duration ? Mi(j.playerEpisode.duration) : 0,
                        a = j.playerItem && j.playerItem.duration ? Mi(j.playerItem.duration) : 0;
                    Ei(e, t || i || a || 0)
                }
                applyResume()
            },
                durationchange: function() {
                if ("vod" === j.playerMode) {
                    var position = legacyCurrentPlaybackPosition(we.currentTime || 0, Hn, zn),
                        total = legacyResolvePlaybackTotal(we.duration, j.playerEpisode && j.playerEpisode.duration ? Mi(j.playerEpisode.duration) : 0, j.playerItem && j.playerItem.duration ? Mi(j.playerItem.duration) : 0);
                    Ei(position, total)
                }
            },
                playing: function() {
                mn(), v()
            },
                ended: function() {
                "vod" === j.playerMode && yn()
            },
                timeupdate: function() {
                if (we.currentTime > 0 && v(), "vod" === j.playerMode) {
                    var position = legacyCurrentPlaybackPosition(we.currentTime || 0, Hn, zn),
                        total = legacyResolvePlaybackTotal(we.duration, j.playerEpisode && j.playerEpisode.duration ? Mi(j.playerEpisode.duration) : 0, j.playerItem && j.playerItem.duration ? Mi(j.playerItem.duration) : 0);
                    Ei(position, total), Ba(position), Ta(position, total), maybeShowNextEpisodePrompt(position, Zn())
                }
            },
                pause: function() {
                (Ti(), "vod" === j.playerMode) && (Ta(legacyCurrentPlaybackPosition(we.currentTime || 0, Hn, zn), legacyResolvePlaybackTotal(we.duration, j.playerEpisode && j.playerEpisode.duration ? Mi(j.playerEpisode.duration) : 0, j.playerItem && j.playerItem.duration ? Mi(j.playerItem.duration) : 0), !0), qi("pause"))
            },
                play: function() {
                "vod" === j.playerMode && (qi("none"), Ti(), Ii = setInterval(function() {
                    if (legacyShouldTickPlayback(j.screen, j.playerMode, !!we, we ? we.paused : !0)) {
                        var position = legacyCurrentPlaybackPosition(we.currentTime || 0, Hn, zn),
                            total = legacyResolvePlaybackTotal(we.duration, j.playerEpisode && j.playerEpisode.duration ? Mi(j.playerEpisode.duration) : 0, j.playerItem && j.playerItem.duration ? Mi(j.playerItem.duration) : 0);
                        Ei(position, total), Ba(position), Ta(position, total)
                    }
                }, legacyPlaybackTiming().historyTickMs))
            },
                waiting: function() {
                Xn("Cargando vídeo…"), "vod" === j.playerMode && Ei(Yn(), Zn())
            },
                stalled: function() {
                Xn("Conectando…"), "vod" === j.playerMode && Ei(Yn(), Zn())
            },
                seeking: function() {
                "vod" === j.playerMode && Ei(Yn(), Zn())
            },
                seeked: function() {
                "vod" === j.playerMode && Ei(Yn(), Zn())
            },
                progress: function() {
                "vod" === j.playerMode && Ei(Yn(), Zn())
            }
            });
            var useHls = legacyShouldUseHls(o, i, legacyNativeTvPlayback(), !!(window.Hls && window.Hls.isSupported()));
            if (useHls) {
                legacyDestroyHls("__tutyHls");
                try {
                    legacyPauseVideo(we)
                } catch (e) {}
                try {
                    we.removeAttribute("src")
                } catch (e) {}
                try {
                    legacySetVideoSource(we, "")
                } catch (e) {}
                for (; we.firstChild;) we.removeChild(we.firstChild);
                try {
                    we.mediaOption = null
                } catch (e) {}
                var hls = new window.Hls({
                        enableWorker: !0,
                        backBufferLength: 30
                    }),
                    hlsPlay;
                window.__tutyHls = hls, legacyWireHlsPlaybackEvents(hls, window.Hls.Events, function(e, t) {
                    var _core = window.TutyCore;
                    if (_core && typeof _core.handleHlsError === "function") return _core.handleHlsError(hls, t, function() {
                        return window.Hls.ErrorTypes
                    }, function() {
                        j.streamError = "No se pudo abrir el stream (HLS)", nr(j.streamError)
                    });
                    if (t && t.fatal)
                        if (t.type === window.Hls.ErrorTypes.NETWORK_ERROR) try {
                            hls.startLoad()
                        } catch (e) {} else if (t.type === window.Hls.ErrorTypes.MEDIA_ERROR) try {
                            hls.recoverMediaError()
                        } catch (e) {}
                    else j.streamError = "No se pudo abrir el stream (HLS)", nr(j.streamError)
                }, function() {
                    try {
                        var e = legacyPlayVideo(we);
                        e && e.catch && e.catch(function() {})
                    } catch (e) {}
                    applyResume()
                }), legacyLoadHls(we, hls, e), legacyApplyPlaybackSurface(we, xe, !0);
                try {
                    hlsPlay = legacyPlayVideo(we), hlsPlay && hlsPlay.catch && hlsPlay.catch(function() {})
                } catch (e) {}
                return
            }
            for (; we.firstChild;) we.removeChild(we.firstChild);
            try {
                we.removeAttribute("src")
            } catch (e) {}
            if (o) {
                var l = {
                        mediaTransportType: "HLS",
                        option: {
                            transmission: {
                                playTime: {
                                    start: 0
                                }
                            }
                        }
                    },
                    d = encodeURI(JSON.stringify(l)),
                    c = i ? s : s + ";mediaOption=" + d;
                if (i) try {
                    we.mediaOption = null
                } catch (e) {} else try {
                    we.mediaOption = l
                } catch (e) {}
                var p = document.createElement("source");
                p.setAttribute("src", e), p.setAttribute("type", c), we.appendChild(p)
            } else {
                try {
                    we.mediaOption = null
                } catch (e) {}
                try {
                    legacySetVideoSource(we, e)
                } catch (e) {}
            }
            try {
                legacySeekVideo(we, 0)
            } catch (e) {}
            legacyApplyPlaybackSurface(we, xe, !0);
            try {
                o && legacyLoadVideo(we);
                var u = legacyPlayVideo(we);
                u && u.catch && u.catch(function() {
                    we.error || (j.streamError = "Pulsa OK para iniciar la reproducción", nr(j.streamError))
                })
            } catch (e) {
                j.streamError = "Pulsa OK para iniciar la reproducción", nr(j.streamError)
            }
        }

        function v() {
            $n(), nr("")
        }
    }

    function or(e, t) {
        var i = Bn;

        function a() {
            var resumeAt = Number(j.resumePosition) || 0,
                media = Aa[Ja(e)];
            media && !ma && (ga = Ka(media.audio));
            var built = legacyBuildPlaybackResolveRequest(e, j.playerEpisode, {
                streamMode: j.streamMode,
                resumePosition: resumeAt,
                trackIndex: j.trackIndex || 0,
                audioTrack: ga || 0,
                isSeries: S(e)
            });
            if (built.missingEpisodes) return t("");
            j.playerEpisode = built.episode, j.resumePosition = built.resumePosition;
            var request = built.request;

            function done(n, s) {
                if (i === Bn) {
                    if (n || !s || !1 === s.returnValue) return j.resumePosition = 0, j.streamError = "No se pudo resolver el título" + (n ? ": " + n : ""), nr(j.streamError), t("");
                    var applied = legacyApplyResolvedPlayback(e, j.playerEpisode, s, resumeAt);
                    try {
                        window.__tutyStreamInfo = applied.streamInfo
                    } catch (e) {}
                    j.resumePosition = applied.resumePosition, t(applied.url)
                }
            }

            function resolveCall(r) {
                q(r ? "resolveSmooth" : "resolve", request, function(e, t) {
                    if (e && r) return request.forceRelay = !1, resolveCall(!1);
                    done(e, t)
                })
            }
            resolveCall(request.forceRelay)
        }
        if (legacyShouldLoadSeriesEpisodesBeforePlay(e, j.playerEpisode)) return nr("Cargando capítulos…"), void U(e, function() {
            i === Bn && a()
        });
        a()
    }

    function sr(e, t) {
        if (j.resumeOpen) return;
        if (e || t) j.playerMode = "vod";
        if (we) {
            t && (j.playerEpisode = t, j.playerSeasonIndex = j.detailSeason || 0), e && (j.playerItem = e);
            var i = e || j.playerItem;
            if (i && Wa(i), j.noHistorySave = !0, ar(), j.noHistorySave = !1, i) {
                if (ma = !1, ga = 0, Qa(i), i._portal) {
                    var a = t && (t.number || t.seriesNumber) || "";
                    return nr(a ? "Cargando capítulo " + a + "…" : "Cargando capítulo…"), void or(i, function(e) {
                        e ? rr(e) : j.streamError || nr("Sin fuente de reproducción")
                    })
                }
                i.streamUrl && rr(i.streamUrl)
            }
        }
    }

    function lr(e, i) {
        ye || En();
        var a = !i || !j.playerEpisode || j.playerEpisode === i || j.playerEpisode.id === i.id,
            sameItem = j.playerItem === e,
            hasSession = !!we && legacyHasPlaybackSession(we.src, we.currentSrc, Fn, j.streamError),
            n = legacyShouldReusePlaybackSession("detail" === j.screen, hasSession, sameItem, a);
        if (!n && sameItem && a && we) {
            var currentPosition = legacyCurrentPlaybackPosition(we.currentTime || 0, Hn, zn);
            currentPosition > 0 && (j.resumePosition = currentPosition)
        }
        j.playerMode = "vod", e && j.playerItem !== e && Xa(), e && (j.playerItem = e), i && (j.playerEpisode = i, j.playerSeasonIndex = j.detailSeason || 0), e && Wa(e), j.playerReturn = {
            screen: "detail",
            focus: j.focus
        };
        var r = t("screen-player"),
            o = t("screen-detail");
        legacyApplyDetailPlayerTransition(r, o), j.screen = "player", legacyApplyPlayerModeClass(ye, !0), vr(), tt(ye), Ri(), n || sr(j.playerItem, j.playerEpisode)
    }

    function dr(e, t, i) {
        "vod" !== e || "detail" !== j.screen ? (ye || En(), "live" === e && Nt(), j.playerMode = e, t && j.playerItem !== t && Xa(), j.playerItem = t || null, j.playerEpisode = i || null, "vod" === e && (j.playerSeasonIndex = j.detailSeason || 0, t && Wa(t)), j.playerReturn = {
            screen: j.screen,
            focus: j.focus
        }, j.channelsOpen = !1, be.classList.remove("is-active"), Ce.classList.remove("is-active"), legacyApplyPlayerModeClass(ye, "vod" === e), vr(), nt("player"), tt(ye), vr(), "vod" === e ? (Ri(), sr(j.playerItem, j.playerEpisode)) : (Pi(), ur(F[j.channel]))) : lr(t, i)
    }
    var cr = 0,
        pr = null;

    function ur(e, t) {
        if (pr && (clearTimeout(pr), pr = null), e || (e = F[j.channel]), e && (e.channelCode || e.streamUrl)) {
            var i = function() {
                var t = ++cr;
                nr("Cargando señal " + (e.name || "") + "…"), q("resolveLive", e.streamUrl ? {
                    streamUrl: e.streamUrl
                } : {
                    channelCode: e.channelCode
                }, function(e, i) {
                    if (t === cr) {
                        if (e || !i || !1 === i.returnValue) return j.streamError = "No se pudo conectar con la señal" + (e ? ": " + e : ""), void nr(j.streamError);
                        var a = i.proxyPath || i.url;
                        if (!a) return j.streamError = "Señal no disponible", void nr(j.streamError);
                        nr(""), Pi(), rr(a)
                    }
                })
            };
            t ? i() : pr = setTimeout(i, legacyResolveLiveResolveDelay(!1))
        }
    }

    function vr() {
        var e = "live" === j.playerMode,
            t = F[j.channel] || {},
            i = be.querySelector(".pi-index"),
            a = be.querySelector(".pi-name"),
            n = be.querySelector(".pi-date"),
            o = be.querySelector(".pi-range"),
            s = be.querySelector(".pi-now"),
            d = be.querySelector(".pi-next"),
            c = be.querySelector(".pi-uhd"),
            p = be.querySelector(".pi-logo");
        if (e) Le && Le.classList.remove("is-active"), be && (be.style.display = ""), i.style.display = "block", i.textContent = r(t.index || j.channel + 1), a.textContent = t.name || "",
            function() {
                var e = be.querySelector(".pi-namerow");
                if (!e) return;
                be.querySelector(".pi-index");
                var t = e.querySelector(".pi-name"),
                    i = e.querySelector(".pi-uhd"),
                    a = 165;
                e.style.position = "absolute", e.style.left = 367.5 + a + "px", e.style.top = "13.5px", e.style.width = "480px", e.style.height = "58px", e.style.display = "block", t.style.position = "absolute", t.style.left = "0px", t.style.top = "8px", t.style.width = "480px", t.style.height = "50px", t.style.lineHeight = "50px", i && (i.style.left = t.offsetWidth + 30 + "px", i.style.top = "18.5px")
            }(), n.textContent = "Hoy", o.textContent = t.time || "", s.style.display = "block", s.textContent = t.now || "En vivo", d.style.display = t.next ? "block" : "none", t.next && (d.textContent = "Siguiente: " + t.next), c.style.display = t.uhd ? "block" : "none", p.style.display = "block", p && (t.logo ? p.style.backgroundImage = "url(" + t.logo + ")" : p.style.backgroundImage = "");
        else {
            be && (be.classList.remove("is-active"), be.style.display = "none");
            var u = j.playerItem || l[0];
            if (Me)
                if (S(u) && j.playerEpisode) {
                    var v = j.playerEpisode.title || j.playerEpisode.name,
                        f = j.playerEpisode.number || j.playerEpisode.seriesNumber,
                        h = v || (f ? "Capítulo " + f : "");
                    Me.textContent = h ? u.title + " - " + h : u.title
                } else Me.textContent = u.title;
            ke && (ke.src = u.poster || u.cover || "assets/original/common/bg_placehoder_vertical.png"), Ei(we ? we.currentTime : 0, we ? we.duration : 0)
        }
        for (var g in Ve) Ve.hasOwnProperty(g) && Ve[g].classList.toggle("is-current", Ve[g]._channel === j.channel);
        fr()
    }

    function fr() {
        var e = be.querySelector(".pi-quality"),
            t = be.querySelector(".pi-scale"),
            i = be.querySelector(".pi-func");
        e && t && i && (e.style.left = "517.5px", t.style.left = e.offsetLeft + e.offsetWidth + 30 + "px", i.style.left = t.offsetLeft + t.offsetWidth + 30 + "px")
    }

    function hr() {
        if ("live" === j.playerMode) {
            j.channelsOpen = !0, Ce.classList.add("is-active"), qn(), Rn(j.channel), On();
            var e = Ve[j.channel];
            if (e) {
                tt(e);
                var t = e.parentNode,
                    i = 111 * j.channel;
                (i < t.scrollTop || i + 109.5 > t.scrollTop + t.clientHeight) && (t.scrollTop = Math.max(0, i - 120))
            }
        }
    }

    function gr() {
        j.channelsOpen = !1, Ce.classList.remove("is-active"), "player" === j.screen && tt(ye)
    }

    function mr() {
        var e = t("app");
        if (e) {
            var i = window.innerWidth || document.documentElement && document.documentElement.clientWidth || 1920,
                a = window.innerHeight || document.documentElement && document.documentElement.clientHeight || 1080,
                n = Math.min(i / 1920, a / 1080);
            (!isFinite(n) || n <= 0) && (n = 1);
            var r = Math.max(0, Math.round((i - 1920 * n) / 2)),
                o = Math.max(0, Math.round((a - 1080 * n) / 2));
            e.style.left = r + "px", e.style.top = o + "px", e.style.webkitTransform = "scale(" + n + ")", e.style.transform = "scale(" + n + ")"
        }
    }

    function yr() {
        var e, i;
        mr(), window.addEventListener("resize", mr, !1), legacyInstallNavigation(document, lt), window.addEventListener("popstate", function() {
                ot()
            }, !1), document.addEventListener("click", function(e) {
                var t = n(e.target, ".focusable");
                t && (tt(t, !0), t._activate && t._activate())
            }), oi(),
            function() {
                if (legacyCanUseLuna()) {
                    var e = p.serviceId || "com.webosflux.xuptertv.fidelity.service";
                    try {
                        window.webOS.service.request("luna://" + e, {
                            method: "keepAlive",
                            parameters: {
                                subscribe: !0
                            },
                            resubscribe: !0,
                            onSuccess: function() {},
                            onFailure: function() {}
                        })
                    } catch (e) {}
                    setInterval(function() {
                        try {
                            window.webOS.service.request("luna://" + e, {
                                method: "heartbeat",
                                parameters: {},
                                onSuccess: function() {},
                                onFailure: function() {}
                            })
                        } catch (e) {}
                    }, 15e3)
                }
            }(), Ke = setTimeout(dt, 2600), N(), Bt(), window.__tuty = {
                version: "4.34.4",
                state: j,
                vod: l,
                channels: F,
                api: v,
                portal: f,
                service: q,
                refreshPortal: D,
                reloadVod: N,
                skipWelcome: dt,
                show: function(e) {
                    "home" === e ? dt() : "detail" === e ? ei(l[0]) : "search" === e ? li() : "settings" === e ? yi() : "player" === e ? dr("live") : nt(e)
                },
                selectTab: function(e) {
                    dt(), ht(e, !0)
                },
                openDetail: function(e) {
                    ei(l[e] || l[0])
                },
                openSearch: li,
                openSettings: yi,
                openLiveCategories: lvOpenCats,
                openLiveSearch: lvOpenSearch,
                toggleLiveFavorites: lvToggleFav,
                openPlayer: function(e, t) {
                    dr(e || "live", l[t] || null)
                },
                focus: function(e) {
                    var t = "string" == typeof e ? document.querySelector(e) : e;
                    t && tt(t)
                },
                key: function(e) {
                    lt({
                        keyCode: e,
                        preventDefault: function() {}
                    })
                },
                search: function(e) {
                    li(), ci(e)
                },
                settingsPanel: function(e) {
                    yi(), bi(e, !0)
                }
            },
            function() {
                var e = String(location.search || "").replace(/^\?/, "");
                if (!e) return;
                for (var t = {}, i = e.split("&"), a = 0; a < i.length; a++)
                    if (i[a]) {
                        var n = i[a].split("=");
                        t[decodeURIComponent(n[0])] = decodeURIComponent(n.slice(1).join("=") || "")
                    } if (void 0 !== t.ch) {
                    var r = parseInt(t.ch, 10) || 0;
                    j.channel = Math.max(0, Math.min(F.length - 1, r))
                }
                var o = t.screen || "home";
                if ("welcome" === o) return;
                dt(), void 0 !== t.tab ? ht(parseInt(t.tab, 10) || 0, !0) : (ht(0, !1), tt(ie));
                "detail" === o ? ei(l[parseInt(t.vod, 10) || 0]) : "search" === o ? (li(), t.q && ci(t.q)) : "settings" === o ? (yi(), void 0 !== t.panel && bi(parseInt(t.panel, 10) || 0, !0)) : "player" === o && (dr("vod" === t.mode ? "vod" : "live", l[parseInt(t.vod, 10) || 0]), "1" === t.channels && hr());
                if (t.focus) {
                    var s = document.querySelector(t.focus);
                    s && tt(s)
                }
            }()
    }

    function br() {
        ar(), pi()
    }
    window.addEventListener("beforeunload", br), window.addEventListener("unload", br), document.addEventListener("visibilitychange", function() {
        document.hidden && br()
    }), "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", yr) : yr()
}();
