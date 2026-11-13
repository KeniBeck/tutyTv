"use strict";

var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "Content-Length,Content-Range,Accept-Ranges"
};

var vodCache = new Map();
var CACHE_TTL = 10 * 60 * 1000;

function encodeToken(value) {
  var json = JSON.stringify(value);
  var bytes = new TextEncoder().encode(json);
  var binary = "";
  for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeToken(token) {
  var normalized = String(token).replace(/-/g, "+").replace(/_/g, "/");
  var padding = normalized.length % 4 ? "=".repeat(4 - (normalized.length % 4)) : "";
  var binary = atob(normalized + padding);
  var bytes = new Uint8Array(binary.length);
  for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return JSON.parse(new TextDecoder().decode(bytes));
}

function corsHeaders(extra) {
  var headers = new Headers(CORS);
  if (extra) {
    Object.keys(extra).forEach(function (key) {
      if (extra[key] !== undefined && extra[key] !== null) headers.set(key, String(extra[key]));
    });
  }
  return headers;
}

function textResponse(body, type, status) {
  return new Response(body, {
    status: status || 200,
    headers: corsHeaders({
      "Content-Type": type || "text/plain; charset=utf-8",
      "Cache-Control": "no-store"
    })
  });
}

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: corsHeaders({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    })
  });
}

async function fetchRange(url, headers, start, end) {
  var range = { Range: "bytes=" + start + "-" + end };
  var response = await fetch(url, { headers: range });
  if (response.status === 401 || response.status === 403) {
    response = await fetch(url, { headers: Object.assign({}, headers || {}, range) });
  }
  if (response.status !== 200 && response.status !== 206) {
    throw new Error("origen HTTP " + response.status);
  }
  return await response.arrayBuffer();
}

async function probeLength(url, headers) {
  try {
    var head = await fetch(url, { method: "HEAD" });
    var headLength = parseInt(head.headers.get("content-length") || "0", 10);
    if (headLength > 0) return headLength;
    if (head.status === 401 || head.status === 403) {
      head = await fetch(url, { method: "HEAD", headers: headers || {} });
      headLength = parseInt(head.headers.get("content-length") || "0", 10);
      if (headLength > 0) return headLength;
    }
  } catch (error) {
    /* fall through */
  }
  var response = await fetch(url, { headers: { Range: "bytes=0-0" } });
  if (response.status === 401 || response.status === 403) {
    response = await fetch(url, {
      headers: Object.assign({}, headers || {}, { Range: "bytes=0-0" })
    });
  }
  var contentRange = response.headers.get("content-range") || "";
  var match = /\/(\d+)\s*$/.exec(contentRange);
  if (match) return parseInt(match[1], 10);
  var length = parseInt(response.headers.get("content-length") || "0", 10);
  return length > 0 ? length : 0;
}

function alignTs(buffer) {
  for (var i = 0; i < 188 && i + 376 < buffer.length; i++) {
    if (buffer[i] === 0x47 && buffer[i + 188] === 0x47 && buffer[i + 376] === 0x47) return i;
  }
  return 0;
}

function firstPts(buffer) {
  var base = alignTs(buffer);
  for (var i = base; i + 188 <= buffer.length; i += 188) {
    var pts = ptsInPacket(buffer, i);
    if (pts !== null) return pts;
  }
  return null;
}

function lastPts(buffer) {
  var found = null;
  var base = alignTs(buffer);
  for (var i = base; i + 188 <= buffer.length; i += 188) {
    var pts = ptsInPacket(buffer, i);
    if (pts !== null) found = pts;
  }
  return found;
}

function ptsInPacket(buffer, offset) {
  if (buffer[offset] !== 0x47) return null;
  if (!(buffer[offset + 1] & 0x40)) return null;
  var adaptation = (buffer[offset + 3] >> 4) & 0x03;
  var payload = offset + 4;
  if (adaptation === 2) return null;
  if (adaptation === 3) payload += 1 + buffer[offset + 4];
  if (payload + 14 > offset + 188) return null;
  if (buffer[payload] !== 0x00 || buffer[payload + 1] !== 0x00 || buffer[payload + 2] !== 0x01) return null;
  var streamId = buffer[payload + 3];
  if (streamId < 0xe0 || streamId > 0xef) return null;
  var flags = buffer[payload + 7];
  if ((flags & 0xc0) !== 0x80 && (flags & 0xc0) !== 0xc0) return null;
  var p = payload + 9;
  if (p + 5 > offset + 188) return null;
  return (
    (buffer[p] & 0x0e) * 536870912 +
    ((buffer[p + 1] & 0xff) << 22) +
    ((buffer[p + 2] & 0xfe) << 14) +
    ((buffer[p + 3] & 0xff) << 7) +
    ((buffer[p + 4] & 0xfe) >> 1)
  );
}

