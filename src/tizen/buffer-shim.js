import { Buffer as NodeBuffer } from "buffer";

var root =
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof self !== "undefined"
      ? self
      : typeof window !== "undefined"
        ? window
        : {};

if (typeof root.Buffer === "undefined") {
  root.Buffer = NodeBuffer;
}

if (typeof root.globalThis === "undefined") {
  root.globalThis = root;
}

export { NodeBuffer as Buffer };
