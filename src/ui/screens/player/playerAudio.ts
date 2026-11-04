import type { AppState } from "../../runtime/state";

export interface AudioTrack {
  index: number;
  code?: string;
  label: string;
}

export interface AudioOptionsNode {
  appendChild(node: AudioButtonNode): void;
}

export interface AudioButtonNode {
  textContent: string;
  classList: {
    add(name: string): void;
  };
  _activate?: (() => void) | null;
}

export interface PlayerAudioHost {
  state: AppState;
  getOptions(): AudioOptionsNode | null;
  clear(node: AudioOptionsNode): void;
  getMediaAudio(): string | undefined;
  isAudioOverride(): boolean;
  getSelectedIndex(): number;
  setSelectedIndex(index: number): void;
  setAudioOverride(value: boolean): void;
  parseTracks(audio: string | undefined): AudioTrack[];
  describeTrack(code: string | undefined): string;
  selectIndex(audio: string | undefined): number;
  languagePreference(code: string | undefined, current: number): number;
  savePreferences(): void;
  isPlayerScreen(): boolean;
  hasMedia(): boolean;
  getRelaySource(): string;
  absolutePosition(): number;
  loadUrl(url: string): void;
  ensureRelayMode(): void;
  reloadResolved(): void;
  closeSettings(): void;
  el(tag: string, className: string, text?: string): AudioButtonNode;
}

let host: PlayerAudioHost | null = null;

export function attachPlayerAudio(next: PlayerAudioHost): boolean {
  host = next;
  return true;
}

export function hasPlayerAudioRuntime(): boolean {
  return host !== null;
}

export function resetPlayerAudioRuntime(): void {
  host = null;
}

export function renderAudioTracks(): boolean {
  if (!host) {
    return false;
  }
  const options = host.getOptions();
  if (!options) {
    return false;
  }
  host.clear(options);
  const audio = host.getMediaAudio();
  if (audio && !host.isAudioOverride()) {
    host.setSelectedIndex(host.selectIndex(audio));
  }
  let tracks = host.parseTracks(audio);
  if (!tracks.length) {
    tracks = [{ index: host.getSelectedIndex() || 0, label: "Español" }];
  }
  for (const track of tracks) {
    const button = host.el("button", "dps-btn focusable");
    button.textContent = track.label;
    if (host.getSelectedIndex() === track.index) {
      button.classList.add("is-selected");
    }
    button._activate = function selectTrack() {
      selectAudioTrack(track.index, track.code);
    };
    options.appendChild(button);
  }
  return true;
}

export function selectAudioTrack(index: number, code?: string): boolean {
  if (!host) {
    return false;
  }
  const state = host.state;
  host.setSelectedIndex(index);
  host.setAudioOverride(true);
  state.playback.audioCode = code || "";
  state.playback.audio = host.languagePreference(code, state.playback.audio);
  host.savePreferences();
  if (host.isPlayerScreen() && host.hasMedia()) {
    const relaySource = host.getRelaySource();
    if (relaySource) {
      host.loadUrl(`${relaySource}?start=${host.absolutePosition()}&a=${index}`);
    } else {
      host.ensureRelayMode();
      host.reloadResolved();
    }
  }
  renderAudioTracks();
  host.closeSettings();
  return true;
}
