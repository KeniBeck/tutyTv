"use strict";
var http = require("http"),
    https = require("https"),
    crypto = require("crypto"),
    urlmod = require("url"),
    tsIndexer = require("./ts-indexer"),
    MAX_TOKENS = 6,
    tokens = {},
    order = [],
    subtitleTokens = {},
    subtitleOrder = [],
    MAX_SUBTITLES = 12,
    server = null,
    port = 0,
    httpAgent = new http.Agent({
        keepAlive: !0,
        maxSockets: 4,
        keepAliveMsecs: 15e3
    }),
    httpsAgent = new https.Agent({
        keepAlive: !0,
        maxSockets: 4,
        keepAliveMsecs: 15e3,
        rejectUnauthorized: !1
    }),
    activeToken = null,
    activeUpstreams = [],
    TS_PACKET_BYTES = 188,
    HLS_SEGMENT_SECONDS = 10;

function destroyConnection(e) {
    if (e) {
        if (e.up) {
            try {
                e.up.unpipe()
            } catch (e) {}
            try {
                "function" == typeof e.up.destroy && e.up.destroy()
            } catch (e) {}
            try {
                e.up.socket && e.up.socket.destroy()
            } catch (e) {}
            e.up = null
        }
        try {
            e.upstream && e.upstream.abort()
        } catch (e) {}
        try {
            e.upstream && e.upstream.socket && e.upstream.socket.destroy()
        } catch (e) {}
        try {
            e.res && !e.res.finished && e.res.destroy()
        } catch (e) {}
        e.upstream = null, e.res = null, e.req = null
    }
}

function killActiveStreams() {
    for (; activeUpstreams.length > 0;) {
        destroyConnection(activeUpstreams.shift())
    }
}

function remember(e, t) {
    for (tokens[e] = t, order.push(e); order.length > MAX_TOKENS;) {
        var r = order.shift();
        r && delete tokens[r]
    }
}

function add(e, t, r) {
    var n = crypto.randomBytes(12).toString("hex");
    return remember(n, {
        url: e,
        headers: t || {},
        duration: Number(r) || 0,
        contentLength: 0,
        lengthWaiters: null,
        at: Date.now()
    }), n
}

function addSubtitle(e) {
    var t = crypto.randomBytes(12).toString("hex");
    for (subtitleTokens[t] = {
            url: e,
            at: Date.now()
        }, subtitleOrder.push(t); subtitleOrder.length > MAX_SUBTITLES;) {
        var r = subtitleOrder.shift();
        r && delete subtitleTokens[r]
    }
    return baseUrl() + "/sub/" + t + ".srt"
}

function sendSubtitle(e, t, r) {
    var n = urlmod.parse(r.url || ""),
        o = "https:" === n.protocol,
        a = {
            hostname: n.hostname,
            servername: n.hostname,
            rejectUnauthorized: !1,
            port: n.port || (o ? 443 : 80),
            path: n.path,
            method: "GET",
            headers: {
                "User-Agent": "Ranger/4.9.4-17294ac0",
                Accept: "*/*"
            },
            agent: o ? httpsAgent : httpAgent
        },
        s = !1,
        i = (o ? https : http).request(a, function(e) {
            var r = [];
            e.on("data", function(e) {
                r.push(e)
            }), e.on("end", function() {
                if (!s) {
                    var n = Buffer.concat(r),
                        o = e.statusCode >= 200 && e.statusCode < 300;
                    t.writeHead(o ? 200 : 502, {
                        "Content-Type": "text/plain; charset=utf-8",
                        "Content-Length": n.length,
                        "Access-Control-Allow-Origin": "*",
                        "Cache-Control": "private, max-age=300"
                    }), t.end(n)
                }
            })
        });
    i.setTimeout(2e4, function() {
        try {
            i.abort()
        } catch (e) {}
    }), i.on("error", function() {
        if (!s) {
            s = !0;
            try {
                t.writeHead(502, {
                    "Content-Type": "text/plain",
                    "Access-Control-Allow-Origin": "*"
                }), t.end("subtitle upstream error")
            } catch (e) {}
        }
    }), i.end()
}

function mediaRequest(e, t, r) {
    var n, o = urlmod.parse(e.url),
        a = "https:" === o.protocol,
        s = {};
    for (n in e.headers) Object.prototype.hasOwnProperty.call(e.headers, n) && (s[n] = e.headers[n]);
    for (n in r || {}) Object.prototype.hasOwnProperty.call(r, n) && (s[n] = r[n]);
    return {
        secure: a,
        options: {
            hostname: o.hostname,
            servername: o.hostname,
            rejectUnauthorized: !1,
            port: o.port || (a ? 443 : 80),
            path: o.path,
            method: t,
            headers: s,
            agent: a ? httpsAgent : httpAgent
        }
    }
}

