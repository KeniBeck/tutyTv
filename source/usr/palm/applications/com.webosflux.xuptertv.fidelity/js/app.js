! function() {
    "use strict";

    function e(e, t, i) {
        var runtime = window.TutyUI;
        if (runtime && runtime.el) return runtime.el(e, t, i);
        var a = document.createElement(e);
        return t && (a.className = t), null != i && (a.textContent = i), a
    }

    function t(e) {
        var runtime = window.TutyUI;
        return runtime && runtime.byId ? runtime.byId(e) : document.getElementById(e)
    }

    function i(e) {
        var runtime = window.TutyUI;
        if (runtime && runtime.clear) return runtime.clear(e);
        for (; e.firstChild;) e.removeChild(e.firstChild)
    }

    function a(e, t, i, a, n) {
        var runtime = window.TutyUI;
        if (runtime && runtime.place) return runtime.place(e, t, i, a, n);
        return e.style.position = "absolute", e.style.left = t + "px", e.style.top = i + "px", void 0 !== a && (e.style.width = a + "px"), void 0 !== n && (e.style.height = n + "px"), e
    }

    function n(e, t) {
        var runtime = window.TutyUI;
        if (runtime && runtime.closest) return runtime.closest(e, t);
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

    var serviceClient = null;

    function getServiceClient() {
        var runtime = window.TutyUI;
        if (!runtime || !runtime.createServiceClient) return null;
        return serviceClient || (serviceClient = runtime.createServiceClient({
            getServiceId: function() {
                return p.serviceId || "com.webosflux.xuptertv.fidelity.service"
            },
            getTimeout: function() {
                return parseInt(p.timeoutMs, 10) || 2e4
            },
            getDevServiceUrl: function() {
                return p.devServiceUrl || void 0
            },
            canUseLuna: legacyCanUseLuna,
            getWebOs: function() {
                return window.webOS
            },
            buildDevUrl: legacyDevServiceUrl,
            requestDev: L
        }))
    }

    function q(e, t, i) {
        var client = getServiceClient();
        if (client) return client.request(e, t, i);
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
                if (R(e, i.item), e.episodes = i.episodes || [], e.seasons = i.seasons && i.seasons.length ? i.seasons : e._catalogSeasons || [], e.seasonId || (e.seasonId = e.id), e.seasons && e.seasons.length && e.seasons.sort(function(e, t) {
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
                    var resolvedSeason = legacyResolveDetailSeason(e.seasons, e.id, e.seasonId, e.title || e.alias);
                    j.detailSeason = resolvedSeason.seasonIndex, resolvedSeason.seasonId && (e.seasonId = resolvedSeason.seasonId)
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
        j = window.TutyUI && window.TutyUI.createAppState ? window.TutyUI.createAppState() : {
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
            nextEpisodeGuardUntil: 0,
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
                streamModes: {},
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

    function legacyResolveDetailSeason(seasons, itemId, currentSeasonId, title) {
        var _core = window.TutyCore;
        if (_core && typeof _core.resolveDetailSeason === "function") return _core.resolveDetailSeason(seasons, itemId, currentSeasonId, title);
        if (!seasons || !seasons.length) return {
            seasonIndex: 0
        };
        var currentId = currentSeasonId ? String(currentSeasonId) : "",
            rootId = itemId ? String(itemId) : "",
            index = 0;
        if (currentId)
            for (index = 0; index < seasons.length; index++)
                if (String(seasons[index].id || "") === currentId) return {
                    seasonIndex: index,
                    seasonId: seasons[index].id
                };
        if (rootId)
            for (index = 0; index < seasons.length; index++)
                if (String(seasons[index].id || "") === rootId) return {
                    seasonIndex: index,
                    seasonId: seasons[index].id
                };
        var match = /(?:temp(?:orada)?|season|t)\s*\.?\s*(\d+)/i.exec(String(title || "").replace(/-/g, " ")),
            number = match ? parseInt(match[1], 10) : 0;
        if (number > 0)
            for (index = 0; index < seasons.length; index++)
                if (Number(seasons[index].number) === number) return {
                    seasonIndex: index,
                    seasonId: seasons[index].id
                };
        return {
            seasonIndex: 0,
            seasonId: seasons[0].id
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
    var ee, te, ie, ae, oe, se, ye, be, Ce, we, xe, Se, _e, Le, ke, Me, Ie, Te, Ee, qe, Oe, De, Ae, Pe = !1,
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
        var runtime = window.TutyUI;
        if (runtime && runtime.hasFocusRuntime && runtime.hasFocusRuntime() && runtime.focusElement) return void runtime.focusElement(e, i)
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
        var runtime = window.TutyUI;
        if (runtime && runtime.hasFocusRuntime && runtime.hasFocusRuntime() && runtime.moveFocus) return void runtime.moveFocus(e)
    }

    function nt(e) {
        var runtime = window.TutyUI;
        runtime && runtime.showScreen && runtime.showScreen(e, document, j)
        if ("player" !== e && j.nextEpisodeOpen && closeNextEpisodePrompt(!1), "player" !== e && j.episodeBrowserOpen && un(!0), "player" !== e && j.categoryPickerOpen && An(!0), "home" !== e && j.liveCategoriesOpen && lvCloseCats(!0), "home" !== e && j.liveSearchOpen && lvCloseSearch(!0), "player" !== e && "detail" !== e) {
            fa && _n(), va && an();
            var r = t("screen-player");
            legacyResetDetailPlayerSurface(r), ar(), resetSubtitles()
        }
        window.TUTYTV_WEB && "player" !== e && "detail" !== e && stopWebMedia(), mt()
    }
    function ot() {
        var runtime = window.TutyUI;
        return runtime && runtime.handleNavigationBack ? runtime.handleNavigationBack() : !1
    }

    function lt(e) {
        var runtime = window.TutyUI;
        return runtime && runtime.handleNavigationKey ? runtime.handleNavigationKey(e) : !1
    }

    function returnFromPlayer() {
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
    }

    function returnFromDetail() {
        ar();
        var n = t("screen-player");
        legacyResetDetailPlayerSurface(n);
        var r = j.detailReturn;
        r && "search" === r.screen ? (nt("search"), tt(r.focus)) : (nt("home"), ht(j.tab, !1), r && r.focus && Ye(r.focus) ? tt(r.focus) : Re[j.tab] && tt(Re[j.tab]))
    }

    function toggleDetailSynopsis() {
        var e = t("screen-detail");
        if (!e) return;
        var i = !e.classList.contains("is-synopsis-open");
        e.classList.toggle("is-synopsis-open", i);
        var a = document.querySelector(".detail-more");
        a && (a.textContent = i ? "Menos" : "Más")
    }

    function handleBrowserHorizontal(code) {
        var r = n(j.focus, "#pe-seasons"),
            o = n(j.focus, "#pe-episodes");
        if (37 === code) {
            if (o && ea && "none" !== ea.style.display) {
                var s = Zi ? Zi.children[j.browserSeason] || it(Zi) : null;
                s && tt(s);
                return !0
            }
        } else if (39 === code && r) {
            var l = ta ? ta.querySelector(".pe-ep.is-current") || it(ta) : null;
            l && tt(l);
            return !0
        }
        return !1
    }

    function closeSeasonPopupAndFocus() {
        ri();
        var e = se ? se.querySelector(".season-arrow") : null;
        e && tt(e)
    }

    function hasDetailSeasonPopup() {
        var runtime = window.TutyUI,
            modulePopup = !!(runtime && runtime.hasDetailRuntime && runtime.hasDetailRuntime() && runtime.hasSeasonPopup && runtime.hasSeasonPopup());
        return !!(ni || modulePopup)
    }

    function getNavigationHost() {
        return {
            state: j,
            byId: t,
            closest: n,
            getFocus: function() {
                return j.focus
            },
            canFocus: Ye,
            focus: tt,
            moveFocus: at,
            activateFocus: function() {
                j.focus && j.focus._activate && j.focus._activate()
            },
            getTabs: function() {
                return Re
            },
            getPlayerFocus: function() {
                return ye
            },
            getSeekbar: function() {
                return Ee
            },
            getChannels: function() {
                return F
            },
            getVideoPaused: function() {
                return !!(we && we.paused)
            },
            hasVideoSource: function() {
                return !!(we && we.src)
            },
            isSeeking: function() {
                return Je
            },
            isFullSettingsOpen: function() {
                return fa
            },
            isQuickSettingsOpen: function() {
                return va
            },
            isAddonsOpen: function() {
                return Pt
            },
            hasSeasonPopup: hasDetailSeasonPopup,
            isSynopsisOpen: function() {
                var e = t("screen-detail");
                return !!(e && e.classList.contains("is-synopsis-open"))
            },
            navigationAction: legacyNavigationAction,
            mapMediaKey: legacyMediaKey,
            closeCategoryPicker: An,
            closeSearch: pi,
            closeLiveSearch: lvCloseSearch,
            closeLiveCategories: lvCloseCats,
            cancelNextEpisodePrompt: cancelNextEpisodePrompt,
            closeEpisodeBrowser: un,
            closeAddons: Wt,
            closeResume: closeResume,
            closeFilter: closeFilter,
            closeFullSettings: _n,
            closeQuickSettings: an,
            closeSeek: function() {
                er(!1)
            },
            closeChannels: gr,
            closeSeasonPopup: closeSeasonPopupAndFocus,
            scheduleInfobarHide: Ai,
            schedulePlaySettingsClose: en,
            hideInfobar: Ni,
            hideVodInfobar: Ui,
            openCategories: lvOpenCats,
            openQuickSettings: tn,
            openFullSettings: Sn,
            openChannels: hr,
            showScreen: nt,
            selectTab: ht,
            platformBack: legacyPlatformBack,
            returnFromPlayer: returnFromPlayer,
            returnFromDetail: returnFromDetail,
            toggleSynopsis: toggleDetailSynopsis,
            handleBrowserHorizontal: handleBrowserHorizontal,
            handleBrowserFocus: function(code) {
                handleBrowserHorizontal(code)
            },
            resetStream: ar,
            resetPlayerSurface: function(node) {
                legacyResetDetailPlayerSurface(node)
            },
            stopWebMedia: stopWebMedia,
            playVideo: function() {
                try {
                    legacyPlayVideo(we)
                } catch (e) {}
            },
            pauseVideo: function() {
                try {
                    legacyPauseVideo(we)
                } catch (e) {}
            },
            togglePlayPause: Di,
            playCurrent: function() {
                if (!we) return;
                try {
                    var e = legacyPlayVideo(we);
                    e && e.catch && e.catch(function() {})
                } catch (e) {}
            },
            setPlaybackStatus: qi,
            showInfobar: Pi,
            vodSeek: Oi,
            stepSeek: ir,
            startSeek: tr,
            endSeek: function() {
                er(!1)
            },
            notifyStatus: nr,
            selectLiveChannel: Vt,
            focusLiveChannelRow: Nn
        }
    }

    function dt() {
        Ke && (clearTimeout(Ke), clearInterval(Ke), Ke = null), Pe || vt(), nt("home"), ht(0, !1), tt(ie);
        var e = t("home-tabs");
        e && (e.classList.add("is-expanded"), e.classList.remove("is-collapsed"));
        var i = document.querySelector(".home-sidebar-bg");
        i && i.classList.add("is-on")
    }
    function getHomeShellHost() {
        return {
            state: j,
            byId: t,
            el: e,
            clear: i,
            focus: tt,
            getTabs: function() {
                return H
            },
            getIcons: function() {
                return B
            },
            getPageCount: function() {
                return ct.length
            },
            getInitialPage: function() {
                return H[j.tab] && H[j.tab].page >= 0 ? H[j.tab].page : 0
            },
            getChannels: function() {
                return Ue
            },
            getLiveFocus: function() {
                return ie
            },
            selectTab: ht,
            focusHomeTab: focusHomeTab,
            openSettings: yi,
            openSearch: li,
            openFilter: openFilter
        }
    }

    function getPlayerStageHost() {
        return {
            state: j,
            byId: t,
            el: e,
            clear: i,
            focus: tt,
            openSeek: er,
            stepSeek: ir,
            stepVodSeek: Oi,
            startSeek: tr,
            openPlaySettings: tn,
            openFullSettings: Sn,
            openEpisodeBrowser: pn,
            schedulePlaySettingsClose: en,
            setSmooth: function(smooth) {
                $a(Ha(), smooth)
            },
            refreshStreamModeButtons: Cn,
            reloadStreamMode: Tn,
            applyAspect: xn,
            applySubtitleDisplay: Fa,
            savePlaybackPreferences: ka,
            openChannels: hr,
            closeChannels: gr,
            selectLiveChannel: Vt,
            hideInfobar: Ni,
            showInfobar: Pi,
            togglePlayPause: Di,
            renderLiveCategories: qn,
            renderLiveChannels: Rn,
            toggleFavorite: function(channel) {
                liveToggleFav(channel)
            },
            refreshLiveList: Ht,
            isFavoritesOnly: function() {
                return liveFavFilter
            },
            getChannels: function() {
                return F
            }
        }
    }

    function getHomeLivePageHost() {
        return {
            state: j,
            getChannels: function() {
                return F
            },
            getRows: function() {
                return Ue
            },
            createVideo: function() {
                return document.createElement("video")
            },
            el: e,
            focus: tt,
            canFocus: Ye,
            openCategories: lvOpenCats,
            toggleFavorites: lvToggleFav,
            openSearch: lvOpenSearch,
            selectChannel: Vt,
            openPlayer: function() {
                dr("live")
            },
            focusLive: function() {
                ie && tt(ie)
            },
            focusTab: function() {
                Re[0] && tt(Re[0])
            }
        }
    }

    function getHomePageHost() {
        return {
            getCatalog: function() {
                return l
            },
            filterCategory: Yt,
            selectPage: I,
            el: e,
            place: a,
            openDetail: ei,
            afterBuild: mt,
            isHomeScreen: function() {
                return "home" === j.screen
            },
            onHeroLeft: function() {
                Re[j.tab] && tt(Re[j.tab])
            }
        }
    }

    var ct = [function(t) {
        var runtime = window.TutyUI;
        if (!runtime || !runtime.buildHomeLivePage) return;
        var refs = runtime.buildHomeLivePage(t, getHomeLivePageHost());
        Et = refs.video, te = refs.container, qt = refs.status, ae = refs.list, ie = refs.focus, ee = refs.channelLabel;
        liveFastAll = refs.fastAll, liveFastFav = refs.fastFav;
        Ht(!1), Bt()
        }, function(e) {
            var runtime = window.TutyUI;
            return runtime && runtime.buildHomeVodPage ? runtime.buildHomeVodPage(1, e, getHomePageHost()) : !1
        }, function(e) {
            var runtime = window.TutyUI;
            return runtime && runtime.buildHomeVodPage ? runtime.buildHomeVodPage(2, e, getHomePageHost()) : !1
        }, function(e) {
            var runtime = window.TutyUI;
            return runtime && runtime.buildHomeVodPage ? runtime.buildHomeVodPage(3, e, getHomePageHost()) : !1
        }, function(t) {
            var runtime = window.TutyUI;
            return runtime && runtime.buildHomeVodPage ? runtime.buildHomeVodPage(4, t, getHomePageHost()) : !1
        }, function(e) {
            var runtime = window.TutyUI;
            return runtime && runtime.buildHomeVodPage ? runtime.buildHomeVodPage(5, e, getHomePageHost()) : !1
        }, function(t) {
            var runtime = window.TutyUI;
            return runtime && runtime.buildHomeVodPage ? runtime.buildHomeVodPage(6, t, getHomePageHost()) : !1
        }],
                pt = {};

    function ut(e) {
        !pt[e] && Ne[e] && ct[e] && (pt[e] = !0, ct[e](Ne[e]))
    }

    function vt() {
        var runtime = window.TutyUI;
        if (!runtime || !runtime.buildHomeShell) return;
        var refs = runtime.buildHomeShell(getHomeShellHost());
        if (!refs) return;
        Pe = !0, pt = {}, Ne = refs.pages, Re = refs.tabs, ut(refs.initialPage)
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
        Pt = !1;

    function Nt() {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasPreviewRuntime && runtime.hasPreviewRuntime() && runtime.stopPreview) return runtime.stopPreview();
        return !1
    }
    function Rt(e) {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasPreviewRuntime && runtime.hasPreviewRuntime() && runtime.previewChannel) return runtime.previewChannel(e || F[j.channel]);
        return !1
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
        var runtime = window.TutyUI;
        if (runtime && runtime.hasLiveListRuntime && runtime.hasLiveListRuntime() && runtime.renderLiveList) return runtime.renderLiveList(t);
        return !1
    }
    function zt() {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasLiveListRuntime && runtime.hasLiveListRuntime() && runtime.scrollLiveList) return void runtime.scrollLiveList();
        if (Ue.length) {
            var e = Ue.filter(function(e) {
                return e._channel === j.channel
            })[0];
            if (e) ae.scrollTop = legacyLiveListScrollTop(Ue.indexOf(e), ae.scrollTop, ae.scrollHeight, ae.clientHeight)
        }
    }

    function Vt(e, t) {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasLiveListRuntime && runtime.hasLiveListRuntime() && runtime.selectLiveChannel) return void runtime.selectLiveChannel(e, t);
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

    function lvFocusList() {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasLiveMenuRuntime && runtime.hasLiveMenuRuntime() && runtime.focusLiveList) return void runtime.focusLiveList();
        return !1
    }

    function lvOpenCats() {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasLiveMenuRuntime && runtime.hasLiveMenuRuntime() && runtime.openCategories) return void runtime.openCategories();
        return !1
    }

    function lvCloseCats(e) {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasLiveMenuRuntime && runtime.hasLiveMenuRuntime() && runtime.closeCategories) return void runtime.closeCategories(e);
        return !1
    }

    function lvToggleFav() {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasLiveMenuRuntime && runtime.hasLiveMenuRuntime() && runtime.toggleFavorites) return void runtime.toggleFavorites();
        return !1
    }

    function lvOpenSearch() {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasLiveMenuRuntime && runtime.hasLiveMenuRuntime() && runtime.openSearch) return void runtime.openSearch();
        return !1
    }

    function lvCloseSearch(e) {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasLiveMenuRuntime && runtime.hasLiveMenuRuntime() && runtime.closeSearch) return void runtime.closeSearch(e);
        return !1
    }

    function jt() {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasAddonsDialogRuntime && runtime.hasAddonsDialogRuntime() && runtime.openAddons) return void runtime.openAddons();
        return !1
    }
    function Wt() {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasAddonsDialogRuntime && runtime.hasAddonsDialogRuntime() && runtime.closeAddons) return void runtime.closeAddons();
        return !1
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
    function Yt(e) {
        return legacyFilterCatalogCategory(l, e)
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
            }, j.detailRange = 0, j.detailSeason = 0, j.detailEpisode = null, j.playerEpisode = null, e.seasons && e.seasons.length) {
            var resolvedSeason = legacyResolveDetailSeason(e.seasons, e.id, e.seasonId, e.title || e.alias);
            j.detailSeason = resolvedSeason.seasonIndex, resolvedSeason.seasonId && (e.seasonId = resolvedSeason.seasonId)
        }
        e.episodes && e.episodes.length && (j.detailEpisode = e.episodes[0]), qa(e), Xa(), Wa(e), Qa(e), ti(e), nt("detail"), ye || En();
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
        var runtime = window.TutyUI;
        if (runtime && runtime.hasResumeRuntime && runtime.hasResumeRuntime() && runtime.openResume) return runtime.openResume(item, episode, pos, dur, cb);
        return !1
    }
    function closeResume() {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasResumeRuntime && runtime.hasResumeRuntime() && runtime.closeResume) return runtime.closeResume();
        return !1
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
        oe = t("detail-buttons"), se = t("detail-bottom");
        var runtime = window.TutyUI;
        if (runtime && runtime.hasDetailRuntime && runtime.hasDetailRuntime() && runtime.renderDetail) return runtime.renderDetail(n);
        return !1
    }
    function ii(e) {
        return legacyBuildEpisodeRanges(e)
    }

    var ni = null;

    function ri() {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasDetailRuntime && runtime.hasDetailRuntime() && runtime.closeSeasonPopup) return void runtime.closeSeasonPopup();
        ni && ni.parentNode && (ni.parentNode.removeChild(ni), ni = null);
        var e = se ? se.querySelector(".season-arrow") : null;
        e && e.classList.remove("is-open")
    }

    function li() {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasSearchRuntime && runtime.hasSearchRuntime() && runtime.openSearchScreen) return void runtime.openSearchScreen();
        return !1
    }

    function ci(e) {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasSearchRuntime && runtime.hasSearchRuntime() && runtime.setSearchQuery) return void runtime.setSearchQuery(e);
        return !1
    }

    function pi() {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasSearchRuntime && runtime.hasSearchRuntime() && runtime.resetSearch) return void runtime.resetSearch();
        return !1
    }

    function openFilter() {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasSearchRuntime && runtime.hasSearchRuntime() && runtime.openFilterPanel) return void runtime.openFilterPanel();
        return !1
    }

    function closeFilter() {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasSearchRuntime && runtime.hasSearchRuntime() && runtime.closeFilterPanel) return void runtime.closeFilterPanel();
        return !1
    }

    function yi() {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasSettingsRuntime && runtime.hasSettingsRuntime() && runtime.openSettings) return void runtime.openSettings();
        return !1
    }

    function bi(e, i) {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasSettingsRuntime && runtime.hasSettingsRuntime() && runtime.selectSettingsTab) return void runtime.selectSettingsTab(e, i);
        return !1
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

    var _i = 5e3;

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
                subtitleEnd()
            ] : [
                t,
                j.playerEpisode && j.playerEpisode.duration,
                j.playerItem && j.playerItem.duration,
                we && isFinite(we.duration) && we.duration > 0 ? we.duration : 0,
                legacyInferEpisodeDuration(j.playerItem && j.playerItem.episodes, j.playerEpisode),
                subtitleEnd()
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
        var runtime = window.TutyUI;
        return runtime && runtime.showPlaybackOsd ? runtime.showPlaybackOsd(e) : !1
    }

    function Ai() {
        var runtime = window.TutyUI;
        return runtime && runtime.schedulePlayerInfobarHide ? runtime.schedulePlayerInfobarHide() : !1
    }

    function Pi() {
        var runtime = window.TutyUI;
        return runtime && runtime.showPlayerInfobar ? runtime.showPlayerInfobar() : !1
    }

    function Ni() {
        var runtime = window.TutyUI;
        return runtime && runtime.hidePlayerInfobar ? runtime.hidePlayerInfobar() : !1
    }

    function Ri() {
        var runtime = window.TutyUI;
        return runtime && runtime.refreshPlayerInfobar ? runtime.refreshPlayerInfobar() : !1
    }

    function Ui() {
        return Ni()
    }
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
        ya = null,
        ba = !1,
        Ca = !1,
        xa = "normal",
        Sa = "white",
        La = 0;

    function ka() {
        xa = ["normal", "big", "small"][Number(j.playback.size) || 0] || "normal", Sa = ["white", "yellow", "black"][Number(j.playback.style) || 0] || "white", Ca || (ba = !!j.playback.subtitle), xn(["cover", "contain", "16-9", "4-3"][Number(j.playback.screen) || 0] || "contain"), Fa()
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
        var title = o(e.title || "").replace(/[^a-z0-9]+/g, "");
        if (title)
            for (var index = 0; index < l.length; index++) {
                var candidateTitle = o(l[index].title || "").replace(/[^a-z0-9]+/g, ""),
                    candidateAlias = o(l[index].alias || "").replace(/[^a-z0-9]+/g, "");
                if (candidateTitle === title || candidateAlias === title) {
                    var matched = l[index];
                    window.TUTYTV_WEB && window.console && console.log("[TUTYTV] history title match", {
                        historyId: e.id,
                        title: e.title,
                        matchedId: matched.id
                    });
                    matched._detailsLoaded || (matched._portal = !0);
                    return void ei(matched)
                }
            }
        window.TUTYTV_WEB && window.console && console.log("[TUTYTV] history title not matched", {
            historyId: e.id,
            title: e.title
        });
        var openFallback = function() {
            var i = _(e, 0);
            i._portal = !0, ei(i)
        };
        if (e.title) try {
            return void q("search", C("search", e.title), function(err, response) {
                if (!err) {
                    var results = g(response),
                        normalizedTitle = o(e.title || "").replace(/[^a-z0-9]+/g, "");
                    for (var index = 0; index < results.length; index++) {
                        var result = results[index],
                            resultTitle = o(result.title || "").replace(/[^a-z0-9]+/g, "");
                        if (resultTitle === normalizedTitle) {
                            var found = _(result, 0);
                            return found._portal = !0, window.TUTYTV_WEB && window.console && console.log("[TUTYTV] history search match", {
                                historyId: e.id,
                                matchedId: found.id
                            }), void ei(found)
                        }
                    }
                }
                openFallback()
            })
        } catch (err) {}
        openFallback()
    }
    var Aa = {},
        Pa = {};

    function Ua(e) {
        var runtime = window.TutyUI;
        return runtime && runtime.loadPlayerSubtitle ? runtime.loadPlayerSubtitle(e) : !1
    }
    function Fa() {
        var runtime = window.TutyUI;
        return runtime && runtime.applyPlayerSubtitleStyle ? runtime.applyPlayerSubtitleStyle(xa, Sa) : !1
    }
    function Ba(e) {
        var runtime = window.TutyUI;
        return runtime && runtime.renderPlayerSubtitle ? runtime.renderPlayerSubtitle(e, ba) : !1
    }
    function Ha() {
        return "detail" === j.screen ? j.detail || null : j.playerItem || j.detail || null
    }
    function resetSubtitles() {
        ua && (ua.innerHTML = "");
        var runtime = window.TutyUI;
        runtime && runtime.hasPlayerSubtitleRuntime && runtime.hasPlayerSubtitleRuntime() && runtime.resetPlayerSubtitles && runtime.resetPlayerSubtitles()
    }

    function subtitleEnd() {
        var runtime = window.TutyUI;
        if (runtime && runtime.hasPlayerSubtitleRuntime && runtime.hasPlayerSubtitleRuntime() && runtime.getPlayerSubtitleEnd) return runtime.getPlayerSubtitleEnd();
        return 0
    }

    var za = j.playback.streamModes && "object" == typeof j.playback.streamModes ? j.playback.streamModes : (j.playback.streamModes = {}),
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
        j.streamMode = t ? "smooth" : "normal", i && (za[i] = !!t), j.playback.streamModes = za, Q()
    }

    function Xa() {
        Va = "", ga = 0, ma = !1, ya = null, ba = !1, Ca = !1, j.trackIndex = 0, resetSubtitles()
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
        var runtime = window.TutyUI;
        return runtime && runtime.schedulePlaySettingsClose ? runtime.schedulePlaySettingsClose() : !1
    }

    function tn() {
        var runtime = window.TutyUI;
        return runtime && runtime.openPlaySettings ? runtime.openPlaySettings() : !1
    }

    function an() {
        var runtime = window.TutyUI;
        return runtime && runtime.closePlaySettings ? runtime.closePlaySettings() : !1
    }

    function rn() {
        var runtime = window.TutyUI;
        return runtime && runtime.syncPlaySettingsRowFocus ? runtime.syncPlaySettingsRowFocus() : !1
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
        var runtime = window.TutyUI;
        return runtime && runtime.openEpisodeBrowser ? runtime.openEpisodeBrowser() : !1
    }
    function un(e) {
        var runtime = window.TutyUI;
        return runtime && runtime.closeEpisodeBrowser ? runtime.closeEpisodeBrowser(e) : !1
    }
    function gn(e, t, saveHistory) {
        if (e && t) {
            closeNextEpisodePrompt(!1), j.nextEpisodeDismissed = !1, j.nextEpisodeGuardUntil = Date.now() + 3e3, !1 !== saveHistory && ar(), j.playerItem = e, j.playerEpisode = t, j.detailEpisode = t, j.playerSeasonIndex = j.detailSeason || 0, ye && be && vr(), bn(e), j.episodeSwitchTimer && clearTimeout(j.episodeSwitchTimer), j.episodeSwitchSeq = (j.episodeSwitchSeq || 0) + 1;
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
        var runtime = window.TutyUI;
        return runtime && runtime.closeNextEpisodePrompt ? runtime.closeNextEpisodePrompt(restoreFocus) : !1
    }
    function cancelNextEpisodePrompt() {
        var runtime = window.TutyUI;
        return runtime && runtime.cancelNextEpisodePrompt ? runtime.cancelNextEpisodePrompt() : !1
    }
    function startNextEpisode(target) {
        var runtime = window.TutyUI;
        return runtime && runtime.startNextEpisode ? runtime.startNextEpisode(target) : !1
    }
    function showNextEpisodePrompt(target, seconds) {
        var runtime = window.TutyUI;
        return runtime && runtime.showNextEpisodePrompt ? runtime.showNextEpisodePrompt(target, seconds) : !1
    }
    function findNextPlaybackTarget() {
        var runtime = window.TutyUI;
        return runtime && runtime.findNextPlaybackTarget ? runtime.findNextPlaybackTarget() : null
    }
    function canOfferNextEpisode(position, total) {
        var runtime = window.TutyUI;
        return runtime && runtime.canOfferNextEpisode ? runtime.canOfferNextEpisode(j, position, total) : !1
    }
    function refreshNextSeasons(item) {
        if (!item || item._nextSeasonsLoading || item._nextSeasonsTried) return;
        item._nextSeasonsLoading = !0;
        try {
            q("detail", {
                contentId: item.id
            }, function(error, response) {
                item._nextSeasonsLoading = !1, item._nextSeasonsTried = !0;
                if (!error && response && !1 !== response.returnValue && response.seasons && response.seasons.length) {
                    item.seasons = response.seasons.slice().sort(function(a, b) {
                        return (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0)
                    });
                    var resolved = legacyResolveDetailSeason(item.seasons, item.id, item.seasonId, item.title || item.alias);
                    j.detailSeason = resolved.seasonIndex, resolved.seasonId && (item.seasonId = resolved.seasonId), window.TUTYTV_WEB && window.console && console.log("[TUTYTV] seasons refreshed", {
                        item: item.id,
                        seasons: item.seasons.length,
                        seasonId: item.seasonId
                    })
                }
                "player" === j.screen && S(item) && maybeShowNextEpisodePrompt(Yn(), Zn())
            })
        } catch (error) {
            item._nextSeasonsLoading = !1, item._nextSeasonsTried = !0
        }
    }

    function maybeShowNextEpisodePrompt(position, total) {
        if (!canOfferNextEpisode(position, total)) return;
        var target = findNextPlaybackTarget();
        if (!target) return;
        window.TUTYTV_WEB && window.console && console.log("[TUTYTV] next prompt", {
            trigger: "timeupdate",
            position: position,
            total: total,
            remaining: total - position,
            current: j.playerEpisode && j.playerEpisode.id,
            target: target.episode && target.episode.id,
            kind: target.kind
        }), showNextEpisodePrompt(target, total - position)
    }

    function yn() {
        var item = j.playerItem;
        if (item && S(item) && "player" === j.screen) {
            var position = Yn(),
                total = Zn();
            if (!canOfferNextEpisode(position, total)) return void mn();
            var target = findNextPlaybackTarget();
            if (!target) return void mn();
            window.TUTYTV_WEB && window.console && console.log("[TUTYTV] next prompt", {
                trigger: "ended",
                position: position,
                total: total,
                remaining: total - position,
                current: j.playerEpisode && j.playerEpisode.id,
                target: target.episode && target.episode.id,
                kind: target.kind
            }), showNextEpisodePrompt(target)
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
        var runtime = window.TutyUI;
        return runtime && runtime.refreshStreamModeButtons ? runtime.refreshStreamModeButtons() : !1
    }
    function wn() {
        var runtime = window.TutyUI;
        return runtime && runtime.refreshAspectButtons ? runtime.refreshAspectButtons() : !1
    }
    function xn(e) {
        var runtime = window.TutyUI;
        return runtime && runtime.applyPlayerAspect ? runtime.applyPlayerAspect(e) : !1
    }
    function Sn(e) {
        var runtime = window.TutyUI;
        return runtime && runtime.openPlaySettingsDialog ? runtime.openPlaySettingsDialog(e) : !1
    }

    function _n() {
        var runtime = window.TutyUI;
        return runtime && runtime.closePlaySettingsDialog ? runtime.closePlaySettingsDialog() : !1
    }

    function Ln() {
        var runtime = window.TutyUI;
        return runtime && runtime.renderAudioTracks ? runtime.renderAudioTracks() : !1
    }
    function Mn(e) {
        var _core = window.TutyCore;
        if (_core && typeof _core.describeLanguageLabel === "function") return _core.describeLanguageLabel(e);
        var t = (e || "").toLowerCase().trim().split(/[-_]/)[0];
        return /^(spa|esp|es|castellano|latino)$/.test(t) ? "Español" : /^(eng|ing|en)$/.test(t) ? "Inglés" : /^(jpn|jap|ja)$/.test(t) ? "Japonés" : /^(kor|cor|ko)$/.test(t) ? "Coreano" : /^(por|pt)$/.test(t) ? "Portugués" : /^(fra|fre|fr|franc)$/.test(t) ? "Francés" : /^(ita|it)$/.test(t) ? "Italiano" : /^(deu|ger|de)$/.test(t) ? "Alemán" : /^(chi|zho|zh)$/.test(t) ? "Chino" : t ? t.charAt(0).toUpperCase() + t.slice(1) : "Pista"
    }

    function Tn() {
        var runtime = window.TutyUI;
        return runtime && runtime.reloadPlayerStream ? runtime.reloadPlayerStream() : !1
    }

    function En() {
        var runtime = window.TutyUI;
        if (!runtime || !runtime.buildPlayerStage) return;
        var refs = runtime.buildPlayerStage(getPlayerStageHost());
        ye = refs.stage, be = refs.infobar, Le = refs.vodInfobar, Ce = refs.channels, je = refs.categories, We = refs.categoryGrid, $e = refs.categorySub;
        we = refs.video, Se = refs.status, _e = refs.nextEpisodeLoading, Ae = refs.osd, xe = refs.frame;
        ke = refs.vodPoster, Me = refs.vodTitle, Ie = refs.vodCurrent, Te = refs.vodTotal, Ee = refs.seekbar, qe = refs.seekProgress, Oe = refs.seekBuffered, De = refs.seekThumb;
        Fi = refs.playSettingsView, ji = refs.btnPlayer1, Wi = refs.btnPlayer2, Gi = refs.aspectRow;
        Qi = refs.episodeBrowser, Ki = refs.episodeTitle, Yi = refs.episodeSub, Zi = refs.episodeSeasons, ea = refs.episodeSeasonsColumn, ta = refs.episodeEpisodes, ia = refs.episodeSeasonLabel;
        aa = refs.audioOptions, ua = refs.subtitles
    }

    function qn() {
        var runtime = window.TutyUI;
        return runtime && runtime.renderLiveCategories ? runtime.renderLiveCategories() : !1
    }

    function On() {
        var runtime = window.TutyUI;
        return runtime && runtime.layoutLiveSelectedCategory ? runtime.layoutLiveSelectedCategory() : !1
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
        var runtime = window.TutyUI;
        return runtime && runtime.focusLiveChannelRow ? runtime.focusLiveChannelRow(e) : !1
    }

    function Rn(t) {
        var runtime = window.TutyUI;
        return runtime && runtime.renderLiveChannels ? runtime.renderLiveChannels(t) : !1
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
        var runtime = window.TutyUI;
        return runtime && runtime.resetPlayerStream ? runtime.resetPlayerStream() : !1
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
            j.noHistorySave = !0, ar(), j.noHistorySave = !1, j.nextEpisodeDismissed = !1, j.nextEpisodeGuardUntil = Date.now() + 2500, Fn = e;
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
        var runtime = window.TutyUI;
        return runtime && runtime.resolvePlayerPlayback ? runtime.resolvePlayerPlayback(e, t) : !1
    }
    function sr(e, t) {
        var runtime = window.TutyUI;
        return runtime && runtime.startPlayerPlayback ? runtime.startPlayerPlayback(e, t) : !1
    }
    function lr(e, i) {
        var runtime = window.TutyUI;
        return runtime && runtime.openFullscreenPlayer ? runtime.openFullscreenPlayer(e, i) : !1
    }
    function dr(e, t, i) {
        var runtime = window.TutyUI;
        return runtime && runtime.openPlayer ? runtime.openPlayer(e, t, i) : !1
    }
    var cr = 0;

    function ur(e, t) {
        var runtime = window.TutyUI;
        return runtime && runtime.playLiveChannel ? runtime.playLiveChannel(e, t) : !1
    }
    function vr() {
        var runtime = window.TutyUI;
        return runtime && runtime.renderPlayerInfoContent ? runtime.renderPlayerInfoContent() : !1
    }
    function fr() {
        var e = be.querySelector(".pi-quality"),
            t = be.querySelector(".pi-scale"),
            i = be.querySelector(".pi-func");
        e && t && i && (e.style.left = "517.5px", t.style.left = e.offsetLeft + e.offsetWidth + 30 + "px", i.style.left = t.offsetLeft + t.offsetWidth + 30 + "px")
    }

    function hr() {
        var runtime = window.TutyUI;
        return runtime && runtime.openLiveChannelPanel ? runtime.openLiveChannelPanel() : !1
    }

    function gr() {
        var runtime = window.TutyUI;
        return runtime && runtime.closeLiveChannelPanel ? runtime.closeLiveChannelPanel() : !1
    }

    function mr() {
        var e = t("app"),
            runtime = window.TutyUI;
        if (e && runtime && runtime.fitCanvas) return void runtime.fitCanvas(e, window.innerWidth || document.documentElement && document.documentElement.clientWidth || 1920, window.innerHeight || document.documentElement && document.documentElement.clientHeight || 1080);
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

    function attachTutyUiRuntime() {
        var runtime = window.TutyUI;
        if (!runtime) return;
        runtime.attachNavigation && runtime.attachNavigation(getNavigationHost());
        runtime.attachPlayerCleanup && runtime.attachPlayerCleanup(getPlayerCleanupHost());
        if (!runtime.attachFocus) return;
        runtime.attachFocus({
            state: j,
            byId: t,
            getFocusables: Ze,
            getTabFocus: function() {
                return tabFocus
            },
            getTabItems: function() {
                return Re
            },
            scrollIntoView: et,
            onFocusChanged: rn,
            afterFocus: mt,
            score: function(direction, current, candidate) {
                var core = window.TutyCore;
                if (!core || typeof core.scoreLegacyFocus !== "function") return null;
                var value = core.scoreLegacyFocus(direction, current, candidate);
                return null === value || void 0 === value ? null : value
            }
        }), runtime.attachLiveList && runtime.attachLiveList({
            state: j,
            getChannels: function() {
                return F
            },
            getRows: function() {
                return Ue
            },
            getListContainer: function() {
                return ae
            },
            getChannelLabel: function() {
                return ee
            },
            getTabs: function() {
                return Re
            },
            getLiveFocus: function() {
                return ie
            },
            getFastAll: function() {
                return liveFastAll
            },
            isFavoritesOnly: function() {
                return liveFavFilter
            },
            isLoading: function() {
                return kt
            },
            filterChannels: function(favoritesOnly) {
                return legacyFilterLiveChannels(F, favoritesOnly, liveIsFav)
            },
            isFavorite: liveIsFav,
            toggleFavorite: liveToggleFav,
            focus: tt,
            focusLiveList: lvFocusList,
            canFocus: Ye,
            el: e,
            clear: i,
            openPlayer: dr,
            isPlayerScreen: function() {
                return "player" === j.screen
            },
            isLiveMode: function() {
                return "live" === j.playerMode
            },
            isHomeLive: function() {
                return "home" === j.screen && 0 === j.tab
            },
            canRefreshPlayerChannels: function() {
                return !!ye
            },
            refreshPlayerChannels: vr,
            playPlayerChannel: ur,
            previewChannel: Rt,
            updateLabel: liveUpdateLabel
        }), runtime.attachPreview && runtime.attachPreview({
            isHomeLive: function() {
                return "home" === j.screen && 0 === j.tab
            },
            getChannel: function() {
                return F[j.channel] || null
            },
            getVideo: function() {
                return Et
            },
            getContainer: function() {
                return te
            },
            getStatus: function() {
                return qt
            },
            resolveLive: function(channel, done) {
                q("resolveLive", channel.streamUrl ? {
                    streamUrl: channel.streamUrl
                } : {
                    channelCode: channel.channelCode
                }, done)
            },
            play: function(video) {
                return legacyPlayVideo(video)
            },
            pause: function(video) {
                legacyPauseVideo(video)
            },
            setSource: function(video, url) {
                legacySetVideoSource(video, url)
            },
            load: function(video) {
                legacyLoadVideo(video)
            },
            loadHls: function(video, hls, url) {
                legacyLoadHls(video, hls, url)
            },
            destroyHls: function() {
                legacyDestroyHls("__tutyPreviewHls")
            },
            setHls: function(hls) {
                window.__tutyPreviewHls = hls
            },
            createHls: function() {
                return new window.Hls({
                    enableWorker: !0,
                    backBufferLength: 10
                })
            },
            hlsEvents: function() {
                return window.Hls && window.Hls.Events || null
            },
            canUseHls: function() {
                return !!(window.Hls && window.Hls.isSupported())
            },
            nativeTvPlayback: legacyNativeTvPlayback,
            nativePreviewHls: legacyNativePreviewHls
        }), runtime.attachLiveMenu && runtime.attachLiveMenu({
            state: j,
            getCategories: function() {
                return St
            },
            getSelectedCategory: function() {
                return _t
            },
            getChannels: function() {
                return F
            },
            getRows: function() {
                return Ue
            },
            getFastFav: function() {
                return liveFastFav
            },
            getFastAll: function() {
                return liveFastAll
            },
            getLiveFocus: function() {
                return ie
            },
            isFavoritesOnly: function() {
                return liveFavFilter
            },
            setFavoritesOnly: function(value) {
                liveFavFilter = value
            },
            byId: t,
            el: e,
            clear: i,
            firstFocus: it,
            canFocus: Ye,
            focus: tt,
            renderList: Ht,
            selectCategory: function(category, first, complete) {
                Ut(category, first, complete)
            },
            selectChannel: Vt,
            openPlayer: dr,
            updateLabel: liveUpdateLabel
        }), runtime.attachAddonsDialog && runtime.attachAddonsDialog({
            getPresets: function() {
                return Ct
            },
            getAddons: wt,
            saveAddons: xt,
            installAddon: Xt,
            getSelectedCategory: function() {
                return _t
            },
            reloadChannels: Ft,
            byId: t,
            el: e,
            clear: i,
            firstFocus: it,
            focus: tt,
            isChannelsOpen: function() {
                return j.channelsOpen
            },
            getChannelsPanel: function() {
                return Ce
            },
            getPlayerFocus: function() {
                return ye
            },
            setOpen: function(value) {
                Pt = value
            }
        }), runtime.attachSearch && runtime.attachSearch({
            state: j,
            getCatalog: function() {
                return l
            },
            getHotSearches: function() {
                for (var source = T(), items = [], index = 0; index < source.length; index++) -1 !== String(source[index] && source[index].category || "").toLowerCase().indexOf("busqueda") && items.push(_(source[index], index + 1));
                return items.length ? items : I("busqueda", 10, 0)
            },
            isPortal: function() {
                return "portal" === p.mode
            },
            searchRemote: function(value, done) {
                q("search", {
                    value: value
                }, done)
            },
            normalizeItem: _,
            buildPoster: bt,
            byId: t,
            el: e,
            clear: i,
            place: a,
            focus: tt,
            canFocus: Ye,
            firstFocus: it,
            showScreen: nt,
            getAppRoot: function() {
                return t("app")
            },
            getNotify: function() {
                return t("home-notify")
            }
        }), runtime.attachSettings && runtime.attachSettings({
            state: j,
            getProfile: function() {
                return X
            },
            getCatalog: function() {
                return l
            },
            isSeries: S,
            openHistory: Oa,
            formatTime: ki,
            refreshPlayback: function() {
                ka(), Q()
            },
            onStreamModeChanged: function() {
                za = j.playback.streamModes = {}, j.playerItem && Wa(j.playerItem)
            },
            byId: t,
            el: e,
            clear: i,
            place: a,
            focus: tt,
            firstFocus: it,
            showScreen: nt
        }), runtime.attachDetail && runtime.attachDetail({
            state: j,
            getCatalog: function() {
                return l
            },
            isSeries: S,
            isFavorite: function(item) {
                return !!(item && item.id && j.favs[String(item.id)])
            },
            toggleFavorite: K,
            isReminderActive: reminderOn,
            toggleReminder: toggleReminder,
            toast: toast,
            play: lr,
            playEpisode: gn,
            startPlayback: sr,
            openLanguage: Sn,
            isSmooth: function() {
                return "smooth" === j.streamMode
            },
            toggleSmooth: function(item) {
                var next = "smooth" !== j.streamMode;
                return $a(item, next), "smooth" === j.streamMode
            },
            loadSeason: function(item, index, done) {
                var season = item.seasons && item.seasons[index];
                if (!season || !season.id) return void done();
                nr("Cargando temporada…"), q("detail", {
                    contentId: season.id
                }, function(error, response) {
                    if (!error && response && !1 !== response.returnValue) {
                        if (response.item) R(item, response.item);
                        item.episodes = response.episodes || [];
                        item.seasonId = season.id;
                        season._episodes = item.episodes;
                        j.detailEpisode = item.episodes[0] || null
                    }
                    done()
                })
            },
            buildPoster: bt,
            byId: t,
            el: e,
            text: function(value) {
                return document.createTextNode(value)
            },
            clear: i,
            place: a,
            focus: tt
        }), runtime.attachResume && runtime.attachResume({
            state: j,
            byId: t,
            el: e,
            text: function(value) {
                return document.createTextNode(value)
            },
            clear: i,
            focus: tt,
            canFocus: Ye,
            getAppRoot: function() {
                return t("app")
            },
            formatTime: ki
        }), runtime.attachPlayerSession && runtime.attachPlayerSession({
            state: j,
            getMedia: function() {
                return we
            },
            getDetail: function() {
                return j.detail
            },
            getStreamUrl: function() {
                return Fn
            },
            resetStream: ar,
            prepareMediaInfo: function(item) {
                ma = !1, ga = 0, Qa(item)
            },
            resolvePlayback: or,
            loadSource: rr,
            notifyStatus: nr,
            shouldReuse: function(screen, hasSource, sameItem, sameEpisode) {
                return legacyShouldReusePlaybackSession(screen, hasSource, sameItem, sameEpisode)
            },
            hasPlaybackSession: function(source, currentSource, streamUrl, streamError) {
                return legacyHasPlaybackSession(source, currentSource, streamUrl, streamError)
            },
            currentPosition: function(media) {
                return legacyCurrentPlaybackPosition(media.currentTime || 0, Hn, zn)
            },
            prepareItem: Wa,
            resetPlaybackItem: Xa,
            showFullscreenPlayer: function() {
                var playerScreen = t("screen-player"),
                    detailScreen = t("screen-detail");
                legacyApplyDetailPlayerTransition(playerScreen, detailScreen), legacyApplyPlayerModeClass(ye, !0), vr(), tt(ye), Ri()
            },
            startPlayback: sr,
            logTransition: function(info) {
                window.TUTYTV_WEB && window.console && console.log("[TUTYTV] fullscreen transition", info)
            }
        }), runtime.attachPlayerResolve && runtime.attachPlayerResolve({
            state: j,
            getSequence: function() {
                return Bn
            },
            getMediaInfo: function(item) {
                return Aa[Ja(item)] || null
            },
            getMediaKey: Ja,
            isAudioOverride: function() {
                return ma
            },
            getAudioIndex: function() {
                return ga
            },
            setAudioIndex: function(index) {
                ga = index
            },
            selectAudioTrack: Ka,
            buildRequest: legacyBuildPlaybackResolveRequest,
            isSeries: S,
            shouldLoadEpisodes: legacyShouldLoadSeriesEpisodesBeforePlay,
            loadSeriesDetail: U,
            resolve: function(request, forceRelay, done) {
                q(forceRelay ? "resolveSmooth" : "resolve", request, done)
            },
            applyResolved: legacyApplyResolvedPlayback,
            setStreamInfo: function(info) {
                try {
                    window.__tutyStreamInfo = info
                } catch (e) {}
            },
            notify: nr
        }), runtime.attachPlayerLive && runtime.attachPlayerLive({
            state: j,
            getCurrentChannel: function() {
                return F[j.channel] || null
            },
            getSequence: function() {
                return cr
            },
            nextSequence: function() {
                return ++cr
            },
            resolveDelay: function() {
                return legacyResolveLiveResolveDelay(!1)
            },
            resolveLive: function(channel, done) {
                q("resolveLive", channel.streamUrl ? {
                    streamUrl: channel.streamUrl
                } : {
                    channelCode: channel.channelCode
                }, done)
            },
            notify: nr,
            showInfobar: function() {
                Pi()
            },
            loadSource: rr
        }), runtime.attachPlayerRouting && runtime.attachPlayerRouting({
            state: j,
            ensurePlayerStage: function() {
                ye || En()
            },
            stopPreview: Nt,
            resetPlaybackItem: Xa,
            prepareItem: Wa,
            applyPlayerMode: function(isVod) {
                legacyApplyPlayerModeClass(ye, isVod)
            },
            refreshPlayer: vr,
            showPlayerScreen: function() {
                nt("player")
            },
            focusPlayer: function() {
                tt(ye)
            },
            closeChannelPanels: function() {
                j.channelsOpen = !1, be && be.classList.remove("is-active"), Ce && Ce.classList.remove("is-active")
            },
            showInfobar: function() {
                Pi()
            },
            playLive: function() {
                ur(F[j.channel])
            },
            playVod: sr,
            openFullscreen: lr
        }), runtime.attachPlayerInfobar && runtime.attachPlayerInfobar({
            state: j,
            getVodBar: function() {
                return Le
            },
            getLiveBar: function() {
                return be
            },
            getOsd: function() {
                return Ae || (Ae = t("player-osd-icon"))
            },
            hideDelayMs: _i
        }), runtime.attachLiveChannelPanel && runtime.attachLiveChannelPanel({
            state: j,
            getPanel: function() {
                return Ce
            },
            getCategories: function() {
                return St
            },
            getSelectedCategory: function() {
                return _t
            },
            getChannels: function() {
                return F
            },
            getPageSize: function() {
                return Ge
            },
            getCategorySignature: function() {
                return Xe
            },
            setCategorySignature: function(value) {
                Xe = value
            },
            getFocusCategory: function() {
                return j.focus && j.focus._cat ? j.focus._cat : null
            },
            getChannelRows: function() {
                return Ve
            },
            setChannelRows: function(rows) {
                Ve = rows
            },
            el: e,
            clear: i,
            focus: tt,
            focusAndScroll: function(container, node) {
                tt(node), Pn(container, node)
            },
            scrollIntoView: Pn,
            selectCategory: Ut,
            openCategories: Dn,
            openAddons: jt,
            playChannel: Vt,
            closePanel: gr,
            focusCurrentChannel: function(index) {
                var row = Ve[index];
                if (!row) return;
                tt(row);
                var parent = row.parentNode,
                    top = 111 * index;
                (top < parent.scrollTop || top + 109.5 > parent.scrollTop + parent.clientHeight) && (parent.scrollTop = Math.max(0, top - 120))
            },
            focusPlayer: function() {
                ye && tt(ye)
            }
        }), runtime.attachPlayerInfoContent && runtime.attachPlayerInfoContent({
            state: j,
            getLiveBar: function() {
                return be
            },
            getVodBar: function() {
                return Le
            },
            getVodTitle: function() {
                return Me
            },
            getVodPoster: function() {
                return ke
            },
            getChannels: function() {
                return F
            },
            getCatalog: function() {
                return l
            },
            getVideo: function() {
                return we
            },
            isSeries: S,
            syncChannelTabs: function() {
                for (var key in Ve) Ve.hasOwnProperty(key) && Ve[key].classList.toggle("is-current", Ve[key]._channel === j.channel)
            },
            layoutLiveQuality: fr,
            updateProgress: function(position, duration) {
                Ei(position, duration)
            }
        }), runtime.attachPlayerSubtitles && runtime.attachPlayerSubtitles({
            getContainer: function() {
                return ua
            },
            fetchText: function(url, done) {
                try {
                    var request = new XMLHttpRequest;
                    request.open("GET", url, !0), request.onload = function() {
                        done(request.status >= 200 && request.status < 300 ? request.responseText : null)
                    }, request.onerror = function() {
                        done(null)
                    }, request.send()
                } catch (e) {
                    done(null)
                }
            },
            parseCues: function(text) {
                return legacyParseSubtitleCues(text)
            },
            findCue: function(list, position) {
                return legacyFindSubtitleCue(list, position)
            }
        }), runtime.attachNextEpisodePrompt && runtime.attachNextEpisodePrompt({
            state: j,
            getPrompt: function() {
                return t("next-episode-prompt")
            },
            getElements: function() {
                return {
                    kicker: t("next-episode-kicker"),
                    title: t("next-episode-title"),
                    play: t("next-episode-play"),
                    cancel: t("next-episode-cancel"),
                    count: t("next-episode-count")
                }
            },
            focus: tt,
            restorePlayerFocus: function() {
                ye && tt(ye)
            },
            formatTarget: function(target) {
                return dn(j.playerItem, target.episode) || "Episodio siguiente"
            },
            startNext: startNextEpisode
        }), runtime.attachNextEpisodeAdvance && runtime.attachNextEpisodeAdvance({
            state: j,
            isSeries: S,
            seasons: sn,
            seasonEpisodes: legacySeasonEpisodes,
            findEpisodeIndex: legacyFindEpisodeIndex,
            resolveNext: legacyResolveNextPlaybackTarget,
            refreshSeasons: refreshNextSeasons,
            resetStream: ar,
            showLoading: showNextEpisodeLoading,
            hideLoading: mn,
            switchEpisode: gn,
            loadSeasonEpisodes: function(item, season, done) {
                ln(item, season, function(episodes, detail) {
                    done(episodes || [], detail)
                })
            },
            mergeDetail: R,
            notify: nr,
            log: function(message, payload) {
                window.TUTYTV_WEB && window.console && console.log("[TUTYTV] " + message, payload)
            }
        }), runtime.attachPlayerAudio && runtime.attachPlayerAudio({
            state: j,
            getOptions: function() {
                return aa
            },
            clear: i,
            getMediaAudio: function() {
                var media = Aa[Ja(Ha())];
                return media && media.audio
            },
            isAudioOverride: function() {
                return ma
            },
            getSelectedIndex: function() {
                return ga
            },
            setSelectedIndex: function(index) {
                ga = index
            },
            setAudioOverride: function(value) {
                ma = value
            },
            parseTracks: function(audio) {
                var core = window.TutyCore;
                if (core && typeof core.parseAudioTracks === "function") return core.parseAudioTracks(audio);
                for (var tracks = [], parts = String(audio || "").split(/[,\/]/), index = 0; index < parts.length; index++) {
                    var code = parts[index].trim();
                    code && tracks.push({
                        index: index,
                        code: code,
                        label: Mn(code)
                    })
                }
                return tracks
            },
            describeTrack: Mn,
            selectIndex: function(audio) {
                return Ka(audio)
            },
            languagePreference: legacyLanguagePreference,
            savePreferences: Q,
            isPlayerScreen: function() {
                return "player" === j.screen
            },
            hasMedia: function() {
                return !!we
            },
            getRelaySource: function() {
                return Hn
            },
            absolutePosition: function() {
                return Math.floor(zn + (we ? we.currentTime || 0 : 0))
            },
            loadUrl: rr,
            ensureRelayMode: function() {
                "relay" !== j.streamMode && "smooth" !== j.streamMode && (j.streamMode = "relay", Cn())
            },
            reloadResolved: Tn,
            closeSettings: en,
            el: e
        }), runtime.attachPlaySettings && runtime.attachPlaySettings({
            state: j,
            byId: t,
            el: e,
            clear: i,
            focus: tt,
            firstFocus: it,
            getFocusRow: function() {
                return j.focus ? n(j.focus, ".psv-row") : null
            },
            isSeries: S,
            getSeasons: sn,
            getEpisodeRanges: ii,
            refreshMediaInfo: Qa,
            playEpisode: function(episode, seasonIndex) {
                var runtime = window.TutyUI;
                runtime && runtime.playEpisodeSelection && runtime.playEpisodeSelection(episode, seasonIndex)
            },
            refreshStreamModeButtons: Cn,
            refreshAspectButtons: wn,
            hideInfobar: Ni,
            ensureStage: function() {
                Fi || En()
            },
            focusPlayer: function() {
                ye && tt(ye)
            },
            isQuickOpen: function() {
                return va
            },
            setQuickOpen: function(value) {
                va = value
            },
            isFullOpen: function() {
                return fa
            },
            setFullOpen: function(value) {
                fa = value
            },
            canFocus: Ye,
            getCurrentFocus: function() {
                return j.focus || null
            },
            getCurrentItem: Ha,
            renderAudioTracks: Ln,
            getSubtitleTracks: function() {
                return Ya(Aa[Ja(Ha())])
            },
            isSubtitleEnabled: function() {
                return ba
            },
            setSubtitleEnabled: function(value) {
                ba = value
            },
            getCurrentSubtitle: function() {
                return ya
            },
            setCurrentSubtitle: function(track) {
                ya = track
            },
            setSubtitleForced: function(value) {
                Ca = value
            },
            loadSubtitle: Ua,
            getSubtitleSize: function() {
                return xa
            },
            getSubtitleStyle: function() {
                return Sa
            },
            setSubtitleSize: function(value) {
                xa = value
            },
            setSubtitleStyle: function(value) {
                Sa = value
            },
            savePlaybackPreferences: Q,
            applySubtitleDisplay: Fa,
            languagePreference: legacyLanguagePreference,
            formatLanguage: Mn
        }), runtime.attachPlayerVideoSettings && runtime.attachPlayerVideoSettings({
            state: j,
            getVideo: function() {
                return we
            },
            getRelayButton: function() {
                return ji
            },
            getNormalButton: function() {
                return Wi
            },
            getCheck: function(button) {
                return button && button.querySelector(".psv-check")
            },
            getAspectButtons: function() {
                return Gi ? Gi.querySelectorAll(".psv-btn") : []
            },
            isRelayMode: legacyRelayStreamMode
        }), runtime.attachEpisodeBrowser && runtime.attachEpisodeBrowser({
            state: j,
            isSeries: S,
            ensureDom: function() {
                return Qi || (En(), Qi)
            },
            getOverlay: function() {
                return Qi || (En(), Qi)
            },
            getTitle: function() {
                return Ki
            },
            getSubtitle: function() {
                return Yi
            },
            getSeasonLabel: function() {
                return ia
            },
            getSeasonsContainer: function() {
                return Zi
            },
            getEpisodesContainer: function() {
                return ta
            },
            el: e,
            clear: i,
            focus: tt,
            firstFocus: it,
            querySelector: function(root, selector) {
                return root && root.querySelector ? root.querySelector(selector) : null
            },
            querySelectorAll: function(root, selector) {
                return root && root.querySelectorAll ? root.querySelectorAll(selector) : []
            },
            getSeasons: sn,
            loadSeasonEpisodes: function(item, season, done) {
                ln(item, season, function(episodes, detail) {
                    done(episodes || [], detail)
                })
            },
            formatEpisode: dn,
            formatDuration: cn,
            loadDetail: U,
            notify: nr,
            hideInfobar: function() {
                Ni()
            },
            closePlaySettingsIfOpen: function() {
                va && an()
            },
            focusPlayer: function() {
                ye && tt(ye)
            },
            isFocusWithin: function(id) {
                return !!n(j.focus, "#" + id)
            },
            playEpisode: gn
        }), runtime.attachAppLifecycle && runtime.attachAppLifecycle({
            isHidden: function() {
                return !!document.hidden
            },
            getPlayer: function() {
                return we
            },
            getPreview: function() {
                return Et
            },
            play: function(media) {
                return legacyPlayVideo(media)
            },
            stopPlayback: ar,
            cleanup: pi
        }), runtime.attachWebOsKeepAlive && runtime.attachWebOsKeepAlive({
            canUseLuna: legacyCanUseLuna,
            getServiceId: function() {
                return p.serviceId || "com.webosflux.xuptertv.fidelity.service"
            },
            getBridge: function() {
                return window.webOS && window.webOS.service ? window.webOS.service : null
            }
        }), runtime.attachDeepLink && runtime.attachDeepLink({
            state: j,
            getSearch: function() {
                return location.search || ""
            },
            getChannelCount: function() {
                return F.length
            },
            skipWelcome: dt,
            selectTab: function(index, focus) {
                ht(index, focus)
            },
            focusDefault: function() {
                tt(ie)
            },
            openDetail: function(index) {
                ei(l[index])
            },
            openSearch: li,
            setSearchQuery: ci,
            openSettings: yi,
            openSettingsPanel: function(index) {
                bi(index, !0)
            },
            openPlayer: function(mode, index) {
                dr(mode, l[index] || null)
            },
            openChannels: hr,
            focusSelector: function(selector) {
                var element = document.querySelector(selector);
                element && tt(element)
            }
        })
    }

    function getPlayerCleanupHost() {
        return {
            state: j,
            getVideo: function() {
                return we
            },
            getPosition: function() {
                return Hn ? zn + (we.currentTime || 0) : we.currentTime || 0
            },
            getAudioIndex: function() {
                return ga
            },
            closeNextEpisodePrompt: closeNextEpisodePrompt,
            shouldSaveHistoryBeforeReset: function() {
                return legacyShouldSaveHistoryBeforeReset(j.playerMode, !!we)
            },
            saveHistoryBeforeReset: function() {
                Ta(legacyCurrentPlaybackPosition(we.currentTime || 0, Hn, zn), legacyResolvePlaybackTotal(we.duration, j.playerEpisode && j.playerEpisode.duration ? Mi(j.playerEpisode.duration) : 0, j.playerItem && j.playerItem.duration ? Mi(j.playerItem.duration) : 0), !0)
            },
            resetPlaybackState: function() {
                j.streamError = "", $n(), nr(""), qi("none"), Ti(), jn && (clearTimeout(jn), jn = null, Vn = 0), Qn(), Hn = "", zn = 0, Hd = 0, Bn++
            },
            resolveAbortBase: function() {
                return legacyResolveAbortServiceBase(Un, Fn)
            },
            abortMedia: function(base) {
                if (base) try {
                    var request = new XMLHttpRequest;
                    request.open("GET", base + "/media/abort", !0), request.send()
                } catch (e) {}
                try {
                    q("abortMedia", {}, function() {})
                } catch (e) {}
            },
            destroyHls: function() {
                legacyDestroyHls("__tutyHls")
            },
            clearVideo: function(video) {
                Fn = "", Un = "";
                try {
                    video.onerror = null
                } catch (e) {}
                try {
                    legacyPauseVideo(video)
                } catch (e) {}
                try {
                    legacySeekVideo(video, 0)
                } catch (e) {}
                video.removeAttribute("src");
                try {
                    legacySetVideoSource(video, "")
                } catch (e) {}
                for (; video.firstChild;) video.removeChild(video.firstChild);
                legacyApplyPlaybackSurface(video, xe, !1)
            },
            clearSessionSource: function() {
                var runtime = window.TutyUI;
                runtime && runtime.clearPlayerSessionSource && runtime.clearPlayerSessionSource()
            },
            notify: nr,
            resolveTarget: function(item, done) {
                or(item, done)
            },
            loadSource: function(url) {
                rr(url)
            },
            seekVideo: function(position) {
                legacySeekVideo(we, position)
            }
        }
    }

    function getBootstrapHost() {
        return {
            attachRuntime: attachTutyUiRuntime,
            resize: mr,
            installNavigation: function() {
                legacyInstallNavigation(document, lt)
            },
            onPopState: ot,
            onClick: function(e) {
                var target = n(e.target, ".focusable");
                target && (tt(target, !0), target._activate && target._activate())
            },
            startKeepAlive: function() {
                var runtime = window.TutyUI;
                runtime && runtime.startWebOsKeepAlive && runtime.startWebOsKeepAlive()
            },
            scheduleWelcome: function() {
                Ke = setTimeout(dt, 2600)
            },
            loadCatalogs: N,
            loadLive: Bt,
            installDebugApi: function() {
                var runtime = window.TutyUI;
                runtime && runtime.installDebugApi && runtime.installDebugApi({
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
                    showScreen: nt,
                    selectTab: ht,
                    openDetail: function(index) {
                        ei(l[index] || l[0])
                    },
                    openSearch: li,
                    openSettings: yi,
                    openLiveCategories: lvOpenCats,
                    openLiveSearch: lvOpenSearch,
                    toggleLiveFavorites: lvToggleFav,
                    openPlayer: function(mode, index) {
                        dr(mode, l[index] || null)
                    },
                    focus: function(target) {
                        var element = "string" == typeof target ? document.querySelector(target) : target;
                        element && tt(element)
                    },
                    handleKey: function(code) {
                        lt({
                            keyCode: code,
                            preventDefault: function() {}
                        })
                    },
                    search: ci,
                    openSettingsPanel: function(panel) {
                        bi(panel, !0)
                    }
                })
            },
            applyDeepLink: function() {
                var runtime = window.TutyUI;
                runtime && runtime.hasDeepLinkRuntime && runtime.hasDeepLinkRuntime() && runtime.applyDeepLink && runtime.applyDeepLink()
            }
        }
    }

    function yr() {
        var runtime = window.TutyUI;
        runtime && runtime.startBootstrap && runtime.startBootstrap(getBootstrapHost())
    }

    function handleVisibilityChange() {
        var runtime = window.TutyUI;
        return runtime && runtime.handleLifecycleVisibilityChange ? runtime.handleLifecycleVisibilityChange() : !1
    }

    function br() {
        var runtime = window.TutyUI;
        return runtime && runtime.handleLifecycleUnload ? runtime.handleLifecycleUnload() : !1
    }
    window.addEventListener("beforeunload", br), window.addEventListener("unload", br), document.addEventListener("visibilitychange", handleVisibilityChange), "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", yr) : yr()
}();
