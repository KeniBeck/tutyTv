import type { AppState } from "../../runtime/state";

export interface InfoNodeStyle {
  display?: string;
  position?: string;
  left?: string;
  top?: string;
  width?: string;
  height?: string;
  lineHeight?: string;
  backgroundImage?: string;
}

export interface InfoNode {
  textContent?: string | null;
  style: InfoNodeStyle;
  classList: {
    add(name: string): void;
    remove(name: string): void;
    toggle?(name: string, force?: boolean): void;
  };
  querySelector(selector: string): InfoNode | null;
  offsetLeft?: number;
  offsetWidth?: number;
}

export interface InfoPosterNode {
  src: string;
}

export interface InfoChannel {
  index?: string | number;
  name?: string;
  time?: string;
  now?: string;
  next?: string;
  uhd?: boolean;
  logo?: string;
  [key: string]: unknown;
}

export interface InfoMedia {
  currentTime?: number;
  duration?: number;
}

export interface InfoItem {
  title?: string;
  poster?: string;
  cover?: string;
  [key: string]: unknown;
}

export interface InfoEpisode {
  title?: string;
  name?: string;
  number?: string | number;
  seriesNumber?: string | number;
  [key: string]: unknown;
}

export interface PlayerInfoContentHost {
  state: AppState;
  getLiveBar(): InfoNode | null;
  getVodBar(): InfoNode | null;
  getVodTitle(): InfoNode | null;
  getVodPoster(): InfoPosterNode | null;
  getChannels(): InfoChannel[];
  getCatalog(): InfoItem[];
  getVideo(): InfoMedia | null;
  isSeries(item: InfoItem): boolean;
  syncChannelTabs(): void;
  layoutLiveQuality(): void;
  updateProgress(position: number, duration: number): void;
}

let host: PlayerInfoContentHost | null = null;

export function attachPlayerInfoContent(next: PlayerInfoContentHost): boolean {
  host = next;
  return true;
}

export function hasPlayerInfoContentRuntime(): boolean {
  return host !== null;
}

export function resetPlayerInfoContentRuntime(): void {
  host = null;
}

export function renderPlayerInfoContent(): boolean {
  if (!host) {
    return false;
  }
  const state = host.state;
  const live = state.playerMode === "live";
  const channels = host.getChannels();
  const liveBar = host.getLiveBar();
  const channel = channels[state.channel] || {};
  if (live && liveBar) {
    host.getVodBar()?.classList.remove("is-active");
    liveBar.style.display = "";
    const index = liveBar.querySelector(".pi-index");
    const name = liveBar.querySelector(".pi-name");
    const date = liveBar.querySelector(".pi-date");
    const range = liveBar.querySelector(".pi-range");
    const now = liveBar.querySelector(".pi-now");
    const next = liveBar.querySelector(".pi-next");
    const uhd = liveBar.querySelector(".pi-uhd");
    const logo = liveBar.querySelector(".pi-logo");
    if (index) {
      index.style.display = "block";
      index.textContent = padChannelIndex(channel.index || state.channel + 1);
    }
    if (name) {
      name.textContent = channel.name || "";
    }
    layoutChannelRow(liveBar);
    if (date) {
      date.textContent = "Hoy";
    }
    if (range) {
      range.textContent = channel.time || "";
    }
    if (now) {
      now.style.display = "block";
      now.textContent = channel.now || "En vivo";
    }
    if (next) {
      next.style.display = channel.next ? "block" : "none";
      if (channel.next) {
        next.textContent = `Siguiente: ${channel.next}`;
      }
    }
    if (uhd) {
      uhd.style.display = channel.uhd ? "block" : "none";
    }
    if (logo) {
      logo.style.display = "block";
      logo.style.backgroundImage = channel.logo ? `url(${channel.logo})` : "";
    }
  } else {
    if (liveBar) {
      liveBar.classList.remove("is-active");
      liveBar.style.display = "none";
    }
    const item = (state.playerItem as InfoItem | null) || host.getCatalog()[0];
    if (item) {
      const title = host.getVodTitle();
      if (title) {
        title.textContent = vodTitle(item, state.playerEpisode as InfoEpisode | null);
      }
      const poster = host.getVodPoster();
      if (poster) {
        poster.src =
          item.poster ||
          item.cover ||
          "assets/original/common/bg_placehoder_vertical.png";
      }
    }
    const media = host.getVideo();
    host.updateProgress(media ? media.currentTime || 0 : 0, media ? media.duration || 0 : 0);
  }
  host.syncChannelTabs();
  host.layoutLiveQuality();
  return true;
}

function vodTitle(item: InfoItem, episode: InfoEpisode | null): string {
  if (host && host.isSeries(item) && episode) {
    const name = episode.title || episode.name;
    const number = episode.number || episode.seriesNumber;
    const suffix = name || (number ? `Capítulo ${number}` : "");
    return suffix ? `${item.title || ""} - ${suffix}` : item.title || "";
  }
  return item.title || "";
}

function layoutChannelRow(liveBar: InfoNode): void {
  const row = liveBar.querySelector(".pi-namerow");
  if (!row) {
    return;
  }
  const name = row.querySelector(".pi-name");
  const uhd = row.querySelector(".pi-uhd");
  const offset = 165;
  row.style.position = "absolute";
  row.style.left = `${367.5 + offset}px`;
  row.style.top = "13.5px";
  row.style.width = "480px";
  row.style.height = "58px";
  row.style.display = "block";
  if (name) {
    name.style.position = "absolute";
    name.style.left = "0px";
    name.style.top = "8px";
    name.style.width = "480px";
    name.style.height = "50px";
    name.style.lineHeight = "50px";
  }
  if (uhd && name) {
    uhd.style.left = `${(name.offsetWidth || 0) + 30}px`;
    uhd.style.top = "18.5px";
  }
}

function padChannelIndex(value: string | number): string {
  const channel = Number(value) || 0;
  return channel < 10 ? `0${channel}` : String(channel);
}
