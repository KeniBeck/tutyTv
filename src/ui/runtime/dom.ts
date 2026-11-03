export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined && text !== null) {
    element.textContent = text;
  }
  return element;
}

export function byId(id: string): HTMLElement | null {
  return document.getElementById(id);
}

export function clear(element: Element): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

export function place(
  element: HTMLElement,
  left: number,
  top: number,
  width?: number,
  height?: number
): HTMLElement {
  element.style.position = "absolute";
  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
  if (width !== undefined) {
    element.style.width = `${width}px`;
  }
  if (height !== undefined) {
    element.style.height = `${height}px`;
  }
  return element;
}

export function closest(node: Node | null, selector: string): HTMLElement | null {
  let current = node;
  while (current && current !== document) {
    if (current.nodeType === 1 && (current as Element).matches(selector)) {
      return current as HTMLElement;
    }
    current = current.parentNode;
  }
  return null;
}
