"use strict";
var http = require("http"),
    fs = require("fs"),
    crypto = require("crypto"),
    urlmod = require("url"),
    spawn = require("child_process").spawn,
    FFMPEG = __dirname + "/ffmpeg",
    HOST = "127.0.0.1",
    PORT = 8787,
    sessions = {},
    current = null;

function log() {
    var e = Array.prototype.slice.call(arguments);
    try {
        fs.appendFileSync("/tmp/tuty-relay.log", e.join(" ") + "\n")
    } catch (e) {}
    console.log.apply(console, ["[relay]"].concat(e))
}
try {
    var mode = fs.statSync(FFMPEG).mode;
    mode & parseInt("111", 8) || fs.chmodSync(FFMPEG, parseInt("755", 8))
} catch (e) {
    log("no se pudo aplicar permiso de ejecucion a ffmpeg:", e.message)
}

function stopCurrent() {
    if (current) {
        try {
            current.ff.kill("SIGKILL")
        } catch (e) {}
        current = null
    }
}

function splitHeaders(e) {
    var r = null,
        t = [];
    return Object.keys(e || {}).forEach(function(o) {
        "user-agent" === o.toLowerCase() ? r = e[o] : t.push(o + ": " + e[o] + "\r\n")
    }), {
        ua: r,
        rest: t.join("")
    }
}

function register(e, r) {
    r = r || {};
    var t = crypto.randomBytes(8).toString("hex");
    return sessions[t] = {
        url: e.url,
        headers: e.headers || {},
        audio: r.audio || 0,
        hevc: !!r.hevc,
        duration: 0,
        probing: !1
    }, "http://" + HOST + ":" + PORT + "/s/" + t + ".mp4"
}

function probeDuration(session) {
    if (!session || session.duration > 0 || session.probing) return;
    session.probing = !0;
    resolveForFfmpeg(session, function(input) {
        var h = splitHeaders(input.headers),
            args = ["-hide_banner", "-loglevel", "info", "-nostdin"];
        /^https?:\/\//i.test(input.url) && (args.push("-rw_timeout", "15000000"), h.ua && args.push("-user_agent", h.ua), h.rest && args.push("-headers", h.rest)), args.push("-i", input.url);
        var ff = spawn(FFMPEG, args, {
                stdio: ["ignore", "ignore", "pipe"]
            }),
            text = "",
            done = !1;

        function finish() {
            done || (done = !0, session.probing = !1, function() {
                try {
                    ff.kill("SIGKILL")
                } catch (e) {}
            }())
        }
        ff.stderr.on("data", function(chunk) {
            text += String(chunk);
            var match = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(text);
            match && (session.duration = 3600 * parseInt(match[1], 10) + 60 * parseInt(match[2], 10) + parseFloat(match[3]), finish())
        }), ff.on("error", function() {
            session.probing = !1
        }), ff.on("close", function() {
            session.probing = !1
        }), setTimeout(finish, 15e3)
    })
}

function buildArgs(e, r, t) {
    var o = splitHeaders(e.headers),
        n = ["-hide_banner", "-loglevel", "warning", "-nostdin", "-probesize", "2M", "-analyzeduration", "2M"];
    return /^https?:\/\//i.test(e.url) && (n.push("-rw_timeout", "15000000"), o.ua && n.push("-user_agent", o.ua), o.rest && n.push("-headers", o.rest)), r > 0 && n.push("-ss", String(r)), n.push("-i", e.url, "-map", "0:v:0", "-map", "0:a:" + t + "?", "-c", "copy"), e.hevc && n.push("-tag:v", "hvc1"), n.push("-bsf:a", "aac_adtstoasc", "-movflags", "frag_keyframe+empty_moov+default_base_moof", "-f", "mp4", "pipe:1"), n
}

