"use strict";
var crypto = require("crypto"),
    https = require("https"),
    http = require("http"),
    url = require("url"),
    KEY_HEX = "e7af1ed7de1ffddd7bd3fe37ebdffde9ef3fe1ae39edfeb8",
    HOSTS = ["osuhk.m3x8o50te.com", "oogoy.f30c96w8.com"],
    PORTAL_CODE = "masnew",
    APP_ID = "com.android.msandroid",
    APK_VERSION = "49902",
    SPKG_VER = "2025-08-07 05:40:11_36_16_",
    APK_VER_HEADER = "43404",
    USER_AGENT = "okhttp/3.12.12",
    CONTENT_TYPE = "application/json;charset=utf-8",
    SNTOKEN_SALT = "ntFT65w6itH!lHCPw7D=@qnsFC5adD28",
    FIXED_MAC = "02:00:00:00:00:00",
    UA_CDN = "Ranger/4.9.4-17294ac0",
    RATE_MS = 450,
    REQUEST_TIMEOUT = 2e4,
    TREE_TTL = 6e5,
    SEARCH_TTL = 18e4,
    SLB_TTL = 3e5,
    ROOT_CODES = {
        featured: "masnew_featured",
        movies: "masnew_movies",
        series: "masnew_series",
        anime: "masnew_anime",
        kids: "masnew_kids",
        free: "masnew_free"
    },
    ROOT_CATEGORY = {
        featured: "destacado",
        movies: "pelicula",
        series: "serie",
        anime: "anime",
        kids: "infantil",
        free: "gratis"
    },
    DEVICE_FIXED = {
        loginType: "2",
        appLanguage: "en",
        hardwareInfo: "ranchu",
        model: "sdk_gphone64_arm64",
        product: "sdk_gphone64_arm64",
        cpu: "arm64-v8a",
        B29: "",
        reserve1: "",
        deviceToken: "",
        drmId: "",
        sdkVer: 36
    },
    FINGERPRINT_FIXED = {
        board: "goldfish_arm64",
        brand: "google",
        cpuAbi: "arm64-v8a",
        device: "emu64a",
        diskInfo: "8GB",
        display: "sdk_gphone64_arm64",
        fingerprint: "google/sdk_gphone64_arm64/emu64a:14/UE1A.230829.036/11228894:user/release-keys",
        hardware: "ranchu",
        host: "abfarm",
        manufacturer: "Google",
        ramSize: "4GB",
        romSize: "8GB",
        tags: "release-keys",
        verId: ""
    };

function bufFrom(e, t) {
    return Buffer.from ? Buffer.from(e, t) : new Buffer(e, t)
}

function bufAlloc(e) {
    if (Buffer.alloc) return Buffer.alloc(e);
    var t = new Buffer(e);
    return t.fill(0), t
}
var EMPTY_IV = bufFrom("", "binary");

function encryptBody(e) {
    var t = crypto.createCipheriv("des-ede3", bufFrom(KEY_HEX, "hex"), EMPTY_IV),
        r = Buffer.concat([t.update(bufFrom(e, "utf8")), t.final()]);
    return bufFrom(r.toString("base64"), "ascii").toString("hex")
}

function decryptBlob(e) {
    var t = bufFrom(e, "hex").toString("ascii"),
        r = crypto.createDecipheriv("des-ede3", bufFrom(KEY_HEX, "hex"), EMPTY_IV);
    return Buffer.concat([r.update(bufFrom(t, "base64")), r.final()]).toString("utf8")
}

function randomHex(e) {
    return crypto.randomBytes(e).toString("hex")
}

function text(e) {
    return null == e ? "" : String(e)
}

function trim(e) {
    return text(e).replace(/^\s+|\s+$/g, "")
}

function imageOf(e, t) {
    var r = e && e.posterList;
    if (!r || !r.length) return "";
    for (var n = 0; n < r.length; n++)
        if (r[n] && r[n].fileType === t && "" !== trim(r[n].fileUrl)) return trim(r[n].fileUrl);
    return ""
}

function genresOf(e) {
    var t = text(e && e.tags);
    if (!t) return [];
    for (var r = t.split(","), n = [], a = 0; a < r.length; a++) {
        var i = trim(r[a]);
        i && n.push(i)
    }
    return n
}
var session = {
        sn: "",
        userId: "",
        userToken: "",
        snToken: "",
        ready: !1,
        busy: !1
    },
    queue = [],
    lastCallAt = 0;

function enqueue(e) {
    queue.push(e), drain()
}

function drain() {
    if (!session.busy && queue.length) {
        var e = lastCallAt + RATE_MS - Date.now();
        if (e > 0) return session.busy = !0, void setTimeout(function() {
            session.busy = !1, drain()
        }, e);
        var t = queue.shift();
        session.busy = !0, lastCallAt = Date.now(), t(function() {
            session.busy = !1, drain()
        })
    }
}

