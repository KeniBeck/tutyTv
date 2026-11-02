import { describe, expect, it } from "vitest";
import { groupCatalogSeries, mergePortalRoots } from "./catalogGrouping";

describe("catalog grouping", () => {
  it("groups series seasons by normalized title and sorts them", () => {
    const movie = { id: "movie", title: "Peli", type: "movie" };
    const seasonTwo = {
      id: "s2",
      title: "Serie Temporada 2",
      type: "series",
      category: "Drama",
      seasons: []
    };
    const seasonOne = {
      id: "s1",
      title: "Serie Temporada 1",
      type: "series",
      category: "Acción,Drama",
      seasons: []
    };
    const result = groupCatalogSeries([movie, seasonTwo, seasonOne]);

    expect(result).toHaveLength(2);
    expect(result[0]).toBe(movie);
    expect(result[1]).toMatchObject({
      id: "s1",
      title: "Serie",
      alias: "Serie",
      _seriesGroup: true,
      _seriesTitle: "Serie",
      category: "Acción,Drama"
    });
    expect(result[1]?.seasons).toEqual([
      { id: "s1", number: 1, title: "Serie" },
      { id: "s2", number: 2, title: "Serie" }
    ]);
    expect(result[1]?._catalogSeasons).toEqual(result[1]?.seasons);
  });

  it("keeps singleton seasons and non-series items without grouping", () => {
    const single = { id: "s1", title: "Otra Serie S01", type: "series" };
    const movie = { id: "m1", title: "Peli", type: "movie" };
    const result = groupCatalogSeries([single, movie]);
    expect(result).toEqual([movie, single]);
  });
});

describe("portal merge", () => {
  it("merges duplicate roots, unions categories and appends bundled items", () => {
    const first = { id: "1", title: "Uno", category: "Drama", poster: "" };
    const second = { id: "1", title: "", category: "Acción", synopsis: "Sinopsis", poster: "p.jpg" };
    const other = { id: "2", title: "Dos", category: "Comedia" };
    const bundled = { id: "local", title: "Local", streamUrl: "video.mp4", category: "otro" };
    const skipped = { id: "local2", title: "Sin URL" };

    const result = mergePortalRoots(
      { movies: [first], series: [second, other] },
      ["movies", "series"],
      [bundled, skipped]
    );

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      id: "1",
      title: "Uno",
      category: "Drama,Acción",
      synopsis: "Sinopsis",
      poster: "p.jpg",
      portal: true
    });
    expect(result[1]).toMatchObject({ id: "2", portal: true });
    expect(result[2]).toEqual({
      id: "local",
      title: "Local",
      streamUrl: "video.mp4",
      category: "demo",
      portal: false
    });
  });

  it("returns an empty collection when there are no portal roots", () => {
    expect(mergePortalRoots({}, ["movies"], [{ id: "local", streamUrl: "x" }])).toEqual([]);
    expect(mergePortalRoots({ movies: [] }, ["movies"], [])).toEqual([]);
  });
});