function resolveForFfmpeg(e, r) {
    var t, o = urlmod.parse(e.url || "");
    if ("http:" !== o.protocol || !o.hostname || /^\d+\.\d+\.\d+\.\d+$/.test(o.hostname)) return r(e);
    try {
        t = spawn("/usr/bin/getent", ["ahostsv4", o.hostname])
    } catch (t) {
        return r(e)
    }
    var n = "";
    t.stdout.on("data", function(e) {
        n += String(e)
    }), t.on("error", function() {
        r(e)
    }), t.on("close", function() {
        var t = /\b(\d{1,3}(?:\.\d{1,3}){3})\b/.exec(n);
        if (!t) return log("DNS nativo no devolvio IPv4; se usa hostname"), r(e);
        var s = {};
        Object.keys(e.headers || {}).forEach(function(r) {
            "host" !== r.toLowerCase() && (s[r] = e.headers[r])
        }), s.Host = o.host, o.hostname = t[1], o.host = t[1] + (o.port ? ":" + o.port : ""), o.href = null, log("CDN resuelto por webOS para ffmpeg"), r({
            url: urlmod.format(o),
            headers: s,
            audio: e.audio,
            hevc: e.hevc
        })
    })
}
var server = http.createServer(function(e, r) {
    var t = urlmod.parse(e.url, !0);
    if ("OPTIONS" === e.method) return r.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "*"
    }), r.end();
    if ("/abort" === t.pathname || "/media/abort" === t.pathname) return stopCurrent(), r.writeHead(200, {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*"
    }), r.end("aborted");
    var durationMatch = /^\/duration\/([0-9a-f]+)$/.exec(t.pathname || "");
    if (durationMatch) {
        var durationSession = sessions[durationMatch[1]];
        durationSession && !durationSession.duration && probeDuration(durationSession);
        var body = JSON.stringify({
            duration: durationSession ? durationSession.duration : 0
        });
        return r.writeHead(200, {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Length": Buffer.byteLength(body),
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store"
        }), r.end(body)
    }
    var o = /^\/s\/([0-9a-f]+)\.mp4$/.exec(t.pathname || ""),
        n = o && sessions[o[1]];
    if (!n) return r.writeHead(404, {
        "Access-Control-Allow-Origin": "*"
    }), r.end();
    if ("HEAD" === e.method) return r.writeHead(200, {
        "Content-Type": "video/mp4",
        "Accept-Ranges": "none",
        "Access-Control-Allow-Origin": "*"
    }), r.end();
    var s = Math.max(0, Number(t.query.start) || 0),
        a = Number(null != t.query.a ? t.query.a : n.audio) || 0;
    stopCurrent(), resolveForFfmpeg(n, function(e) {
        var t = spawn(FFMPEG, buildArgs(e, s, a), {
            stdio: ["ignore", "pipe", "pipe"]
        });
        current = {
            ff: t
        };
        var o = !1;
        t.on("error", function(e) {
            log("no se pudo lanzar ffmpeg:", e.message), o || (r.writeHead(500, {
                "Access-Control-Allow-Origin": "*"
            }), o = !0), r.end()
        }), t.stderr.on("data", function(e) {
            var text = String(e),
                match = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(text);
            match && (n.duration = 3600 * parseInt(match[1], 10) + 60 * parseInt(match[2], 10) + parseFloat(match[3])), log("ffmpeg:", text.trim())
        }), t.stdout.on("data", function(e) {
            o || (r.writeHead(200, {
                "Content-Type": "video/mp4",
                "Accept-Ranges": "none",
                "Cache-Control": "no-cache",
                Connection: "close",
                "Access-Control-Allow-Origin": "*"
            }), o = !0), r.write(e) || (t.stdout.pause(), r.once("drain", function() {
                t.stdout.resume()
            }))
        }), t.on("close", function(e) {
            current && current.ff === t && (current = null), o || (r.writeHead(502, {
                "Access-Control-Allow-Origin": "*"
            }), o = !0), r.end(), e && log("ffmpeg termino con codigo", e)
        }), r.on("close", function() {
            try {
                t.kill("SIGKILL")
            } catch (e) {}
        })
    })
});
server.on("error", function(e) {
    log("error del servidor:", e.message)
}), server.listen(PORT, HOST, function() {
    log("escuchando en", HOST + ":" + PORT)
}), module.exports = {
    register: register,
    stop: stopCurrent,
    available: function() {
        try {
            return fs.accessSync(FFMPEG, fs.constants && fs.constants.X_OK || fs.X_OK || 1), !0
        } catch (e) {
            return !1
        }
    },
    path: function() {
        return FFMPEG
    },
    port: function() {
        return PORT
    }
};