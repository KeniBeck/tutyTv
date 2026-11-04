export interface ViewerProfile {
  id: string;
  createdAt: number;
  history: unknown[];
  reminders?: Record<string, unknown>;
  favs?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface EnsureViewerProfileResult {
  profile: ViewerProfile;
  created: boolean;
}

export function createViewerProfileId(now: number): string {
  return "TV-" + String(now).slice(-8);
}

export function ensureViewerProfile(
  base: ViewerProfile,
  stored: unknown,
  now: number
): EnsureViewerProfileResult {
  const candidate = stored as ViewerProfile | null;
  if (candidate && typeof candidate === "object" && candidate.id) {
    if (!(candidate.history && candidate.history.length)) {
      candidate.history = [];
    }
    return { profile: candidate, created: false };
  }

  base.id = createViewerProfileId(now);
  base.createdAt = now;
  if (!(base.history && base.history.length)) {
    base.history = [];
  }
  return { profile: base, created: true };
}
