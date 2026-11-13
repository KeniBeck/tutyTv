"use strict";

function parse(input) {
  try {
    var parsed = new URL(String(input));
    return {
      href: parsed.href,
      protocol: parsed.protocol,
      slashes: true,
      auth: parsed.username ? parsed.username + (parsed.password ? ":" + parsed.password : "") : null,
      host: parsed.host,
      port: parsed.port || null,
      hostname: parsed.hostname,
      hash: parsed.hash || null,
      search: parsed.search || null,
      query: parsed.search ? parsed.search.slice(1) : null,
      pathname: parsed.pathname,
      path: parsed.pathname + parsed.search
    };
  } catch (error) {
    return {
      href: String(input),
      protocol: null,
      slashes: null,
      auth: null,
      host: null,
      port: null,
      hostname: null,
      hash: null,
      search: null,
      query: null,
      pathname: String(input),
      path: String(input)
    };
  }
}

function resolve(base, relative) {
  return new URL(String(relative), String(base)).toString();
}

module.exports = { parse: parse, resolve: resolve };