function deviceDict() {
    var e = {};
    for (var t in DEVICE_FIXED) Object.prototype.hasOwnProperty.call(DEVICE_FIXED, t) && (e[t] = DEVICE_FIXED[t]);
    return e.apkVersion = APK_VERSION, e.sysVersion = SPKG_VER, e.appId = APP_ID, e.sn = session.sn, e
}

function post(e, t, r) {
    var n;
    try {
        n = encryptBody(JSON.stringify(t))
    } catch (t) {
        return r(new Error(e + ": error cifrando cuerpo: " + t.message))
    }
    var a = HOSTS[0],
        i = 0;
    ! function t() {
        var o = https.request({
            hostname: a,
            servername: a,
            rejectUnauthorized: !1,
            path: "/api/portalCore/" + e,
            method: "POST",
            headers: {
                apk: APP_ID,
                apkVer: APK_VER_HEADER,
                spkgVer: SPKG_VER,
                "User-Agent": USER_AGENT,
                "Content-Type": CONTENT_TYPE,
                "Content-Length": Buffer.byteLength(n)
            }
        }, function(t) {
            var n = [];
            t.on("data", function(e) {
                n.push(e)
            }), t.on("end", function() {
                var a, i = Buffer.concat(n).toString("utf8");
                try {
                    a = JSON.parse(i)
                } catch (n) {
                    return r(new Error(e + ": respuesta no JSON (" + t.statusCode + ")"))
                }
                var o = void 0 === a.returnCode || null === a.returnCode ? "" : String(a.returnCode);
                if ("" !== o && "0" !== o) {
                    var s = new Error(e + " -> " + o + " " + text(a.errorMessage));
                    return s.portalCode = o, r(s)
                }
                if ("string" == typeof a.data && "" !== a.data) {
                    var u;
                    try {
                        u = decryptBlob(a.data)
                    } catch (t) {
                        return r(new Error(e + ": no se pudo descifrar la respuesta (" + t.message + ")"))
                    }
                    try {
                        return r(null, JSON.parse(u))
                    } catch (t) {
                        return r(new Error(e + ": respuesta descifrada no JSON"))
                    }
                }
                r(null, void 0 !== a.data && null !== a.data ? a.data : a)
            })
        });
        o.setTimeout(REQUEST_TIMEOUT, function() {
            o.abort()
        }), o.on("timeout", function() {
            o.abort()
        }), o.on("error", function(e) {
            if (++i < HOSTS.length) return a = HOSTS[i], void t();
            r(e)
        }), o.write(n), o.end()
    }()
}

function call(e, t, r, n) {
    "function" == typeof r && (n = r, r = {}), r = r || {}, enqueue(function(a) {
        var i, o = {};
        for (i in !1 !== r.baseFields && (o.portalCode = PORTAL_CODE, o.userId = session.userId, o.userToken = session.userToken), t) Object.prototype.hasOwnProperty.call(t, i) && (o[i] = t[i]);
        var s = deviceDict();
        for (i in s) Object.prototype.hasOwnProperty.call(s, i) && (o[i] = s[i]);
        post(e, o, function(i, o) {
            if (a(), i && ("aaa100028" === i.portalCode || /未登录|sesi[oó]n|login/i.test(i.message)) && !r._sessionRetried) return console.log("[magis] sesión no iniciada (" + (i.portalCode || i.message) + "). Renovando sesión limpia..."), session.ready = !1, session.userId = "", session.userToken = "", session.snToken = "", ensureSession(function(a) {
                if (a) return n(i);
                r._sessionRetried = !0, call(e, t, r, n)
            });
            n(i, o)
        })
    })
}

