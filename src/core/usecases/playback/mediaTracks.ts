import { selectTrackIndexByCodeOrPreference } from "./languagePreference";

export interface AudioTrack {
  index: number;
  code: string;
  label: string;
}

export interface SubtitleTrack {
  lang?: unknown;
  url?: unknown;
  format?: unknown;
}

export function splitTrackCodes(value: unknown): string[] {
  return String(value || "").split(/[,/]/).map((code) => String(code).trim());
}

export function selectAudioTrackIndex(
  audio: unknown,
  preferredCode: string | null | undefined,
  preference: number
): number {
  const codes = splitTrackCodes(audio);
  const index = selectTrackIndexByCodeOrPreference(codes, preferredCode, preference);
  return index >= 0 ? index : 0;
}

export function normalizeSubtitleTracks(mediaInfo: { subtitles?: unknown } | null | undefined): SubtitleTrack[] {
  const source = mediaInfo && Array.isArray(mediaInfo.subtitles) ? mediaInfo.subtitles : [];
  const tracks: SubtitleTrack[] = [];

  for (const item of source) {
    const track = item as SubtitleTrack;
    tracks.push({ lang: track.lang, url: track.url, format: track.format });
  }

  return tracks.sort((left, right) => {
    const leftSpanish = /^(es|spa|esp)$/i.test(String(left.lang || "")) ? 0 : 1;
    const rightSpanish = /^(es|spa|esp)$/i.test(String(right.lang || "")) ? 0 : 1;
    return leftSpanish - rightSpanish;
  });
}

export function chooseSubtitleTrack(
  tracks: ReadonlyArray<SubtitleTrack>,
  preferredCode: string | null | undefined,
  preference: number
): SubtitleTrack | null {
  if (!tracks.length) return null;
  const index = selectTrackIndexByCodeOrPreference(
    tracks.map((track) => String(track.lang || "")),
    preferredCode,
    preference
  );
  return index >= 0 ? tracks[index]! : tracks[0]!;
}

export function describeLanguageLabel(value: unknown): string {
  const code = String(value || "").toLowerCase().trim().split(/[-_]/)[0] || "";
  if (/^(spa|esp|es|castellano|latino)$/.test(code)) return "Español";
  if (/^(eng|ing|en)$/.test(code)) return "Inglés";
  if (/^(jpn|jap|ja)$/.test(code)) return "Japonés";
  if (/^(kor|cor|ko)$/.test(code)) return "Coreano";
  if (/^(por|pt)$/.test(code)) return "Portugués";
  if (/^(fra|fre|fr|franc)$/.test(code)) return "Francés";
  if (/^(ita|it)$/.test(code)) return "Italiano";
  if (/^(deu|ger|de)$/.test(code)) return "Alemán";
  if (/^(chi|zho|zh)$/.test(code)) return "Chino";
  return code ? code.charAt(0).toUpperCase() + code.slice(1) : "Pista";
}

export function parseAudioTracks(audio: unknown): AudioTrack[] {
  const codes = String(audio || "").split(/[,/]/);
  const tracks: AudioTrack[] = [];

  for (let index = 0; index < codes.length; index++) {
    const code = codes[index]!.trim();
    if (code) {
      tracks.push({ index, code, label: describeLanguageLabel(code) });
    }
  }

  return tracks;
}
