import type { AppState } from "../../runtime/state";

export interface PlaySettingsNode {
  textContent?: string | null;
  id?: string;
  style: { display?: string };
  classList: {
    add(name: string): void;
    remove(name: string): void;
    contains(name: string): boolean;
    toggle(name: string, force?: boolean): void;
  };
  appendChild(node: PlaySettingsNode): void;
  querySelector(selector: string): PlaySettingsNode | null;
  querySelectorAll(selector: string): ArrayLike<PlaySettingsNode>;
  getAttribute?(name: string): string | null;
  parentNode?: PlaySettingsNode | null;
  _activate?: (() => void) | null;
}

export interface PlaySettingsItem {
  id?: string | number;
  title?: string;
  seasonId?: string | number;
  episodes?: PlaySettingsEpisode[];
  seasons?: PlaySettingsSeason[];
  [key: string]: unknown;
}

export interface PlaySettingsSeason {
  id?: string | number;
  number?: number;
  _episodes?: PlaySettingsEpisode[];
  [key: string]: unknown;
}

export interface PlaySettingsEpisode {
  id?: string | number;
  number?: number;
  [key: string]: unknown;
}

export interface PlaySettingRange {
  start: number;
  end: number;
}

export interface PlaySettingsState extends AppState {
  playerEpisodeRange?: number;
}

export interface PlaySubtitleTrack {
  lang?: string;
  url?: string;
  format?: string;
}

export interface PlaySettingsHost {
  state: PlaySettingsState;
  byId(id: string): PlaySettingsNode | null;
  el(tag: string, className?: string, text?: string): PlaySettingsNode;
  clear(node: PlaySettingsNode): void;
  focus(node: PlaySettingsNode | null): void;
  firstFocus(root: PlaySettingsNode): PlaySettingsNode | null;
  getFocusRow(): PlaySettingsNode | null;
  isSeries(item: unknown): boolean;
  getSeasons(item: PlaySettingsItem): PlaySettingsSeason[];
  getEpisodeRanges(total: number): PlaySettingRange[];
  refreshMediaInfo(item: unknown, done: () => void): void;
  playEpisode(episode: PlaySettingsEpisode, seasonIndex: number): void;
  refreshStreamModeButtons(): void;
  refreshAspectButtons(): void;
  hideInfobar(): void;
  ensureStage(): void;
  focusPlayer(): void;
  isQuickOpen(): boolean;
  setQuickOpen(value: boolean): void;
  isFullOpen(): boolean;
  setFullOpen(value: boolean): void;
  canFocus(node: PlaySettingsNode | null): boolean;
  getCurrentFocus(): PlaySettingsNode | null;
  getCurrentItem(): PlaySettingsItem | null;
  renderAudioTracks(): void;
  getSubtitleTracks(): PlaySubtitleTrack[];
  isSubtitleEnabled(): boolean;
  setSubtitleEnabled(value: boolean): void;
  getCurrentSubtitle(): PlaySubtitleTrack | null;
  setCurrentSubtitle(track: PlaySubtitleTrack | null): void;
  setSubtitleForced(value: boolean): void;
  loadSubtitle(track: PlaySubtitleTrack | null): void;
  getSubtitleSize(): string;
  getSubtitleStyle(): string;
  setSubtitleSize(value: string): void;
  setSubtitleStyle(value: string): void;
  savePlaybackPreferences(): void;
  applySubtitleDisplay(): void;
  languagePreference(language: string, current: number): number;
  formatLanguage(language: string): string;
}

const CLOSE_DELAY_MS = 8000;

let host: PlaySettingsHost | null = null;
let closeTimer: ReturnType<typeof setTimeout> | null = null;
let episodeRanges: PlaySettingRange[] = [];
let returnFocus: PlaySettingsNode | null = null;

export function attachPlaySettings(next: PlaySettingsHost): boolean {
  host = next;
  return true;
}

export function hasPlaySettingsRuntime(): boolean {
  return host !== null;
}

export function resetPlaySettingsRuntime(): void {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
  host = null;
}

export function schedulePlaySettingsClose(): boolean {
  if (!host) {
    return false;
  }
  clearCloseTimer();
  closeTimer = setTimeout(function closeAfterDelay() {
    closeTimer = null;
    closePlaySettings();
  }, CLOSE_DELAY_MS);
  return true;
}

