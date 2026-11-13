import type { SourceVideo } from "../../ui/screens/player/playerSource";

interface AvPlayListener {
  onbufferingstart?: () => void;
  onbufferingprogress?: (percent: number) => void;
  onbufferingcomplete?: () => void;
  oncurrentplaytime?: (position: number) => void;
  onstreamcompleted?: () => void;
  onerror?: (error: unknown) => void;
  onevent?: (event: unknown) => void;
  onsubtitlechange?: (position: number, text: string, type: number) => void;
  ondrmevent?: (event: unknown) => void;
}

interface AvPlayApi {
  open(url: string): void;
  close(): void;
  prepareAsync?(
    onSuccess: () => void,
    onError: (error: unknown) => void
  ): void;
  play(): void;
  pause(): void;
  stop(): void;
  seekTo(position: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  getState(): string;
  setDisplayRect(x: number, y: number, width: number, height: number): void;
  setDisplayMethod?(method: string): void;
  setListener(listener: AvPlayListener): void;
  setBufferingParam?(...args: unknown[]): void;
}

interface TizenWebApis {
  avplay?: AvPlayApi;
}

interface ActiveAvPlay {
  video: HTMLVideoElement;
  object: HTMLObjectElement;
  stage: HTMLElement;
  av: AvPlayApi;
  keys: string[];
  timer: ReturnType<typeof setInterval> | null;
  seekTimer: ReturnType<typeof setTimeout> | null;
  error: boolean;
}

let active: ActiveAvPlay | null = null;

function getAvPlay(): AvPlayApi | null {
  if (typeof window === "undefined") {
    return null;
  }
  const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent || "";
  const tizenWindow = window as unknown as { tizen?: unknown; webapis?: TizenWebApis };
  const isTizen = /tizen|samsung|smart-tv/i.test(userAgent) || Boolean(tizenWindow.tizen);
  if (!isTizen) {
    return null;
  }
  const av = tizenWindow.webapis && tizenWindow.webapis.avplay;
  return av && typeof av.open === "function" ? av : null;
}

export function isAvPlayAvailable(): boolean {
  return Boolean(getAvPlay());
}

export function isAvPlayActive(): boolean {
  return active !== null;
}

function dispatch(video: HTMLVideoElement, name: string): void {
  try {
    video.dispatchEvent(new Event(name));
  } catch {
    // Ignore event dispatch failures during teardown.
  }
}

function ensureStyle(): void {
  if (document.getElementById("tuty-avplay-style")) {
    return;
  }
  const style = document.createElement("style");
  style.id = "tuty-avplay-style";
  style.textContent =
    "#player-stage.tuty-avplay > video{display:none!important;}" +
    "#player-stage > object.tuty-avplayer{position:absolute;inset:0;width:100%;height:100%;z-index:0;background:#000;pointer-events:none;}";
  document.head.appendChild(style);
}

function stateOf(av: AvPlayApi): string {
  try {
    return av.getState();
  } catch {
    return "NONE";
  }
}

function currentSeconds(av: AvPlayApi): number {
  try {
    return Math.max(0, Number(av.getCurrentTime()) / 1000);
  } catch {
    return 0;
  }
}

function durationSeconds(av: AvPlayApi): number {
  try {
    return Math.max(0, Number(av.getDuration()) / 1000);
  } catch {
    return 0;
  }
}

function define(video: HTMLVideoElement, keys: string[], name: string, descriptor: PropertyDescriptor): void {
  Object.defineProperty(video, name, Object.assign({ configurable: true }, descriptor));
  keys.push(name);
}

export function stopAvPlay(): void {
  const current = active;
  if (!current) {
    return;
  }
  active = null;
  if (current.timer) {
    clearInterval(current.timer);
  }
  if (current.seekTimer) {
    clearTimeout(current.seekTimer);
  }
  try {
    const state = stateOf(current.av);
    if (state === "PLAYING" || state === "PAUSED" || state === "READY") {
      current.av.stop();
    }
  } catch {
    // Ignore AVPlay stop failures.
  }
  try {
    current.av.close();
  } catch {
    // Ignore AVPlay close failures.
  }
  current.stage.classList.remove("tuty-avplay");
  if (current.object.parentNode) {
    current.object.parentNode.removeChild(current.object);
  }
  current.video.style.display = "";
  for (const key of current.keys) {
    try {
      delete (current.video as unknown as Record<string, unknown>)[key];
    } catch {
      // Ignore failed restores.
    }
  }
}

export function startAvPlay(video: SourceVideo, url: string): boolean {
  const av = getAvPlay();
  if (!av || !url) {
    return false;
  }
  const element = video as unknown as HTMLVideoElement;
  const stage =
    (element.parentElement as HTMLElement | null) ||
    document.getElementById("player-stage");
  if (!stage) {
    return false;
  }

  stopAvPlay();
  ensureStyle();

  const object = document.createElement("object");
  object.id = "tuty-avplayer";
  object.className = "tuty-avplayer";
  object.setAttribute("type", "application/avplayer");
  stage.insertBefore(object, stage.firstChild);
  stage.classList.add("tuty-avplay");
  element.style.display = "none";

  const current: ActiveAvPlay = {
    video: element,
    object,
    stage,
    av,
    keys: [],
    timer: null,
    seekTimer: null,
    error: false
  };
  active = current;

  const originalRemoveAttribute = element.removeAttribute.bind(element);
  define(element, current.keys, "removeAttribute", {
    value: function removeAttribute(name: string): void {
      if (String(name).toLowerCase() === "src") {
        stopAvPlay();
      }
      originalRemoveAttribute(name);
    }
  });
  define(element, current.keys, "currentTime", {
    get: function getCurrentTime(): number {
      return active === current ? currentSeconds(current.av) : 0;
    },
    set: function setCurrentTime(value: number): void {
      if (active !== current) {
        return;
      }
      const target = Math.max(0, Number(value) || 0);
      const milliseconds = Math.floor(target * 1000);
      const seek = function seek(): void {
        if (active !== current) {
          return;
        }
        try {
          current.av.seekTo(milliseconds);
        } catch {
          // Ignore seek failures before the player is ready.
        }
      };
      if (current.seekTimer) {
        clearTimeout(current.seekTimer);
        current.seekTimer = null;
      }
      dispatch(current.video, "seeking");
      seek();
      if (stateOf(current.av) !== "PLAYING") {
        current.seekTimer = setTimeout(seek, 700);
      }
      dispatch(current.video, "seeked");
    }
  });
  define(element, current.keys, "duration", {
    get: function getDuration(): number {
      return active === current ? durationSeconds(current.av) : 0;
    }
  });
  define(element, current.keys, "paused", {
    get: function getPaused(): boolean {
      return active !== current || stateOf(current.av) !== "PLAYING";
    }
  });
  define(element, current.keys, "readyState", {
    get: function getReadyState(): number {
      return active === current ? 4 : 0;
    }
  });
  define(element, current.keys, "error", {
    get: function getError(): { code: number } | null {
      return active === current && current.error ? { code: 1 } : null;
    }
  });
  define(element, current.keys, "buffered", {
    get: function getBuffered(): { length: number; start(): number; end(): number } {
      return { length: 0, start: () => 0, end: () => 0 };
    }
  });
  define(element, current.keys, "play", {
    value: function play(): Promise<void> {
      if (active !== current) {
        return Promise.resolve();
      }
      try {
        current.av.play();
        dispatch(current.video, "play");
        dispatch(current.video, "playing");
      } catch {
        current.error = true;
        dispatch(current.video, "error");
      }
      return Promise.resolve();
    }
  });
  define(element, current.keys, "pause", {
    value: function pause(): void {
      if (active !== current) {
        return;
      }
      try {
        current.av.pause();
        dispatch(current.video, "pause");
      } catch {
        // Ignore pause failures.
      }
    }
  });
  define(element, current.keys, "load", {
    value: function load(): void {
      // AVPlay is managed by prepareAsync/play.
    }
  });

  try {
    av.open(url);
    try {
      av.setDisplayMethod?.("PLAYER_DISPLAY_MODE_LETTER_BOX");
    } catch {
      // Display mode is optional on older Tizen versions.
    }
    try {
      av.setDisplayRect(0, 0, 1920, 1080);
    } catch {
      // Keep the default display rect if the TV rejects it.
    }
    av.setListener({
      onbufferingstart: function onBufferingStart(): void {
        if (active !== current) {
          return;
        }
        dispatch(current.video, "waiting");
      },
      onbufferingcomplete: function onBufferingComplete(): void {
        if (active !== current) {
          return;
        }
        dispatch(current.video, "canplay");
      },
      oncurrentplaytime: function onCurrentPlayTime(): void {
        if (active !== current) {
          return;
        }
        dispatch(current.video, "timeupdate");
      },
      onstreamcompleted: function onStreamCompleted(): void {
        if (active !== current) {
          return;
        }
        dispatch(current.video, "ended");
      },
      onerror: function onError(): void {
        if (active !== current) {
          return;
        }
        current.error = true;
        dispatch(current.video, "error");
      }
    });
    const started = function started(): void {
      if (active !== current) {
        return;
      }
      dispatch(current.video, "loadedmetadata");
      dispatch(current.video, "durationchange");
      dispatch(current.video, "loadeddata");
      dispatch(current.video, "canplay");
      try {
        current.av.play();
        dispatch(current.video, "play");
        dispatch(current.video, "playing");
      } catch {
        current.error = true;
        dispatch(current.video, "error");
      }
      current.timer = setInterval(function tick(): void {
        if (active === current) {
          dispatch(current.video, "timeupdate");
        }
      }, 1000);
    };
    if (typeof av.prepareAsync === "function") {
      av.prepareAsync(started, function failed(): void {
        current.error = true;
        dispatch(current.video, "error");
      });
    } else {
      started();
    }
    return true;
  } catch {
    stopAvPlay();
    return false;
  }
}
