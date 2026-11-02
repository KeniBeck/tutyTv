import { describe, expect, it, vi } from "vitest";
import { filterLiveChannels, findLiveSearchMatches, selectNewLiveChannels } from "./liveChannels";

describe("live channel filtering", () => {
  const channels = [{ name: "Uno" }, { name: "Dos" }, { name: "Tres" }];

  it("keeps original indexes and order", () => {
    expect(filterLiveChannels(channels, false, () => false)).toEqual([
      { channel: channels[0], index: 0 },
      { channel: channels[1], index: 1 },
      { channel: channels[2], index: 2 }
    ]);
  });

  it("filters favorites without changing their original indexes", () => {
    const isFavorite = vi.fn((channel: { name: string }) => channel.name !== "Dos");

    expect(filterLiveChannels(channels, true, isFavorite)).toEqual([
      { channel: channels[0], index: 0 },
      { channel: channels[2], index: 2 }
    ]);
    expect(isFavorite.mock.calls.map(([channel]) => channel.name)).toEqual(["Uno", "Dos", "Tres"]);
  });
});

describe("live channel search", () => {
  const channels = [
    { name: "Café Uno" },
    { name: "Canal Dos" },
    { name: "Cine Acción" },
    { name: "Cine Drama" }
  ];
  const categories = [
    { name: "Cine" },
    { name: "Deportes" },
    { name: "Cine clásico" }
  ];

  it("normalizes accents and case while preserving source order", () => {
    expect(findLiveSearchMatches(channels, categories, "CAFE")).toEqual({
      channels: [{ channel: channels[0], index: 0 }],
      categories: []
    });
  });

  it("finds channels and categories with the legacy limits", () => {
    const result = findLiveSearchMatches(channels, categories, "cine");

    expect(result.channels.map((item) => item.index)).toEqual([2, 3]);
    expect(result.categories).toEqual([categories[0], categories[2]]);
  });

  it("returns all channels up to the limit when the query is empty", () => {
    expect(findLiveSearchMatches(channels, categories, "")).toEqual({
      channels: channels.map((channel, index) => ({ channel, index })),
      categories: []
    });
  });

  it("applies explicit channel and category limits", () => {
    expect(findLiveSearchMatches(channels, categories, "", { channels: 2 })).toEqual({
      channels: [
        { channel: channels[0], index: 0 },
        { channel: channels[1], index: 1 }
      ],
      categories: []
    });
    expect(findLiveSearchMatches(channels, categories, "cine", { categories: 1 }).categories).toEqual([
      categories[0]
    ]);
  });
});

interface TestLiveChannel {
  channelCode?: string;
  name?: string;
}

describe("live channel pagination merge", () => {
  it("keeps first occurrences and skips codes already loaded", () => {
    const current: TestLiveChannel[] = [{ channelCode: "a", name: "A" }];
    const firstB: TestLiveChannel = { channelCode: "b", name: "B" };
    const secondB: TestLiveChannel = { channelCode: "b", name: "B duplicate" };
    const noCode: TestLiveChannel = { name: "No code" };
    const incoming: TestLiveChannel[] = [
      firstB,
      { channelCode: "a", name: "A duplicate" },
      secondB,
      noCode
    ];

    expect(selectNewLiveChannels(current, incoming)).toEqual([firstB, noCode]);
  });

  it("ignores empty entries while preserving object identity", () => {
    const incoming: TestLiveChannel = { channelCode: "c", name: "C" };
    const current: Array<TestLiveChannel | null | undefined> = [null, undefined, { channelCode: "a" }];
    const incomingList: Array<TestLiveChannel | null | undefined> = [null, incoming];

    expect(selectNewLiveChannels(current, incomingList)).toEqual([incoming]);
    expect(selectNewLiveChannels([], [incoming])[0]).toBe(incoming);
  });
});