export function openPlaySettings(): boolean {
  if (!host) {
    return false;
  }
  host.ensureStage();
  const panel = host.byId("player-playsetting-view");
  if (!panel) {
    return false;
  }
  host.setQuickOpen(true);
  host.setFullOpen(false);
  host.hideInfobar();
  refreshPlaySettings();
  panel.classList.add("is-active");
  const shift = host.byId("player-subtitles");
  shift?.classList.add("shift-up");
  host.refreshMediaInfo(host.state.playerItem, function afterRefresh() {
    if (host?.isQuickOpen()) {
      refreshPlaySettings();
    }
  });
  schedulePlaySettingsClose();
  const item = host.state.playerItem;
  if (host.isSeries(item)) {
    const episodesRow = host.byId("psv-episodes-row");
    const episodeButton = episodesRow?.querySelector(".psv-ep-btn");
    if (episodeButton) {
      host.focus(episodeButton);
      return true;
    }
    const episodesButton = host.byId("psv-btn-episodes");
    if (episodesButton) {
      host.focus(episodesButton);
      return true;
    }
  }
  const configButton = host.byId("psv-btn-config");
  if (configButton) {
    host.focus(configButton);
  }
  return true;
}

export function closePlaySettings(): boolean {
  if (!host) {
    return false;
  }
  clearCloseTimer();
  host.setQuickOpen(false);
  host.byId("player-playsetting-view")?.classList.remove("is-active");
  host.byId("player-subtitles")?.classList.remove("shift-up");
  if (host.state.screen === "player" && !host.isFullOpen()) {
    host.focusPlayer();
  }
  return true;
}

export function refreshPlaySettings(): boolean {
  if (!host) {
    return false;
  }
  const panel = host.byId("player-playsetting-view");
  const focusedRow = host.getFocusRow();
  const focusedRowId = focusedRow?.id || "";
  const focusedText = focusedRow?.textContent || "";
  renderEpisodeSelection();
  host.byId("psv-sec-audio")?.classList.remove("is-hidden");
  host.refreshStreamModeButtons();
  host.refreshAspectButtons();
  syncPlaySettingsRowFocus();
  if (host.isQuickOpen() && focusedRowId && panel) {
    const rows = panel.querySelectorAll(".psv-row");
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      if (row?.id !== focusedRowId) {
        continue;
      }
      const controls = row.querySelectorAll(".focusable");
      let target: PlaySettingsNode | null = null;
      for (let control = 0; control < controls.length; control += 1) {
        if (controls[control]?.textContent === focusedText) {
          target = controls[control] || null;
          break;
        }
      }
      const fallback = host.firstFocus(row);
      const focusTarget = target || fallback;
      if (focusTarget) {
        host.focus(focusTarget);
      }
      break;
    }
  }
  return true;
}

export function openPlaySettingsDialog(itemOverride?: PlaySettingsItem | null): boolean {
  if (!host) {
    return false;
  }
  host.ensureStage();
  const panel = host.byId("dialog-playsettings");
  if (!panel) {
    return false;
  }
  clearCloseTimer();
  host.setFullOpen(true);
  returnFocus = host.getCurrentFocus();
  let item = itemOverride || host.getCurrentItem();
  if (host.state.screen === "detail") {
    item = (host.state.detail as PlaySettingsItem | null) || item;
  }
  bindDialogControls();
  host.renderAudioTracks();
  renderSubtitleSettings();
  host.applySubtitleDisplay();
  panel.classList.add("is-active");
  host.refreshMediaInfo(item, function afterRefresh() {
    if (host?.isFullOpen()) {
      host.renderAudioTracks();
      renderSubtitleSettings();
    }
  });
  const audioOptions = host.byId("dps-audio-options");
  const target =
    audioOptions?.querySelector(".focusable") ||
    host.byId("dps-sub-switch") ||
    host.byId("dps-btn-exit");
  if (target) {
    host.focus(target);
  }
  return true;
}

export function closePlaySettingsDialog(): boolean {
  if (!host) {
    return false;
  }
  host.setFullOpen(false);
  host.byId("dialog-playsettings")?.classList.remove("is-active");
  if (host.isQuickOpen()) {
    const configButton = host.byId("psv-btn-config");
    if (configButton) {
      host.focus(configButton);
    }
    schedulePlaySettingsClose();
  } else if (returnFocus && host.canFocus(returnFocus)) {
    host.focus(returnFocus);
  } else if (host.state.screen === "player") {
    host.focusPlayer();
  }
  returnFocus = null;
  return true;
}

