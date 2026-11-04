export interface FocusRectLike {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface FocusScrollMetrics {
  offsetWidth?: number;
  offsetHeight?: number;
  scrollWidth?: number;
  clientWidth?: number;
}

export interface FocusScrollAdjustment {
  top: number;
  left: number;
}

function scale(current: number | undefined, viewport: number | undefined): number {
  const value = current ? (viewport || 0) / current : 1;
  return isFinite(value) && value > 0 ? value : 1;
}

export function computeLegacyScrollAdjustment(
  rect: FocusRectLike,
  container: FocusRectLike,
  metrics: FocusScrollMetrics
): FocusScrollAdjustment {
  const sx = scale(metrics.offsetWidth, container.right - container.left);
  const sy = scale(metrics.offsetHeight, container.bottom - container.top);
  const leftOverflow = (rect.left - container.left) / sx;
  const rightOverflow = (rect.right - container.right) / sx;
  const topOverflow = (rect.top - container.top) / sy;
  const bottomOverflow = (rect.bottom - container.bottom) / sy;

  let top = 0;
  if (topOverflow < 0) {
    top = topOverflow - 12;
  } else if (bottomOverflow > 0) {
    top = bottomOverflow + 12;
  }

  let left = 0;
  if ((metrics.scrollWidth || 0) > (metrics.clientWidth || 0) + 1) {
    if (leftOverflow < 0) {
      left = leftOverflow - 12;
    } else if (rightOverflow > 0) {
      left = rightOverflow + 12;
    }
  }

  return { top, left };
}
