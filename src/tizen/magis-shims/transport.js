"use strict";

function headerObject(input) {
  var out = {};
  if (!input) return out;
  Object.keys(input).forEach(function (key) {
    var lower = key.toLowerCase();
    if (
      lower === "host" ||
      lower === "content-length" ||
      lower === "connection" ||
      lower === "transfer-encoding"
    ) {
      return;
    }
    out[key] = input[key];
  });
  return out;
}

function buildUrl(options, defaultProtocol) {
  if (typeof options === "string") return options;
  if (options && options.href) return options.href;
  var protocol = options.protocol || defaultProtocol;
  var host = options.hostname || options.host || "localhost";
  var port = options.port ? ":" + options.port : "";
  var path = options.path || "/";
  if (path.charAt(0) !== "/") path = "/" + path;
  return protocol + "//" + host + port + path;
}

function xhrFetch(url, init) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open(init.method || "GET", url, true);
    xhr.responseType = "arraybuffer";
    if (init.timeoutMs) xhr.timeout = init.timeoutMs;
    var headers = init.headers || {};
    Object.keys(headers).forEach(function (key) {
      try {
        xhr.setRequestHeader(key, headers[key]);
      } catch (error) {
        /* forbidden header on this platform */
      }
    });
    xhr.onload = function () {
      var parsed = {};
      String(xhr.getAllResponseHeaders() || "")
        .trim()
        .split(/[\r\n]+/)
        .forEach(function (line) {
          var index = line.indexOf(":");
          if (index > 0) {
            parsed[line.slice(0, index).toLowerCase()] = line.slice(index + 1).trim();
          }
        });
      resolve({
        status: xhr.status,
        arrayBuffer: function () {
          return Promise.resolve(xhr.response || new ArrayBuffer(0));
        },
        headers: {
          forEach: function (callback) {
            Object.keys(parsed).forEach(function (key) {
              callback(parsed[key], key);
            });
          }
        }
      });
    };
    xhr.onerror = function () {
      reject(new Error("network error"));
    };
    xhr.ontimeout = function () {
      reject(new Error("timeout"));
    };
    try {
      xhr.send(init.body || null);
    } catch (error) {
      reject(error);
    }
  });
}

function doFetch(url, init) {
  if (typeof fetch !== "function") {
    return xhrFetch(url, init);
  }
  return fetch(url, init).catch(function (error) {
    var headers = init.headers;
    if (headers && (headers["User-Agent"] || headers["user-agent"])) {
      var alt = {};
      Object.keys(headers).forEach(function (key) {
        if (key.toLowerCase() !== "user-agent") alt[key] = headers[key];
      });
      return fetch(url, {
        method: init.method,
        headers: alt,
        body: init.body,
        signal: init.signal
      });
    }
    throw error;
  });
}

function createTransport(defaultProtocol) {
  function request(options, callback) {
    if (typeof options === "string") options = { path: options };
    options = options || {};
    var listeners = {};
    var chunks = [];
    var controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    var timeoutMs = 0;
    var timer = null;
    var started = false;
    var done = false;

    function emit(name, arg) {
      var list = listeners[name] || [];
      for (var i = 0; i < list.length; i++) {
        try {
          list[i](arg);
        } catch (error) {
          /* ignore listener errors */
        }
      }
    }

    var req = {
      on: function (name, fn) {
        (listeners[name] || (listeners[name] = [])).push(fn);
        return req;
      },
      setTimeout: function (ms, fn) {
        timeoutMs = ms || 0;
        if (fn) req.on("timeout", fn);
        return req;
      },
      write: function (data) {
        if (data !== undefined && data !== null) chunks.push(Buffer.from(data));
        return true;
      },
      abort: function () {
        if (!done && controller) {
          try {
            controller.abort();
          } catch (error) {
            /* ignore */
          }
        }
        return req;
      },
      end: function (data) {
        if (data !== undefined && data !== null) chunks.push(Buffer.from(data));
        if (started) return req;
        started = true;
        run();
        return req;
      }
    };

    async function run() {
      if (timeoutMs > 0) {
        timer = setTimeout(function () {
          emit("timeout");
          if (controller) {
            try {
              controller.abort();
            } catch (error) {
              /* ignore */
            }
          }
        }, timeoutMs);
      }
      try {
        var response = await doFetch(buildUrl(options, defaultProtocol), {
          method: options.method || "GET",
          headers: headerObject(options.headers),
          body: chunks.length ? Buffer.concat(chunks) : undefined,
          signal: controller ? controller.signal : undefined,
          timeoutMs: timeoutMs
        });
        if (timer) clearTimeout(timer);
        var body = Buffer.from(await response.arrayBuffer());
        var headers = {};
        response.headers.forEach(function (value, key) {
          headers[key.toLowerCase()] = value;
        });
        done = true;
        var fake = {
          statusCode: response.status,
          headers: headers,
          resume: function () {},
          on: function (name, fn) {
            if (name === "data") fn(body);
            else if (name === "end") setTimeout(fn, 0);
            return fake;
          }
        };
        if (callback) callback(fake);
      } catch (error) {
        if (timer) clearTimeout(timer);
        if (done) return;
        done = true;
        emit("error", error);
      }
    }

    return req;
  }

  function get(target, options, callback) {
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    options = options || {};
    var parsed = null;
    try {
      parsed = new URL(target);
    } catch (error) {
      parsed = null;
    }
    var settings = parsed
      ? {
          protocol: parsed.protocol,
          hostname: parsed.hostname,
          port: parsed.port,
          path: parsed.pathname + parsed.search,
          method: "GET",
          headers: options.headers || {}
        }
      : { path: target, method: "GET", headers: options.headers || {} };
    var req = request(settings, callback);
    if (options.timeout) req.setTimeout(options.timeout);
    req.end();
    return req;
  }

  return { request: request, get: get };
}

module.exports = { createTransport: createTransport };
