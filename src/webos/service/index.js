"use strict";
var Service = require("webos-service"),
    pkg = require("./package.json"),
    magis = require("./magis"),
    proxy = require("./proxy"),
    relay = require("./ffmpeg-relay"),
    service = new Service(pkg.name);
try {
    process.exit = function(e) {
        console.log("[tuty-service] blocked process.exit(" + e + ") to keep streaming alive")
    }
} catch (e) {}
if (service.activityManager) try {
    service.activityManager.idleTimeout = 86400, service.activityManager.create("keepAlive", function(e) {
        console.log("[tuty-service] persistent activity created")
    })
} catch (e) {
    console.log("[tuty-service] activityManager init note: " + (e && e.message))
}

function fail(e, r, i) {
    e.respond({
        returnValue: !1,
        errorText: r && r.message || r || "error",
        errorCode: i || r && r.portalCode || 1
    })
}

function respond(e, r, i) {
    if (r) return fail(e, r);
    var t = i || {};
    t.returnValue = !0, e.respond(t)
}

function attachSubtitles(e) {
    return e && e.subtitles && e.subtitles.length ? (e.subtitles = e.subtitles.map(function(e) {
        return {
            lang: e.lang,
            format: e.format,
            url: proxy.addSubtitle(e.url)
        }
    }), e) : e
}

function resolveStream(e, r) {
    var i = e.payload || {},
        t = {
            trackIndex: i.trackIndex
        };
    magis.resolve(i.contentId, i.seriesContentId, t, function(t, a) {
        if (t) return fail(e, t);
        var n = /hevc|h\.?265/i.test(a.codec || "") || /hevc|h\.?265/i.test(a.mime || ""),
            o = r || !0 === i.forceRelay || "true" === i.forceRelay || "smooth" === i.playbackMode || "relay" === i.playbackMode;
        if (o && !relay.available()) return fail(e, new Error("Modo Fluido no disponible: ffmpeg no es ejecutable en esta TV"));
        if (o) {
            var s = relay.register(a, {
                hevc: n,
                audio: Number(i.audioTrack) || 0
            });
            return console.log("[tuty-service] routing stream via ffmpeg relay: " + s), a.proxyPath = s, a.mime = "video/mp4", a.isRelay = !0, a.isHls = !1, void proxy.start(function() {
                respond(e, null, attachSubtitles(a))
            })
        }
        proxy.start(function(r, i) {
            if (r) return fail(e, r);
            var t = proxy.add(a.url, a.headers, a.duration),
                n = "video/mp4" === a.mime ? "mp4" : "ts";
            a.proxyPath = proxy.baseUrl() + "/media/" + t + "/stream." + n, a.isHls = !1, attachSubtitles(a), respond(e, null, a)
        })
    })
}
service.register("ping", function(e) {
    e.respond({
        returnValue: !0,
        service: pkg.name,
        version: pkg.version,
        portalHosts: magis.constants.ROOT_CODES ? "magis" : "none",
        proxyPort: proxy.port(),
        relayAvailable: relay.available(),
        ffmpegPath: relay.path(),
        relayPort: relay.port()
    })
}), service.register("keepAlive", function(e) {
    e.respond({
        returnValue: !0,
        subscribed: !!e.isSubscription
    })
}), service.register("heartbeat", function(e) {
    e.respond({
        returnValue: !0,
        alive: !0,
        proxyPort: proxy.port(),
        timestamp: Date.now()
    })
}), service.register("home", function(e) {
    var r = e.payload && e.payload.root || "movies";
    magis.home(r, function(r, i) {
        respond(e, r, i)
    })
}), service.register("search", function(e) {
    var r = e.payload && e.payload.value || "";
    magis.search(r, function(r, i) {
        respond(e, r, i)
    })
}), service.register("detail", function(e) {
    var r = e.payload && e.payload.contentId;
    magis.detail(r, function(r, i) {
        respond(e, r, i)
    })
}), service.register("resolve", function(e) {
    resolveStream(e, !1)
}), service.register("resolveSmooth", function(e) {
    resolveStream(e, !0)
}), service.register("mediaInfo", function(e) {
    var r = e.payload || {};
    magis.mediaInfo(r.contentId, r.seriesContentId, function(r, i) {
        if (r) return fail(e, r);
        proxy.start(function(r) {
            if (r) return fail(e, r);
            respond(e, null, attachSubtitles(i))
        })
    })
}), service.register("liveChannels", function(e) {
    var r = e.payload || {};
    magis.getLiveChannels(r.columnId, r.pageNum, r.pageSize, function(i, t, a) {
        if (i) return fail(e, i);
        respond(e, null, {
            channels: t || [],
            pageNum: Math.max(1, parseInt(r.pageNum, 10) || 1),
            hasMore: !!a
        })
    })
}), service.register("liveCategories", function(e) {
    magis.getLiveCategories(function(r, i) {
        if (r) return fail(e, r);
        respond(e, null, {
            categories: i || []
        })
    })
}), service.register("fetchM3u", function(e) {
    var r = e.payload || {};
    if (!r.url) return fail(e, new Error("url requerida"));
    magis.fetchM3u(r.url, function(r, i) {
        if (r) return fail(e, r);
        respond(e, null, {
            channels: i || []
        })
    })
}), service.register("resolveLive", function(e) {
    var r = e.payload || {};
    if (r.streamUrl) {
        if (!/\.m3u8(?:\?|$)/i.test(r.streamUrl)) return respond(e, null, {
            url: r.streamUrl,
            proxyPath: r.streamUrl,
            isHls: !1
        });
        return proxy.start(function(t) {
            if (t) return fail(e, t);
            var i = proxy.add(r.streamUrl, {
                "User-Agent": "Mozilla/5.0 (SmartHub; SMART-TV; U; Linux/SmartTV) AppleWebKit/538.1+ (KHTML, like Gecko) Safari/538.1+",
                "Accept": "*/*"
            }, 0);
            respond(e, null, {
                url: r.streamUrl,
                proxyPath: proxy.baseUrl() + "/media/" + i + "/stream.m3u8",
                isHls: !0
            })
        })
    }
    return r.channelCode ? void magis.resolveLive(r.channelCode, function(r, i) {
        if (r) return fail(e, r);
        proxy.start(function(r) {
            if (r) return fail(e, r);
            var t = proxy.add(i.url, i.headers, 0);
            i.proxyPath = proxy.baseUrl() + "/media/" + t + "/stream.m3u8", i.isHls = !0, respond(e, null, i)
        })
    }) : fail(e, new Error("channelCode requerido"))
}), service.register("abortMedia", function(e) {
    try {
        relay.stop()
    } catch (e) {}
    try {
        proxy.killActiveStreams()
    } catch (e) {}
    e.respond({
        returnValue: !0
    })
}), service.register("prewarm", function(e) {
    magis.ensureSession(function(r) {
        if (r) return fail(e, r);
        e.respond({
            returnValue: !0,
            sn: magis.session.sn,
            userId: magis.session.userId
        })
    })
}), console.log("[tuty-service] started " + pkg.name + " v" + pkg.version);