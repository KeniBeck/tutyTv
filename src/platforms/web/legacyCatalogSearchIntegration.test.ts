import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const searchSource = readFileSync(new URL(
  "../../ui/screens/search/searchScreen.ts",
  import.meta.url
), "utf8");


describe("legacy catalog search integration", () => {
  it("keeps the search UI connected to the Core helpers", () => {
    expect(searchSource).toMatch(/findLocalSearchMatches\(host\.getCatalog\(\), value\)/);
    expect(searchSource).toMatch(/combineSearchResults\(local, response\.items, function normalize\(item, index\)/);
  });

});
