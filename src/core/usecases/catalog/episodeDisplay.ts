export function episodeDisplayTitle(series: unknown, episode: unknown, index: number): string {
  const item = (episode ?? {}) as { number?: unknown; title?: unknown; name?: unknown };
  const number = item.number !== undefined && item.number !== null ? item.number : index + 1;
  let name = String(item.title || item.name || "").trim();
  const seriesTitle = String((series as { title?: unknown } | null)?.title || "")
    .trim()
    .replace(/[\s\-–_]*[TtSs]\d+$/, "");

  if (seriesTitle && name.indexOf(seriesTitle) === 0) {
    name = name.substring(seriesTitle.length);
  }
  name = name.replace(/^[\s\-–_:.]+/, "").trim();
  if (!name || /^(?:[TtSs]?\d+[\s\-–_.:]*)+$/.test(name)) {
    name = "Episodio " + number;
  }
  return name;
}

export function formatEpisodeDuration(value: unknown): string {
  const text = String(value || "").trim();
  const match = /^(\d+):(\d+)(?::(\d+))?$/.exec(text);
  if (!match) return text;
  if (match[3]) {
    return (parseInt(match[1] ?? "0", 10) || 0) + " h "
      + (parseInt(match[2] ?? "0", 10) || 0) + " min";
  }
  return (parseInt(match[1] ?? "0", 10) || 0) + " min";
}
