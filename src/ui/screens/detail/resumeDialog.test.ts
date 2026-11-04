import { beforeEach, describe, expect, it, vi } from "vitest";
import { attachResume, closeResume, openResume, resetResumeRuntime, type ResumeHost } from "./resumeDialog";
import { createAppState } from "../../runtime/state";

class FakeNode {
  id = "";
  tagName = "";
  className = "";
  textContent = "";
  src = "";
  alt = "";
  style: Record<string, string> = {};
  children: FakeNode[] = [];
  parentNode: FakeNode | null = null;
  _activate?: () => void;
  _classes = new Set<string>();

  classList = {
    add: (name: string) => this._classes.add(name),
    remove: (name: string) => this._classes.delete(name),
    toggle: (name: string, force?: boolean) => {
      if (force === true) {
        this._classes.add(name);
      } else if (force === false) {
        this._classes.delete(name);
      } else if (this._classes.has(name)) {
        this._classes.delete(name);
      } else {
        this._classes.add(name);
      }
    },
    contains: (name: string) => this._classes.has(name)
  };

  appendChild(child: FakeNode) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }
}

function textOf(node: FakeNode): string {
  return [node.textContent, ...node.children.map(textOf)].join(" ");
}

function findByClass(node: FakeNode, className: string): FakeNode | null {
  for (const child of node.children) {
    if (child.className.includes(className)) {
      return child;
    }
    const found = findByClass(child, className);
    if (found) {
      return found;
    }
  }
  return null;
}

function createHost() {
  const state = createAppState();
  const root = new FakeNode();
  const focus = vi.fn();
  const host: ResumeHost = {
    state,
    byId: (id) => {
      if (id === "dialog-resume") {
        return (root.children.find((child) => child.id === id) as unknown as ReturnType<ResumeHost["byId"]>) || null;
      }
      return null;
    },
    el: (tag, className, text) => {
      const node = new FakeNode();
      node.className = className || "";
      node.textContent = text || "";
      node.tagName = tag.toUpperCase();
      return node as unknown as ReturnType<ResumeHost["el"]>;
    },
    text: (value) => {
      const node = new FakeNode();
      node.textContent = value;
      return node as unknown as Node;
    },
    clear: (element) => {
      (element as unknown as FakeNode).children = [];
    },
    focus,
    canFocus: () => true,
    getAppRoot: () => root as unknown as ReturnType<ResumeHost["getAppRoot"]>,
    formatTime: (value) => String(value)
  };
  return { host, state, root, focus };
}

describe("resume dialog runtime", () => {
  beforeEach(() => {
    resetResumeRuntime();
    vi.useRealTimers();
  });

  it("resumes playback and restores focus", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const { host, state, root, focus } = createHost();
    const back = new FakeNode();
    state.focus = back as unknown as typeof state.focus;
    const callback = vi.fn();
    attachResume(host);

    expect(openResume({ id: "m", title: "Movie" }, null, 30, 120, callback)).toBe(true);
    expect(state.resumeOpen).toBe(true);
    const dialog = root.children.find((child) => child.id === "dialog-resume");
    expect(dialog?.classList.contains("is-active")).toBe(true);
    expect(textOf(dialog!)).toContain("CONTINUAR VIENDO");
    expect(textOf(dialog!)).toContain("Reanudar");

    const continueButton = findByClass(dialog!, "resume-continue");
    continueButton?._activate?.();
    expect(callback).not.toHaveBeenCalled();

    vi.setSystemTime(1400);
    continueButton?._activate?.();
    expect(callback).toHaveBeenCalledWith(true);
    expect(state.resumeOpen).toBe(false);
    expect(focus).toHaveBeenCalledWith(back);
  });

  it("restarts from the beginning and closes without callback", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const { host, state, root } = createHost();
    const callback = vi.fn();
    attachResume(host);
    openResume({ id: "m", title: "Movie" }, null, 30, 120, callback);
    const dialog = root.children.find((child) => child.id === "dialog-resume");
    const restart = findByClass(dialog!, "resume-restart");
    vi.setSystemTime(1400);
    restart?._activate?.();
    expect(callback).toHaveBeenCalledWith(false);

    openResume({ id: "m", title: "Movie" }, null, 30, 120, callback);
    const reopened = root.children.find((child) => child.id === "dialog-resume");
    const close = findByClass(reopened!, "resume-close");
    close?._activate?.();
    expect(state.resumeOpen).toBe(false);
    expect(closeResume()).toBe(true);
  });
});