export function renderSubtitleSettings(): boolean {
  if (!host) {
    return false;
  }
  const tracks = host.getSubtitleTracks();
  const enabled = host.isSubtitleEnabled();
  const current = host.getCurrentSubtitle();
  const toggle = host.byId("dps-sub-switch");
  if (toggle) {
    toggle.parentNode?.classList.toggle("is-hidden", !tracks.length);
    toggle.classList.toggle("is-on", enabled);
    const text = toggle.querySelector(".dps-switch-text");
    if (text) {
      text.textContent = enabled ? "ON" : "OFF";
    }
  }
  const visible = enabled && tracks.length > 0;
  host.byId("dps-row-lang")?.classList.toggle("is-visible", visible);
  host.byId("dps-row-size")?.classList.toggle("is-visible", visible);
  host.byId("dps-row-style")?.classList.toggle("is-visible", visible);
  if (enabled) {
    const languageOptions = host.byId("dps-lang-options");
    if (languageOptions) {
      host.clear(languageOptions);
      for (let index = 0; index < tracks.length; index += 1) {
        const track = tracks[index] as PlaySubtitleTrack;
        const button = host.el("button", "dps-btn focusable", host.formatLanguage(track.lang || "Sub"));
        if (current && current.url === track.url) {
          button.classList.add("is-selected");
        }
        button._activate = function selectLanguage() {
          if (!host) {
            return;
          }
          host.setCurrentSubtitle(track);
          host.setSubtitleEnabled(true);
          host.setSubtitleForced(true);
          host.state.playback.subtitle = true;
          host.state.playback.subCode = track.lang || "";
          host.state.playback.subLang = host.languagePreference(track.lang || "", host.state.playback.subLang);
          host.savePlaybackPreferences();
          host.loadSubtitle(track);
          renderSubtitleSettings();
          schedulePlaySettingsClose();
        };
        languageOptions.appendChild(button);
      }
    }
    const size = host.getSubtitleSize();
    const sizeButtons = host.byId("dps-size-options")?.querySelectorAll(".dps-btn") || [];
    for (let index = 0; index < sizeButtons.length; index += 1) {
      sizeButtons[index]?.classList.toggle("is-selected", sizeButtons[index]?.getAttribute?.("data-size") === size);
    }
    const style = host.getSubtitleStyle();
    const styleButtons = host.byId("dps-style-options")?.querySelectorAll(".dps-btn") || [];
    for (let index = 0; index < styleButtons.length; index += 1) {
      styleButtons[index]?.classList.toggle("is-selected", styleButtons[index]?.getAttribute?.("data-style") === style);
    }
  }
  return true;
}

function bindDialogControls(): void {
  if (!host) {
    return;
  }
  const toggle = host.byId("dps-sub-switch");
  if (toggle) {
    toggle._activate = function toggleSubtitles() {
      if (!host) {
        return;
      }
      host.setSubtitleForced(true);
      const next = !host.isSubtitleEnabled();
      host.setSubtitleEnabled(next);
      if (next) {
        const tracks = host.getSubtitleTracks();
        let current = host.getCurrentSubtitle();
        if (!current && tracks.length) {
          current = tracks[0] || null;
          host.setCurrentSubtitle(current);
        }
        if (current) {
          host.loadSubtitle(current);
        }
      } else {
        host.loadSubtitle(null);
      }
      host.state.playback.subtitle = next;
      host.savePlaybackPreferences();
      renderSubtitleSettings();
      schedulePlaySettingsClose();
    };
  }
  const exit = host.byId("dps-btn-exit");
  if (exit) {
    exit._activate = function exitDialog() {
      closePlaySettingsDialog();
    };
  }
  const sizes = host.byId("dps-size-options");
  if (sizes) {
    const buttons = sizes.querySelectorAll(".dps-btn");
    for (let index = 0; index < buttons.length; index += 1) {
      const button = buttons[index];
      if (!button) {
        continue;
      }
      button._activate = function selectSize() {
        if (!host) {
          return;
        }
        const value = button.getAttribute?.("data-size") || "normal";
        host.setSubtitleSize(value);
        host.state.playback.size = Math.max(0, ["normal", "big", "small"].indexOf(value));
        host.savePlaybackPreferences();
        host.applySubtitleDisplay();
        renderSubtitleSettings();
      };
    }
  }
  const styles = host.byId("dps-style-options");
  if (styles) {
    const buttons = styles.querySelectorAll(".dps-btn");
    for (let index = 0; index < buttons.length; index += 1) {
      const button = buttons[index];
      if (!button) {
        continue;
      }
      button._activate = function selectStyle() {
        if (!host) {
          return;
        }
        const value = button.getAttribute?.("data-style") || "white";
        host.setSubtitleStyle(value);
        host.state.playback.style = Math.max(0, ["white", "yellow", "black"].indexOf(value));
        host.savePlaybackPreferences();
        host.applySubtitleDisplay();
        renderSubtitleSettings();
      };
    }
  }
}

