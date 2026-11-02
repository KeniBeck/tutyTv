interface ClassListLike {
  add(token: string): void;
  remove(token: string): void;
}

interface StyleLike {
  display: string;
}

export interface PlaybackSurfaceTarget {
  classList?: ClassListLike | null;
  style?: StyleLike | null;
}

export interface PlayerStatusTarget {
  classList?: ClassListLike | null;
  textContent?: string | null;
}

export function applyPlaybackSurface(
  video: PlaybackSurfaceTarget | null | undefined,
  poster: PlaybackSurfaceTarget | null | undefined,
  active: boolean
): void {
  if (video && video.classList) {
    if (active) video.classList.add("is-active");
    else video.classList.remove("is-active");
  }
  if (poster && poster.style) {
    poster.style.display = active ? "none" : "block";
  }
}

export function applyPlayerStatus(
  element: PlayerStatusTarget | null | undefined,
  message: unknown
): void {
  if (!element) return;
  if (message) {
    element.textContent = String(message);
    element.classList?.add("is-active");
  } else {
    element.textContent = "";
    element.classList?.remove("is-active");
  }
}

export function applyDetailPlayerTransition(
  playerScreen: PlaybackSurfaceTarget | null | undefined,
  detailScreen: PlaybackSurfaceTarget | null | undefined
): void {
  if (playerScreen && playerScreen.classList) {
    playerScreen.classList.remove("is-mini");
    playerScreen.classList.add("is-active");
  }
  if (detailScreen && detailScreen.classList) {
    detailScreen.classList.remove("is-active");
  }
}

export function resetDetailPlayerSurface(
  playerScreen: PlaybackSurfaceTarget | null | undefined
): void {
  if (!playerScreen || !playerScreen.classList) return;
  playerScreen.classList.remove("is-mini");
  playerScreen.classList.remove("is-active");
}

export function applyPlayerModeClass(
  element: PlaybackSurfaceTarget | null | undefined,
  isVod: boolean
): void {
  if (!element || !element.classList) return;
  if (isVod) element.classList.add("is-vod");
  else element.classList.remove("is-vod");
}
