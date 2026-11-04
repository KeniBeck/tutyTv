import { describe, expect, it } from "vitest";
import { normalizeText } from "./normalizeText";

describe("normalizeText", () => {
  it("lowercases and removes accents", () => {
    expect(normalizeText("Acción")).toBe("accion");
    expect(normalizeText("PELÍCULA")).toBe("pelicula");
  });

  it("handles nullish input", () => {
    expect(normalizeText(null)).toBe("");
    expect(normalizeText(undefined)).toBe("");
  });
});