function ensureSession(e) {
    if (session.ready && session.userId && session.userToken) return e(null, session);
    session.ready = !1;
    var t, r = {};
    for (t in FINGERPRINT_FIXED) Object.prototype.hasOwnProperty.call(FINGERPRINT_FIXED, t) && (r[t] = FINGERPRINT_FIXED[t]);

    function n(t) {
        if (console.log("[magis] snToken/active falló: " + (t && t.message) + ". Reintentando con otro host..."), !t || !t._retried) return HOSTS.push(HOSTS.shift()), (t || new Error("reintento"))._retried = !0, setTimeout(function() {
            ensureSession(e)
        }, 500);
        var r = https.get("https://raw.githubusercontent.com/xuper-plugin/kino-plugin-xuper/seeds/seeds.json", {
            timeout: 1e4
        }, function(r) {
            if (200 !== r.statusCode) return e(t);
            var n = [];
            r.on("data", function(e) {
                n.push(e)
            }), r.on("end", function() {
                try {
                    var r = JSON.parse(Buffer.concat(n).toString("utf8")),
                        a = Array.isArray(r) ? r : r && r.seeds || [];
                    if (!a.length) return e(t);
                    var i = a[Math.floor(Math.random() * Math.min(a.length, 50))];
                    session.userId = trim(i.userId), session.userToken = trim(i.userToken), session.sn = trim(i.sn).toLowerCase(), session.ready = !0, e(null, session)
                } catch (r) {
                    e(t)
                }
            })
        });
        r.on("error", function() {
            e(t)
        }), r.on("timeout", function() {
            r.abort(), e(t)
        })
    }
    r.androidId = randomHex(8), r.cpuId = randomHex(8), r.serialNumber = randomHex(8), r.etheMac = randomHex(6).replace(/(..)(?=.)/g, "$1:"), r.gatewayMac = randomHex(6).replace(/(..)(?=.)/g, "$1:"), r.wifiMac = randomHex(6).replace(/(..)(?=.)/g, "$1:"), call("v3/snToken", r, {
        baseFields: !1
    }, function(t, r) {
        if (t) return n(t);
        var a = trim(r && r.snToken);
        if (!a) return n(new Error("el portal no devolvió snToken"));
        var i = r && trim(r.sn);
        i || (i = crypto.createHash("md5").update(a + SNTOKEN_SALT).digest("hex")), session.snToken = a, session.sn = String(i).toLowerCase(), call("v8/active", {
            snToken: a,
            authVersion: "",
            authCode: "",
            preCode: "",
            macAddr: FIXED_MAC,
            reserve1: "",
            openNum: 4,
            channel: "default",
            matadata: "",
            signdata: ""
        }, {
            baseFields: !1
        }, function(t, r) {
            return t ? n(t) : (session.userId = trim(r && r.userId), session.userToken = trim(r && r.userToken), session.userToken ? (session.ready = !0, void e(null, session)) : n(new Error("el portal no activó el dispositivo")))
        })
    })
}

function itemFromAsset(e, t, r) {
    if (!e || "" === trim(e.contentId)) return null;
    var n = trim(e.programType) || "movie",
        a = "teleplay" === n || "series" === n || e.volumnCount && parseInt(e.volumnCount, 10) > 1;
    return {
        id: trim(e.contentId),
        title: text(e.name || e.title),
        category: t || "",
        kind: r || (a ? "serie" : "película"),
        score: void 0 === e.score || null === e.score || "" === e.score ? "—" : text(e.score),
        year: trim(e.releaseTime || e.releaseDate) ? trim(e.releaseTime || e.releaseDate).slice(0, 4) : "—",
        duration: text(e.duration),
        genres: genresOf(e),
        director: text(e.director),
        actors: text(e.actorDisplay || e.actors),
        synopsis: text(e.description || e.synopsis),
        poster: imageOf(e, "icon") || imageOf(e, "poster"),
        landscape: imageOf(e, "poster") || imageOf(e, "stage"),
        backdrop: imageOf(e, "stage") || imageOf(e, "poster"),
        type: a ? "teleplay" : n,
        alias: text(e.alias),
        country: trim(e.originalCountry || e.country),
        releaseDate: trim(e.releaseTime || e.releaseDate),
        tagline: trim(e.viewPoint || e.tagline),
        volumeCount: void 0 === e.volumnCount || null === e.volumnCount ? parseInt(e.volumeCount, 10) || 0 : parseInt(e.volumnCount, 10) || 0,
        updateCount: void 0 === e.updateCount || null === e.updateCount ? 0 : parseInt(e.updateCount, 10) || 0,
        moreAudio: void 0 !== e.moreAudio ? e.moreAudio : 0,
        moreSubtitle: void 0 !== e.moreSubtitle ? e.moreSubtitle : 0,
        row: "",
        streamUrl: "",
        portal: !0
    }
}
var treeCache = {},
    itemCache = {},
    searchCache = {},
    slbCache = null;

function remember(e) {
    e && e.id && (itemCache[e.id] = e)
}

function itemsFromTree(e, t) {
    var r = e && e.recommendList,
        n = [],
        a = ROOT_CATEGORY[t] || "";
    if (!r || !r.length) return n;
    for (var i = 0; i < r.length; i++) {
        var o = r[i],
            s = o && o.assetList;
        if (s && s.length)
            for (var u = 0; u < s.length; u++) {
                var l = itemFromAsset(s[u], a, null);
                l && (l.row = text(o.name), "free" === t && /free\.kids/i.test(l.row) && -1 === l.category.indexOf("infantil") && (l.category += ",infantil"), n.push(l), remember(l))
            }
    }
    return n
}

