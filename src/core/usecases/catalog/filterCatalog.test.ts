import { describe, expect, it } from "vitest";
import { filterCatalogByQuery } from "./filterCatalog";
import type { MediaItem } from "../../models/media";

const sample: MediaItem[] = [
  {
    id: "1",
    title: "Accion Total",
    kind: "movie",
    category: "pelicula",
    genres: ["accion"]
  },
  {
    id: "2",
    title: "Serie Familiar",
    kind: "series",
    category: "serie",
    genres: ["familiar"]
  }
];

describe("filterCatalogByQuery", () => {
  it("returns all items when query is empty", () => {
    expect(filterCatalogByQuery(sample, "")).toHaveLength(2);
  });

  it("finds items by normalized text", () => {
    expect(filterCatalogByQuery(sample, "accion")).toHaveLength(1);
    expect(filterCatalogByQuery(sample, "ACCION")).toHaveLength(1);
  });
});