async function probeDuration(url, headers, length) {
  if (!length) return 0;
  var chunk = Math.min(512 * 1024, length);
  var first = Buffer.from(await fetchRange(url, headers, 0, chunk - 1));
  var lastStart = Math.max(0, length - chunk);
  var last = Buffer.from(await fetchRange(url, headers, lastStart, length - 1));
  var start = firstPts(first);
  var end = lastPts(last);
  if (start === null || end === null) return 0;
  var seconds = (end - start) / 90000;
  if (seconds < 0) seconds += 8589934592 / 90000;
  if (!(seconds > 0) || seconds > 172800) return 0;
  return seconds;
}

async function probeVod(url, headers) {
  var cached = vodCache.get(url);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached;
  var length = 0;
  var duration = 0;
  try {
    length = await probeLength(url, headers);
    if (length > 0) duration = await probeDuration(url, headers, length);
  } catch (error) {
    length = length || 0;
  }
  var result = { length: length, duration: duration, at: Date.now() };
  if (length > 0) vodCache.set(url, result);
  return result;
}

function buildVodPlaylist(length, duration) {
  var target = 10;
  var total = duration > 0 ? duration : length > 0 ? length / 200000 : 600;
  if (!(total > 0)) total = 600;
  var count = Math.max(1, Math.ceil(total / target));
  var segmentBytes = length > 0 ? Math.floor(length / count / 188) * 188 : 0;
  if (segmentBytes <= 0) {
    count = 1;
    segmentBytes = length;
  }
  var targetDuration = Math.ceil(Math.max(target, total / count));
  var lines = [
    "#EXTM3U",
    "#EXT-X-VERSION:4",
    "#EXT-X-PLAYLIST-TYPE:VOD",
    "#EXT-X-TARGETDURATION:" + targetDuration,
    "#EXT-X-MEDIA-SEQUENCE:0"
  ];
  var offset = 0;
  for (var i = 0; i < count; i++) {
    var end = i === count - 1 ? length - 1 : Math.min(length - 1, offset + segmentBytes - 1);
    var size = length > 0 ? end - offset + 1 : 0;
    var extinf = i === count - 1 ? Math.max(0.001, total - i * target) : target;
    lines.push("#EXTINF:" + extinf.toFixed(3) + ",");
    if (size > 0) lines.push("#EXT-X-BYTERANGE:" + size + "@" + offset);
    lines.push(size > 0 ? "stream.ts?from=" + offset + "&to=" + end : "stream.ts");
    offset = end + 1;
    if (length > 0 && offset >= length) break;
  }
  lines.push("#EXT-X-ENDLIST");
  return lines.join("\n") + "\n";
}

function upstreamHeaders(headers, extra) {
  var merged = {};
  Object.keys(headers || {}).forEach(function (key) {
    merged[key] = headers[key];
  });
  Object.keys(extra || {}).forEach(function (key) {
    merged[key] = extra[key];
  });
  return merged;
}

function responseHeadersFrom(upstream, fallbackType) {
  return corsHeaders({
    "Content-Type": upstream.headers.get("content-type") || fallbackType,
    "Content-Length": upstream.headers.get("content-length") || undefined,
    "Content-Range": upstream.headers.get("content-range") || undefined,
    "Accept-Ranges": upstream.headers.get("accept-ranges") || "bytes",
    "Cache-Control": "public, max-age=3600"
  });
}

async function proxyStream(url, headers, request, fallbackType, rangeOverride) {
  var range = rangeOverride || request.headers.get("Range");
  var rangeHeaders = range ? { Range: range } : {};
  var response = await fetch(url, { headers: rangeHeaders });
  if (response.status === 401 || response.status === 403) {
    response = await fetch(url, { headers: upstreamHeaders(headers, rangeHeaders) });
  }
  return new Response(response.body, {
    status: response.status,
    headers: responseHeadersFrom(response, fallbackType)
  });
}

