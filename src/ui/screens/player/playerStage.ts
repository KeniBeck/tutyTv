import type { AppState } from "../../runtime/state";

export interface PlayerStageNode {
  id?: string;
  textContent?: string | null;
  innerHTML?: string;
  style: Record<string, string | number | undefined>;
  classList: {
    add(name: string): void;
    remove(name: string): void;
    toggle(name: string, force?: boolean): void;
  };
  appendChild(node: PlayerStageNode): void;
  querySelector(selector: string): PlayerStageNode | null;
  querySelectorAll(selector: string): ArrayLike<PlayerStageNode>;
  getAttribute?(name: string): string | null;
  offsetLeft?: number;
  offsetWidth?: number;
  _activate?: (() => void) | null;
  _onMove?: ((direction: string) => boolean) | null;
}

export interface PlayerStageChannel {
  [key: string]: unknown;
}

export interface PlayerStageRefs {
  stage: PlayerStageNode | null;
  infobar: PlayerStageNode | null;
  vodInfobar: PlayerStageNode | null;
  channels: PlayerStageNode | null;
  categories: PlayerStageNode | null;
  categoryGrid: PlayerStageNode | null;
  categorySub: PlayerStageNode | null;
  video: PlayerStageNode | null;
  status: PlayerStageNode | null;
  nextEpisodeLoading: PlayerStageNode | null;
  osd: PlayerStageNode | null;
  frame: PlayerStageNode | null;
  vodPoster: PlayerStageNode | null;
  vodTitle: PlayerStageNode | null;
  vodCurrent: PlayerStageNode | null;
  vodTotal: PlayerStageNode | null;
  seekbar: PlayerStageNode | null;
  seekProgress: PlayerStageNode | null;
  seekBuffered: PlayerStageNode | null;
  seekThumb: PlayerStageNode | null;
  playSettingsView: PlayerStageNode | null;
  btnEpisodes: PlayerStageNode | null;
  btnConfig: PlayerStageNode | null;
  btnPlayer1: PlayerStageNode | null;
  btnPlayer2: PlayerStageNode | null;
  btnFeedback: PlayerStageNode | null;
  aspectRow: PlayerStageNode | null;
  episodeBrowser: PlayerStageNode | null;
  episodeTitle: PlayerStageNode | null;
  episodeSub: PlayerStageNode | null;
  episodeSeasons: PlayerStageNode | null;
  episodeSeasonsColumn: PlayerStageNode | null;
  episodeEpisodes: PlayerStageNode | null;
  episodeSeasonLabel: PlayerStageNode | null;
  audioOptions: PlayerStageNode | null;
  subtitles: PlayerStageNode | null;
}

export interface PlayerStageHost {
  state: AppState;
  byId(id: string): PlayerStageNode | null;
  el(tag: string, className?: string, text?: string): PlayerStageNode;
  clear(node: PlayerStageNode): void;
  focus(node: PlayerStageNode): void;
  openSeek(force: boolean): void;
  stepSeek(delta: number): void;
  stepVodSeek(delta: number): void;
  startSeek(): void;
  openPlaySettings(): void;
  openFullSettings(): void;
  openEpisodeBrowser(): void;
  schedulePlaySettingsClose(): void;
  setSmooth(smooth: boolean): void;
  refreshStreamModeButtons(): void;
  reloadStreamMode(): void;
  applyAspect(value: string): void;
  applySubtitleDisplay(): void;
  savePlaybackPreferences(): void;
  openChannels(): void;
  closeChannels(): void;
  selectLiveChannel(index: number, force?: boolean): void;
  hideInfobar(): void;
  showInfobar(): void;
  togglePlayPause(): void;
  renderLiveCategories(): void;
  renderLiveChannels(): void;
  toggleFavorite(channel: PlayerStageChannel): void;
  refreshLiveList(favoritesOnly: boolean): void;
  isFavoritesOnly(): boolean;
  getChannels(): PlayerStageChannel[];
}