export function syncPlaySettingsRowFocus(): boolean {
  if (!host) {
    return false;
  }
  const panel = host.byId("player-playsetting-view");
  if (!panel) {
    return false;
  }
  const rows = panel.querySelectorAll(".psv-row");
  for (let index = 0; index < rows.length; index += 1) {
    rows[index]?.classList.remove("is-row-focused");
  }
  host.getFocusRow()?.classList.add("is-row-focused");
  return true;
}

function renderEpisodeSelection(): void {
  if (!host) {
    return;
  }
  const section = host.byId("psv-sec-selection");
  if (!section) {
    return;
  }
  const item = host.state.playerItem as PlaySettingsItem | null;
  if (!item || !host.isSeries(item)) {
    section.style.display = "none";
    return;
  }
  section.style.display = "block";
  const row = host.byId("psv-episodes-row");
  if (!row) {
    return;
  }
  host.clear(row);
  const seasons = host.getSeasons(item);
  const season = seasons[host.state.playerSeasonIndex] || seasons[0];
  const episodes =
    season && season.id === (item.seasonId || item.id) && item.episodes && item.episodes.length
      ? item.episodes
      : season?._episodes || item.episodes || [];
  if (!episodes.length) {
    row.appendChild(host.el("div", "psv-selection-empty", "Temporadas y episodios"));
    return;
  }
  let selected = 0;
  for (let index = 0; index < episodes.length; index += 1) {
    const episode = episodes[index] as PlaySettingsEpisode;
    const current = host.state.playerEpisode as PlaySettingsEpisode | null;
    if (current && (episode.id === current.id || episode.number === current.number)) {
      selected = index;
      break;
    }
  }
  episodeRanges = host.getEpisodeRanges(episodes.length);
  if (
    host.state.playerEpisodeRange === undefined ||
    host.state.playerEpisodeRange >= episodeRanges.length
  ) {
    host.state.playerEpisodeRange = Math.floor(selected / 20);
  }
  const range = episodeRanges[host.state.playerEpisodeRange] || episodeRanges[0];
  if (!range) {
    return;
  }
  const numbers = host.el("div", "psv-episode-numbers");
  for (let index = range.start; index < range.end; index += 1) {
    const episode = episodes[index] as PlaySettingsEpisode;
    const label = index === selected
      ? "▶"
      : String(episode.number !== undefined && episode.number !== null ? episode.number : index + 1);
    const button = host.el("button", `psv-ep-btn focusable${index === selected ? " is-selected" : ""}`, label);
    button._activate = function playSelectedEpisode() {
      host?.playEpisode(episode, host.state.playerSeasonIndex);
    };
    numbers.appendChild(button);
  }
  row.appendChild(numbers);
  const ranges = host.el("div", "psv-episode-ranges");
  for (let index = 0; index < episodeRanges.length; index += 1) {
    const targetRange = episodeRanges[index] as PlaySettingRange;
    const targetIndex = index;
    const button = host.el(
      "button",
      `psv-range-btn focusable${targetRange === range ? " is-selected" : ""}`,
      `${targetRange.start + 1}-${targetRange.end}`
    );
    button._activate = function selectRange() {
      if (!host) {
        return;
      }
      host.state.playerEpisodeRange = targetIndex;
      renderEpisodeSelection();
      const first = host.byId("psv-episodes-row")?.querySelector(".psv-ep-btn");
      if (first) {
        host.focus(first);
      }
    };
    ranges.appendChild(button);
  }
  row.appendChild(ranges);
}

function clearCloseTimer(): void {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
}