function home(e, t) {
    e = ROOT_CODES[e] ? e : "movies";
    var r = treeCache[e];
    if (r && Date.now() - r.at < TREE_TTL) return t(null, {
        root: e,
        items: r.items,
        cached: !0
    });
    ensureSession(function(r) {
        if (r) return t(r);
        call("getNextColumns", {
            columnCode: ROOT_CODES[e],
            pageNum: 1,
            pageSize: 60,
            version: ""
        }, function(r, n) {
            if (r) return t(r);
            var a = itemsFromTree(n, e);
            treeCache[e] = {
                at: Date.now(),
                items: a
            }, t(null, {
                root: e,
                items: a,
                cached: !1
            })
        })
    })
}

function search(e, t) {
    var r = trim(e);
    if (!r) return t(null, {
        items: []
    });
    var n = r.toLowerCase(),
        a = searchCache[n];
    if (a && Date.now() - a.at < SEARCH_TTL) return t(null, {
        items: a.items,
        cached: !0
    });
    ensureSession(function(e) {
        if (e) return t(e);
        call("v3/searchByName", {
            value: r,
            type: "0",
            columnId: "",
            filter: "",
            pageNum: 1,
            pageSize: 20
        }, function(e, r) {
            if (e) return t(e);
            var a = r && r.searchItemList,
                i = [],
                o = {};
            if (a && a.length)
                for (var s = 0; s < a.length; s++) {
                    var u = a[s] && a[s].itemList;
                    if (u && u.length)
                        for (var l = 0; l < u.length; l++) {
                            var c = itemFromAsset(u[l], "", null);
                            c && !o[c.id] && (o[c.id] = !0, i.push(c), remember(c))
                        }
                }
            searchCache[n] = {
                at: Date.now(),
                items: i
            }, t(null, {
                items: i,
                total: r && r.totalSize,
                cached: !1
            })
        })
    })
}

function detail(e, t) {
    var r = trim(e);
    if (!r) return t(new Error("falta contentId"));
    ensureSession(function(e) {
        if (e) return t(e);
        call("v4/getItemData", {
            contentId: r,
            type: "0",
            sortType: "0",
            language: "en",
            macAddr: FIXED_MAC
        }, function(e, n) {
            var a = itemCache[r] || null;
            if (e) return "portal100006" === e.portalCode && a ? t(null, {
                item: a,
                episodes: [],
                seasons: []
            }) : t(e);
            var i = n && n.assetData;
            if (!i) return a ? t(null, {
                item: a,
                episodes: [],
                seasons: []
            }) : t(new Error("el portal no devolvió datos del título"));
            var o = itemFromAsset(i, a ? a.category : "", null);
            a && (o.row = a.row, o.category = a.category), remember(o);
            var s = [],
                u = i.simpleProgramList;
            if (u && u.length)
                for (var l = 0; l < u.length; l++) {
                    var c = u[l];
                    c && s.push({
                        id: trim(c.contentId),
                        title: text(c.name),
                        name: text(c.name),
                        number: void 0 === c.seriesNumber || null === c.seriesNumber ? l + 1 : c.seriesNumber,
                        duration: text(c.duration),
                        quality: text(c.quality),
                        picture: text(c.picture || c.pic || c.image || c.cover || c.posterUrl || c.poster),
                        description: text(c.description || c.desc || c.synopsis || c.shortDescription || c.introduce)
                    })
                }
            var d = [],
                f = i.sameSeasonSeriesList;
            if (f && f.length)
                for (var m = 0; m < f.length; m++) f[m] && trim(f[m].contentId) && d.push({
                    id: trim(f[m].contentId),
                    number: f[m].seasonNumber
                });
            t(null, {
                item: o,
                episodes: s,
                seasons: d
            })
        })
    })
}

function slbBean() {
    return {
        hasPay: "0",
        userIdentity: "1",
        type: "merge",
        appVer: APK_VERSION,
        lang: "es",
        encMediaSupported: 1,
        liveCodeList: ["masnew_live"],
        appParams: "",
        reserve1: FIXED_MAC,
        pipFlag: "0"
    }
}

function isCfl(e) {
    for (var t = e.slice(e.lastIndexOf("?") + 1).split("&"), r = 0; r < t.length; r++)
        if ("sign_type=cfl" === trim(t[r])) return !0;
    return !1
}

function withScheme(e) {
    var t = trim(e).replace(/\/+$/, "");
    return /^https?:\/\//.test(t) ? t : "https://" + t
}

function vodCdns(e) {
    var t = [],
        r = e && e.cdn_list;
    if (!r || !r.length) return t;
    for (var n = 0; n < r.length; n++) {
        var a = r[n];
        if (a && "vod" === trim(a.tag))
            for (var i = a.url_list || [], o = 0; o < i.length; o++) {
                var s = i[o],
                    u = trim(s && s.url);
                if ((isCfl(u) || "cfl" === trim(s && s.sign_type)) && "free" === trim(s && s.tag)) {
                    var l = [withScheme(a.main_addr)],
                        c = trim(a.spared_addr);
                    c && -1 === l.indexOf(withScheme(c)) && l.push(withScheme(c)), t.push({
                        bases: l,
                        auth: u
                    });
                    break
                }
            }
    }
    return t
}

