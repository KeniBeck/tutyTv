export type NativeRetry = "native-hls" | "compatible-vod" | null;

export function selectNativeRetry(
  code: number | null | undefined,
  playerMode: string,
  streamMode: string,
  isHls: boolean,
  nativeHls: boolean,
  hasItem: boolean
): NativeRetry {
  if (code === 4 && playerMode === "live" && isHls && !nativeHls) {
    return "native-hls";
  }
  if (code === 4 && playerMode === "vod" && streamMode === "normal" && hasItem) {
    return "compatible-vod";
  }
  return null;
}
