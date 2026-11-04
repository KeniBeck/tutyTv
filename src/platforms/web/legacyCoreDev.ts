/// <reference types="vite/client" />

import * as core from "../shared/legacyCoreBridge";

type CoreNamespace = typeof core;
type GlobalWithCore = typeof globalThis & { TutyCore?: CoreNamespace };

const globalScope = globalThis as GlobalWithCore;

globalScope.TutyCore = core;

if (import.meta.hot) {
  import.meta.hot.accept("../shared/legacyCoreBridge", (next) => {
    if (next) {
      globalScope.TutyCore = next as unknown as CoreNamespace;
    }
  });
}
