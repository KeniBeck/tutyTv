import type { AppState } from "./state";

export function showScreen(name: string, documentRoot: Document, state: AppState): HTMLElement | null {
  const screens = documentRoot.querySelectorAll<HTMLElement>(".screen");
  for (let index = 0; index < screens.length; index += 1) {
    screens[index]?.classList.remove("is-active");
  }
  const target = documentRoot.getElementById(`screen-${name}`);
  if (target) {
    target.classList.add("is-active");
  }
  state.screen = name;
  return target;
}
