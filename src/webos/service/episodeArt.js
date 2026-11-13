"use strict";
var https = require("https"),
    http = require("http"),
    url = require("url"),
    API = "https://api.tvmaze.com",
    USER_AGENT = "TutyTV/1.7.3 (+https://www.tvmaze.com)",
    CACHE_TTL = 864e5,
    REQUEST_TIMEOUT = 2e3,
    OVERALL_TIMEOUT = 6e3,
    RATE_MS = 500,
    MAX_REDIRECTS = 3,
    showCache = {},
    episodesCache = {},
    inFlight = {},
    queue = [],
    busy = false,
    lastAt = 0;

function now() {
    return Date.now()
}

function trim(value) {
    return null == value ? "" : String(value).replace(/^\s+|\s+$/g, "")
}

function normalize(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "")
}

function imdbOf(value) {
    var match = /(tt\d{6,})/.exec(String(value || ""));
    return match ? match[1] : ""
}

function cleanTitle(value) {
    return trim(String(value || "").replace(/\s+(?:S|T|Temp\.?|Temporada)\s*\d+\s*$/i, ""))
}

function seasonFromTitle(value) {
    var match = /(?:^|\s)(?:S|T|Temp\.?|Temporada)\s*(\d+)\s*$/i.exec(String(value || ""));
    return match ? parseInt(match[1], 10) || 0 : 0
}

function prune(cache) {
    var keys = Object.keys(cache);
    if (keys.length < 300) return;
    for (var i = 0; i < keys.length; i++) {
        var entry = cache[keys[i]];
        if (!entry || now() - entry.at >= CACHE_TTL) delete cache[keys[i]]
    }
}

function enqueue(task) {
    queue.push(task);
    drain()
}

function drain() {
    if (busy || !queue.length) return;
    var wait = lastAt + RATE_MS - now();
    if (wait > 0) {
        busy = true;
        setTimeout(function() {
            busy = false;
            drain()
        }, wait);
        return
    }
    var task = queue.shift();
    busy = true;
    lastAt = now();
    task(function() {
        busy = false;
        drain()
    })
}

function redirectTarget(target, location) {
    var next = url.resolve(target, location),
        sourceEmbed = /(?:^|&)embed=([^&]+)/.exec(url.parse(target).query || ""),
        nextQuery = url.parse(next).query || "";
    if (sourceEmbed && !/(?:^|&)embed=/.test(nextQuery)) next += (nextQuery ? "&" : "?") + "embed=" + sourceEmbed[1];
    return next
}

function requestJson(target, redirects, cb) {
    var parsed = url.parse(target),
        secure = "http:" !== parsed.protocol,
        transport = secure ? https : http,
        done = false,
        req = transport.request({
            hostname: parsed.hostname,
            port: parsed.port || (secure ? 443 : 80),
            path: parsed.path || "/",
            method: "GET",
            rejectUnauthorized: false,
            headers: {
                "User-Agent": USER_AGENT,
                Accept: "application/json"
            }
        }, function(res) {
            var status = res.statusCode || 0;
            if (status >= 300 && status < 400 && res.headers.location && redirects < MAX_REDIRECTS) {
                done = true;
                res.resume();
                return requestJson(redirectTarget(target, res.headers.location), redirects + 1, cb)
            }
            var chunks = [];
            res.on("data", function(chunk) {
                chunks.push(chunk)
            });
            res.on("end", function() {
                if (done) return;
                done = true;
                if (status < 200 || status >= 300) {
                    var err = new Error("TVMaze HTTP " + status);
                    err.statusCode = status;
                    return cb(err)
                }
                try {
                    cb(null, JSON.parse(Buffer.concat(chunks).toString("utf8")))
                } catch (e) {
                    cb(new Error("TVMaze respuesta no JSON"))
                }
            })
        });
    req.setTimeout(REQUEST_TIMEOUT, function() {
        req.abort()
    });
    req.on("timeout", function() {
        req.abort()
    });
    req.on("error", function(e) {
        if (done) return;
        done = true;
        cb(e)
    });
    req.end()
}

function getJson(target, cb) {
    if (inFlight[target]) {
        inFlight[target].push(cb);
        return
    }
    inFlight[target] = [cb];
    enqueue(function(done) {
        requestJson(target, 0, function(err, data) {
            var listeners = inFlight[target] || [];
            delete inFlight[target];
            done();
            for (var i = 0; i < listeners.length; i++) listeners[i](err, data)
        })
    })
}

function parseEpisodes(show) {
    for (var source = show && show._embedded && show._embedded.episodes, list = Array.isArray(source) ? source : [], episodes = [], i = 0; i < list.length; i++) {
        var item = list[i] || {},
            image = item.image && (item.image.medium || item.image.original) || "";
        episodes.push({
            season: parseInt(item.season, 10) || 0,
            number: parseInt(item.number, 10) || 0,
            image: image
        })
    }
    return episodes
}

