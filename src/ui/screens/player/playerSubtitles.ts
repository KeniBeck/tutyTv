export interface SubtitleTrack {
  url?: string;
  lang?: string;
  format?: string;
  [key: string]: unknown;
}

export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

export interface SubtitleContainer {
  innerHTML: string;
  classList: {
    add(...names: string[]): void;
    remove(...names: string[]): void;
  };
}

export interface PlayerSubtitleHost {
  getContainer(): SubtitleContainer | null;
  fetchText(url: string, done: (text: string | null) => void): void;
  parseCues(text: string): SubtitleCue[];
  findCue(cues: SubtitleCue[], position: number): SubtitleCue | null;
}

let host: PlayerSubtitleHost | null = null;
let cues: SubtitleCue[] = [];
let sequence = 0;

export function attachPlayerSubtitles(next: PlayerSubtitleHost): boolean {
  host = next;
  return true;
}

export function hasPlayerSubtitleRuntime(): boolean {
  return host !== null;
}

export function resetPlayerSubtitleRuntime(): void {
  host = null;
  cues = [];
  sequence = 0;
}

export function loadPlayerSubtitle(track?: SubtitleTrack | null): boolean {
  if (!host) {
    return false;
  }
  const requestId = ++sequence;
  if (!track || !track.url) {
    cues = [];
    clearContainer(host);
    return true;
  }
  host.fetchText(String(track.url), (text) => {
    if (!host || requestId !== sequence) {
      return;
    }
    cues = text ? host.parseCues(text) : [];
  });
  return true;
}

export function renderPlayerSubtitle(position: number, enabled: boolean): boolean {
  if (!host) {
    return false;
  }
  const container = host.getContainer();
  if (!container) {
    return true;
  }
  if (enabled && cues.length > 0) {
    const cue = host.findCue(cues, Number(position) || 0);
    if (cue) {
      const markup = `<span class="player-subtitles-text">${cue.text}</span>`;
      if (container.innerHTML !== markup) {
        container.innerHTML = markup;
      }
      return true;
    }
  }
  if (container.innerHTML !== "") {
    container.innerHTML = "";
  }
  return true;
}

export function applyPlayerSubtitleStyle(size: string, color: string): boolean {
  if (!host) {
    return false;
  }
  const container = host.getContainer();
  if (!container) {
    return true;
  }
  container.classList.remove("size-small", "size-normal", "size-big");
  container.classList.add(`size-${size}`);
  container.classList.remove("color-white", "color-yellow", "color-black");
  container.classList.add(`color-${color}`);
  return true;
}

export function resetPlayerSubtitles(): boolean {
  if (!host) {
    return false;
  }
  sequence += 1;
  cues = [];
  clearContainer(host);
  return true;
}

export function getPlayerSubtitleEnd(): number {
  const last = cues[cues.length - 1];
  return last && last.end > 0 ? last.end : 0;
}

function clearContainer(runtime: PlayerSubtitleHost): void {
  const container = runtime.getContainer();
  if (container && container.innerHTML !== "") {
    container.innerHTML = "";
  }
}
