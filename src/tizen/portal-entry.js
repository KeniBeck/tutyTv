import "./buffer-shim.js";
import magis from "../webos/service/magis.js";

var LIVE_USER_AGENT =
  "Mozilla/5.0 (SmartHub; SMART-TV; U; Linux/SmartTV) AppleWebKit/538.1+ (KHTML, like Gecko) Safari/538.1+";

function isTizen() {
  try {
    var ua = String((typeof navigator !== "undefined" && navigator.userAgent) || "");
    return /Tizen|SMART-TV/i.test(ua) || Boolean(typeof window !== "undefined" && window.webapis);
  } catch {
    return false;
  }
}

function stringError(error) {
  if (!error) return null;
  if (typeof error === "string") return error;
  if (error.message) return String(error.message);
  return String(error);
}

function decorateVod(info) {
  if (!info || typeof info !== "object") return info;
  var url = String(info.url || "");
  var mime = String(info.mime || "");
  var isMp4 = /video\/mp4/i.test(mime) || /\.mp4(?:\?|$)/i.test(url);
  var isManifest = /mpegurl|m3u8/i.test(mime) || /\.m3u8(?:\?|$)/i.test(url);
  info.proxyPath = info.proxyPath || url;
  if (isMp4) {
    info.isHls = false;
    info.mime = "video/mp4";
  } else if (isManifest) {
    info.isHls = true;
    info.mime = "application/vnd.apple.mpegurl";
  } else {
    info.isHls = false;
  }
  return info;
}

function decorateLive(info) {
  if (!info || typeof info !== "object") return info;
  info.proxyPath = info.proxyPath || info.url;
  info.isHls = true;
  info.mime = "application/vnd.apple.mpegurl";
  return info;
}

function liveFromUrl(streamUrl) {
  var url = String(streamUrl);
  var isManifest = /\.m3u8(?:\?|$)/i.test(url);
  return {
    url: url,
    proxyPath: url,
    isHls: isManifest,
    mime: isManifest ? "application/vnd.apple.mpegurl" : "",
    headers: isManifest
      ? { "User-Agent": LIVE_USER_AGENT, Accept: "*/*" }
      : {},
    returnValue: true
  };
}

function request(method, params, done) {
  params = params || {};
  var finished = false;

  function finish(error, response) {
    if (finished) return;
    finished = true;
    done(error, response);
  }

  function callback(error, response) {
    if (error) {
      finish(stringError(error), null);
      return;
    }
    finish(null, response);
  }

  try {
    switch (method) {
      case "ping":
      case "heartbeat":
      case "keepAlive":
        finish(null, {
          service: "tuty-portal",
          version: "1.0.0",
          relayAvailable: false,
          nativeHls: true,
          alive: true,
          timestamp: Date.now()
        });
        return true;
      case "home":
        magis.home(params.root || "movies", callback);
        return true;
      case "search":
        magis.search(params.value || "", callback);
        return true;
      case "detail":
        magis.detail(params.contentId, callback);
        return true;
      case "liveCategories":
        magis.getLiveCategories(callback);
        return true;
      case "liveChannels":
        magis.getLiveChannels(
          params.columnId,
          params.pageNum,
          params.pageSize,
          function onChannels(error, channels, hasMore) {
            if (error) {
              finish(stringError(error), null);
              return;
            }
            finish(null, {
              channels: channels || [],
              pageNum: Math.max(1, parseInt(params.pageNum, 10) || 1),
              hasMore: Boolean(hasMore)
            });
          }
        );
        return true;
      case "fetchM3u":
        magis.fetchM3u(params.url, function onM3u(error, channels) {
          if (error) {
            finish(stringError(error), null);
            return;
          }
          finish(null, { channels: channels || [] });
        });
        return true;
      case "resolve":
      case "resolveSmooth":
        magis.resolve(
          params.contentId,
          params.seriesContentId,
          { trackIndex: parseInt(params.trackIndex, 10) || 0 },
          function onVod(error, info) {
            if (error) {
              finish(stringError(error), null);
              return;
            }
            finish(null, decorateVod(info));
          }
        );
        return true;
      case "mediaInfo":
        magis.mediaInfo(
          params.contentId,
          params.seriesContentId,
          function onMediaInfo(error, info) {
            if (error) {
              finish(stringError(error), null);
              return;
            }
            finish(null, decorateVod(info));
          }
        );
        return true;
      case "resolveLive":
        if (params.streamUrl) {
          finish(null, liveFromUrl(params.streamUrl));
          return true;
        }
        if (!params.channelCode) {
          finish("channelCode requerido", null);
          return true;
        }
        magis.resolveLive(params.channelCode, function onLive(error, info) {
          if (error) {
            finish(stringError(error), null);
            return;
          }
          finish(null, decorateLive(info));
        });
        return true;
      case "abortMedia":
        finish(null, {});
        return true;
      case "prewarm":
        magis.ensureSession(function onSession(error) {
          if (error) {
            finish(stringError(error), null);
            return;
          }
          finish(null, {});
        });
        return true;
      default:
        finish("Método desconocido: " + method, null);
        return true;
    }
  } catch (error) {
    finish(stringError(error), null);
    return true;
  }
}

if (isTizen()) {
  window.TutyPortal = magis;
  window.TutyPortalBridge = { request: request };
}

export { magis, request };
