import { describe, expect, it } from "vitest";
import { combineSearchResults, findLocalSearchMatches } from "./catalogSearch";

describe("catalog search", () => {
  const items = [
    { id: "1", title: "Acción Total", alias: "" },
    { id: "2", title: "Otra", alias: "Serie Épica" },
    { id: "3", title: "Drama", alias: "" }
  ];

  it("finds local matches by normalized title or alias", () => {
    expect(findLocalSearchMatches(items, "accion")).toEqual([items[0]]);
    expect(findLocalSearchMatches(items, "epica")).toEqual([items[1]]);
    expect(findLocalSearchMatches(items, "  ")).toEqual([]);
    expect(findLocalSearchMatches(items, "nada")).toEqual([]);
  });

  it("combines local and remote results without duplicating ids", () => {
    const indexes: number[] = [];
    const result = combineSearchResults(
      [items[0]!],
      [{ id: "2", title: "Remoto 2" }, { id: "1", title: "Duplicado" }, { id: "3", title: "Remoto 3" }],
      (remote, index) => {
        indexes.push(index);
        return remote as typeof items[number];
      }
    );

    expect(result.map((item) => item.id)).toEqual(["1", "2", "3"]);
    expect(result[1]).toBeInstanceOf(Object);
    expect(indexes).toEqual([2, 3, 3]);
  });
});