function getSlb(e) {
    if (slbCache && Date.now() < slbCache.at + SLB_TTL) return e(null, slbCache.slb);
    call("v14/getSlbInfo", slbBean(), function(t, r) {
        return t ? e(t) : vodCdns(r).length ? (slbCache = {
            at: Date.now(),
            slb: r
        }, void e(null, r)) : e(new Error("el portal no expuso CDN de vod libre"))
    })
}

function fieldNumber(e) {
    var t = text(e).match(/(\d+(?:\.\d+)?)/);
    return t ? parseFloat(t[1]) : 0
}

function trackHeight(e) {
    var t = fieldNumber(e && (e.videoHeight || e.height || e.pixelHeight));
    if (t) return t;
    var r = text(e && (e.resolution || e.videoResolution || e.quality)).toLowerCase(),
        n = r.match(/\d{3,4}\s*[x×]\s*(\d{3,4})/);
    return n ? parseInt(n[1], 10) : /\b(4k|uhd|2160)\b/.test(r) ? 2160 : /\b1440\b/.test(r) ? 1440 : /\b1080\b|\bfhd\b/.test(r) ? 1080 : /\b720\b|\bhd\b/.test(r) ? 720 : /\b480\b|\bsd\b/.test(r) ? 480 : 0
}

function trackBitrateKbps(e) {
    var t = e && (e.videoBitrate || e.videoBitRate || e.bitrate || e.bitRate || e.rate || ""),
        r = fieldNumber(t),
        n = text(t).toLowerCase();
    return /mbps|m\b/.test(n) ? 1e3 * r : r > 1e4 ? r / 1e3 : r
}

function trackFrameRate(e) {
    return fieldNumber(e && (e.frameRate || e.fps || e.videoFps))
}

function trackSummary(e) {
    return {
        codec: trim(e && e.encodeFormat).toUpperCase(),
        format: trim(e && e.videoFormat).toLowerCase(),
        quality: trim(e && e.quality),
        height: trackHeight(e),
        bitrateKbps: trackBitrateKbps(e),
        frameRate: trackFrameRate(e)
    }
}

function durationSeconds(e) {
    var t = trim(e);
    if (!t) return 0;
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(t)) {
        var r = t.split(":");
        return 3600 * parseInt(r[0], 10) + 60 * parseInt(r[1], 10) + parseInt(r[2], 10)
    }
    var n = fieldNumber(t);
    return n > 1e5 ? n / 1e3 : n
}

function mediaScore(e) {
    var t = trim(e && e.encodeFormat).toLowerCase().replace(/[^a-z0-9]/g, ""),
        r = trim(e && e.videoFormat).toLowerCase(),
        n = -1 !== t.indexOf("h264") || -1 !== t.indexOf("avc"),
        a = -1 !== t.indexOf("h265") || -1 !== t.indexOf("hevc"),
        i = "mp4" === r,
        o = trackSummary(e),
        s = 0;
    return s += n ? 0 : a ? 80 : 160, /av1|vp9|10bit|hdr/.test(t) && (s += 500), i || (s += 2e3), o.height > 1080 && (s += 500 + o.height), o.frameRate > 30 && (s += 300 + o.frameRate), o.bitrateKbps > 9e3 ? s += 250 : o.bitrateKbps > 6500 && (s += 80), s
}

function collectTracks(e) {
    for (var t = [], r = e && e.totalMovieList || [], n = 0; n < r.length; n++)
        for (var a = r[n] && r[n].movieList || [], i = 0; i < a.length; i++) a[i] && trim(a[i].contentId) && t.push(a[i]);
    return t.sort(function(e, t) {
        return mediaScore(e) - mediaScore(t)
    }), t
}

function subtitleList(e) {
    for (var t = [], r = e && e.subtitleList || [], n = 0; n < r.length && t.length < 30; n++) {
        var a = r[n] && r[n].file && r[n].file[0];
        a && trim(a.url) && t.push({
            lang: trim(r[n].language),
            url: trim(a.url),
            format: trim(a.fileType) || "srt"
        })
    }
    return t
}

function loadPlay(e, t, r) {
    var n = trim(e);
    if (!n) return r(new Error("falta contentId"));
    ensureSession(function(e) {
        if (e) return r(e);
        call("v10/startPlayVOD", {
            contentId: n,
            seriesContentId: trim(t),
            startTime: 0,
            type: "1",
            columnId: 0,
            authType: ""
        }, function(e, t) {
            if (e) return r(e);
            var n = t && t.episodeList && t.episodeList[0];
            if (!n) return r(new Error("el portal no devolvió pistas de vídeo"));
            var a = collectTracks(n);
            if (!a.length) return r(new Error("el portal no devolvió pistas de vídeo"));
            r(null, {
                play: t,
                episode: n,
                tracks: a
            })
        })
    })
}

