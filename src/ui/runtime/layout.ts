export function fitCanvas(
  element: HTMLElement,
  viewportWidth: number,
  viewportHeight: number
): void {
  const width = viewportWidth || 1920;
  const height = viewportHeight || 1080;
  let scale = Math.min(width / 1920, height / 1080);
  if (!Number.isFinite(scale) || scale <= 0) {
    scale = 1;
  }
  const left = Math.max(0, Math.round((width - 1920 * scale) / 2));
  const top = Math.max(0, Math.round((height - 1080 * scale) / 2));
  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
  element.style.webkitTransform = `scale(${scale})`;
  element.style.transform = `scale(${scale})`;
}
