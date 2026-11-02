export interface RelayResume {
  url: string;
  consumed: boolean;
}

export function isRelayStreamMode(mode: string): boolean {
  return mode === "relay" || mode === "smooth";
}

export function shouldForceRelay(mode: string, resumeAt: number): boolean {
  return isRelayStreamMode(mode) || resumeAt > 0;
}

export function applyRelayResumeStart(url: string, resumeAt: number): RelayResume {
  if (!(resumeAt > 0) || !/\/s\/[0-9a-f]+\.mp4/i.test(url)) {
    return { url, consumed: false };
  }

  const separator = url.indexOf("?") !== -1 ? "&" : "?";
  return { url: `${url}${separator}start=${Math.floor(resumeAt)}`, consumed: true };
}
