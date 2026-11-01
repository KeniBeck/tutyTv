#!/usr/bin/env node
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const APP_DIR = path.join(ROOT, "usr/palm/applications/com.webosflux.xuptertv.fidelity");
const SERVICE_DIR = path.join(ROOT, "usr/palm/services/com.webosflux.xuptertv.fidelity.service");
const HLS_FILE = path.join(__dirname, "hls.min.js");

const magis = require(path.join(SERVICE_DIR, "magis.js"));
const proxy = require(path.join(SERVICE_DIR, "proxy.js"));
const webRelay = require(path.join(__dirname, "ffmpeg-web.js"));

const VERSION = "1.6.5";
const BUILD = "1.6.5-r12";
const args = process.argv.slice(2).filter(function (x) { return x.indexOf("--") !== 0; });
const PORT = Math.max(1, parseInt(args[0] || process.env.PORT || "8910", 10) || 8910);
const HOST = process.env.HOST || "127.0.0.1";
const OPEN = process.env.XUPER_NO_OPEN !== "1" && process.argv.indexOf("--no-open") < 0;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".otf": "font/otf",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".m3u8": "application/vnd.apple.mpegurl",
  ".ts": "video/mp2t",
  ".srt": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

function json(res, obj, status) {
  const body = JSON.stringify(obj);
  res.writeHead(status || 200, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function respond(res, data) {
  if (!data || typeof data !== "object") data = {};
  if (!Object.prototype.hasOwnProperty.call(data, "returnValue")) data.returnValue = true;
  json(res, data);
}

function fail(res, err) {
  json(res, {
    returnValue: false,
    errorText: err && err.message ? err.message : String(err || "error")
  });
}

function sendFile(res, file, type) {
  fs.stat(file, function (err, st) {
    if (err || !st.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("not found");
    }
    res.writeHead(200, {
      "Content-Type": type || MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Content-Length": st.size,
      "Cache-Control": "no-store, no-cache, must-revalidate"
    });
    fs.createReadStream(file).pipe(res);
  });
}

function attachSubtitles(info) {
  if (info && info.subtitles && info.subtitles.length) {
    info.subtitles = info.subtitles.map(function (s) {
      return { lang: s.lang, format: s.format, url: proxy.addSubtitle(s.url) };
    });
  }
  return info;
}

function proxyAdd(info, forceHls) {
  const isMp4 = !forceHls && (/video\/mp4/i.test(info.mime || "") || /\.mp4(?:\?|$)/i.test(info.url || ""));
  const token = proxy.add(info.url, info.headers, info.duration);
  info.proxyPath = proxy.baseUrl() + "/media/" + token + "/" + (isMp4 ? "stream.mp4" : "stream.m3u8");
  info.isHls = !isMp4;
  return attachSubtitles(info);
}

function resolveVod(params, res) {
  const requested = parseInt(params.trackIndex, 10);
  const autoTrack = !params.trackIndex || params.trackIndex === "0" || isNaN(requested);

  function doResolve(trackIndex) {
    magis.resolve(params.contentId, params.seriesContentId, { trackIndex: trackIndex }, function (err, info) {
      if (err) return fail(res, err);
      if (/hevc|h\.?265/i.test(info.codec || "")) {
        if (!webRelay.available()) {
          return fail(res, new Error("Este título es H.265/HEVC y el navegador no puede reproducirlo. Instala ffmpeg para activar la transcodificación."));
        }
        info.proxyPath = webRelay.register(info, { audio: parseInt(params.audioTrack, 10) || 0 });
        info.mime = "video/mp4";
        info.codec = "H264";
        if (info.selectedTrack) info.selectedTrack.codec = "H264";
        info.isHls = false;
        info.isRelay = true;
        return respond(res, attachSubtitles(info));
      }
      proxy.start(function (err2) {
        if (err2) return fail(res, err2);
        respond(res, proxyAdd(info, false));
      });
    });
  }

  if (!autoTrack) return doResolve(requested);
  magis.mediaInfo(params.contentId, params.seriesContentId, function (err, info) {
    if (err || !info || !info.tracks || !info.tracks.length) return doResolve(0);
    let chosen = 0;
    for (let i = 0; i < info.tracks.length; i++) {
      const codec = String(info.tracks[i].codec || "").toUpperCase();
      if (/H\.?264|AVC/.test(codec)) { chosen = i; break; }
    }
    doResolve(chosen);
  });
}

function resolveLive(params, res) {
  if (params.streamUrl) {
    const isHls = /\.m3u8(?:\?|$)/i.test(params.streamUrl);
    if (!isHls) return respond(res, { url: params.streamUrl, proxyPath: params.streamUrl, isHls: false });
    return proxy.start(function (err) {
      if (err) return fail(res, err);
      respond(res, proxyAdd({ url: params.streamUrl, headers: {}, duration: 0 }, true));
    });
  }
  if (!params.channelCode) return fail(res, new Error("channelCode requerido"));
  magis.resolveLive(params.channelCode, function (err, info) {
    if (err) return fail(res, err);
    proxy.start(function (err2) {
      if (err2) return fail(res, err2);
      respond(res, proxyAdd(info, true));
    });
  });
}

function mediaInfo(params, res) {
  magis.mediaInfo(params.contentId, params.seriesContentId, function (err, info) {
    if (err) return fail(res, err);
    proxy.start(function (err2) {
      if (err2) return fail(res, err2);
      respond(res, attachSubtitles(info));
    });
  });
}

function handleApi(method, q, res) {
  switch (method) {
    case "ping":
      return respond(res, {
        service: "xuper-web",
        version: VERSION,
        proxyPort: proxy.port(),
        relayAvailable: webRelay.available(),
        relayPort: webRelay.port()
      });
    case "keepAlive":
    case "heartbeat":
      return respond(res, { alive: true, timestamp: Date.now() });
    case "home":
      return magis.home(q.root || "movies", function (err, data) {
        if (err) return fail(res, err);
        return respond(res, data);
      });
    case "search":
      return magis.search(q.value || "", function (err, data) {
        if (err) return fail(res, err);
        return respond(res, data);
      });
    case "detail":
      return magis.detail(q.contentId, function (err, data) {
        if (err) return fail(res, err);
        return respond(res, data);
      });
    case "liveChannels":
      return magis.getLiveChannels(q.columnId, q.pageNum, q.pageSize, function (err, channels, hasMore) {
        if (err) return fail(res, err);
        return respond(res, {
          channels: channels || [],
          pageNum: Math.max(1, parseInt(q.pageNum, 10) || 1),
          hasMore: !!hasMore
        });
      });
    case "liveCategories":
      return magis.getLiveCategories(function (err, categories) {
        if (err) return fail(res, err);
        return respond(res, { categories: categories || [] });
      });
    case "fetchM3u":
      if (!q.url) return fail(res, new Error("url requerida"));
      return magis.fetchM3u(q.url, function (err, channels) {
        if (err) return fail(res, err);
        return respond(res, { channels: channels || [] });
      });
    case "resolve":
    case "resolveSmooth":
      return resolveVod(q, res);
    case "mediaInfo":
      return mediaInfo(q, res);
    case "resolveLive":
      return resolveLive(q, res);
    case "abortMedia":
      try { proxy.killActiveStreams(); } catch (e) {}
      try { webRelay.stop(); } catch (e) {}
      return respond(res, {});
    case "prewarm":
      return magis.ensureSession(function (err) {
        if (err) return fail(res, err);
        return respond(res, {});
      });
    default:
      return fail(res, new Error("método desconocido: " + method));
  }
}

function serveIndex(res) {
  fs.readFile(path.join(APP_DIR, "index.html"), "utf8", function (err, html) {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("index.html no encontrado");
    }
    const inject = [
      '<style>html,body{cursor:default !important}.focusable{cursor:pointer}</style>',
      '<script>window.XUPERTV_WEB=true;window.XUPERTV_WEB_BUILD="' + BUILD + '";console.log("[XuperTV Web] build " + window.XUPERTV_WEB_BUILD);</script>',
      '<script src="/hls.min.js?v=' + BUILD + '"></script>',
      '<script>window.XUPERTV_API&&(window.XUPERTV_API.devServiceUrl=location.origin);</script>',
      '<script src="js/app.js?v=' + BUILD + '"></script>'
    ].join("\n");
    html = html.replace('href="css/style.css"', 'href="css/style.css?v=' + BUILD + '"');
    html = html.replace('<script src="js/app.js"></script>', inject);
    const body = Buffer.from(html, "utf8");
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Length": body.length,
      "Cache-Control": "no-store"
    });
    res.end(body);
  });
}

