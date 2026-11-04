import { describe, expect, it } from "vitest";
import { filterMatches } from "./filterMatches";

const movie = {
  category: "destacado,pelicula",
  genres: ["Acción", "Drama"],
  kind: "película"
};

describe("filterMatches", () => {
  it("accepts the wildcard", () => {
    expect(filterMatches(movie, "*")).toBe(true);
  });

  it("matches a category regardless of accents and case", () => {
    expect(filterMatches(movie, "cat:pelicula")).toBe(true);
    expect(filterMatches(movie, "cat:Película")).toBe(true);
    expect(filterMatches(movie, "cat:serie")).toBe(false);
  });

  it("falls back to kind when category does not match", () => {
    expect(filterMatches({ kind: "serie" }, "cat:Serie")).toBe(true);
  });

  it("matches genres", () => {
    expect(filterMatches(movie, "gen:accion")).toBe(true);
    expect(filterMatches(movie, "gen:comedia")).toBe(false);
  });
});
