export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

export function parseSubtitleTimestamp(value: unknown): number {
  const parts = String(value ?? "").replace(",", ".").split(":");
  if (parts.length !== 3) return 0;
  return 3600 * parseFloat(parts[0] ?? "0")
    + 60 * parseFloat(parts[1] ?? "0")
    + parseFloat(parts[2] ?? "0");
}

export function findSubtitleCue(cues: SubtitleCue[] | null | undefined, time: number): SubtitleCue | null {
  for (const cue of cues || []) {
    if (time >= cue.start && time <= cue.end) return cue;
  }
  return null;
}

export function parseSubtitleCues(source: unknown): SubtitleCue[] {
  if (!source) return [];
  const blocks = String(source).replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n\n");
  const cues: SubtitleCue[] = [];

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 2) continue;

    const timeIndex = (lines[0] ?? "").indexOf("-->") !== -1 ? 0 : 1;
    const timeLine = lines[timeIndex] ?? "";
    if (timeLine.indexOf("-->") === -1) continue;

    const parts = timeLine.split("-->");
    const start = parseSubtitleTimestamp(parts[0]?.trim());
    const end = parseSubtitleTimestamp(parts[1]?.trim());
    const textLines = timeIndex === 0 ? lines.slice(1) : lines.slice(2);
    const text = textLines.join("<br>")
      .replace(/<font[^>]*>/gi, "")
      .replace(/<\/font>/gi, "")
      .trim();

    if (text) cues.push({ start, end, text });
  }

  return cues;
}