function serveStatic(pathname, res) {
  if (pathname === "/" || pathname === "/index.html") return serveIndex(res);
  if (pathname === "/hls.min.js") return sendFile(res, HLS_FILE, "application/javascript; charset=utf-8");
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch (e) { decoded = pathname; }
  const file = path.normalize(path.join(APP_DIR, decoded));
  if (file !== APP_DIR && file.indexOf(APP_DIR + path.sep) !== 0) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("forbidden");
  }
  return sendFile(res, file);
}

const server = http.createServer(function (req, res) {
  const parsed = new URL(req.url, "http://" + HOST + ":" + PORT);
  const pathname = parsed.pathname || "/";
  const method = pathname.replace(/^\/+/, "");
  if (!method || method.indexOf(".") >= 0 || pathname === "/") {
    return serveStatic(pathname, res);
  }
  const query = {};
  parsed.searchParams.forEach(function (value, key) {
    query[key] = value;
  });
  handleApi(method, query, res);
});

server.on("error", function (err) {
  console.error("\n  Error del servidor: " + err.message);
  process.exit(1);
});

server.listen(PORT, HOST, function () {
  const shownHost = HOST === "0.0.0.0" ? "localhost" : HOST;
  const link = "http://" + shownHost + ":" + PORT + "/";
  console.log("");
  console.log("   ================================================================");
  console.log("      XuperTV  Web  " + VERSION);
  console.log("   ================================================================");
  console.log("");
  console.log("   Abre en tu navegador:  " + link);
  console.log("");
  if (webRelay.available()) {
    console.log("   ffmpeg: OK (H.265 se transcode a H.264 para el navegador)");
  } else {
    console.log("   Aviso: ffmpeg no encontrado. Los títulos H.265 no se verán.");
    console.log("          En Arch: sudo pacman -S ffmpeg");
  }
  console.log("");
  console.log("   Ctrl+C para detener.");
  console.log("");
  if (OPEN) {
    let child = null;
    try {
      if (process.platform === "win32") child = spawn("cmd", ["/c", "start", "", link], { detached: true, stdio: "ignore" });
      else if (process.platform === "darwin") child = spawn("open", [link], { detached: true, stdio: "ignore" });
      else child = spawn("xdg-open", [link], { detached: true, stdio: "ignore" });
    } catch (e) {}
    if (child) {
      child.on("error", function () {});
      child.unref();
    }
  }
});

process.on("SIGINT", function () {
  console.log("\n   Cerrando XuperTV Web...");
  process.exit(0);
});