export function buildPlayerStage(host: PlayerStageHost): PlayerStageRefs {
  const stage = host.byId("player-stage");
  const infobar = host.byId("player-infobar");
  const vodInfobar = host.byId("player-vod-infobar");
  const channels = host.byId("player-channels");
  const categories = host.byId("player-categories");
  const categoryGrid = host.byId("pcat-grid");
  const categorySub = host.byId("pcat-sub");
  const video = host.byId("player-video");
  const status = host.byId("player-status");
  const nextEpisodeLoading = host.byId("next-episode-loading");
  const osd = host.byId("player-osd-icon");
  const frame = stage ? stage.querySelector(".player-frame") : null;
  const vodPoster = host.byId("vod-infobar-poster");
  const vodTitle = host.byId("vod-infobar-title");
  const vodCurrent = host.byId("vod-time-current");
  const vodTotal = host.byId("vod-time-total");
  const seekbar = host.byId("vod-seekbar");
  const seekProgress = host.byId("vod-seek-progress");
  const seekBuffered = host.byId("vod-seek-buffered");
  const seekThumb = host.byId("vod-seek-thumb");

  if (seekbar) {
    seekbar.classList.add("focusable");
    seekbar._activate = function activateSeekbar() {
      host.openSeek(true);
    };
    seekbar._onMove = function moveSeekbar(direction: string): boolean {
      if (direction === "left") {
        host.stepSeek(-1);
        return true;
      }
      if (direction === "right") {
        host.stepSeek(1);
        return true;
      }
      if (direction === "down" || direction === "up") {
        host.openSeek(false);
        return true;
      }
      return false;
    };
  }

  const playSettingsView = host.byId("player-playsetting-view");
  const btnEpisodes = host.byId("psv-btn-episodes");
  const btnConfig = host.byId("psv-btn-config");
  const btnPlayer1 = host.byId("psv-btn-p1");
  const btnPlayer2 = host.byId("psv-btn-p2");
  host.byId("psv-sec-quality");
  host.byId("psv-quality-row");
  host.byId("psv-sec-aspect");
  host.byId("psv-sec-player");
  const btnFeedback = host.byId("psv-btn-feedback");
  const aspectRow = host.byId("psv-aspect-row");
  const episodeBrowser = host.byId("player-episodes");
  const episodeTitle = host.byId("pe-title");
  const episodeSub = host.byId("pe-sub");
  const episodeSeasons = host.byId("pe-seasons");
  const episodeSeasonsColumn = host.byId("pe-seasons-col");
  const episodeEpisodes = host.byId("pe-episodes");
  const episodeSeasonLabel = host.byId("pe-season-label");

  if (btnEpisodes) {
    btnEpisodes._activate = function openEpisodes() {
      host.openEpisodeBrowser();
    };
  }
  if (btnFeedback) {
    btnFeedback._activate = function closeFeedback() {
      host.schedulePlaySettingsClose();
    };
  }
  if (btnConfig) {
    btnConfig._activate = function openConfig() {
      host.openFullSettings();
    };
  }
  if (btnPlayer1) {
    btnPlayer1._activate = function selectPlayer1() {
      host.setSmooth(true);
      host.refreshStreamModeButtons();
      host.schedulePlaySettingsClose();
      host.reloadStreamMode();
    };
  }
  if (btnPlayer2) {
    btnPlayer2._activate = function selectPlayer2() {
      host.setSmooth(false);
      host.refreshStreamModeButtons();
      host.schedulePlaySettingsClose();
      host.reloadStreamMode();
    };
  }
  if (aspectRow) {
    const aspectButtons = aspectRow.querySelectorAll(".psv-btn");
    for (let index = 0; index < aspectButtons.length; index += 1) {
      const button = aspectButtons[index];
      if (!button) {
        continue;
      }
      button._activate = function applyAspectButton() {
        host.applyAspect(button.getAttribute?.("data-aspect") || "");
      };
    }
  }

  const audioOptions = host.byId("dps-audio-options");
  const subtitles = host.byId("player-subtitles");
  host.applySubtitleDisplay();
  host.savePlaybackPreferences();
  if (infobar) {
    host.clear(infobar);
  }
  if (channels) {
    host.clear(channels);
  }

  if (stage) {
    stage.classList.add("focusable");
    stage._onMove = function moveStage(direction: string): boolean {
      if (host.state.playerMode === "vod") {
        if (direction === "left") {
          host.stepVodSeek(-10);
          return true;
        }
        if (direction === "right") {
          host.stepVodSeek(10);
          return true;
        }
        if (direction === "down") {
          host.openPlaySettings();
          return true;
        }
        if (direction === "up") {
          host.startSeek();
          return true;
        }
        return false;
      }
      if (direction === "left") {
        host.openChannels();
        return true;
      }
      if (direction === "right") {
        host.closeChannels();
        return true;
      }
      if (direction === "up") {
        host.selectLiveChannel(host.state.channel - 1);
        return true;
      }
      if (direction === "down") {
        host.selectLiveChannel(host.state.channel + 1);
        return true;
      }
      return false;
    };
    stage._activate = function activateStage() {
      if (host.state.playerMode !== "vod") {
        if (host.state.infobar) {
          host.hideInfobar();
        } else {
          host.showInfobar();
        }
      } else {
        host.togglePlayPause();
      }
    };
  }

  if (infobar) {
    infobar.appendChild(host.el("div", "pi-logo"));
    infobar.appendChild(host.el("div", "pi-index"));
    const nameRow = host.el("div", "pi-namerow");
    nameRow.appendChild(host.el("div", "pi-name"));
    const uhd = host.el("div", "pi-uhd");
    uhd.style.left = "20px";
    nameRow.appendChild(uhd);
    infobar.appendChild(nameRow);
    infobar.appendChild(host.el("div", "pi-date"));
    infobar.appendChild(host.el("div", "pi-range"));
    infobar.appendChild(host.el("div", "pi-now"));
    infobar.appendChild(host.el("div", "pi-next"));
    const seek = host.el("div", "pi-seek");
    seek.appendChild(host.el("div", "bar"));
    infobar.appendChild(seek);
    infobar.appendChild(host.el("div", "pi-menu", "info"));
    infobar.appendChild(host.el("div", "pi-quality", "HD"));
    infobar.appendChild(host.el("div", "pi-scale", "Normal"));
    infobar.appendChild(host.el("div", "pi-func", "Selecion de función"));

    const actions = host.el("div", "pi-actions");
    const entries = [
      { label: "Pip", right: 446, width: 67, hidden: true },
      { label: "HD", right: 389, width: 67 },
      { label: "Anterior", right: 333, width: 67 },
      { label: "Formato", right: 249, width: 120 },
      { label: "Favorito", right: 219, width: 67 },
      { label: "Reproductor 1", right: 151, width: 90 },
      { label: "Bloquear", right: 107, width: 67 },
      { label: "Feedback", right: 50, width: 67 }
    ];
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index] as typeof entries[number];
      if (entry.hidden) {
        continue;
      }
      const action = host.el("div", "pi-act focusable", entry.label);
      action.style.width = `${1.5 * entry.width}px`;
      action.style.left = `${1920 - 1.5 * entry.right - 1.5 * entry.width}px`;
      action._activate = function activateAction() {
        if (!infobar) {
          return;
        }
        if (entry.label === "Anterior") {
          host.selectLiveChannel(host.state.channel - 1);
        } else if (entry.label === "Formato") {
          const scale = infobar.querySelector(".pi-scale");
          if (!scale) {
            return;
          }
          scale.textContent =
            scale.textContent === "Normal" ? "16:9" : scale.textContent === "16:9" ? "4:3" : "Normal";
          positionInfobarMeta(infobar);
        } else if (entry.label === "Favorito") {
          const channel = host.getChannels()[host.state.channel];
          if (channel) {
            host.toggleFavorite(channel);
            host.refreshLiveList(host.isFavoritesOnly());
          }
        }
      };
      actions.appendChild(action);
    }
    infobar.appendChild(actions);
  }

  if (channels) {
    const header = host.el("div", "pc-header");
    header.appendChild(host.el("div", "pc-title", "Canales de TV"));
    channels.appendChild(header);
    const categoryContainer = host.el("div", "pc-categories scrollable");
    categoryContainer.id = "pc-categories";
    channels.appendChild(categoryContainer);
    channels.appendChild(host.el("div", "pc-div"));
    const list = host.el("div", "pc-list scrollable");
    channels.appendChild(list);
    host.renderLiveCategories();
    host.renderLiveChannels();
    const menu = host.el("div", "pc-menu");
    menu.appendChild(host.el("div", "ic"));
    menu.appendChild(host.el("div", "l1", "Presione [OK] para reproducir"));
    menu.appendChild(host.el("div", "l2", "(Arriba: Categorías · OK: Filtrar)"));
    channels.appendChild(menu);
  }

  return {
    stage,
    infobar,
    vodInfobar,
    channels,
    categories,
    categoryGrid,
    categorySub,
    video,
    status,
    nextEpisodeLoading,
    osd,
    frame,
    vodPoster,
    vodTitle,
    vodCurrent,
    vodTotal,
    seekbar,
    seekProgress,
    seekBuffered,
    seekThumb,
    playSettingsView,
    btnEpisodes,
    btnConfig,
    btnPlayer1,
    btnPlayer2,
    btnFeedback,
    aspectRow,
    episodeBrowser,
    episodeTitle,
    episodeSub,
    episodeSeasons,
    episodeSeasonsColumn,
    episodeEpisodes,
    episodeSeasonLabel,
    audioOptions,
    subtitles
  };
}

function positionInfobarMeta(infobar: PlayerStageNode): void {
  const quality = infobar.querySelector(".pi-quality");
  const scale = infobar.querySelector(".pi-scale");
  const func = infobar.querySelector(".pi-func");
  if (quality && scale && func) {
    quality.style.left = "517.5px";
    scale.style.left = `${(quality.offsetLeft || 0) + (quality.offsetWidth || 0) + 30}px`;
    func.style.left = `${(scale.offsetLeft || 0) + (scale.offsetWidth || 0) + 30}px`;
  }
}
