export function relayDurationEndpoint(proxyPath: string): string | null {
  const match = /^(https?:\/\/[^/]+)\/s\/([0-9a-fA-F]+)\.mp4(?:[?#].*)?$/.exec(String(proxyPath || ""));
  if (!match) return null;
  return `${match[1]}/duration/${match[2]}`;
}
