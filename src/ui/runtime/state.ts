export interface FocusableElement extends HTMLElement {
  _onMove?: (direction: string) => boolean;
  _onFocus?: () => void;
  _activate?: () => void;
}

export interface PlaybackState {
  streamMode: string;
  streamModes: Record<string, boolean>;
  screen: number;
  audio: number;
  audioCode: string;
  subLang: number;
  subCode: string;
  size: number;
  style: number;
  subtitle: boolean;
}

export interface AppState {
  screen: string;
  tab: number;
  channel: number;
  focus: FocusableElement | null;
  detail: unknown;
  detailReturn: unknown;
  detailRange: number;
  detailSeason: number;
  detailEpisode: unknown;
  detailNeedsRebuild: boolean;
  playerReturn: unknown;
  playerMode: string;
  playerItem: unknown;
  playerEpisode: unknown;
  playerSeasonIndex: number;
  nextEpisodeOpen: boolean;
  nextEpisodeTimer: ReturnType<typeof setTimeout> | null;
  nextEpisodeTarget: unknown;
  nextEpisodeSeq: number;
  nextEpisodeCountdown: number;
  nextEpisodeDismissed: boolean;
  nextEpisodeGuardUntil: number;
  episodeBrowserOpen: boolean;
  categoryPickerOpen: boolean;
  liveCategoriesOpen: boolean;
  liveSearchOpen: boolean;
  filterOpen: boolean;
  filterReturn: unknown;
  resumeOpen: boolean;
  resumeReturn: unknown;
  resumePosition: number;
  resumeOpenedAt: number;
  noHistorySave: boolean;
  browserSeason: number;
  streamError: string;
  streamMode: string;
  trackIndex: number;
  channelsOpen: boolean;
  infobar: boolean;
  infoTimer: ReturnType<typeof setTimeout> | null;
  searchQuery: string;
  searchNumeric: boolean;
  searchSeq: number;
  searchFocus: unknown;
  playback: PlaybackState;
  crOn: boolean;
  favs: Record<string, boolean>;
}

export function createAppState(): AppState {
  return {
    screen: "welcome",
    tab: 0,
    channel: 0,
    focus: null,
    detail: null,
    detailReturn: null,
    detailRange: 0,
    detailSeason: 0,
    detailEpisode: null,
    detailNeedsRebuild: false,
    playerReturn: null,
    playerMode: "live",
    playerItem: null,
    playerEpisode: null,
    playerSeasonIndex: 0,
    nextEpisodeOpen: false,
    nextEpisodeTimer: null,
    nextEpisodeTarget: null,
    nextEpisodeSeq: 0,
    nextEpisodeCountdown: 7,
    nextEpisodeDismissed: false,
    nextEpisodeGuardUntil: 0,
    episodeBrowserOpen: false,
    categoryPickerOpen: false,
    liveCategoriesOpen: false,
    liveSearchOpen: false,
    filterOpen: false,
    filterReturn: null,
    resumeOpen: false,
    resumeReturn: null,
    resumePosition: 0,
    resumeOpenedAt: 0,
    noHistorySave: false,
    browserSeason: 0,
    streamError: "",
    streamMode: "normal",
    trackIndex: 0,
    channelsOpen: false,
    infobar: true,
    infoTimer: null,
    searchQuery: "",
    searchNumeric: false,
    searchSeq: 0,
    searchFocus: null,
    playback: {
      streamMode: "normal",
      streamModes: {},
      screen: 0,
      audio: 0,
      audioCode: "",
      subLang: 0,
      subCode: "",
      size: 0,
      style: 0,
      subtitle: true
    },
    crOn: false,
    favs: {}
  };
}
