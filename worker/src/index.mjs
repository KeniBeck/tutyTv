"use strict";

import magis from "../../src/webos/service/magis.js";
import hls from "./hls.js";

var API = new Set([
  "ping",
  "keepAlive",
  "heartbeat",
  "home",
  "search",
  "detail",
  "liveChannels",
  "liveCategories",
  "fetchM3u",
  "resolve",
  "resolveSmooth",
  "mediaInfo",
  "resolveLive",
  "abortMedia",
  "prewarm"
]);

var LIVE_USER_AGENT = "Mozilla/5.0 (SmartHub; SMART-TV; U; Linux/SmartTV) AppleWebKit/538.1+ (KHTML, like Gecko) Safari/538.1+";

function fromCallback(invoke) {
  return new Promise(function (resolve, reject) {
    invoke(function (error, data) {
      if (error) reject(error);
      else resolve(data);
    });
  });
}

function proxySubtitles(info, origin) {
  if (info && Array.isArray(info.subtitles) && info.subtitles.length) {
    info.subtitles = info.subtitles.map(function (subtitle) {
      return {
        lang: subtitle.lang,
        format: subtitle.format,
        url: origin + "/sub/" + hls.encodeToken({ u: subtitle.url }) + ".srt"
      };
    });
  }
  return info;
}

async function decorateVod(info, origin) {
  var headers = info.headers || {};
  var token = hls.encodeToken({ u: info.url, h: headers });
  var sourceUrl = info.url || "";
  var isMp4 = /video\/mp4/i.test(info.mime || "") || /\.mp4(?:\?|$)/i.test(sourceUrl);
  var isManifest = /mpegurl|m3u8/i.test(info.mime || "") || /\.m3u8(?:\?|$)/i.test(sourceUrl);

  if (isMp4) {
    info.proxyPath = origin + "/hls/" + token + "/stream.mp4";
    info.isHls = false;
    info.mime = "video/mp4";
  } else if (isManifest) {
    info.proxyPath = origin + "/hls/" + token + "/live.m3u8";
    info.isHls = true;
    info.mime = "application/vnd.apple.mpegurl";
  } else {
    try {
      var probe = await hls.probeVod(info.url, headers);
      if (probe.duration > 0) info.duration = probe.duration;
    } catch (error) {
      /* keep going: the playlist handler can still fall back to a single segment */
    }
    info.proxyPath = origin + "/hls/" + token + "/stream.m3u8";
    info.isHls = true;
    info.mime = "application/vnd.apple.mpegurl";
  }

  return proxySubtitles(info, origin);
}

async function resolveVod(params, origin) {
  var requested = parseInt(params.trackIndex, 10);
  var trackIndex = isNaN(requested) ? 0 : requested;
  var info = await fromCallback(function (callback) {
    magis.resolve(params.contentId, params.seriesContentId, { trackIndex: trackIndex }, callback);
  });
  return decorateVod(info, origin);
}

async function resolveLive(params, origin) {
  if (params.streamUrl) {
    var streamUrl = params.streamUrl;
    if (!/\.m3u8(?:\?|$)/i.test(streamUrl)) {
      return { url: streamUrl, proxyPath: streamUrl, isHls: false };
    }
    var token = hls.encodeToken({
      u: streamUrl,
      h: { "User-Agent": LIVE_USER_AGENT, Accept: "*/*" }
    });
    return {
      url: streamUrl,
      proxyPath: origin + "/hls/" + token + "/live.m3u8",
      isHls: true,
      mime: "application/vnd.apple.mpegurl"
    };
  }
  if (!params.channelCode) throw new Error("channelCode requerido");
  var info = await fromCallback(function (callback) {
    magis.resolveLive(params.channelCode, callback);
  });
  var liveToken = hls.encodeToken({
    u: info.url,
    h: info.headers || {},
    code: params.channelCode
  });
  info.proxyPath = origin + "/hls/" + liveToken + "/live.m3u8";
  info.isHls = true;
  info.mime = "application/vnd.apple.mpegurl";
  return info;
}