function sourceLength(e, t) {
    if (e.contentLength > 0) return t(null, e.contentLength);
    if (e.lengthWaiters) e.lengthWaiters.push(t);
    else {
        e.lengthWaiters = [t];
        var r = mediaRequest(e, "GET", {
                Range: "bytes=0-0"
            }),
            n = (r.secure ? https : http).request(r.options, function(t) {
                var r = /\/(\d+)$/.exec(String(t.headers["content-range"] || "")),
                    n = r ? parseInt(r[1], 10) : parseInt(t.headers["content-length"], 10);
                t.resume();
                var o = e.lengthWaiters || [];
                e.lengthWaiters = null, n > 0 && (e.contentLength = n);
                for (var a = 0; a < o.length; a++) o[a](n > 0 ? null : new Error("el CDN no informó el tamaño"), n)
            });
        n.setTimeout(15e3, function() {
            try {
                n.abort()
            } catch (e) {}
        }), n.on("error", function(t) {
            var r = e.lengthWaiters || [];
            e.lengthWaiters = null;
            for (var n = 0; n < r.length; n++) r[n](t)
        }), n.end()
    }
}

function readRange(e, t, r, n) {
    var o = mediaRequest(e, "GET", {
            Range: "bytes=" + t + "-" + r
        }),
        a = (o.secure ? https : http).request(o.options, function(e) {
            var t = [];
            e.on("data", function(e) {
                t.push(e)
            }), e.on("end", function() {
                n(e.statusCode >= 200 && e.statusCode < 300 ? null : new Error("rango rechazado"), Buffer.concat(t))
            })
        });
    a.setTimeout(25e3, function() {
        try {
            a.abort()
        } catch (e) {}
    }), a.on("error", function(e) {
        n(e)
    }), a.end()
}

function sendVirtualHls(e, t, r, n) {
    sourceLength(n, function(o, a) {
        if (o) return t.writeHead(502, {
            "Content-Type": "text/plain",
            "Access-Control-Allow-Origin": "*"
        }), void t.end("no se pudo crear el manifiesto HLS");
        n.indexer || (n.indexer = tsIndexer.create(a, function(e, t, r) {
            readRange(n, e, t, r)
        }), n.indexer.start());
        var s = n.indexer;
        if (s.segments.length || s.complete) {
            for (var i = ["#EXTM3U", "#EXT-X-VERSION:4", "#EXT-X-PLAYLIST-TYPE:VOD", "#EXT-X-TARGETDURATION:" + HLS_SEGMENT_SECONDS, "#EXT-X-MEDIA-SEQUENCE:0"], l = 0; l < s.segments.length; l++) {
                var c = s.segments[l];
                i.push("#EXTINF:" + c.duration.toFixed(3) + ","), i.push("#EXT-X-BYTERANGE:" + (c.end - c.start + 1) + "@" + c.start), i.push("stream.ts")
            }
            s.complete && i.push("#EXT-X-ENDLIST");
            var u = i.join("\n") + "\n";
            t.writeHead(200, {
                "Content-Type": "application/vnd.apple.mpegurl",
                "Content-Length": Buffer.byteLength(u),
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-store"
            }), t.end(u)
        } else s.when(function() {
            sendVirtualHls(e, t, r, n)
        })
    })
}

