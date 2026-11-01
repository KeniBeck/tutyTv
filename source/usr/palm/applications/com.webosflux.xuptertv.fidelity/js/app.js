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
    var p = window.XUPERTV_API || {},
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
        if ("[object Array]" === Object.prototype.toString.call(e)) return e;
        if (!e) return [];
        for (var t = ["items", "movies", "results", "recommendList", "movieList", "totalMovieList", "programList", "data"], i = 0; i < t.length; i++) {
            if ("[object Array]" === Object.prototype.toString.call(e[t[i]])) return e[t[i]];
            if (e[t[i]] && "object" == typeof e[t[i]]) {
                var a = g(e[t[i]]);
                if (a.length) return a
            }
        }
        return []
    }

    function m(e) {
        var t = p[e + "Url"];
        if (t) return String(t);
        var i = String(p.baseUrl || "").replace(/\/$/, ""),
            a = String(p[e + "Path"] || "");
        return i && a ? i + ("/" === a.charAt(0) ? a : "/" + a) : ""
    }

    function y() {
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
        var e = y();
        return !!(e.userId && e.userToken && e.portalCode)
    }

    function C(e, t) {
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
        return !!e && ("teleplay" === e.type || "series" === e.type || "serie" === e.kind || e.category && -1 !== e.category.indexOf("serie") || e.episodes && e.episodes.length > 0 || e.seasons && e.seasons.length > 0 || e.volumeCount && parseInt(e.volumeCount, 10) > 1)
    }

    function _(e, t) {
        var i = (e = e || {}).genres || e.genre || [];
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
        if (!e || !S(e)) return null;
        var t = String(e.title || e.alias || "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, ""),
            i = /^(.*?)(?:\s*[-–:|]?\s*(?:temporada|season)\s*(\d+)|\s*[-–:|]?\s*[st]\s*0?(\d+))\s*$/i.exec(t);
        if (!i || !i[1]) return null;
        var a = parseInt(i[2] || i[3], 10);
        return !a || a > 99 ? null : {
            title: i[1].replace(/\s+$/, ""),
            number: a
        }
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
        for (var f = function(e) {
                for (var t = {}, i = [], a = 0; a < e.length; a++) {
                    var n = k(e[a]);
                    n ? (t[r = o(n.title)] || (t[r] = {
                        title: n.title,
                        items: []
                    }), t[r].items.push({
                        item: e[a],
                        number: n.number
                    })) : i.push(e[a])
                }
                for (var r in t)
                    if (t.hasOwnProperty(r)) {
                        var s = t[r];
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
            }(d), h = 0; h < f.length; h++) l.push(f[h]);
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
        var a, n = [];
        if (e)
            for (a = 0; a < l.length; a++) {
                -1 !== o(l[a].category || "").split(",").indexOf(e) && n.push(l[a])
            }
        if (n.length || (n = l.slice(i, i + t)), n.length || (n = l.slice(0, t)), n.length < t && l.length) {
            var r = {};
            for (a = 0; a < n.length; a++) r[String(n[a].id)] = !0;
            for (var s = 0; n.length < t && s < 2 * l.length;) {
                var d = l[s % l.length];
                s++, r[String(d.id)] || (n.push(d), r[String(d.id)] = !0)
            }
        }
        return n
    }

    function T() {
        var e = window.XUPERTV_CATALOG;
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
        if (E() && window.PalmServiceBridge) try {
            return window.webOS.service.request("luna://" + a, {
                method: e,
                parameters: t || {},
                timeout: parseInt(p.timeoutMs, 10) || 2e4,
                onSuccess: function(e) {
                    r(null, e)
                },
                onFailure: function(e) {
                    r(e && e.errorText || "Error del servicio XuperTV", null)
                }
            }), !0
        } catch (e) {
            if (!p.devServiceUrl) return r("Error comunicando con el servicio: " + (e.message || e), null), !1
        }
        return p.devServiceUrl ? (L(String(p.devServiceUrl).replace(/\/$/, "") + "/" + e + "?" + function(e) {
            var t = [];
            for (var i in e) Object.prototype.hasOwnProperty.call(e, i) && t.push(encodeURIComponent(i) + "=" + encodeURIComponent(e[i]));
            return t.join("&")
        }(t || {}), function(e, t) {
            r(e, t)
        }, null), !0) : (r("El servicio XuperTV no está disponible", null), !1)
    }

    function O(e) {
        var t = {},
            i = [],
            a = {};

        function n(e) {
            if (e && e.id) {
                var n = String(e.id);
                if (t[n]) {
                    var r = t[n];
                    for (var o in e) Object.prototype.hasOwnProperty.call(e, o) && "" !== e[o] && "—" !== e[o] && null !== e[o] && void 0 !== e[o] && (r[o] = e[o])
                } else t[n] = e, i.push(n);
                var s = String(e.category || "").split(",");
                a[n] = a[n] || {};
                for (var l = 0; l < s.length; l++) s[l] && (a[n][s[l]] = !0)
            }
        }
        for (var r = 0; r < h.length; r++)
            for (var o = e[h[r]] || [], s = 0; s < o.length; s++) o[s].portal = !0, n(o[s]);
        if (i.length) {
            for (var l = [], d = 0; d < i.length; d++) {
                var c = t[i[d]];
                c.category = Object.keys(a[i[d]]).join(","), l.push(c)
            }
            for (var p = function() {
                    for (var e = T(), t = [], i = 0; i < e.length; i++)
                        if (e[i] && e[i].streamUrl) {
                            var a = {};
                            for (var n in e[i]) Object.prototype.hasOwnProperty.call(e[i], n) && (a[n] = e[i][n]);
                            a.category = "demo", a.portal = !1, t.push(a)
                        } return t
                }(), u = 0; u < p.length; u++) l.push(p[u]);
            l.length && M(l, "portal", !0)
        }
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
        var e, t = (e = window.XUPERTV_PORTAL) ? g(e) : [];
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
                        var i = function(e) {
                            if (!e || "object" != typeof e) return "";
                            var t = e.returnCode || e.code || e.errorCode || "",
                                i = e.errorMessage || e.message || e.msg || "";
                            return t || i ? (t ? String(t) + ": " : "") + (i ? String(i) : "La API rechazó la petición") : ""
                        }(t);
                        if (e || i || !M(g(t), "api")) {
                            var a = e || i || "La API no devolvió películas";
                            P("bundled-fallback", a) || (v.error = a)
                        }
                    }, "xuper" === p.mode ? {
                        method: "POST",
                        body: C("catalog")
                    } : null)) : p.useBundledCatalog ? P("bundled", null) : v.error = "Falta baseUrl/catalogUrl del catálogo autorizado" : v.error = "Falta la sesión XuperTV (userId, userToken y portalCode)"
                } else P("bundled", null);
        else A()
    }

    function R(e, t) {
        var i = e && e._seriesGroup ? e.id : null,
            a = e && e._seriesGroup ? e._seriesTitle : null,
            n = _(t, e.id);
        for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && "—" !== n[r] && "" !== n[r] && "Sin sinopsis disponible." !== n[r] && (e[r] = n[r]);
        null !== i && (e.id = i, e.title = a, e.alias = a, e.seasons = e._catalogSeasons || e.seasons)
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
                subLang: 0,
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
        try {
            var i = localStorage.getItem(e);
            return i ? JSON.parse(i) : t
        } catch (e) {
            return t
        }
    }

    function J(e, t) {
        try {
            localStorage.setItem(e, JSON.stringify(t))
        } catch (e) {}
    }

    function Q() {
        J($, j.playback)
    }

    function K(e) {
        if (!e || !e.id) return !1;
        var t = String(e.id),
            i = !j.favs[t];
        return i ? j.favs[t] = !0 : delete j.favs[t], X.favs = j.favs, J(W, X), i
    }

    function reminderOn(e) {
        return !!(e && e.id && X.reminders && X.reminders[String(e.id)])
    }

    function toggleReminder(e) {
        if (!e || !e.id) return !1;
        var t = String(e.id),
            i = !reminderOn(e);
        if (i) X.reminders[t] = {
            id: t,
            title: e.title || "Contenido",
            poster: e.poster || e.cover || "",
            count: e.episodes && e.episodes.length ? e.episodes.length : parseInt(e.updateCount || e.volumeCount || 0, 10) || 0,
            createdAt: Date.now()
        };
        else delete X.reminders[t];
        return J(W, X), i
    }

    function toast(msg) {
        var i = t("app");
        if (i) {
            var a = e("div", "xuper-toast", msg);
            i.appendChild(a), setTimeout(function() {
                a.parentNode && a.parentNode.removeChild(a)
            }, 3500)
        }
    }

    function stopWebMedia() {
        if (!window.XUPERTV_WEB) return;
        try {
            we && we.pause()
        } catch (e) {}
        window.__xuperHls && (function() {
            try {
                window.__xuperHls.destroy()
            } catch (e) {}
        })(), window.__xuperHls = null;
        try {
            Et && Et.pause()
        } catch (e) {}
        window.__xuperPreviewHls && (function() {
            try {
                window.__xuperPreviewHls.destroy()
            } catch (e) {}
        })(), window.__xuperPreviewHls = null;
        try {
            q("abortMedia", {}, function() {})
        } catch (e) {}
    }

    function checkReminders() {
        if (!X.reminders) return;
        var e = Object.keys(X.reminders);
        if (!e.length || X.reminderCheckAt && Date.now() - X.reminderCheckAt < 216e5) return;
        X.reminderCheckAt = Date.now(), J(W, X);
        for (var t = e.slice(0, 10), i = [], a = 0, n = 0; n < t.length; n++)(function(e) {
            q("detail", {
                contentId: e
            }, function(n, r) {
                if (a++, !n && r && !1 !== r.returnValue) {
                    var s = r.item || {},
                        l = X.reminders[e];
                    if (l) {
                        var d = r.episodes && r.episodes.length ? r.episodes.length : parseInt(s.updateCount || s.volumeCount || 0, 10) || 0;
                        d > 0 && (l.count > 0 && d > l.count && i.push(s.title || l.title || "Una serie"), l.count = d), l.title = s.title || l.title, l.poster = s.poster || s.posterUrl || l.poster, J(W, X)
                    }
                }
                a === t.length && i.length && toast("Nuevos episodios: " + i.slice(0, 3).join(", "))
            })
        })(t[n])
    }! function() {
        var e = G($, null);
        if (e)
            for (var t in j.playback) j.playback.hasOwnProperty(t) && void 0 !== e[t] && (j.playback[t] = e[t]);
        var i = G(W, null);
        i && i.id ? (X = i).history && X.history.length || (X.history = []) : (X.id = "TV-" + String(Date.now()).slice(-8), X.createdAt = Date.now(), J(W, X)),         X.favs || (X.favs = {}), X.reminders || (X.reminders = {}), j.favs = X.favs
    }();
    var Y, Z, ee, te, ie, ae, ne, re, oe, se, le, de, ce, pe, ue, ve, fe, he, ge, me, ye, be, Ce, we, xe, Se, _e, Le, ke, Me, Ie, Te, Ee, qe, Oe, De, Ae, Pe = !1,
        Ne = [],
        Re = [],
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

    function Ye(e) {
        if (!e || !e.getBoundingClientRect) return !1;
        if (null === e.offsetParent) return !1;
        var t = e.getBoundingClientRect();
        if (t.width < 1 || t.height < 1) return !1;
        if (j.episodeBrowserOpen) return !!n(e, "#player-episodes");
        if (j.categoryPickerOpen) return !!n(e, "#player-categories");
        if (j.liveCategoriesOpen) return !!n(e, "#live-categories");
        if (j.liveSearchOpen) return !!n(e, "#live-search");
        if (j.resumeOpen) return !!n(e, "#dialog-resume");
        if (j.filterOpen) return !!n(e, "#filter-panel");
        if (fa) return !!n(e, "#dialog-playsettings");
        if (va) return !!n(e, "#player-playsetting-view");
        var i = n(e, ".home-page");
        if (i && !i.classList.contains("is-current")) return !1;
        var a = n(e, ".settings-panel");
        if (a && !a.classList.contains("is-active")) return !1;
        var r = n(e, ".search-hot");
        if (r && r.classList.contains("is-hidden")) return !1;
        var o = n(e, ".search-results");
        if (o && !o.classList.contains("is-active")) return !1;
        var s = n(e, ".player-channels");
        if (s && !s.classList.contains("is-active")) return !1;
        var l = n(e, ".player-infobar");
        return !(l && !l.classList.contains("is-active"))
    }

    function Ze() {
        for (var e = document.querySelectorAll(".focusable"), t = [], i = 0; i < e.length; i++) Ye(e[i]) && t.push(e[i]);
        return t
    }

    function et(e) {
        for (var t = n(e, ".scrollable"); t;) {
            var i = e.getBoundingClientRect(),
                a = t.getBoundingClientRect(),
                sx = t.offsetWidth ? a.width / t.offsetWidth : 1,
                sy = t.offsetHeight ? a.height / t.offsetHeight : 1;
            (!isFinite(sx) || sx <= 0) && (sx = 1), (!isFinite(sy) || sy <= 0) && (sy = 1);
            var l = (i.left - a.left) / sx,
                r = (i.right - a.right) / sx,
                u = (i.top - a.top) / sy,
                d = (i.bottom - a.bottom) / sy;
            u < 0 ? t.scrollTop += u - 12 : d > 0 && (t.scrollTop += d + 12), t.scrollWidth > t.clientWidth + 1 && (l < 0 ? t.scrollLeft += l - 12 : r > 0 && (t.scrollLeft += r + 12)), t = n(t.parentNode, ".scrollable")
        }
    }

    function tt(e, i) {
        if (e)
            if (j.focus !== e) {
                j.focus && j.focus.classList.remove("is-focused"), j.focus = e, e.classList.add("is-focused"), e._onFocus && e._onFocus(), rn();
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

    function at(e) {
        if (j.focus) {
            if (!j.focus._onMove || !j.focus._onMove(e)) {
                for (var t = "home" === j.screen && n(j.focus, ".home-page"), i = "home" === j.screen && n(j.focus, ".home-tabs"), a = Ze(), r = j.focus.getBoundingClientRect(), o = r.left + r.width / 2, s = r.top + r.height / 2, l = null, d = 1e9, c = 0; c < a.length; c++) {
                    var p = a[c];
                    if (p !== j.focus && ((!t || !n(p, ".home-tabs")) && (!i || n(p, ".home-tabs")))) {
                        var u, v, f, h = p.getBoundingClientRect(),
                            g = h.left + h.width / 2 - o,
                            m = h.top + h.height / 2 - s;
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
                        var y = u + 2 * v + (f ? 0 : 320);
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
        if (n && n.classList.add("is-active"), j.screen = e, "player" !== e && j.episodeBrowserOpen && un(!0), "player" !== e && j.categoryPickerOpen && An(!0), "home" !== e && j.liveCategoriesOpen && lvCloseCats(!0), "home" !== e && j.liveSearchOpen && lvCloseSearch(!0), "player" !== e && "detail" !== e) {
            fa && _n(), va && an();
            var r = t("screen-player");
            r && (r.classList.remove("is-mini"), r.classList.remove("is-active")), ar(), wa++, Da = [], ua && (ua.innerHTML = "")
        }
        window.XUPERTV_WEB && "player" !== e && "detail" !== e && stopWebMedia(), mt()
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
                        s && (s.classList.remove("is-mini"), s.classList.remove("is-active")), e && "search" === e.screen ? (nt("search"), tt(e.focus)) : (nt("home"), ht(j.tab, !1), e && e.focus && Ye(e.focus) ? tt(e.focus) : Re[j.tab] && tt(Re[j.tab]))
                    }
                }());
                if ("detail" !== j.screen) {
                    if ("search" === j.screen) return pi(), nt("home"), ht(j.tab, !1), void(Re[j.tab] && tt(Re[j.tab]));
                    if ("settings" === j.screen) return nt("home"), ht(j.tab, !1), void(Re[j.tab] && tt(Re[j.tab]));
                    if ("home" === j.screen) {
                        if (0 !== j.tab) return ht(0, !0), void(Re[0] && tt(Re[0]));
                        window.webOSTV && window.webOSTV.platformBack ? window.webOSTV.platformBack() : window.PalmSystem && window.PalmSystem.platformBack && window.PalmSystem.platformBack()
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
                    n && (n.classList.remove("is-mini"), n.classList.remove("is-active"));
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
            a = !0;
        if (461 === t || 27 === t || 8 === t || "Back" === i || "GoBack" === i || "Escape" === i) return j.categoryPickerOpen ? (An(), e.preventDefault && e.preventDefault(), void(e.stopPropagation && e.stopPropagation())) : j.liveSearchOpen ? (lvCloseSearch(), e.preventDefault && e.preventDefault(), void(e.stopPropagation && e.stopPropagation())) : j.liveCategoriesOpen ? (lvCloseCats(), e.preventDefault && e.preventDefault(), void(e.stopPropagation && e.stopPropagation())) : j.episodeBrowserOpen ? (un(), e.preventDefault && e.preventDefault(), void(e.stopPropagation && e.stopPropagation())) : Pt ? (rt = Date.now(), Wt(), e.preventDefault && e.preventDefault(), void(e.stopPropagation && e.stopPropagation())) : j.resumeOpen ? (closeResume(), e.preventDefault && e.preventDefault(), void(e.stopPropagation && e.stopPropagation())) : j.filterOpen ? (closeFilter(), e.preventDefault && e.preventDefault(), void(e.stopPropagation && e.stopPropagation())) : fa ? (rt = Date.now(), _n(), e.preventDefault && e.preventDefault(), void(e.stopPropagation && e.stopPropagation())) : va ? (rt = Date.now(), an(), e.preventDefault && e.preventDefault(), void(e.stopPropagation && e.stopPropagation())) : (ot(), e.preventDefault && e.preventDefault(), void(e.stopPropagation && e.stopPropagation()));
        if (j.resumeOpen) return 37 === t ? at("left") : 38 === t ? at("up") : 39 === t ? at("right") : 40 === t ? at("down") : 13 === t || 32 === t ? st() : a = !1, void(a && e.preventDefault && e.preventDefault());
        if (j.filterOpen) return 37 === t ? at("left") : 38 === t ? at("up") : 39 === t ? at("right") : 40 === t ? at("down") : 13 === t || 32 === t ? st() : a = !1, void(a && e.preventDefault && e.preventDefault());
        if (j.categoryPickerOpen) return 37 === t ? at("left") : 38 === t ? at("up") : 39 === t ? at("right") : 40 === t ? at("down") : 13 === t || 32 === t ? st() : a = !1, void(a && e.preventDefault && e.preventDefault());
        if (j.liveSearchOpen || j.liveCategoriesOpen) return 37 === t ? at("left") : 38 === t ? at("up") : 39 === t ? at("right") : 40 === t ? at("down") : 13 === t || 32 === t ? st() : a = !1, void(a && e.preventDefault && e.preventDefault());
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
            var d = 415 === t || "MediaPlay" === i || "Play" === i,
                c = 19 === t || "MediaPause" === i || "Pause" === i,
                p = 10252 === t || "MediaPlayPause" === i,
                u = 417 === t || "MediaFastForward" === i || "FastForward" === i,
                v = 412 === t || "MediaRewind" === i || "Rewind" === i,
                f = 413 === t || "MediaStop" === i || "Stop" === i;
            if ("player" === j.screen) {
                if (d) {
                    if (we && we.paused) {
                        try {
                            we.play()
                        } catch (e) {}
                        qi("none"), Pi()
                    }
                    return void(e.preventDefault && e.preventDefault())
                }
                if (c) {
                    if (we && !we.paused) {
                        try {
                            we.pause()
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
            var h = 457 === t || 93 === t || 467 === t || "Menu" === i || "ContextMenu" === i;
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
            if (37 === t) at("left");
            else if (38 === t) at("up");
            else if (39 === t) at("right");
            else if (40 === t) at("down");
            else if (13 === t || 32 === t) {
                if (j.episodeBrowserOpen) return void st();
                if (fa) st();
                else if (va) en(), st();
                else if ("player" === j.screen && "vod" === j.playerMode && j.focus === Ee && Je) er(!0);
                else if ("player" === j.screen && j.streamError && we && we.src && !n(j.focus, ".player-channels")) {
                    var b = we.play();
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
                i = t.slice(0, 6),
                a = !(!i[0] || !i[0]._portal);
            Kt(e, i, {
                titles: a,
                dots: a ? 4 : 0,
                shade: a
            });
            var n = t.slice(6);
            n.length && Zt(e, n, 860, "Títulos destacados")
        }, function(e) {
            var t = Yt("pelicula"),
                i = t.slice(0, 6),
                a = !(!i[0] || !i[0]._portal);
            Kt(e, i, {
                titles: a,
                dots: a ? 4 : 0,
                shade: a
            });
            var n = t.slice(6);
            n.length && Zt(e, n, 860, "Más películas")
        }, function(e) {
            var t = Yt("serie"),
                i = t.slice(0, 6),
                a = !(!i[0] || !i[0]._portal);
            Kt(e, i, {
                titles: a,
                dots: a ? 3 : 2,
                shade: a
            });
            var n = t.slice(6);
            n.length && Zt(e, n, 860, "Más series")
        }, function(t) {
            var i = I("infantil", 12, 0);
            i.length || (i = l);
            var n = !(!i[0] || !i[0]._portal);
            t.appendChild(Jt(i[0], 192, 38.5, 831, 534, {
                shade: !0,
                title: n
            }));
            for (var r = [
                    [1029, 38.5],
                    [1446, 38.5],
                    [1029, 269.5],
                    [1446, 269.5]
                ], o = 0; o < r.length; o++) t.appendChild(Jt(i[(o + 1) % i.length], r[o][0], r[o][1], 413, 222, {}));
            if (t.appendChild(Qt(833, 468.5, 4, 0)), i[0]) {
                var s = e("div", "kids-subtitle", i[0].tagline || i[0].title);
                a(s, 192, 526.5, 1249, 40), t.appendChild(s)
            }
            var d = e("div", "poster-row");
            a(d, 192, 578.5, 1920, 310);
            for (var c = 0; c < 7; c++) {
                var p = i[c % i.length];
                if (!p) break;
                d.appendChild(bt(p, 266 * c, 0, 266, 310, {
                    gold: !0
                }))
            }
            t.appendChild(d)
        }, function(e) {
            var t = Yt("anime"),
                i = t.slice(0, 6),
                a = !(!i[0] || !i[0]._portal);
            Kt(e, i, {
                titles: a,
                dots: a ? 3 : 2,
                shade: a
            });
            var n = t.slice(6);
            n.length && Zt(e, n, 860, "Anime y animación")
        }, function(t) {
            var i = l.length ? l : [];
            t.appendChild(Jt(i[0], 192, 38.5, 1249, 703, {
                shade: !0
            }));
            for (var n = 0; n < 3; n++) t.appendChild(Jt(i[(n + 1) % i.length], 1446, 38.5 + 231 * n, 413, 226, {
                badge: 2 === n ? "Adult" : ""
            }));
            t.appendChild(e("div", "explore-row-title", "Netflix"));
            var r = e("div", "explore-strip");
            a(r, 192, 811.5, 1920, 130);
            for (var o = 0; o < 8; o++) {
                var s = e("div", "explore-logo");
                a(s, 272 * o, 0, 260, 120), r.appendChild(s)
            }
            t.appendChild(r)
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
                            } else if (H[e].page >= 0) {
                                var i = it(Ne[H[e].page]);
                                i && tt(i)
                            }
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
                                } else if (H[e].page >= 0) {
                                    var a = it(Ne[H[e].page]);
                                    a && tt(a)
                                }
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
        window.XUPERTV_WEB && "player" !== j.screen && "detail" !== j.screen && stopWebMedia();
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
                } else {
                    var l = it(Ne[i.page]);
                    l && tt(l)
                } mt()
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
        try {
            var e = localStorage.getItem("xuper_m3u_addons");
            if (e) {
                var t = JSON.parse(e);
                if (Array.isArray(t) && t.length) return t
            }
        } catch (e) {}
        var i = [Ct[0]];
        try {
            localStorage.setItem("xuper_m3u_addons", JSON.stringify(i))
        } catch (e) {}
        return i
    }

    function xt(e) {
        try {
            localStorage.setItem("xuper_m3u_addons", JSON.stringify(e || []))
        } catch (e) {}
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
            window.__xuperPreviewHls && (function() {
                try {
                    window.__xuperPreviewHls.destroy()
                } catch (e) {}
            })(), window.__xuperPreviewHls = null;
            try {
                Et.pause()
            } catch (e) {}
            Et.removeAttribute("src");
            try {
                Et.src = "", Et.load()
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
                                    var useHlsPreview = previewHls && !/webOS|SmartTV|Large Screen/i.test(navigator.userAgent || "") && window.Hls && window.Hls.isSupported() && !(Et.canPlayType && Et.canPlayType("application/vnd.apple.mpegurl"));
                                    if (useHlsPreview) {
                                        window.__xuperPreviewHls && (function() {
                                            try {
                                                window.__xuperPreviewHls.destroy()
                                            } catch (e) {}
                                        })(), window.__xuperPreviewHls = null;
                                        var phls = new window.Hls({
                                            enableWorker: !0,
                                            backBufferLength: 10
                                        });
                                        window.__xuperPreviewHls = phls, phls.on(window.Hls.Events.MANIFEST_PARSED, function() {
                                            if (i === Ot) try {
                                                var e = Et.play();
                                                e && e.catch && e.catch(function() {})
                                            } catch (e) {}
                                        }), phls.on(window.Hls.Events.ERROR, function(e, t) {
                                            t && t.fatal && i === Ot && (te.classList.remove("is-preview-loading", "is-preview-playing"), qt && (qt.textContent = ""))
                                        }), phls.loadSource(a), phls.attachMedia(Et)
                                    } else try {
                                        Et.src = a, Et.load();
                                        var n = Et.play();
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

    function Ut(e, t) {
        e && (_t = e, qn(), e.isAddon ? Ft(function() {
            t && t()
        }) : Bt(e.id, function() {
            t && t()
        }))
    }

    /* Local live favourites survive category changes and app restarts.  Portal
       channels expose channelCode, addon channels only a name, so key on both. */
    function liveFavKey(e) {
        return "live:" + (e && (e.channelCode || e.id || e.name) || "")
    }

    function liveIsFav(e) {
        return !!(e && (e.fav || j.favs && j.favs[liveFavKey(e)]))
    }

    function liveToggleFav(e) {
        if (!e) return !1;
        var t = liveFavKey(e),
            i = !j.favs[t];
        return i ? j.favs[t] = !0 : delete j.favs[t], X.favs = j.favs, J(W, X), e.fav = i, i
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
                    nr(""), F.splice(0, F.length);
                    for (var o = 0; o < i.length; o++) i[o].index = o + 1, i[o].fav = liveIsFav(i[o]), F.push(i[o]);
                    j.channel = 0, Ht(!1), Rn(), F[0] && ee && (ee.textContent = F[0].name), "player" === j.screen && "live" === j.playerMode && (vr(), ur(F[0], !0)), e && e()
                }
            })
        })(t[n])
    }

    function Bt(e, t) {
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
                            for (var d = {}, c = 0; c < F.length; c++) F[c] && F[c].channelCode && (d[F[c].channelCode] = !0);
                            for (var p = 0; p < l.length; p++) {
                                var u = l[p];
                                !u || u.channelCode && d[u.channelCode] || (u.channelCode && (d[u.channelCode] = !0), u.fav = liveIsFav(u), F.push(u))
                            }
                            kt = !0, Ht(!1), Rn(), j.channel >= F.length && (j.channel = 0), F[j.channel] && ee && (ee.textContent = F[j.channel].name), "player" === j.screen && "live" === j.playerMode ? vr() : Rt(F[j.channel])
                        }
                        if (r || (r = !0, Lt || function(e) {
                                Lt && St.length ? e && e(null, St) : q("liveCategories", {}, function(t, i) {
                                    var a = [];
                                    if (i && i.categories && i.categories.length)
                                        for (var n = 0; n < i.categories.length; n++) {
                                            var r = i.categories[n],
                                                o = r.name;
                                            "ChannelList" !== o && 76182 !== r.id || (o = "Todos"), a.push({
                                                id: r.id,
                                                name: o,
                                                code: r.code,
                                                isAddon: !1
                                            })
                                        } else a = [{
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
                                        }];
                                    a.push({
                                        id: "addons",
                                        name: "➕ Addons M3U",
                                        isAddon: !0
                                    }), St = a, Lt = !0, _t || (_t = St[0]), qn(), liveUpdateLabel(), e && e(null, St)
                                })
                            }(), t && t(o, s)), !o && s && s.hasMore && l.length) return n++, void setTimeout(e, 25);
                        Mt = !1, o && !kt && setTimeout(function() {
                            a === It && Bt(i)
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
            var favOnly = !!t || liveFavFilter;
            if (F.length) {
                for (var a = 0; a < F.length; a++) {
                    if (favOnly && !liveIsFav(F[a])) continue;
                    var n = e("div", "live-row focusable");
                    n._channel = a;
                    var r = e("div", "row-icon");
                    F[a].logo && (r.style.backgroundImage = "url(" + F[a].logo + ")", r.style.backgroundSize = "contain", r.style.backgroundRepeat = "no-repeat", r.style.backgroundPosition = "center");
                    var o = e("div", "row-play"),
                        s = e("div", "row-name", F[a].name),
                        rowIndex = Ue.length;
                    n.appendChild(r), n.appendChild(o), n.appendChild(s), a === j.channel && n.classList.add("is-current"), n._activate = function(e) {
                        return function() {
                            Vt(e, !0), dr("live")
                        }
                    }(a), n._onMove = function(e) {
                        return function(t) {
                            if ("left" === t) return ie ? tt(ie) : Re[0] && tt(Re[0]), !0;
                            if ("up" === t) return e > 0 && Ue[e - 1] ? (tt(Ue[e - 1]), !0) : liveFastAll ? (tt(liveFastAll), !0) : !1;
                            if ("down" === t) return e < Ue.length - 1 && Ue[e + 1] ? (tt(Ue[e + 1]), !0) : !1;
                            return !1
                        }
                    }(rowIndex), ae.appendChild(n), Ue.push(n)
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
            if (e) {
                var t = 120 * Ue.indexOf(e),
                    i = Math.max(0, ae.scrollHeight - ae.clientHeight),
                    a = ae.scrollTop;
                t < a && (a = t), t + 100.5 > a + ae.clientHeight && (a = t + 100.5 - ae.clientHeight), ae.scrollTop = Math.max(0, Math.min(i, a))
            }
        }
    }

    function Vt(e, t) {
        e < 0 && (e = 0), e > F.length - 1 && (e = F.length - 1), j.channel = e;
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
            a = liveFavFilter ? Ue.length : F.length,
            unit = 1 === a ? " canal" : " canales";
        e.textContent = "TV en vivo · " + (liveFavFilter ? "Favoritos" : i) + (a ? " · " + a + unit : "")
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
        search.appendChild(e("div", "pcat-name", "🔍 Buscar canal"));
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
        liveKbEdit && (liveSearchQuery ? (liveKbEdit.textContent = liveSearchQuery, liveKbEdit.classList.remove("is-placeholder")) : (liveKbEdit.textContent = "Buscar canal en vivo…", liveKbEdit.classList.add("is-placeholder")))
    }

    function lvRenderResults() {
        var list = t("live-search-list");
        if (list) {
            i(list);
            var sub = t("live-search-sub"),
                q = o(liveSearchQuery),
                cats = St && St.length ? St : [],
                catMatches = [],
                matches = [],
                k = 0;
            if (q)
                for (k = 0; k < cats.length && catMatches.length < 8; k++) o(cats[k].name || "").indexOf(q) >= 0 && catMatches.push(cats[k]);
            for (k = 0; k < F.length && matches.length < 250; k++) {
                var ch = F[k];
                ch && (!q || o(ch.name || "").indexOf(q) >= 0) && matches.push({
                    ch: ch,
                    idx: k
                })
            }
            if (sub) sub.textContent = q ? matches.length + (1 === matches.length ? " canal" : " canales") + " · " + catMatches.length + (1 === catMatches.length ? " categoría" : " categorías") : "Escribe para buscar entre los " + F.length + " canales de " + liveCatName();
            for (var c = 0; c < catMatches.length; c++)(function(cat) {
                var row = e("div", "live-sr-row live-sr-cat focusable");
                row.appendChild(e("div", "live-sr-icon live-sr-icon-cat", "TV"));
                row.appendChild(e("div", "live-sr-name", "Categoría: " + cat.name));
                row.appendChild(e("div", "live-sr-badge", "CATEGORÍA"));
                row._activate = function() {
                    lvCloseSearch(!0), liveFavFilter = !1, lvSyncFav(), ie && tt(ie), Ut(cat, function() {
                        liveUpdateLabel(), lvFocusList()
                    })
                };
                list.appendChild(row)
            })(catMatches[c]);
            for (var m = 0; m < matches.length; m++)(function(item) {
                var row = e("div", "live-sr-row focusable"),
                    icon = e("div", "live-sr-icon");
                item.ch.logo && (icon.style.backgroundImage = "url(" + item.ch.logo + ")", icon.style.backgroundSize = "contain", icon.style.backgroundRepeat = "no-repeat", icon.style.backgroundPosition = "center");
                row.appendChild(icon);
                row.appendChild(e("div", "live-sr-name", item.ch.name || "Canal"));
                row.appendChild(e("div", "live-sr-badge", "EN VIVO"));
                row._activate = function() {
                    lvCloseSearch(!0), Vt(item.idx, !0), dr("live")
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
            i = e ? e.querySelector(".live-sr-row") : null;
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
        for (var a = t("da-presets-list"), n = t("da-installed-list"), r = wt(), o = {}, s = 0; s < r.length; s++) o[r[s].url] = !0;
        if (a) {
            i(a);
            for (var l = 0; l < Ct.length; l++)(function(t) {
                var i = e("div", "da-preset-item"),
                    n = e("div", "da-preset-info");
                n.appendChild(e("div", "da-preset-name", t.name)), n.appendChild(e("div", "da-preset-desc", t.desc)), i.appendChild(n);
                var r = !!o[t.url],
                    s = e("button", "da-preset-btn focusable" + (r ? " is-installed" : ""), r ? "✔ Instalado" : "+ Instalar");
                s._activate = function() {
                    r || (s.textContent = "Instalando…", Xt(t, function(e, t) {
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
                        r.splice(i, 1), xt(r), $t(), _t && _t.isAddon && Ft()
                    }, a.appendChild(d), n.appendChild(a)
                })(r[d], d);
            else n.appendChild(e("div", "da-installed-empty", "No hay addons personalizados instalados aún. Instala una lista recomendada arriba o escribe una URL."));
        var c = t("da-btn-add-custom");
        c && (c._activate = function() {
            var e = t("da-custom-url"),
                i = e ? (e.value || "").trim() : "";
            i && /^https?:\/\//i.test(i) ? (c.textContent = "Descargando…", Xt({
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
                for (var n = wt(), r = !1, o = 0; o < n.length; o++)
                    if (n[o].url === e.url) {
                        n[o].count = a.channels.length, r = !0;
                        break
                    } r || n.push({
                    id: e.id || "addon_" + Date.now(),
                    name: e.name || "Lista M3U",
                    url: e.url,
                    count: a.channels.length
                }), xt(n), t && t(null, a.channels.length)
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

    function Kt(e, t, i) {
        i = i || {};
        var a = t.length ? t : l;
        if (a.length) {
            var n;
            for (n = 0; n < 2; n++) e.appendChild(Jt(a[n % a.length], Gt.bigX[n], Gt.bigY, Gt.bigW, Gt.bigH, {
                shade: !1 !== i.shade,
                title: i.titles
            }));
            for (n = 0; n < 4; n++) e.appendChild(Jt(a[(n + 2) % a.length], Gt.smallX[n], Gt.smallY, Gt.smallW, Gt.smallH, {}));
            i.dots && e.appendChild(Qt(848, 535.5, i.dots, 0))
        }
    }

    function Yt(e) {
        var t, i = [];
        if (e)
            for (t = 0; t < l.length; t++) {
                (-1 !== o(l[t].category || "").split(",").indexOf(e) || l[t].kind && -1 !== o(l[t].kind).indexOf(e)) && i.push(l[t])
            }
        return i.length ? i : l
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
        if (!e || !e.id) return null;
        for (var t = X.history || [], i = 0; i < t.length; i++)
            if (String(t[i].id) === String(e.id)) return t[i];
        return null
    }

    function episodeIdExists(item, id) {
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
            pos = hist ? Number(hist.position) || 0 : 0,
            dur = hist ? Number(hist.duration) || 0 : 0;
        j.resumePosition = 0;
        var isSeries = !!(hist && (typeof hist.series === "boolean" ? hist.series : S(item))),
            epLen = item && item.episodes ? item.episodes.length : 0,
            mismatchReset = !1;
        if (epLen > 1 && hist && hist.episodeId && j.detailEpisode && String(hist.episodeId) !== String(j.detailEpisode.id) && episodeIdExists(item, hist.episodeId)) pos = 0, mismatchReset = !0;
        window.XUPERTV_WEB && window.console && console.log("[XUPERTV] resume", item && item.id, "pos", hist && hist.position, "dur", dur, "series", isSeries, "eps", epLen, "histEp", hist && hist.episodeId, "curEp", j.detailEpisode && j.detailEpisode.id, "reset", mismatchReset, "show", pos > 2);
        if (pos > 2) {
            ar();
            try {
                askResume(item, j.detailEpisode, pos, dur, function(cont) {
                    j.resumePosition = cont ? pos : 0, sr(item, j.detailEpisode)
                })
            } catch (err) {
                window.XUPERTV_WEB && window.console && console.error("[XUPERTV] resume modal error", err), j.resumePosition = 0, sr(item, j.detailEpisode)
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
        for (var t = [], i = 0; i < e; i += 20) t.push({
            start: i,
            end: Math.min(e, i + 20)
        });
        return t
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
            for (var i = [], a = 0; a < l.length; a++) {
                var n = o(l[a].title || ""),
                    r = l[a].alias ? o(l[a].alias) : "";
                (-1 !== n.indexOf(t) || r && -1 !== r.indexOf(t)) && i.push(l[a])
            }
            if (fi(i), j.searchTimer && clearTimeout(j.searchTimer), "portal" === p.mode && t.length >= 2) {
                var s = ++j.searchSeq;
                j.searchTimer = setTimeout(function() {
                    q("search", {
                        value: e.trim()
                    }, function(e, t) {
                        if (s === j.searchSeq && !e && t && !1 !== t.returnValue && t.items && t.items.length) {
                            for (var a = i.slice(), n = {}, r = 0; r < a.length; r++) n[String(a[r].id)] = !0;
                            for (var o = 0; o < t.items.length; o++) {
                                var l = _(t.items[o], a.length + 1);
                                n[String(l.id)] || (n[String(l.id)] = !0, a.push(l))
                            }
                            fi(a)
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
        for (var s in (Be = {}).profile = xi(), Be.history = Si(), Be.share = ((o = Ci("Compartir APP")).appendChild(e("div", "sp-hr")), o.appendChild(e("div", "share-copy", "Instala XuperTV en otro televisor desde tu propia IPK. El historial de este perfil permanece privado en este TV.")), o), Be.playback = function() {
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
                t.appendChild(e("div", "sp-title plain", "Sobre nosotros")), t.appendChild(a(e("div", "sp-hr soft"), 0, 165, 1498, 1)), t.appendChild(e("div", "sp-about-body", "Xuper TV se dedica a ofrecer a los usuarios una amplia variedad de recursos de alta calidad. Aquí encontrarás miles de películas, series, animes y canales en vivo, todo reunido en un solo lugar. Brindamos una experiencia estable, diversa y siempre actualizada, además de contenidos gratuitos para disfrutar.")), t.appendChild(e("div", "sp-about-port", "Port para LG webOS realizado por CristiancoDEV"));
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
                "streamMode" === this._group ? (j.playback.streamMode = 1 === this._index ? "smooth" : "normal", za = {}, j.playerItem && Wa(j.playerItem)) : j.playback[this._group] = this._index, ka(), Q();
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
        e = Math.max(0, Math.floor(e || 0));
        var t = Math.floor(e / 3600),
            i = Math.floor(e % 3600 / 60),
            a = e % 60;
        return r(t) + ":" + r(i) + ":" + r(a)
    }

    function Mi(e) {
        if ("number" == typeof e && isFinite(e) && e > 0) return e;
        if ("string" != typeof e) return 0;
        var t = e.trim();
        if (!t || "—" === t || "-" === t) return 0;
        var i = t.match(/(\d+)\s*h(?:our|ora|s)?/i),
            a = t.match(/(\d+)\s*m(?:in|uto|s)?/i),
            n = t.match(/(\d+)\s*s(?:ec|eg)?/i);
        if (i || a || n) return 3600 * (i ? parseInt(i[1], 10) : 0) + 60 * (a ? parseInt(a[1], 10) : 0) + (n ? parseInt(n[1], 10) : 0);
        if (-1 !== t.indexOf(":")) {
            var r = t.split(":");
            if (2 === r.length) {
                var o = Number(r[0]),
                    s = Number(r[1]);
                if (isFinite(o) && isFinite(s) && o >= 0 && s >= 0) return 60 * o + s
            } else if (3 === r.length) {
                o = Number(r[0]), s = Number(r[1]);
                var l = Number(r[2]);
                if (isFinite(o) && isFinite(s) && isFinite(l) && o >= 0 && s >= 0 && l >= 0) return 3600 * o + 60 * s + l
            }
        }
        var d = Number(t);
        return isFinite(d) && d > 0 ? d : 0
    }
    var Ii = null;

    function Ti() {
        Ii && (clearInterval(Ii), Ii = null)
    }

    function Ei(e, t) {
        if (Ie && Te && qe) {
            Je && (e = Qe);
            var i = Mi(t);
            if (!i && j.playerEpisode && j.playerEpisode.duration && (i = Mi(j.playerEpisode.duration)), !i && j.playerItem && j.playerItem.duration && (i = Mi(j.playerItem.duration)), !i && we && isFinite(we.duration) && we.duration > 0 && (i = we.duration), !i && Da && Da.length) {
                var a = Da[Da.length - 1];
                a && a.end > 0 && (i = Math.round(a.end + 60))
            }
            if (e = Number(e) || 0, Ie.textContent = ki(e), !i || i <= 0) e > (i = S(j.playerItem) ? 2700 : 6300) && (i = Math.round(1.15 * e));
            Te.textContent = ki(i);
            var n = Math.min(100, Math.max(0, e / i * 100));
            if (qe.style.width = n.toFixed(2) + "%", De && (De.style.left = n.toFixed(2) + "%"), we && we.buffered && we.buffered.length > 0) try {
                var r = we.buffered.end(we.buffered.length - 1);
                Hn && (r += zn);
                var o = Math.min(100, Math.max(0, r / i * 100));
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
                we.currentTime = a
            } catch (e) {}
            Ei(a, we.duration), Pi(), qi(e > 0 ? "forward" : "backward")
        }
    }

    function Di() {
        if (we)
            if (we.paused) {
                try {
                    var e = we.play();
                    e && e.catch && e.catch(function() {})
                } catch (e) {}
                qi("none"), Pi()
            } else {
                try {
                    we.pause()
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
        var i = String(e || t || "").toLowerCase(),
            a = t || "es";
        return "es" === a ? /^(es|spa|esp)|espa/.test(i) : "pt" === a ? /^(pt|por)|portu/.test(i) : "en" === a && /^(en|eng|ing)|ingl/.test(i)
    }

    function Ta(e, t, i) {
        var a = j.playerItem;
        if (!j.noHistorySave && a && a.id && !(e < 3)) {
            var n = Date.now();
            if (i || !(n - La < 15e3)) {
                La = n;
                for (var r = j.playerEpisode, o = String(a.id), s = [{
                        id: o,
                        title: a.title || a.name || "Contenido",
                        poster: a.poster || a.cover || "",
                        series: !!S(a),
                        episodeId: r && r.id ? String(r.id) : "",
                        episodeNumber: r && (r.number || r.seriesNumber) || "",
                        position: Math.floor(e),
                        duration: Math.floor(t || a.duration || 0),
                        updatedAt: n
                    }], l = X.history || [], d = 0; d < l.length && s.length < 30; d++) String(l[d].id) !== o && s.push(l[d]);
                X.history = s, J(W, X)
            }
        }
    }
    var Ea = null;

    function qa(e) {
        var t = findHistory(e) || Ea;
        if (t && e && String(t.id) === String(e.id) && t.episodeId && e.episodes)
            for (var i = 0; i < e.episodes.length; i++)
                if (String(e.episodes[i].id) === t.episodeId) return j.detailEpisode = e.episodes[i], void(j.playerEpisode = e.episodes[i])
    }

    function Oa(e) {
        if (!e || !e.id) return;
        for (var t = 0; t < l.length; t++)
            if (String(l[t].id) === String(e.id)) return Ea = e, void ei(l[t]);
        var i = _(e, 0);
        i._portal = !0, Ea = e, ei(i)
    }
    var Da = [],
        Aa = {},
        Pa = {},
        Na = null;

    function Ra(e) {
        if (!e) return 0;
        var t = e.replace(",", ".").split(":");
        return 3 === t.length ? 3600 * parseFloat(t[0]) + 60 * parseFloat(t[1]) + parseFloat(t[2]) : 0
    }

    function Ua(e) {
        var t = ++wa;
        if (!e || !e.url) return Da = [], void(ua && (ua.innerHTML = ""));
        try {
            var i = new XMLHttpRequest;
            i.open("GET", e.url, !0), i.onload = function() {
                t === wa && i.status >= 200 && i.status < 300 && (Da = function(e) {
                    var t = [];
                    if (!e) return t;
                    for (var i = e.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n\n"), a = 0; a < i.length; a++) {
                        var n = i[a].trim().split("\n");
                        if (n.length >= 2) {
                            var r = -1 !== n[0].indexOf("--\x3e") ? n[0] : n[1],
                                o = -1 !== n[0].indexOf("--\x3e") ? n.slice(1) : n.slice(2);
                            if (r && -1 !== r.indexOf("--\x3e")) {
                                var s = r.split("--\x3e"),
                                    l = Ra(s[0].trim()),
                                    d = Ra(s[1].trim()),
                                    c = o.join("<br>").replace(/<font[^>]*>/gi, "").replace(/<\/font>/gi, "").trim();
                                c && t.push({
                                    start: l,
                                    end: d,
                                    text: c
                                })
                            }
                        }
                    }
                    return t
                }(i.responseText))
            }, i.send()
        } catch (e) {}
    }

    function Fa() {
        ua && (ua.classList.remove("size-small", "size-normal", "size-big"), ua.classList.add("size-" + xa), ua.classList.remove("color-white", "color-yellow", "color-black"), ua.classList.add("color-" + Sa))
    }

    function Ba(e) {
        if (ua)
            if (ba && Da && Da.length) {
                for (var t = null, i = 0; i < Da.length; i++)
                    if (e >= Da[i].start && e <= Da[i].end) {
                        t = Da[i];
                        break
                    } if (t) {
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
        for (var t = (e || "").split(/[,\/]/), i = ["es", "pt", "en"][Number(j.playback.audio) || 0] || "es", a = 0; a < t.length; a++)
            if (Ia(t[a].trim(), i)) return a;
        return 0
    }

    function Ya(e) {
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
            ba = !0, ya = t[0];
            for (var n = 0; n < t.length; n++)
                if (Ia(t[n].lang, Ma())) {
                    ya = t[n];
                    break
                } Ua(ya)
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
        return e && e.seasons && e.seasons.length ? e.seasons : [{
            id: e ? e.id : "",
            number: 1
        }]
    }

    function ln(e, t, i) {
        return i = i || function() {}, e && t ? t.id === (e.seasonId || e.id) && e.episodes && e.episodes.length ? (t._episodes = e.episodes, i(e.episodes)) : t._episodes ? i(t._episodes) : t._loading ? (t._wait = t._wait || [], void t._wait.push(i)) : (t._loading = !0, t._wait = [i], void q("detail", {
            contentId: t.id
        }, function(e, i) {
            t._loading = !1;
            var a = !e && i && !1 !== i.returnValue && i.episodes ? i.episodes : [];
            a.length && (t._episodes = a);
            var n = t._wait || [];
            t._wait = [];
            for (var r = 0; r < n.length; r++) try {
                n[r](a)
            } catch (e) {}
        })) : i([])
    }

    function dn(e, t, i) {
        var a = t && void 0 !== t.number && null !== t.number ? t.number : i + 1,
            n = String(t && (t.title || t.name) || "").trim(),
            r = String(e && e.title || "").trim().replace(/[\s\-–_]*[TtSs]\d+$/, "");
        return r && 0 === n.indexOf(r) && (n = n.substring(r.length)), (n = n.replace(/^[\s\-–_:.]+/, "").trim()) && !/^(?:[TtSs]?\d+[\s\-–_.:]*)+$/.test(n) || (n = "Episodio " + a), n
    }

    function cn(e) {
        var t = String(e && e.duration || "").trim(),
            i = /^(\d+):(\d+)(?::(\d+))?$/.exec(t);
        return i ? i[3] ? (parseInt(i[1], 10) || 0) + " h " + (parseInt(i[2], 10) || 0) + " min" : (parseInt(i[1], 10) || 0) + " min" : t
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

    function gn(e, t) {
        if (e && t) {
            j.playerItem = e, j.playerEpisode = t, j.detailEpisode = t, j.playerSeasonIndex = j.detailSeason || 0, ye && be && vr(), bn(e), j.episodeSwitchTimer && clearTimeout(j.episodeSwitchTimer), j.episodeSwitchSeq = (j.episodeSwitchSeq || 0) + 1;
            var i = j.episodeSwitchSeq;
            ar(), nr("Cambiando capítulo…"), j.episodeSwitchTimer = setTimeout(function() {
                j.episodeSwitchTimer = null, i === j.episodeSwitchSeq && ("player" === j.screen || "detail" === j.screen) && (j.resumePosition = 0, sr(e, t))
            }, 600)
        }
    }

    function mn() {
        _e || (_e = t("next-episode-loading")), _e && (_e.classList.remove("is-active"), _e.style.backgroundImage = "")
    }

    function yn() {
        var e = j.playerItem;
        if (e && S(e) && "player" === j.screen) {
            for (var i = function(e) {
                    var t = sn(e),
                        i = t[j.playerSeasonIndex] || t[0];
                    return i ? i.id === (e.seasonId || e.id) && e.episodes && e.episodes.length ? e.episodes : i._episodes || [] : []
                }(e), a = j.playerEpisode, n = -1, r = 0; r < i.length; r++)
                if (a && (i[r].id === a.id || i[r].number === a.number)) {
                    n = r;
                    break
                } if (!(n < 0))
                if (function(e) {
                        if (_e || (_e = t("next-episode-loading")), _e) {
                            var i = e && (e.backdrop || e.landscape || e.poster) || "";
                            _e.style.backgroundImage = i ? 'url("' + String(i).replace(/"/g, "%22") + '")' : "", _e.classList.add("is-active")
                        }
                    }(e), n + 1 < i.length) gn(e, i[n + 1]);
                else {
                    var o = sn(e),
                        s = (j.playerSeasonIndex || 0) + 1,
                        l = o[s];
                    if (l) {
                        var d = a;
                        ln(e, l, function(t) {
                            j.playerItem === e && j.playerEpisode === d && "player" === j.screen && (t && t.length ? (j.detailSeason = s, j.playerSeasonIndex = s, e.seasonId = l.id || e.seasonId, e.episodes = t, l._episodes = t, gn(e, t[0])) : mn())
                        })
                    } else mn()
                }
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
        var e = "relay" === j.streamMode || "smooth" === j.streamMode;
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
            var a = function(e) {
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
                    In(t.index), Ln(), en()
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
                        ya = t, ba = !0, Ca = !0, Ua(t), kn(), en()
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
        var t = (e || "").toLowerCase().trim().split(/[-_]/)[0];
        return /^(spa|esp|es|castellano|latino)$/.test(t) ? "Español" : /^(eng|ing|en)$/.test(t) ? "Inglés" : /^(jpn|jap|ja)$/.test(t) ? "Japonés" : /^(kor|cor|ko)$/.test(t) ? "Coreano" : /^(por|pt)$/.test(t) ? "Portugués" : /^(fra|fre|fr|franc)$/.test(t) ? "Francés" : /^(ita|it)$/.test(t) ? "Italiano" : /^(deu|ger|de)$/.test(t) ? "Alemán" : /^(chi|zho|zh)$/.test(t) ? "Chino" : t ? t.charAt(0).toUpperCase() + t.slice(1) : "Pista"
    }

    function In(e) {
        if (ga = e, ma = !0, "player" === j.screen && we)
            if (Hn) {
                var t = zn + (we.currentTime || 0);
                rr(Hn + "?start=" + Math.floor(t) + "&a=" + e)
            } else "relay" !== j.streamMode && "smooth" !== j.streamMode && (j.streamMode = "relay", Cn()), Tn()
    }

    function Tn() {
        if (we) {
            var e = Hn ? zn + (we.currentTime || 0) : we.currentTime || 0,
                t = j.playerItem;
            ar(), nr("Cambiando reproductor…"), or(t, function(t) {
                if (t) {
                    if (-1 !== t.indexOf(":8787/s/")) {
                        var i = t + "?start=" + Math.floor(e);
                        ga && (i += "&a=" + ga), rr(i)
                    } else if (rr(t), e > 0) try {
                        we.currentTime = e
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
                kn(), en()
            }), da)
            for (var r = da.querySelectorAll(".dps-btn"), o = 0; o < r.length; o++)(function(e) {
                e._activate = function() {
                    xa = e.getAttribute("data-size") || "normal", Fa(), kn()
                }
            })(r[o]);
        if (ca)
            for (var s = ca.querySelectorAll(".dps-btn"), l = 0; l < s.length; l++)(function(e) {
                e._activate = function() {
                    Sa = e.getAttribute("data-style") || "white", Fa(), kn()
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
        Vn = 0,
        jn = null,
        Wn = null;

    function $n() {
        Wn && (clearTimeout(Wn), Wn = null)
    }

    function Xn(e) {
        Wn || j.streamError || (Wn = setTimeout(function() {
            Wn = null, !j.streamError && we && !we.paused && we.readyState < 3 && nr(e)
        }, 700))
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
                var e = zn + (we.currentTime || 0),
                    t = Math.max(0, e + Vn);
                Vn = 0;
                var i = j.playerItem && j.playerItem.duration || we.duration || 0;
                i > 0 && t > i - 2 && (t = Math.max(0, i - 2)), zn = Math.floor(t);
                var a = Hn + "?start=" + zn;
                return Jn = setTimeout(Qn, 12e3), void rr(a)
            }
            var n = (we.currentTime || 0) + Vn;
            Vn = 0;
            var r = we.duration || 0;
            n < 0 && (n = 0), r > 0 && n > r - 1 && (n = r - 1);
            try {
                we.currentTime = n
            } catch (e) {}
        } else Vn = 0
    }

    function Oi(e) {
        we && (Vn += e, jn && clearTimeout(jn), jn = setTimeout(Kn, 800), qi(e > 0 ? "fwd" : "rew"), setTimeout(function() {
            qi("none")
        }, 600))
    }

    function Yn() {
        return we ? Hn ? zn + (we.currentTime || 0) : we.currentTime || 0 : 0
    }

    function Zn() {
        var e = we && isFinite(we.duration) && we.duration > 0 ? we.duration : 0;
        return !e && j.playerEpisode && j.playerEpisode.duration && (e = Mi(j.playerEpisode.duration)), !e && j.playerItem && j.playerItem.duration && (e = Mi(j.playerItem.duration)), e || 0
    }

    function er(e) {
        if (Je) {
            var t = Qe,
                i = Yn();
            Je = !1, Ee && Ee.classList.remove("is-scrubbing"), e && Math.abs(t - i) >= 1 && Oi(t - i), Ei(Yn(), Zn()), tt(ye), Ai()
        }
    }

    function tr() {
        var e = Zn();
        Ee && e ? (Qe = Math.max(0, Math.min(e - 1, Yn())), Je = !0, Ee.classList.add("is-scrubbing"), Pi(), j.infoTimer && (clearTimeout(j.infoTimer), j.infoTimer = null), Ei(Qe, e), tt(Ee)) : Pi()
    }

    function ir(e) {
        var t = Zn();
        if (Je && t) {
            var i = Math.max(60, Math.min(300, Math.round(.05 * t)));
            Ei(Qe = Math.max(0, Math.min(t - 1, Qe + e * i)), t)
        }
    }

    function ar() {
        "vod" === j.playerMode && we && Ta(Hn ? zn + (we.currentTime || 0) : we.currentTime || 0, we && isFinite(we.duration) && we.duration > 0 ? we.duration : Mi(j.playerEpisode && j.playerEpisode.duration || j.playerItem && j.playerItem.duration || 0), !0);
        j.streamError = "", $n(), nr(""), qi("none"), Ti(), jn && (clearTimeout(jn), jn = null, Vn = 0), Qn(), Hn = "", zn = 0, Bn++;
        var e = Un;
        if (!e && Fn && -1 !== Fn.indexOf("127.0.0.1")) {
            var t = /^(http:\/\/127\.0\.0\.1:\d+)/.exec(Fn);
            t && (e = t[1])
        }
        if (e) try {
            var i = new XMLHttpRequest;
            i.open("GET", e + "/media/abort", !0), i.send()
        } catch (e) {}
        try {
            q("abortMedia", {}, function() {})
        } catch (e) {}
        window.__xuperHls && (function() {
            try {
                window.__xuperHls.destroy()
            } catch (e) {}
        })(), window.__xuperHls = null;
        if (Fn = "", Un = "", we) {
            try {
                we.onerror = null
            } catch (e) {}
            try {
                we.pause()
            } catch (e) {}
            try {
                we.currentTime = 0
            } catch (e) {}
            we.removeAttribute("src");
            try {
                we.src = ""
            } catch (e) {}
            for (; we.firstChild;) we.removeChild(we.firstChild);
            we.classList.remove("is-active"), xe && (xe.style.display = "block")
        }
    }

    function nr(e) {
        Se || (Se = t("player-status")), Se && (e ? (Se.textContent = e, Se.classList.add("is-active")) : (Se.textContent = "", Se.classList.remove("is-active")))
    }

    function rr(e, t) {
        if (we && e) {
            var i = !!(t = t || {}).nativeHls,
                resumeAt = Number(j.resumePosition) || 0;
            j.resumePosition = 0;
            var applyResume = function() {
                if (resumeAt > 0) {
                    try {
                        we.currentTime = resumeAt
                    } catch (e) {}
                    resumeAt = 0
                }
            };
            j.noHistorySave = !0, ar(), j.noHistorySave = !1, Fn = e;
            var a = /^(http:\/\/127\.0\.0\.1:\d+)/.exec(e);
            if (a && (Un = a[1]), -1 !== e.indexOf(":8787/s/")) {
                Hn = e.split("?")[0];
                var n = /[?&]start=(\d+)/.exec(e);
                zn = n ? parseInt(n[1], 10) : 0
            } else Hn = "", zn = 0;
            nr("Conectando con el vídeo…"), j.streamError = "";
            try {
                we.preload = "auto"
            } catch (e) {}
            var r = j.playerItem && j.playerItem.streamMime || "",
                o = -1 !== e.indexOf(".m3u8") || -1 !== r.indexOf("mpegurl") || !(!j.playerItem || !j.playerItem.isHls),
                s = o ? "application/vnd.apple.mpegurl" : -1 !== e.indexOf(".mp4") || -1 !== r.indexOf("mp4") ? "video/mp4" : "video/mp2t";
            we.onerror = function() {
                mn(), Qn();
                var t = we.error && we.error.code;
                if (4 === t && "live" === j.playerMode && o && !i) {
                    var a = cr;
                    return nr("Reintentando señal con compatibilidad webOS…"), void setTimeout(function() {
                        "live" === j.playerMode && cr === a && rr(e, {
                            nativeHls: !0
                        })
                    }, 0)
                }
                if (4 === t && "vod" === j.playerMode && "normal" === j.streamMode && j.playerItem) {
                    var n = j.playerItem,
                        r = ja(n);
                    if (Va !== r) return Va = r, $a(n, !0), nr("Reintentando película en modo compatible…"), void setTimeout(function() {
                        "vod" === j.playerMode && j.playerItem === n && "smooth" === j.streamMode && Tn()
                    }, 0)
                }
                j.streamError = "No se pudo abrir el stream (código " + (t || "error") + ")", we.classList.remove("is-active"), xe && (xe.style.display = "block"), nr(j.streamError)
            }, we.onloadeddata = v, we.oncanplay = function() {
                Qn(), v()
            }, we.onloadedmetadata = function() {
                if (v(), "vod" === j.playerMode) {
                    var e = Hn ? zn : we.currentTime || 0,
                        t = we && isFinite(we.duration) && we.duration > 0 ? we.duration : 0,
                        i = j.playerEpisode && j.playerEpisode.duration ? Mi(j.playerEpisode.duration) : 0,
                        a = j.playerItem && j.playerItem.duration ? Mi(j.playerItem.duration) : 0;
                    Ei(e, t || i || a || 0)
                }
                applyResume()
            }, we.ondurationchange = function() {
                if ("vod" === j.playerMode) {
                    var e = Hn ? zn + (we.currentTime || 0) : we.currentTime || 0,
                        t = we && isFinite(we.duration) && we.duration > 0 ? we.duration : 0,
                        i = j.playerEpisode && j.playerEpisode.duration ? Mi(j.playerEpisode.duration) : 0,
                        a = j.playerItem && j.playerItem.duration ? Mi(j.playerItem.duration) : 0;
                    Ei(e, t || i || a || 0)
                }
            }, we.onplaying = function() {
                mn(), v()
            }, we.onended = function() {
                "vod" === j.playerMode && yn()
            }, we.ontimeupdate = function() {
                if (we.currentTime > 0 && v(), "vod" === j.playerMode) {
                    var e = Hn ? zn + (we.currentTime || 0) : we.currentTime || 0,
                        t = we && isFinite(we.duration) && we.duration > 0 ? we.duration : 0,
                        i = j.playerEpisode && j.playerEpisode.duration ? Mi(j.playerEpisode.duration) : 0,
                        a = j.playerItem && j.playerItem.duration ? Mi(j.playerItem.duration) : 0,
                        n = t || i || a || 0;
                    Ei(e, n), Ba(e), Ta(e, n)
                }
            }, we.onpause = function() {
                (Ti(), "vod" === j.playerMode) && (Ta(Hn ? zn + (we.currentTime || 0) : we.currentTime || 0, we && isFinite(we.duration) && we.duration > 0 ? we.duration : Mi(j.playerEpisode && j.playerEpisode.duration || j.playerItem && j.playerItem.duration || 0), !0), qi("pause"))
            }, we.onplay = function() {
                "vod" === j.playerMode && (qi("none"), Ti(), Ii = setInterval(function() {
                    if ("player" === j.screen && "vod" === j.playerMode && we && !we.paused) {
                        var e = Hn ? zn + (we.currentTime || 0) : we.currentTime || 0,
                            t = we && isFinite(we.duration) && we.duration > 0 ? we.duration : 0,
                            i = j.playerEpisode && j.playerEpisode.duration ? Mi(j.playerEpisode.duration) : 0,
                            a = j.playerItem && j.playerItem.duration ? Mi(j.playerItem.duration) : 0,
                            n = t || i || a || 0;
                        Ei(e, n), Ba(e), Ta(e, n)
                    }
                }, 500))
            }, we.onwaiting = function() {
                Xn("Cargando vídeo…")
            }, we.onstalled = function() {
                Xn("Conectando…")
            };
            var useHls = o && !i && !/webOS|SmartTV|Large Screen/i.test(navigator.userAgent || "") && window.Hls && window.Hls.isSupported();
            if (useHls) {
                window.__xuperHls && (function() {
                    try {
                        window.__xuperHls.destroy()
                    } catch (e) {}
                })(), window.__xuperHls = null;
                try {
                    we.pause()
                } catch (e) {}
                try {
                    we.removeAttribute("src")
                } catch (e) {}
                try {
                    we.src = ""
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
                window.__xuperHls = hls, hls.on(window.Hls.Events.ERROR, function(e, t) {
                    if (t && t.fatal)
                        if (t.type === window.Hls.ErrorTypes.NETWORK_ERROR) try {
                            hls.startLoad()
                        } catch (e) {} else if (t.type === window.Hls.ErrorTypes.MEDIA_ERROR) try {
                            hls.recoverMediaError()
                        } catch (e) {}
                    else j.streamError = "No se pudo abrir el stream (HLS)", nr(j.streamError)
                }), hls.on(window.Hls.Events.MANIFEST_PARSED, function() {
                    try {
                        var e = we.play();
                        e && e.catch && e.catch(function() {})
                    } catch (e) {}
                    applyResume()
                }), hls.loadSource(e), hls.attachMedia(we), we.classList.add("is-active"), xe && (xe.style.display = "none");
                try {
                    hlsPlay = we.play(), hlsPlay && hlsPlay.catch && hlsPlay.catch(function() {})
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
                    we.src = e
                } catch (e) {}
            }
            try {
                we.currentTime = 0
            } catch (e) {}
            we.classList.add("is-active"), xe && (xe.style.display = "none");
            try {
                o && we.load();
                var u = we.play();
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
                a = {
                    contentId: e.id
                };
            a.playbackMode = j.streamMode, a.forceRelay = "smooth" === j.streamMode || "relay" === j.streamMode || resumeAt > 0, a.trackIndex = j.trackIndex || 0;
            var n = Aa[Ja(e)];
            if (n && !ma && (ga = Ka(n.audio)), a.audioTrack = ga || 0, S(e)) {
                var r = j.playerEpisode,
                    o = e.seasonId || e.id;
                if (r && r.id) a.contentId = r.id, a.seriesContentId = o;
                else {
                    if (!e.episodes || !e.episodes.length) return t("");
                    j.playerEpisode = e.episodes[0], a.contentId = e.episodes[0].id, a.seriesContentId = o
                }
            }
            if (!resumeAt) j.resumePosition = 0;

            function done(n, s) {
                if (i === Bn) {
                    if (n || !s || !1 === s.returnValue) return j.resumePosition = 0, j.streamError = "No se pudo resolver el título" + (n ? ": " + n : ""), nr(j.streamError), t("");
                    e.streamMime = s.mime || "", e.streamCodec = s.codec || "", s.duration > 0 ? (e.duration = s.duration, j.playerEpisode && (j.playerEpisode.duration = s.duration)) : e.duration = e.duration || 0, e.subtitles = s.subtitles || [], e.streamAudioInfo = s.audio || "", e.isHls = !!s.isHls;
                    try {
                        window.__xuperStreamInfo = {
                            selectedTrack: s.selectedTrack || {},
                            availableTracks: s.availableTracks || []
                        }
                    } catch (e) {}
                    var l = s.proxyPath || s.url || "";
                    resumeAt > 0 && /:8787\/s\//.test(l) && (l += (-1 !== l.indexOf("?") ? "&" : "?") + "start=" + Math.floor(resumeAt), j.resumePosition = 0), t(l)
                }
            }

            function resolveCall(r) {
                q(r ? "resolveSmooth" : "resolve", a, function(e, t) {
                    if (e && r) return a.forceRelay = !1, resolveCall(!1);
                    done(e, t)
                })
            }
            resolveCall(a.forceRelay)
        }
        if (S(e) && !j.playerEpisode && (!e.episodes || !e.episodes.length) && !e._detailsLoaded) return nr("Cargando capítulos…"), void U(e, function() {
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
            n = "detail" === j.screen && we && !!we.src && j.playerItem === e && a;
        j.playerMode = "vod", e && j.playerItem !== e && Xa(), e && (j.playerItem = e), i && (j.playerEpisode = i), e && Wa(e), j.playerReturn = {
            screen: "detail",
            focus: j.focus
        };
        var r = t("screen-player"),
            o = t("screen-detail");
        r && (r.classList.remove("is-mini"), r.classList.add("is-active")), o && o.classList.remove("is-active"), j.screen = "player", ye.classList.add("is-vod"), vr(), tt(ye), Ri(), n || sr(j.playerItem, j.playerEpisode)
    }

    function dr(e, t, i) {
        "vod" !== e || "detail" !== j.screen ? (ye || En(), "live" === e && Nt(), j.playerMode = e, t && j.playerItem !== t && Xa(), j.playerItem = t || null, j.playerEpisode = i || null, "vod" === e && t && Wa(t), j.playerReturn = {
            screen: j.screen,
            focus: j.focus
        }, j.channelsOpen = !1, be.classList.remove("is-active"), Ce.classList.remove("is-active"), ye.classList.toggle("is-vod", "vod" === e), vr(), nt("player"), tt(ye), vr(), "vod" === e ? (Ri(), sr(j.playerItem, j.playerEpisode)) : (Pi(), ur(F[j.channel]))) : lr(t, i)
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
            t ? i() : pr = setTimeout(i, 180)
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
        mr(), window.addEventListener("resize", mr, !1), document.addEventListener("keydown", lt, !1), document.addEventListener("keyup", function(e) {
                461 !== (e.keyCode || e.which) && "Back" !== e.key && "GoBack" !== e.key || lt(e)
            }, !1), window.addEventListener("popstate", function() {
                ot()
            }, !1), document.addEventListener("click", function(e) {
                var t = n(e.target, ".focusable");
                t && (tt(t, !0), t._activate && t._activate())
            }), oi(),
            function() {
                if (E() && window.PalmServiceBridge) {
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
            }(), Ke = setTimeout(dt, 2600), N(), Bt(), window.__xuper = {
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