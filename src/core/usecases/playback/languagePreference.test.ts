import { describe, expect, it } from "vitest";
import {
  findTrackIndexByCode,
  languagePreferenceIndex,
  matchesLanguagePreference,
  selectTrackIndexByCodeOrPreference
} from "./languagePreference";

describe("language preferences", () => {
  it("matches the legacy language aliases", () => {
    expect(matchesLanguagePreference("spa", "es")).toBe(true);
    expect(matchesLanguagePreference("Español", "es")).toBe(true);
    expect(matchesLanguagePreference("por", "pt")).toBe(true);
    expect(matchesLanguagePreference("eng", "en")).toBe(true);
    expect(matchesLanguagePreference("jpn", "en")).toBe(false);
    expect(matchesLanguagePreference("", "pt")).toBe(true);
  });

  it("maps track codes to the three stored preferences", () => {
    expect(languagePreferenceIndex("es", 9)).toBe(0);
    expect(languagePreferenceIndex("spa", 9)).toBe(0);
    expect(languagePreferenceIndex("pt-BR", 9)).toBe(1);
    expect(languagePreferenceIndex("eng", 9)).toBe(2);
    expect(languagePreferenceIndex("jpn", 9)).toBe(9);
    expect(languagePreferenceIndex("", 9)).toBe(9);
  });

  it("finds exact track codes case-insensitively", () => {
    expect(findTrackIndexByCode(["spa", "eng", "jpn"], "JPN")).toBe(2);
    expect(findTrackIndexByCode(["spa", "eng"], "por")).toBe(-1);
    expect(findTrackIndexByCode(["spa"], "")).toBe(-1);
  });

  it("prefers the exact stored code before the language preference", () => {
    expect(selectTrackIndexByCodeOrPreference(["spa", "eng", "jpn"], "jpn", 0)).toBe(2);
    expect(selectTrackIndexByCodeOrPreference(["spa", "eng"], "", 2)).toBe(1);
    expect(selectTrackIndexByCodeOrPreference(["jpn", "kor"], "", 0)).toBe(-1);
  });
});