function base64Url(e) {
    return new Buffer(String(e), "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function fromBase64Url(e) {
    for (var t = String(e).replace(/-/g, "+").replace(/_/g, "/"); t.length % 4;) t += "=";
    return new Buffer(t, "base64").toString("utf8")
}

function hlsChildUrl(e, t, r) {
    return r && 0 !== r.indexOf("data:") ? baseUrl() + "/hls/" + e + "/" + base64Url(urlmod.resolve(t, r)) : r
}

function rewriteHlsManifest(e, t, r) {
    for (var n = String(e || "").replace(/^\uFEFF/, "").split(/\r?\n/), o = 0; o < n.length; o++) {
        var a = n[o];
        a && ("#" !== a.charAt(0) ? n[o] = hlsChildUrl(t, r, a) : -1 !== a.indexOf("URI=") && (n[o] = a.replace(/URI=("|')([^"']+)\1/g, function(e, n, o) {
            return "URI=" + n + hlsChildUrl(t, r, o) + n
        })))
    }
    return n.join("\n")
}

function forward(e, t, r, n) {
    activeToken !== n && (killActiveStreams(), activeToken = n);
    var o = {};
    e.headers.range && (o.Range = e.headers.range), e.headers["if-range"] && (o["If-Range"] = e.headers["if-range"]);
    var a = mediaRequest(r, "HEAD" === e.method ? "HEAD" : "GET", o),
        s = a.secure,
        i = a.options;
    if (t.socket) try {
        t.socket.setNoDelay(!0)
    } catch (e) {}
    var l = {
        upstream: null,
        res: t,
        req: e,
        up: null
    };

    function c() {
        var e = activeUpstreams.indexOf(l); - 1 !== e && activeUpstreams.splice(e, 1), destroyConnection(l)
    }
    activeUpstreams.push(l), e.on("close", c), e.on("aborted", c), t.on("close", c), t.on("finish", c), t.on("error", c);
    var u = (s ? https : http).request(i, function(o) {
        if (l.up = o, o.socket) try {
            o.socket.setNoDelay(!0)
        } catch (e) {}
        if (u.setTimeout(0), u.socket) try {
            u.socket.setTimeout(0)
        } catch (e) {}
        var a = (o.headers["content-type"] || "").toLowerCase(),
            s = "video/mp2t"; - 1 !== a.indexOf("mp4") ? s = "video/mp4" : (-1 !== a.indexOf("mpegurl") || r.url && -1 !== r.url.indexOf(".m3u8")) && (s = "application/vnd.apple.mpegurl");
        var i = "application/vnd.apple.mpegurl" === s,
            d = {
                "Content-Type": s,
                "Accept-Ranges": o.headers["accept-ranges"] || "bytes",
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": i ? "no-cache, no-store" : "private, max-age=120",
                Connection: "keep-alive"
            };
        if (o.headers["content-length"] && (d["Content-Length"] = o.headers["content-length"]), o.headers["content-range"] && (d["Content-Range"] = o.headers["content-range"]), "HEAD" === e.method) return t.writeHead(o.statusCode || 200, d), t.end(), void o.resume();
        if (i) {
            var p = [];
            return o.on("data", function(e) {
                p.push(e)
            }), o.on("error", function() {
                c()
            }), void o.on("end", function() {
                var e = rewriteHlsManifest(Buffer.concat(p).toString("utf8"), n, r.url);
                delete d["Content-Length"], delete d["Content-Range"], d["Content-Length"] = Buffer.byteLength(e);
                try {
                    t.writeHead(o.statusCode || 200, d), t.end(e)
                } catch (e) {
                    c()
                }
            })
        }
        t.writeHead(o.statusCode || 200, d), o.on("error", function() {
            c()
        }), o.on("close", function() {
            c()
        }), o.on("end", function() {
            c()
        }), o.pipe(t)
    });
    if (l.upstream = u, u.socket) try {
        u.socket.setNoDelay(!0)
    } catch (e) {}
    u.setTimeout(25e3, function() {
        if (!t.headersSent) {
            try {
                u.abort()
            } catch (e) {}
            try {
                t.writeHead(504, {
                    "Content-Type": "text/plain",
                    "Access-Control-Allow-Origin": "*"
                }), t.end("gateway timeout")
            } catch (e) {}
        }
        c()
    }), u.on("error", function() {
        if (!t.headersSent) try {
            t.writeHead(502, {
                "Content-Type": "text/plain",
                "Access-Control-Allow-Origin": "*"
            }), t.end("upstream error")
        } catch (e) {}
        c()
    }), u.end()
}

function handler(e, t) {
    try {
        e.setTimeout(0)
    } catch (e) {}
    try {
        t.setTimeout(0)
    } catch (e) {}
    if ("OPTIONS" === e.method) return t.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Range"
    }), void t.end();
    if ("/media/abort" === e.url) return killActiveStreams(), activeToken = null, t.writeHead(200, {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*"
    }), void t.end("aborted");
    var r = /^\/sub\/([a-f0-9]{24})\.srt$/.exec(e.url || "");
    if (r) {
        var n = subtitleTokens[r[1]];
        return n ? void sendSubtitle(e, t, n) : (t.writeHead(410, {
            "Content-Type": "text/plain",
            "Access-Control-Allow-Origin": "*"
        }), void t.end("expired"))
    }
    var o = /^\/hls\/([a-f0-9]{24})\/([A-Za-z0-9_-]+)$/.exec((e.url || "").split("?")[0]);
    if (o) {
        var a = tokens[o[1]];
        if (!a) return t.writeHead(410, {
            "Content-Type": "text/plain",
            "Access-Control-Allow-Origin": "*"
        }), void t.end("expired");
        var s = fromBase64Url(o[2]);
        return /^https?:\/\//i.test(s) ? void forward(e, t, {
            url: s,
            headers: a.headers,
            duration: 0
        }, o[1]) : (t.writeHead(400, {
            "Content-Type": "text/plain",
            "Access-Control-Allow-Origin": "*"
        }), void t.end("invalid hls child"))
    }
    var i = /^\/media\/([a-f0-9]{24})(?:\/([^\?#]*))?(?:[?#].*)?$/.exec(e.url || "");
    if (!i) return t.writeHead(404, {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*"
    }), void t.end("not found");
    var l = i[1],
        c = i[2] || "",
        u = tokens[l];
    if (!u) return t.writeHead(410, {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*"
    }), void t.end("expired"); - 1 !== u.url.indexOf(".m3u8") || -1 === c.indexOf(".m3u8") ? forward(e, t, u, l) : sendVirtualHls(e, t, l, u)
}

function start(e) {
    if (server && port) return e(null, port);
    (server = http.createServer(handler)).timeout = 0, "function" == typeof server.setTimeout && server.setTimeout(0), server.on("error", function(t) {
        e(t)
    }), server.listen(0, function() {
        port = server.address().port, e(null, port)
    })
}

function baseUrl() {
    return port ? "http://127.0.0.1:" + port : ""
}
module.exports = {
    start: start,
    add: add,
    addSubtitle: addSubtitle,
    baseUrl: baseUrl,
    port: function() {
        return port
    },
    killActiveStreams: killActiveStreams
};