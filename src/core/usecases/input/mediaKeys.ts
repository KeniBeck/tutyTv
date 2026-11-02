export type LegacyMediaKey =
  | "play"
  | "pause"
  | "playpause"
  | "forward"
  | "rewind"
  | "stop"
  | "menu"
  | null;

export function mapLegacyMediaKey(
  keyCode: number | null | undefined,
  key: string | null | undefined
): LegacyMediaKey {
  const name = key || "";
  if (keyCode === 415 || name === "MediaPlay" || name === "Play") return "play";
  if (keyCode === 19 || name === "MediaPause" || name === "Pause") return "pause";
  if (keyCode === 10252 || name === "MediaPlayPause") return "playpause";
  if (keyCode === 417 || name === "MediaFastForward" || name === "FastForward") return "forward";
  if (keyCode === 412 || name === "MediaRewind" || name === "Rewind") return "rewind";
  if (keyCode === 413 || name === "MediaStop" || name === "Stop") return "stop";
  if (
    keyCode === 457 ||
    keyCode === 93 ||
    keyCode === 467 ||
    name === "Menu" ||
    name === "ContextMenu"
  ) {
    return "menu";
  }
  return null;
}
