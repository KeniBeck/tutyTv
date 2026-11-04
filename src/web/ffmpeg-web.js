"use strict";

// Relay de transcodificacion para la version web.
// El portal entrega VOD en H.265/HEVC y la mayoria de navegadores de
// escritorio no lo decodifican. Este servidor usa el ffmpeg del sistema para
// convertir a H.264/AAC y entregar un MP4 fragmentado que el <video> pueda
// reproducir. Solo lo usa la version web; la TV sigue con HLS nativo.

const http = require("http");
const crypto = require("crypto");
const { spawn, spawnSync } = require("child_process");

const FFMPEG = process.env.FFMPEG || "ffmpeg";
const HOST = "127.0.0.1";
const PORT = Math.max(1, parseInt(process.env.NEXTFFMPEG_PORT || "8787", 10) || 8787);
const sessions = {};
let lastKey = "";
const active = [];
let server = null;

function available() {
  try {
    const r = spawnSync(FFMPEG, ["-version"], { stdio: "ignore" });
    return !r.error && r.status === 0;
  } catch (e) {
    return false;
  }
}

function stopAll() {
  while (active.length) {
    const entry = active.shift();
    try { entry.ff.kill("SIGKILL"); } catch (e) {}
  }
  lastKey = "";
}

function splitHeaders(headers) {
  let ua = "";
  const rest = [];
  Object.keys(headers || {}).forEach(function (key) {
    const value = headers[key];
    if (String(key).toLowerCase() === "user-agent") ua = value;
    else rest.push(key + ": " + value + "\r\n");
  });
  return { ua: ua, rest: rest.join("") };
}

function register(info, opts) {
  opts = opts || {};
  const token = crypto.randomBytes(8).toString("hex");
  sessions[token] = {
    url: info.url,
    headers: info.headers || {},
    audio: opts.audio || 0,
    duration: 0
  };
  while (Object.keys(sessions).length > 12) {
    const first = Object.keys(sessions)[0];
    delete sessions[first];
  }
  return "http://" + HOST + ":" + PORT + "/s/" + token + ".mp4";
}

function probeDuration(session) {
  if (!session || session.duration > 0 || session.probing) return;
  session.probing = true;
  const h = splitHeaders(session.headers);
  const args = ["-hide_banner", "-loglevel", "info", "-nostdin"];
  if (/^https?:\/\//i.test(session.url)) {
    args.push("-rw_timeout", "15000000");
    if (h.ua) args.push("-user_agent", h.ua);
    if (h.rest) args.push("-headers", h.rest);
  }
  args.push("-i", session.url);
  const ff = spawn(FFMPEG, args, { stdio: ["ignore", "ignore", "pipe"] });
  let text = "";
  const finish = function () {
    session.probing = false;
    try { ff.kill("SIGKILL"); } catch (e) {}
  };
  ff.stderr.on("data", function (chunk) {
    text += String(chunk);
    const match = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(text);
    if (match) {
      session.duration = 3600 * parseInt(match[1], 10) + 60 * parseInt(match[2], 10) + parseFloat(match[3]);
      finish();
    }
  });
  ff.on("error", function () { session.probing = false; });
  ff.on("close", function () { session.probing = false; });
  setTimeout(finish, 15000);
}

function buildArgs(info, start, audio) {  const h = splitHeaders(info.headers);
  const args = [
    "-hide_banner", "-loglevel", "warning", "-nostdin",
    "-err_detect", "ignore_err",
    "-probesize", "2M", "-analyzeduration", "2M"
  ];
  if (/^https?:\/\//i.test(info.url)) {
    args.push("-rw_timeout", "15000000");
    if (h.ua) args.push("-user_agent", h.ua);
    if (h.rest) args.push("-headers", h.rest);
  }
  if (start > 0) args.push("-ss", String(start));
  args.push("-i", info.url);
  args.push("-map", "0:v:0", "-map", "0:a:" + audio + "?");
  args.push(
    "-vf", "scale='min(1920,iw)':-2",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-tune", "zerolatency",
    "-crf", "23",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "128k",
    "-ac", "2",
    "-movflags", "frag_keyframe+empty_moov+default_base_moof",
    "-max_muxing_queue_size", "2048",
    "-f", "mp4",
    "pipe:1"
  );
  return args;
}