async function handleApi(method, params, origin) {
  switch (method) {
    case "ping":
      return {
        service: "tuty-worker",
        version: "1.0.0",
        relayAvailable: false,
        nativeHls: true,
        timestamp: Date.now()
      };
    case "keepAlive":
    case "heartbeat":
      return { alive: true, timestamp: Date.now() };
    case "home":
      return await fromCallback(function (callback) {
        magis.home(params.root || "movies", callback);
      });
    case "search":
      return await fromCallback(function (callback) {
        magis.search(params.value || "", callback);
      });
    case "detail":
      return await fromCallback(function (callback) {
        magis.detail(params.contentId, callback);
      });
    case "liveChannels":
      return await new Promise(function (resolve, reject) {
        magis.getLiveChannels(params.columnId, params.pageNum, params.pageSize, function (error, channels, hasMore) {
          if (error) return reject(error);
          resolve({
            channels: channels || [],
            pageNum: Math.max(1, parseInt(params.pageNum, 10) || 1),
            hasMore: !!hasMore
          });
        });
      });
    case "liveCategories":
      return await new Promise(function (resolve, reject) {
        magis.getLiveCategories(function (error, categories) {
          if (error) return reject(error);
          resolve({ categories: categories || [] });
        });
      });
    case "fetchM3u":
      if (!params.url) throw new Error("url requerida");
      return await new Promise(function (resolve, reject) {
        magis.fetchM3u(params.url, function (error, channels) {
          if (error) return reject(error);
          resolve({ channels: channels || [] });
        });
      });
    case "resolve":
    case "resolveSmooth":
      return await resolveVod(params, origin);
    case "mediaInfo": {
      var info = await fromCallback(function (callback) {
        magis.mediaInfo(params.contentId, params.seriesContentId, callback);
      });
      return proxySubtitles(info, origin);
    }
    case "resolveLive":
      return await resolveLive(params, origin);
    case "abortMedia":
      return {};
    case "prewarm":
      return await fromCallback(function (callback) {
        magis.ensureSession(callback);
      });
    default:
      throw new Error("método desconocido: " + method);
  }
}

async function handleRequest(request) {
  var url = new URL(request.url);
  var origin = url.origin;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: hls.corsHeaders() });
  }

  var path = url.pathname;
  var route = /^\/hls\/([A-Za-z0-9_-]+)\/(stream\.m3u8|stream\.ts|stream\.mp4|live\.m3u8|live)$/.exec(path);
  if (route) {
    var token = route[1];
    var action = route[2];
    var payload;
    try {
      payload = hls.decodeToken(token);
    } catch (error) {
      return hls.textResponse("token inválido", "text/plain", 400);
    }
    var target = payload.u;
    var headers = payload.h || {};
    try {
      if (action === "stream.m3u8") return await hls.handleVodManifest(target, headers, origin, token);
      if (action === "stream.ts") return await hls.handleVodSegment(target, headers, request, url.searchParams);
      if (action === "stream.mp4") return await hls.handleMp4Segment(target, headers, request);
      if (action === "live.m3u8") {
        return await hls.handleLiveManifest(target, headers, origin, token, async function () {
          if (!payload.code) return null;
          return await fromCallback(function (callback) {
            magis.resolveLive(payload.code, callback);
          });
        });
      }
      var child = url.searchParams.get("u");
      if (!child) return hls.textResponse("u requerida", "text/plain", 400);
      var childUrl = hls.decodeToken(child).u;
      return await hls.handleLiveChild(target, headers, childUrl, request, origin, token);
    } catch (error) {
      return hls.textResponse("error hls: " + (error.message || error), "text/plain", 502);
    }
  }

  var subtitle = /^\/sub\/([A-Za-z0-9_-]+?)(?:\.srt)?$/.exec(path);
  if (subtitle) {
    try {
      return await hls.handleSubtitle(hls.decodeToken(subtitle[1]).u);
    } catch (error) {
      return hls.textResponse("token inválido", "text/plain", 400);
    }
  }

  if (path === "/" || path === "") {
    return hls.jsonResponse({
      service: "tuty-worker",
      version: "1.0.0",
      message: "TutyTV Worker activo",
      timestamp: Date.now()
    });
  }

  var method = path.replace(/^\/+/, "");
  if (!API.has(method)) {
    return hls.textResponse("not found", "text/plain", 404);
  }

  var params = {};
  url.searchParams.forEach(function (value, key) {
    params[key] = value;
  });

  try {
    var data = await handleApi(method, params, origin);
    if (data && typeof data === "object" && !("returnValue" in data)) data.returnValue = true;
    return hls.jsonResponse(data);
  } catch (error) {
    return hls.jsonResponse({
      returnValue: false,
      errorText: error && error.message ? error.message : String(error)
    });
  }
}

export default {
  fetch: handleRequest
};
