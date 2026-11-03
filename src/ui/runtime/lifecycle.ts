export interface LifecycleMedia {
  paused: boolean;
}

export interface LifecycleHost {
  isHidden(): boolean;
  getPlayer(): LifecycleMedia | null;
  getPreview(): LifecycleMedia | null;
  play(media: LifecycleMedia): unknown;
  stopPlayback(): void;
  cleanup(): void;
}

let host: LifecycleHost | null = null;
let playerWasPlaying = false;
let previewWasPlaying = false;

export function attachAppLifecycle(next: LifecycleHost): boolean {
  host = next;
  return true;
}

export function hasAppLifecycleRuntime(): boolean {
  return host !== null;
}

export function resetAppLifecycleRuntime(): void {
  host = null;
  playerWasPlaying = false;
  previewWasPlaying = false;
}

export function suspendLifecyclePlayback(): boolean {
  if (!host) {
    return false;
  }
  const player = host.getPlayer();
  const preview = host.getPreview();
  playerWasPlaying = Boolean(player && !player.paused);
  previewWasPlaying = Boolean(preview && !preview.paused);
  return true;
}

export function resumeLifecyclePlayback(): boolean {
  if (!host) {
    return false;
  }
  const wasPlayerPlaying = playerWasPlaying;
  const wasPreviewPlaying = previewWasPlaying;
  playerWasPlaying = false;
  previewWasPlaying = false;
  if (wasPlayerPlaying) {
    const player = host.getPlayer();
    if (player && player.paused) {
      playQuietly(player);
    }
  }
  if (wasPreviewPlaying) {
    const preview = host.getPreview();
    if (preview && preview.paused) {
      playQuietly(preview);
    }
  }
  return true;
}

export function handleLifecycleVisibilityChange(): boolean {
  if (!host) {
    return false;
  }
  if (host.isHidden()) {
    suspendLifecyclePlayback();
  } else {
    resumeLifecyclePlayback();
  }
  return true;
}

export function handleLifecycleUnload(): boolean {
  if (!host) {
    return false;
  }
  host.stopPlayback();
  host.cleanup();
  return true;
}

function playQuietly(media: LifecycleMedia): void {
  if (!host) {
    return;
  }
  try {
    const result = host.play(media);
    if (result && typeof (result as PromiseLike<unknown>).then === "function") {
      (result as PromiseLike<unknown>).then(undefined, () => undefined);
    }
  } catch {
    // La reproduccion se reanuda sin bloquear la salida de segundo plano.
  }
}
