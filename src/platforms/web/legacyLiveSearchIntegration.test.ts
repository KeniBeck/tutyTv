import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import * as core from "../shared/legacyCoreBridge";

const source = readFileSync(new URL(
  "../../../source/usr/palm/applications/com.webosflux.xuptertv.fidelity/js/app.js",
  import.meta.url
), "utf8");
const liveListSource = readFileSync(new URL(
  "../../ui/screens/home/liveList.ts",
  import.meta.url
), "utf8");
const liveMenuSource = readFileSync(new URL(
  "../../ui/screens/home/liveMenu.ts",
  import.meta.url
), "utf8");

const snippet = [
  source.match(/ {4}function o\(e\) \{[\s\S]*?\n {4}\}/)?.[0],
  source.match(
    / {4}function legacyFilterLiveChannels\([\s\S]*?(?= {4}function Ft\()/
  )?.[0]
].join("\n");

interface Channel {
  name: string;
  logo?: string;
  favorite?: boolean;
  channelCode?: string;
}

describe("legacy live TV search integration", () => {
  it("keeps live filtering and search connected to Core helpers", () => {
    expect(liveListSource).toMatch(/runtime\.filterChannels\(favoritesOnly\)/);
    expect(liveMenuSource).toMatch(/findLiveSearchMatches\(host\.getChannels\(\), categories, searchQuery\)/);
    expect(source).toMatch(/legacySelectNewLiveChannels\(F, l\)/);
    expect(liveMenuSource).toMatch(/match\.channel\.logo/);
    expect(liveMenuSource).toMatch(/host\.selectChannel\(match\.index, true\)/);
  });

  it.each([true, false])("preserves favorites, indexes, accents and category search (core available: %s)", (withCore) => {
    expect(snippet).toBeTruthy();
    const runtime = runInNewContext(
      `${snippet}\n({ legacyFilterLiveChannels, legacySelectNewLiveChannels })`,
      { window: { TutyCore: withCore ? core : undefined } }
    ) as {
      legacyFilterLiveChannels(
        channels: Channel[],
        favoritesOnly: boolean,
        isFavorite: (channel: Channel) => boolean
      ): Array<{ channel: Channel; index: number }>;
      legacySelectNewLiveChannels(current: Channel[], incoming: Channel[]): Channel[];
    };

    const channels: Channel[] = [
      { name: "Café Uno", favorite: true },
      { name: "Canal Dos" },
      { name: "Cine Acción", favorite: true }
    ];
    expect(runtime.legacyFilterLiveChannels(channels, true, (channel) => Boolean(channel.favorite))).toEqual([
      { channel: channels[0], index: 0 },
      { channel: channels[2], index: 2 }
    ]);
    expect(runtime.legacyFilterLiveChannels(channels, false, () => false)).toEqual([
      { channel: channels[0], index: 0 },
      { channel: channels[1], index: 1 },
      { channel: channels[2], index: 2 }
    ]);
    const firstB = { name: "B", channelCode: "b" };
    const noCode = { name: "No code" };
    expect(runtime.legacySelectNewLiveChannels(
      [{ name: "A", channelCode: "a" }],
      [firstB, { name: "A duplicate", channelCode: "a" }, { name: "B duplicate", channelCode: "b" }, noCode]
    )).toEqual([firstB, noCode]);
  });
});