function isManifest(url, contentType) {
  return /\.m3u8(?:\?|$)/i.test(url || "") || /mpegurl/i.test(contentType || "");
}

function rewriteChildUrl(value, base, origin, token) {
  var absolute;
  try {
    absolute = new URL(value, base).toString();
  } catch (error) {
    return value;
  }
  return origin + "/hls/" + token + "/live?u=" + encodeToken({ u: absolute });
}

function rewriteManifest(manifest, base, origin, token) {
  var output = [];
  var lines = String(manifest).split(/\r?\n/);
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line) {
      output.push(line);
      continue;
    }
    if (line.charAt(0) === "#") {
      output.push(
        line.replace(/URI="([^"]+)"/g, function (match, uri) {
          return 'URI="' + rewriteChildUrl(uri, base, origin, token) + '"';
        })
      );
    } else {
      output.push(rewriteChildUrl(line, base, origin, token));
    }
  }
  return output.join("\n");
}

async function handleVodManifest(url, headers, origin, token) {
  var probe = await probeVod(url, headers);
  return textResponse(buildVodPlaylist(probe.length, probe.duration), "application/vnd.apple.mpegurl");
}

async function handleVodSegment(url, headers, request, params) {
  var range = null;
  if (params && params.get) {
    var from = params.get("from");
    var to = params.get("to");
    if (from !== null && to !== null) range = "bytes=" + from + "-" + to;
  }
  return proxyStream(url, headers, request, "video/mp2t", range);
}

async function handleMp4Segment(url, headers, request) {
  return proxyStream(url, headers, request, "video/mp4");
}

async function handleLiveManifest(url, headers, origin, token, refresh) {
  var response = await fetch(url, { headers: headers || {} });
  if ((response.status === 401 || response.status === 403) && refresh) {
    var fresh = await refresh();
    if (fresh && fresh.url) {
      url = fresh.url;
      headers = fresh.headers || {};
      response = await fetch(url, { headers: headers });
    }
  }
  if (!response.ok) {
    return new Response(response.body, {
      status: response.status,
      headers: responseHeadersFrom(response, "text/plain")
    });
  }
  var contentType = response.headers.get("content-type") || "";
  if (!isManifest(url, contentType)) {
    return new Response(response.body, {
      status: response.status,
      headers: responseHeadersFrom(response, "video/mp2t")
    });
  }
  var manifest = await response.text();
  return textResponse(rewriteManifest(manifest, url, origin, token), "application/vnd.apple.mpegurl");
}

async function handleLiveChild(parentUrl, parentHeaders, childUrl, request, origin, token) {
  var childIsManifest = isManifest(childUrl, "");
  var response = await fetch(childUrl, { headers: childIsManifest ? parentHeaders || {} : {} });
  if (!childIsManifest && (response.status === 401 || response.status === 403)) {
    response = await fetch(childUrl, { headers: parentHeaders || {} });
  }
  var contentType = response.headers.get("content-type") || "";
  if (isManifest(childUrl, contentType)) {
    var manifest = await response.text();
    return textResponse(rewriteManifest(manifest, childUrl, origin, token), "application/vnd.apple.mpegurl");
  }
  return new Response(response.body, {
    status: response.status,
    headers: responseHeadersFrom(response, "video/mp2t")
  });
}

async function handleSubtitle(url) {
  var response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (SmartHub; SMART-TV; U; Linux/SmartTV) AppleWebKit/538.1+ (KHTML, like Gecko) Safari/538.1+",
      Accept: "*/*"
    }
  });
  if (!response.ok) return textResponse("subtitle " + response.status, "text/plain", response.status);
  var body = await response.text();
  return textResponse(body, "application/x-subrip; charset=utf-8");
}

module.exports = {
  CORS: CORS,
  encodeToken: encodeToken,
  decodeToken: decodeToken,
  corsHeaders: corsHeaders,
  jsonResponse: jsonResponse,
  textResponse: textResponse,
  probeVod: probeVod,
  handleVodManifest: handleVodManifest,
  handleVodSegment: handleVodSegment,
  handleMp4Segment: handleMp4Segment,
  handleLiveManifest: handleLiveManifest,
  handleLiveChild: handleLiveChild,
  handleSubtitle: handleSubtitle
};
