import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppState } from "../../runtime/state";
import {
  attachPlayerInfoContent,
  renderPlayerInfoContent,
  resetPlayerInfoContentRuntime,
  type InfoNode,
  type PlayerInfoContentHost
} from "./playerInfoContent";

function createNode(
  selectors: Record<string, InfoNode> = {},
  text = ""
): InfoNode & { classes: Set<string> } {
  const classes = new Set<string>();
  return {
    textContent: text,
    classes,
    style: {},
    offsetWidth: 100,
    classList: {
      add(name: string) {
        classes.add(name);
      },
      remove(name: string) {
        classes.delete(name);
      },
      toggle(name: string, force?: boolean) {
        const next = force === undefined ? !classes.has(name) : force;
        if (next) {
          classes.add(name);
        } else {
          classes.delete(name);
        }
      }
    },
    querySelector(selector: string) {
      return selectors[selector] || null;
    }
  };
}

function createHarness() {
  const state = createAppState();
  state.screen = "player";
  state.playerMode = "live";
  state.channel = 2;
  const index = createNode();
  const name = createNode();
  const date = createNode();
  const range = createNode();
  const now = createNode();
  const next = createNode();
  const uhd = createNode();
  const logo = createNode();
  const rowName = createNode();
  const rowUhd = createNode();
  const row = createNode({ ".pi-name": rowName, ".pi-uhd": rowUhd });
  const liveBar = createNode({
    ".pi-index": index,
    ".pi-name": name,
    ".pi-date": date,
    ".pi-range": range,
    ".pi-now": now,
    ".pi-next": next,
    ".pi-uhd": uhd,
    ".pi-logo": logo,
    ".pi-namerow": row
  });
  const vodBar = createNode();
  vodBar.classes.add("is-active");
  const vodTitle = createNode();
  const vodPoster = { src: "" };
  const syncChannelTabs = vi.fn();
  const layoutLiveQuality = vi.fn();
  const updateProgress = vi.fn();
  const video = { currentTime: 30, duration: 100 };
  const item = { title: "Serie", poster: "poster.jpg" };
  const channel = {
    index: 3,
    name: "Canal Tres",
    time: "20:00",
    now: "Ahora",
    next: "Después",
    uhd: true,
    logo: "logo.png"
  };
  const host: PlayerInfoContentHost = {
    state,
    getLiveBar: () => liveBar,
    getVodBar: () => vodBar,
    getVodTitle: () => vodTitle,
    getVodPoster: () => vodPoster,
    getChannels: () => [channel],
    getCatalog: () => [item],
    getVideo: () => video,
    isSeries: () => true,
    syncChannelTabs,
    layoutLiveQuality,
    updateProgress
  };
  attachPlayerInfoContent(host);
  return {
    state,
    index,
    name,
    date,
    range,
    now,
    next,
    uhd,
    logo,
    row,
    rowName,
    rowUhd,
    liveBar,
    vodBar,
    vodTitle,
    vodPoster,
    item,
    host,
    syncChannelTabs,
    layoutLiveQuality,
    updateProgress
  };
}

afterEach(() => {
  resetPlayerInfoContentRuntime();
  vi.clearAllMocks();
});

describe("playerInfoContent", () => {
  it("renders the live channel info and layout", () => {
    const harness = createHarness();
    harness.state.channel = 0;

    expect(renderPlayerInfoContent()).toBe(true);

    expect(harness.vodBar.classes.has("is-active")).toBe(false);
    expect(harness.liveBar.style.display).toBe("");
    expect(harness.index.textContent).toBe("03");
    expect(harness.index.style.display).toBe("block");
    expect(harness.name.textContent).toBe("Canal Tres");
    expect(harness.date.textContent).toBe("Hoy");
    expect(harness.range.textContent).toBe("20:00");
    expect(harness.now.textContent).toBe("Ahora");
    expect(harness.next.textContent).toBe("Siguiente: Después");
    expect(harness.next.style.display).toBe("block");
    expect(harness.uhd.style.display).toBe("block");
    expect(harness.logo.style.backgroundImage).toBe("url(logo.png)");
    expect(harness.row.style.width).toBe("480px");
    expect(harness.rowName.style.lineHeight).toBe("50px");
    expect(harness.rowUhd.style.left).toBe("130px");
    expect(harness.syncChannelTabs).toHaveBeenCalledTimes(1);
    expect(harness.layoutLiveQuality).toHaveBeenCalledTimes(1);
  });

  it("hides optional live fields when the channel has no data", () => {
    const harness = createHarness();
    harness.host.getChannels = () => [{ name: "Canal" }];
    harness.state.channel = 0;

    renderPlayerInfoContent();

    expect(harness.index.textContent).toBe("01");
    expect(harness.next.style.display).toBe("none");
    expect(harness.uhd.style.display).toBe("none");
    expect(harness.logo.style.backgroundImage).toBe("");
  });

  it("renders the VOD title, poster and progress", () => {
    const harness = createHarness();
    harness.state.playerMode = "vod";
    harness.state.playerItem = harness.item;
    harness.state.playerEpisode = { title: "El inicio", number: 2 };

    renderPlayerInfoContent();

    expect(harness.liveBar.style.display).toBe("none");
    expect(harness.liveBar.classes.has("is-active")).toBe(false);
    expect(harness.vodTitle.textContent).toBe("Serie - El inicio");
    expect(harness.vodPoster.src).toBe("poster.jpg");
    expect(harness.updateProgress).toHaveBeenCalledWith(30, 100);
  });

  it("uses the episode number and catalog fallback when needed", () => {
    const harness = createHarness();
    harness.state.playerMode = "vod";
    harness.state.playerItem = { title: "Serie" };
    harness.state.playerEpisode = { number: 4 };

    renderPlayerInfoContent();

    expect(harness.vodTitle.textContent).toBe("Serie - Capítulo 4");
    expect(harness.vodPoster.src).toBe("assets/original/common/bg_placehoder_vertical.png");
  });

  it("uses the catalog item when no player item is available", () => {
    const harness = createHarness();
    harness.state.playerMode = "vod";
    harness.state.playerItem = null;
    harness.host.isSeries = () => false;

    renderPlayerInfoContent();

    expect(harness.vodTitle.textContent).toBe("Serie");
  });

  it("returns false without the runtime", () => {
    resetPlayerInfoContentRuntime();
    expect(renderPlayerInfoContent()).toBe(false);
  });
});
