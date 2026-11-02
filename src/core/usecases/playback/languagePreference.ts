export function matchesLanguagePreference(code: string, preference: string): boolean {
  const value = String(code || preference || "").toLowerCase();
  const pref = preference || "es";
  if (pref === "es") {
    return /^(es|spa|esp)|espa/.test(value);
  }
  if (pref === "pt") {
    return /^(pt|por)|portu/.test(value);
  }
  if (pref === "en") {
    return /^(en|eng|ing)|ingl/.test(value);
  }
  return false;
}

export function languagePreferenceIndex(code: string | null | undefined, fallback: number): number {
  const value = String(code || "");
  if (!value) return fallback;
  if (matchesLanguagePreference(value, "es")) return 0;
  if (matchesLanguagePreference(value, "pt")) return 1;
  if (matchesLanguagePreference(value, "en")) return 2;
  return fallback;
}

export function findTrackIndexByCode(codes: string[], code: string | null | undefined): number {
  const target = String(code || "").trim().toLowerCase();
  if (!target) return -1;
  for (let index = 0; index < codes.length; index++) {
    if (String(codes[index] ?? "").trim().toLowerCase() === target) {
      return index;
    }
  }
  return -1;
}

export function selectTrackIndexByCodeOrPreference(
  codes: string[],
  preferredCode: string | null | undefined,
  preference: number
): number {
  const exact = findTrackIndexByCode(codes, preferredCode);
  if (exact >= 0) return exact;

  const language = ["es", "pt", "en"][Number(preference) || 0] ?? "es";
  for (let index = 0; index < codes.length; index++) {
    if (matchesLanguagePreference(codes[index] ?? "", language)) {
      return index;
    }
  }
  return -1;
}