function mediaInfo(e, t, r) {
    loadPlay(e, t, function(e, t) {
        if (e) return r(e);
        var n = t.tracks[0];
        r(null, {
            name: text(t.play && t.play.name),
            audio: trim(n.audioInfo),
            subtitles: subtitleList(t.episode),
            tracks: t.tracks.map(trackSummary),
            selected: trackSummary(n),
            duration: durationSeconds(n.duration || t.episode.duration || t.play && t.play.duration)
        })
    })
}

function resolve(e, t, r, n) {
    "function" == typeof r && (n = r, r = {}), r = r || {}, loadPlay(e, t, function(e, t) {
        if (e) return n(e);
        var a = t.play,
            i = t.episode,
            o = t.tracks,
            s = parseInt(r.trackIndex, 10);
        s >= 0 && s < o.length || (s = 0);
        for (var u = o[s], l = [], c = 0; c < o.length; c++) l.push(trackSummary(o[c]));
        var d = trim(u.licenseList && u.licenseList[0] && u.licenseList[0].license || "");
        if (!d) return n(new Error("el portal no devolvió licencia de reproducción"));
        getSlb(function(e, t) {
            if (e) return n(e);
            var r = vodCdns(t);
            if (!r.length) return n(new Error("el portal no expuso CDN de vod libre"));
            var o = r[0],
                c = "ts" === trim(u.videoFormat).toLowerCase() ? "ts" : "mp4",
                f = o.bases[0] + "/vod/" + trim(u.contentId) + "_media." + c,
                m = "ts" === c ? "video/mp2t" : "video/mp4",
                p = trim(u.encodeFormat).toUpperCase();
            n(null, {
                url: f,
                mime: m,
                codec: p,
                quality: trim(u.quality),
                duration: durationSeconds(u.duration || i.duration || a && a.duration),
                selectedTrack: trackSummary(u),
                availableTracks: l,
                trackIndex: s,
                audio: trim(u.audioInfo),
                headers: {
                    "Content-Auth": o.auth,
                    "Content-License": d,
                    "User-Agent": UA_CDN,
                    App: APP_ID,
                    "App-Version": APK_VERSION
                },
                subtitles: subtitleList(i),
                name: text(a && a.name)
            })
        })
    })
}
for (var LIVE_K = [3614090360, 3905402710, 606105819, 3250441966, 4118548399, 1200080426, 2821735955, 4249261313, 1770035416, 2336552879, 4294925233, 2304563134, 1804603682, 4254626195, 2792965006, 1236535329, 4129170786, 3225465664, 643717713, 3921069994, 3593408605, 38016083, 3634488961, 3889429448, 568446438, 3275163606, 4107603335, 1163531501, 2850285829, 4243563512, 1735328473, 2368359562, 4294588738, 2272392833, 1839030562, 4259657740, 2763975236, 1272893353, 4139469664, 3200236656, 681279174, 3936430074, 3564056709, 76029189, 3654602809, 3871185381, 530742520, 3299628645, 4096336452, 1126891415, 2878612391, 4237533241, 1700485571, 2399980690, 4293706877, 2240044497, 1873313359, 4264355552, 2734768916, 1309151649, 4149444226, 3174756917, 765973179, 3951481745], LIVE_S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21], LIVE_ROUND1 = [10, 11, 12, 13, 14, 15, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5], LIVE_G = [], iG = 0; iG < 64; iG++) LIVE_G.push(iG < 16 ? LIVE_ROUND1[iG] : iG < 32 ? (5 * iG + 1) % 16 : iG < 48 ? (3 * iG + 5) % 16 : 7 * iG % 16);
var LIVE_SALT = bufFrom([115, 97, 108, 116, 51, 51, 51, 51, 61, 52, 152, 13, 10, 21, 50, 201, 195, 130, 23, 8, 192]);

function rotl(e, t) {
    return (e << t | e >>> 32 - t) >>> 0
}

function liveCompress(e, t, r) {
    for (var n = new Array(16), a = 0; a < 16; a++) {
        var i = r + 4 * a;
        n[a] = (t[i] | t[i + 1] << 8 | t[i + 2] << 16 | t[i + 3] << 24) >>> 0
    }
    for (var o = e[0], s = e[1], u = e[2], l = e[3], c = 0; c < 64; c++) {
        var d = (c < 16 ? s & u | ~s & l : c < 32 ? l & s | ~l & u : c < 48 ? s ^ u ^ l : u ^ (s | ~l)) + o + LIVE_K[c] + n[LIVE_G[c]] >>> 0;
        o = l, l = u, u = s, s = s + rotl(d, LIVE_S[c]) >>> 0
    }
    e[0] = e[0] + o >>> 0, e[1] = e[1] + s >>> 0, e[2] = e[2] + u >>> 0, e[3] = e[3] + l >>> 0
}

