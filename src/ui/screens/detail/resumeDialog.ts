import type { AppState } from "../../runtime/state";

export interface ResumeItem {
  id?: string | number;
  title?: string;
  poster?: string;
  landscape?: string;
  backdrop?: string;
  cover?: string;
  type?: string;
  kind?: string;
  [key: string]: unknown;
}

export interface ResumeEpisode {
  id?: string | number;
  number?: string | number;
  seriesNumber?: string | number;
  [key: string]: unknown;
}

export interface ResumeNode extends HTMLElement {
  _activate?: () => void;
}

export interface ResumeHost {
  state: AppState;
  byId(id: string): ResumeNode | null;
  el(tag: string, className?: string, text?: string): ResumeNode;
  text(value: string): Node;
  clear(element: ResumeNode): void;
  focus(element: ResumeNode | null): void;
  canFocus(element: ResumeNode): boolean;
  getAppRoot(): ResumeNode | null;
  formatTime(value: number): string;
}

let host: ResumeHost | null = null;

export function attachResume(next: ResumeHost): boolean {
  host = next;
  return true;
}

export function hasResumeRuntime(): boolean {
  return host !== null;
}

export function resetResumeRuntime(): void {
  host = null;
}

export function closeResume(): boolean {
  if (!host) {
    return false;
  }
  host.state.resumeOpen = false;
  const dialog = host.byId("dialog-resume");
  dialog?.classList.remove("is-active");
  const back = host.state.resumeReturn as ResumeNode | null | undefined;
  if (back && host.canFocus(back)) {
    host.focus(back);
  }
  host.state.resumeReturn = null;
  return true;
}

export function openResume(
  item: ResumeItem,
  episode: ResumeEpisode | null | undefined,
  position: number,
  duration: number,
  callback: (continuePlayback: boolean) => void
): boolean {
  if (!host) {
    return false;
  }
  host.state.resumeOpen = true;
  host.state.resumeReturn = host.state.focus;
  host.state.resumeOpenedAt = Date.now();

  const root = host.getAppRoot();
  let dialog = host.byId("dialog-resume");
  if (!dialog) {
    if (!root) {
      return false;
    }
    dialog = host.el("div", "resume-overlay");
    dialog.id = "dialog-resume";
    root.appendChild(dialog);
  }
  host.clear(dialog);
  dialog.classList.add("is-active");

  const card = host.el("div", "resume-card");
  const posterBox = host.el("div", "resume-poster");
  const image = host.el("img") as HTMLImageElement;
  image.src =
    item.poster ||
    item.landscape ||
    item.backdrop ||
    item.cover ||
    "assets/original/common/bg_placehoder_vertical.png";
  image.alt = "";
  posterBox.appendChild(image);
  posterBox.appendChild(host.el("div", "resume-poster-shade"));

  const body = host.el("div", "resume-body");
  body.appendChild(host.el("div", "resume-kicker", "CONTINUAR VIENDO"));
  body.appendChild(host.el("div", "resume-title", item.title || "Contenido"));

  const subtitle =
    episode && (episode.number || episode.seriesNumber)
      ? `Episodio ${episode.number || episode.seriesNumber}`
      : item.type === "teleplay" || item.kind === "serie"
        ? "Serie"
        : "Película";
  body.appendChild(host.el("div", "resume-sub", subtitle));

  if (duration > 0) {
    const progress = host.el("div", "resume-progress");
    const bar = host.el("div", "resume-progress-bar");
    bar.style.width = `${Math.min(100, Math.max(0, (position / duration) * 100)).toFixed(1)}%`;
    progress.appendChild(bar);
    body.appendChild(progress);
    body.appendChild(host.el("div", "resume-time", `Te quedaste en ${host.formatTime(position)}`));
  }

  const actions = host.el("div", "resume-actions");
  const continueButton = host.el(
    "div",
    "focusable resume-btn resume-continue"
  );
  continueButton.appendChild(host.el("span", "resume-play"));
  continueButton.appendChild(host.text(`Reanudar · ${host.formatTime(position)}`));
  continueButton._activate = function continuePlayback() {
    if (Date.now() - (host?.state.resumeOpenedAt || 0) < 300) {
      return;
    }
    closeResume();
    callback(true);
  };

  const restart = host.el("div", "focusable resume-btn resume-restart", "Empezar desde el principio");
  restart._activate = function restartPlayback() {
    if (Date.now() - (host?.state.resumeOpenedAt || 0) < 300) {
      return;
    }
    closeResume();
    callback(false);
  };

  actions.appendChild(continueButton);
  actions.appendChild(restart);
  body.appendChild(actions);

  const close = host.el("div", "focusable resume-close", "×");
  close._activate = function closeDialog() {
    closeResume();
  };

  card.appendChild(posterBox);
  card.appendChild(body);
  card.appendChild(close);
  dialog.appendChild(card);
  host.focus(continueButton);
  return true;
}