function handler(req, res) {
  const parsed = new URL(req.url, "http://" + HOST + ":" + PORT);
  if (req.method === "OPTIONS") {
    res.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*"
    });
    return res.end();
  }
  if (parsed.pathname === "/abort" || parsed.pathname === "/media/abort") {
    stopAll();
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Access-Control-Allow-Origin": "*" });
    return res.end("aborted");
  }
  const durationMatch = /^\/duration\/([0-9a-f]+)$/.exec(parsed.pathname || "");
  if (durationMatch) {
    const data = sessions[durationMatch[1]];
    if (data && !data.duration) probeDuration(data);
    const body = JSON.stringify({ duration: data ? data.duration : 0 });
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(body),
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    });
    return res.end(body);
  }
  const match = /^\/s\/([0-9a-f]+)\.mp4$/.exec(parsed.pathname || "");
  const session = match && sessions[match[1]];
  if (!session) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "Access-Control-Allow-Origin": "*" });
    return res.end("not found");
  }
  if (req.method === "HEAD") {
    res.writeHead(200, {
      "Content-Type": "video/mp4",
      "Accept-Ranges": "none",
      "Access-Control-Allow-Origin": "*"
    });
    return res.end();
  }

  const start = Math.max(0, Number(parsed.searchParams.get("start")) || 0);
  const audioParam = parsed.searchParams.get("a");
  const audio = Number(audioParam != null ? audioParam : session.audio) || 0;
  const key = match[1] + "|" + start + "|" + audio;
  if (lastKey && key !== lastKey) stopAll();
  lastKey = key;
  if (active.length >= 3) {
    const old = active.shift();
    try { old.ff.kill("SIGKILL"); } catch (e) {}
  }

  const ff = spawn(FFMPEG, buildArgs(session, start, audio), { stdio: ["ignore", "pipe", "pipe"] });
  const entry = { ff: ff };
  active.push(entry);
  let headersSent = false;

  ff.on("error", function (err) {
    console.error("[ffmpeg-web] no se pudo lanzar ffmpeg: " + err.message);
    if (!headersSent) {
      headersSent = true;
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8", "Access-Control-Allow-Origin": "*" });
    }
    res.end();
  });

  ff.stderr.on("data", function (chunk) {
    const text = String(chunk).trim();
    if (!text) return;
    const duration = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(text);
    if (duration) {
      session.duration = 3600 * parseInt(duration[1], 10) + 60 * parseInt(duration[2], 10) + parseFloat(duration[3]);
    }
    if (/Could not find ref with POC|Error constructing the frame RPS|Skipping invalid undecodable NALU|\[hevc @/i.test(text)) return;
    console.error("[ffmpeg-web] " + text);
  });

  ff.stdout.on("data", function (chunk) {
    if (!headersSent) {
      headersSent = true;
      res.writeHead(200, {
        "Content-Type": "video/mp4",
        "Accept-Ranges": "none",
        "Cache-Control": "no-cache",
        "Connection": "close",
        "Access-Control-Allow-Origin": "*"
      });
    }
    if (!res.write(chunk)) {
      ff.stdout.pause();
      res.once("drain", function () { ff.stdout.resume(); });
    }
  });

  ff.on("close", function (code) {
    const at = active.indexOf(entry);
    if (at >= 0) active.splice(at, 1);
    if (!headersSent) {
      headersSent = true;
      res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8", "Access-Control-Allow-Origin": "*" });
    }
    res.end();
    if (code) console.error("[ffmpeg-web] ffmpeg termino con codigo " + code);
  });

  req.on("close", function () {
    try { ff.kill("SIGKILL"); } catch (e) {}
    const at = active.indexOf(entry);
    if (at >= 0) active.splice(at, 1);
  });
}

function start() {
  if (server) return;
  server = http.createServer(handler);
  server.on("error", function (err) {
    console.error("[ffmpeg-web] error del servidor: " + err.message);
  });
  server.listen(PORT, HOST, function () {
    console.log("[ffmpeg-web] transcodificador escuchando en http://" + HOST + ":" + PORT);
  });
}

start();

module.exports = {
  register: register,
  stop: stopAll,
  available: available,
  port: function () { return PORT; }
};
