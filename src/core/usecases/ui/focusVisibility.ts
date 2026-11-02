export interface LegacyFocusVisibilityState {
  episodeBrowserOpen: boolean;
  categoryPickerOpen: boolean;
  liveCategoriesOpen: boolean;
  liveSearchOpen: boolean;
  resumeOpen: boolean;
  filterOpen: boolean;
  playSettingsOpen: boolean;
  playSettingViewOpen: boolean;
  nextEpisodeOpen: boolean;
}

export interface LegacyVisibilityElement {
  hasClass(className: string): boolean;
}

export interface LegacyVisibilityProbe {
  closest(selector: string): LegacyVisibilityElement | null;
}

export function isLegacyFocusVisible(probe: LegacyVisibilityProbe, state: LegacyFocusVisibilityState): boolean {
  if (state.episodeBrowserOpen) return !!probe.closest("#player-episodes");
  if (state.categoryPickerOpen) return !!probe.closest("#player-categories");
  if (state.liveCategoriesOpen) return !!probe.closest("#live-categories");
  if (state.liveSearchOpen) return !!probe.closest("#live-search");
  if (state.resumeOpen) return !!probe.closest("#dialog-resume");
  if (state.filterOpen) return !!probe.closest("#filter-panel");
  if (state.playSettingsOpen) return !!probe.closest("#dialog-playsettings");
  if (state.playSettingViewOpen) return !!probe.closest("#player-playsetting-view");
  if (state.nextEpisodeOpen) return !!probe.closest("#next-episode-prompt");

  const checks: Array<[selector: string, className: string]> = [
    [".home-page", "is-current"],
    [".settings-panel", "is-active"],
    [".search-hot", "is-hidden"],
    [".search-results", "is-active"],
    [".player-channels", "is-active"],
    [".player-infobar", "is-active"]
  ];
  for (const [selector, className] of checks) {
    const container = probe.closest(selector);
    if (!container) continue;
    if (selector === ".search-hot" ? container.hasClass(className) : !container.hasClass(className)) {
      return false;
    }
  }
  return true;
}