function lookupShow(imdb, title, cb) {
    var key = imdb ? "imdb:" + imdb : "title:" + normalize(title),
        cached = showCache[key];
    if (cached && now() - cached.at < CACHE_TTL) return cb(null, cached.id);
    var target = imdb ? API + "/lookup/shows?imdb=" + encodeURIComponent(imdb) + "&embed=episodes" : API + "/singlesearch/shows?q=" + encodeURIComponent(title) + "&embed=episodes";
    getJson(target, function(err, show) {
        if (err || !show || !show.id) {
            var error = err || new Error("TVMaze sin coincidencias");
            if (404 === error.statusCode) {
                showCache[key] = {
                    at: now(),
                    id: 0
                };
                prune(showCache)
            }
            return cb(error)
        }
        showCache[key] = {
            at: now(),
            id: show.id
        };
        prune(showCache);
        episodesCache[show.id] = {
            at: now(),
            episodes: parseEpisodes(show)
        };
        prune(episodesCache);
        cb(null, show.id)
    })
}

function loadEpisodes(showId, cb) {
    var cached = episodesCache[showId];
    if (cached && now() - cached.at < CACHE_TTL) return cb(null, cached.episodes);
    getJson(API + "/shows/" + encodeURIComponent(showId) + "?embed=episodes", function(err, show) {
        if (err) return cb(err);
        var episodes = parseEpisodes(show);
        episodesCache[showId] = {
            at: now(),
            episodes: episodes
        };
        prune(episodesCache);
        cb(null, episodes)
    })
}

function pickImage(pool, season, number, index, total) {
    var i, item, seasonPool;
    for (i = 0; i < pool.length; i++) {
        item = pool[i];
        if (item.season === season && item.number === number && item.image) return item.image
    }
    seasonPool = [];
    for (i = 0; i < pool.length; i++) {
        item = pool[i];
        if (item.season === season) seasonPool.push(item)
    }
    if (!seasonPool.length) {
        var bySeason = {},
            order = [];
        for (i = 0; i < pool.length; i++) {
            item = pool[i];
            if (!bySeason[item.season]) {
                bySeason[item.season] = [];
                order.push(item.season)
            }
            bySeason[item.season].push(item)
        }
        if (!season && order.length) {
            seasonPool = bySeason[order[0]]
        } else {
            for (i = 0; i < order.length; i++)
                if (bySeason[order[i]].length === total) {
                    seasonPool = bySeason[order[i]];
                    break
                }
        }
    }
    if (!seasonPool.length) return "";
    if (seasonPool.length === total && seasonPool[index] && seasonPool[index].image) return seasonPool[index].image;
    for (i = 0; i < seasonPool.length; i++)
        if (seasonPool[i].number === number && seasonPool[i].image) return seasonPool[i].image;
    return ""
}

function enrichEpisodes(options, cb) {
    options = options || {};
    var episodes = options.episodes;
    if (!episodes || !episodes.length) {
        cb(null, episodes || []);
        return
    }
    var fallback = trim(options.fallback),
        finished = false,
        imdb = imdbOf(options.imdb),
        title = cleanTitle(options.title),
        season = parseInt(options.season, 10) || seasonFromTitle(options.title),
        timer = setTimeout(function() {
            finish(new Error("TVMaze timeout"))
        }, OVERALL_TIMEOUT);

    function finish(err, pool) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        for (var i = 0; i < episodes.length; i++) {
            var episode = episodes[i] || {},
                image = pool ? pickImage(pool, season, parseInt(episode.number, 10) || i + 1, i, episodes.length) : "",
                current = trim(episode.picture);
            episode.still = image || "";
            episode.picture = image || fallback || current;
            episode.pictureFallback = !image && !!(fallback || current)
        }
        cb(err || null, episodes)
    }
    if (!imdb && !title) return finish();
    lookupShow(imdb, title, function(err, showId) {
        if (err || !showId) return finish(err);
        loadEpisodes(showId, function(err2, pool) {
            return err2 ? finish(err2) : void finish(null, pool)
        })
    })
}

function clearCache() {
    showCache = {};
    episodesCache = {}
}
module.exports = {
    enrichEpisodes: enrichEpisodes,
    clearCache: clearCache,
    _private: {
        imdbOf: imdbOf,
        cleanTitle: cleanTitle,
        seasonFromTitle: seasonFromTitle,
        pickImage: pickImage
    },
    constants: {
        CACHE_TTL: CACHE_TTL,
        REQUEST_TIMEOUT: REQUEST_TIMEOUT
    }
};