function liveDigestHex(e) {
    var t = [1732584193, 4023233417, 2562383102, 271733878],
        r = e.length,
        n = (56 - (r + 1) % 64 + 64) % 64,
        a = bufAlloc(r + 1 + n + 8);
    e.copy(a, 0), a[r] = 128;
    for (var i = r % 536870912 * 8, o = Math.floor(r / 536870912), s = 0; s < 4; s++) a[r + 1 + n + s] = i >>> 8 * s & 255, a[r + 5 + n + s] = o >>> 8 * s & 255;
    for (var u = 0; u < a.length; u += 64) liveCompress(t, a, u);
    for (var l = "", c = 0; c < 4; c++)
        for (var d = 0; d < 4; d++) {
            var f = (t[c] >>> 8 * d & 255).toString(16);
            f.length < 2 && (f = "0" + f), l += f
        }
    return l
}

function signO3(e, t) {
    var r = bufFrom("token=" + e + "&sign2_method=sign_o3&instance=0&start_moment=" + t, "utf8");
    return liveDigestHex(Buffer.concat([r, LIVE_SALT]))
}

function bareHost(e) {
    var t = "string" == typeof e ? e : "";
    0 === t.indexOf("https://") && (t = t.slice(8)), 0 === t.indexOf("http://") && (t = t.slice(7));
    var r = t.indexOf("/");
    return r >= 0 ? t.slice(0, r) : t
}

function getLiveChannels(e, t, r, n) {
    "function" == typeof e ? (n = e, e = null, t = 1, r = 20) : "function" == typeof t ? (n = t, t = 1, r = 20) : "function" == typeof r && (n = r, r = 20), t = Math.max(1, parseInt(t, 10) || 1), r = Math.max(1, Math.min(50, parseInt(r, 10) || 20)), ensureSession(function(a) {
        if (a) return n(a);
        var i = [],
            o = {};
        post("v6/getLiveData", {
            userToken: session.userToken,
            userId: session.userId,
            portalCode: PORTAL_CODE,
            columnId: e || 76182,
            dataVersion: "",
            pageSize: r,
            pageNum: t,
            expireTimeStr: ""
        }, function(e, t) {
            if (e) return n(e);
            for (var a = t && t.channelList || [], s = 0; s < a.length; s++) {
                var u = a[s];
                if (u && u.channelCode && !o[u.channelCode]) {
                    o[u.channelCode] = !0;
                    var l = text(u.posterUrl);
                    !l && u.posterList && u.posterList.length && (l = text(u.posterList[0].fileUrl)), i.push({
                        channelCode: u.channelCode,
                        index: u.channelNumber || i.length + 1,
                        name: text(u.name || u.alias || "Canal " + (i.length + 1)),
                        logo: l,
                        uhd: "3" === u.quality,
                        fav: u.isFav || !1,
                        now: "En vivo",
                        next: "",
                        time: "",
                        liveAddressList: u.liveAddressList || []
                    })
                }
            }
            n(null, i, a.length >= r)
        })
    })
}
var liveCategoriesCache = null;

function getLiveCategories(e) {
    if (liveCategoriesCache && liveCategoriesCache.length) return e(null, liveCategoriesCache);
    ensureSession(function(t) {
        if (t) return e(t);
        call("getNextColumns", {
            columnCode: "masnew_live",
            pageNum: 1,
            pageSize: 50,
            version: ""
        }, function(t, r) {
            if (t) return e(t);
            for (var n = r && r.recommendList || [], a = [], i = 0; i < n.length; i++) {
                var o = n[i];
                o && o.columnId && a.push({
                    id: o.columnId,
                    name: text(o.name || o.title || o.alias || "Categoría " + (i + 1)),
                    code: o.code || ""
                })
            }
            liveCategoriesCache = a, e(null, a)
        })
    })
}

function parseM3u(e) {
    for (var t = (e || "").split(/\r?\n/), r = [], n = null, a = 0; a < t.length; a++) {
        var i = t[a].trim();
        if (0 === i.indexOf("#EXTINF:")) {
            var o = i.indexOf(","),
                s = i.slice(8, o > 0 ? o : void 0),
                u = o > 0 ? i.slice(o + 1).trim() : "Canal",
                l = /tvg-logo="([^"]+)"/i.exec(s),
                c = /group-title="([^"]+)"/i.exec(s);
            n = {
                name: u,
                logo: l ? l[1] : "",
                group: c ? c[1] : "Addon",
                isAddon: !0,
                now: "En vivo",
                fav: !1
            }
        } else i && 0 !== i.indexOf("#") && n && (n.url = i, n.streamUrl = i, n.channelCode = "m3u_" + (r.length + 1), n.index = r.length + 1, r.push(n), n = null)
    }
    return r
}

