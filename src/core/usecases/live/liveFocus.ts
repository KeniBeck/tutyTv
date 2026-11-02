export function liveListScrollTop(
  rowIndex: number,
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number
): number {
  const rowTop = rowIndex * 120;
  let next = scrollTop;

  if (rowTop < next) {
    next = rowTop;
  }
  if (rowTop + 100.5 > next + clientHeight) {
    next = rowTop + 100.5 - clientHeight;
  }

  const max = Math.max(0, scrollHeight - clientHeight);
  return Math.max(0, Math.min(max, next));
}
