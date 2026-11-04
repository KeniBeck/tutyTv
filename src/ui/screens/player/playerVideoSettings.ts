import type { AppState } from "../../runtime/state";

export interface VideoClassNode {
  classList: {
    add(name: string): void;
    remove(...names: string[]): void;
    toggle(name: string, force?: boolean): void;
    contains(name: string): boolean;
  };
}

export interface VideoSettingButton extends VideoClassNode {
  getAttribute(name: string): string | null;
}

export interface VideoSettingCheck {
  style: {
    display: string;
  };
}

export interface PlayerVideoSettingsHost {
  state: AppState;
  getVideo(): VideoClassNode | null;
  getRelayButton(): VideoSettingButton | null;
  getNormalButton(): VideoSettingButton | null;
  getCheck(button: VideoSettingButton): VideoSettingCheck | null;
  getAspectButtons(): ArrayLike<VideoSettingButton>;
  isRelayMode(mode: string): boolean;
}

const ASPECTS = ["cover", "contain", "16-9", "4-3"];

let host: PlayerVideoSettingsHost | null = null;
let aspect = "contain";

export function attachPlayerVideoSettings(next: PlayerVideoSettingsHost): boolean {
  host = next;
  return true;
}

export function hasPlayerVideoSettingsRuntime(): boolean {
  return host !== null;
}

export function resetPlayerVideoSettingsRuntime(): void {
  host = null;
  aspect = "contain";
}

export function normalizePlayerAspect(value: unknown): string {
  const next = String(value || "");
  return ASPECTS.indexOf(next) !== -1 ? next : "contain";
}

export function getPlayerAspect(): string {
  return aspect;
}

export function applyPlayerAspect(value: unknown): boolean {
  if (!host) {
    return false;
  }
  aspect = normalizePlayerAspect(value);
  const video = host.getVideo();
  if (video) {
    video.classList.remove("aspect-cover", "aspect-contain", "aspect-16-9", "aspect-4-3");
    video.classList.add(`aspect-${aspect}`);
  }
  refreshAspectButtons();
  return true;
}

export function refreshAspectButtons(): boolean {
  if (!host) {
    return false;
  }
  const buttons = host.getAspectButtons();
  for (let index = 0; index < buttons.length; index += 1) {
    const button = buttons[index];
    if (!button) {
      continue;
    }
    const selected = button.getAttribute("data-aspect") === aspect;
    button.classList.toggle("is-selected", selected);
    const check = host.getCheck(button);
    if (check) {
      check.style.display = selected ? "block" : "none";
    }
  }
  return true;
}

export function refreshStreamModeButtons(): boolean {
  if (!host) {
    return false;
  }
  const relay = host.isRelayMode(host.state.streamMode);
  const relayButton = host.getRelayButton();
  if (relayButton) {
    relayButton.classList.toggle("is-selected", relay);
    const check = host.getCheck(relayButton);
    if (check) {
      check.style.display = relay ? "block" : "none";
    }
  }
  const normalButton = host.getNormalButton();
  if (normalButton) {
    normalButton.classList.toggle("is-selected", !relay);
    const check = host.getCheck(normalButton);
    if (check) {
      check.style.display = relay ? "none" : "block";
    }
  }
  return true;
}

export function aspectFromSetting(value: unknown): string {
  return ASPECTS[Number(value) || 0] || "contain";
}