function fetchM3u(e, t) {
    if (!e) return t(new Error("URL de addon requerida"));
    var r = 0 === e.indexOf("https://") ? https : http,
        n = url.parse(e);
    n.rejectUnauthorized = !1, n.headers = {
        "User-Agent": "Mozilla/5.0 (SmartHub; SMART-TV; U; Linux/SmartTV) AppleWebKit/538.1+ (KHTML, like Gecko) Safari/538.1+"
    };
    var a = r.get(n, function(e) {
        if (e.statusCode >= 300 && e.statusCode < 400 && e.headers.location) return fetchM3u(e.headers.location, t);
        if (200 !== e.statusCode) return t(new Error("HTTP " + e.statusCode + " al descargar addon"));
        var r = [];
        e.on("data", function(e) {
            r.push(e)
        }), e.on("end", function() {
            var e = parseM3u(Buffer.concat(r).toString("utf8"));
            t(null, e)
        })
    });
    a.on("error", function(e) {
        t(e)
    }), a.setTimeout(2e4, function() {
        a.abort(), t(new Error("Tiempo de espera agotado al descargar addon"))
    })
}
var liveResolveCache = {},
    LIVE_RESOLVE_CACHE_MS = 12e4;

function resolveLive(e, t) {
    var r = liveResolveCache[e];
    if (r && Date.now() - r.at < LIVE_RESOLVE_CACHE_MS) return setTimeout(function() {
        t(null, r.stream)
    }, 0);
    ensureSession(function(r) {
        if (r) return t(r);
        call("v4/startPlayLive", {
            channelCode: e,
            columnId: 0,
            type: "1"
        }, function(r, n) {
            if (r) return t(r);
            for (var a = n && n.liveAddressList || [], i = null, o = 0; o < a.length; o++)
                if (a[o] && a[o].playCode && a[o].license) {
                    i = a[o];
                    break
                } if (!i && a[0] && (i = a[0]), !i || !i.license) return t(new Error("el portal no devolvió licencia para el canal"));
            var s = i.playCode || e,
                u = i.license,
                l = slbBean();
            l.liveCodeList = [e], call("v14/getSlbInfo", l, function(r, a) {
                if (r) return t(r);
                for (var i = a.cdn_list || [], o = [], l = 0; l < i.length; l++) {
                    var c = i[l];
                    if ("live" === c.tag)
                        for (var d = c.url_list || [], f = 0; f < d.length; f++) {
                            var m = d[f],
                                p = m.url || "";
                            if ("cfl" === m.sign_type || -1 !== p.indexOf("sign_type=cfl")) {
                                var v = bareHost(c.main_addr);
                                v && o.push({
                                    cflHost: v,
                                    authBase: p
                                })
                            }
                        }
                }
                if (!o.length) return t(new Error("el portal no expuso CDN de vivo"));
                var h = o[0],
                    g = "http://" + h.cflHost + "/live/" + s + ".m3u8",
                    C = h.authBase.match(/token=([0-9a-fA-F]{32})/),
                    _ = C ? C[1] : "",
                    E = Math.trunc(Date.now()),
                    b = signO3(_, E),
                    y = {
                        url: g,
                        mime: "application/x-mpegurl",
                        headers: {
                            "Content-Auth": h.authBase + "&sign2_method=sign_o3&instance=0&start_moment=" + E + "&sign2=" + b,
                            "Content-License": u,
                            "User-Agent": "Ranger/4.9.4-17294ac0",
                            App: "com.android.msandroid",
                            "App-Version": "49902",
                            "X-Buffer": "0"
                        },
                        name: text(n.name)
                    };
                liveResolveCache[e] = {
                    at: Date.now(),
                    stream: y
                }, t(null, y)
            })
        })
    })
}
module.exports = {
    home: home,
    search: search,
    detail: detail,
    mediaInfo: mediaInfo,
    resolve: resolve,
    getLiveChannels: getLiveChannels,
    getLiveCategories: getLiveCategories,
    resolveLive: resolveLive,
    fetchM3u: fetchM3u,
    parseM3u: parseM3u,
    call: call,
    post: post,
    ensureSession: ensureSession,
    session: session,
    constants: {
        APP_ID: APP_ID,
        APK_VERSION: APK_VERSION,
        UA_CDN: UA_CDN,
        FIXED_MAC: FIXED_MAC,
        ROOT_CODES: ROOT_CODES
    }
};