export interface WebOsKeepAliveBridge {
  request(uri: string, options: Record<string, unknown>): void;
}

export interface WebOsKeepAliveHost {
  canUseLuna(): boolean;
  getServiceId(): string;
  getBridge(): WebOsKeepAliveBridge | null;
}

let host: WebOsKeepAliveHost | null = null;
let heartbeat: ReturnType<typeof setInterval> | null = null;

export function attachWebOsKeepAlive(next: WebOsKeepAliveHost): boolean {
  host = next;
  return true;
}

export function hasWebOsKeepAliveRuntime(): boolean {
  return host !== null;
}

export function resetWebOsKeepAliveRuntime(): void {
  stopWebOsKeepAlive();
  host = null;
}

export function startWebOsKeepAlive(): boolean {
  if (!host || !host.canUseLuna()) {
    return false;
  }
  const bridge = host.getBridge();
  if (!bridge) {
    return false;
  }
  const serviceId = host.getServiceId() || "com.webosflux.xuptertv.fidelity.service";
  const uri = `luna://${serviceId}`;
  stopHeartbeat();
  try {
    bridge.request(uri, {
      method: "keepAlive",
      parameters: {
        subscribe: true
      },
      resubscribe: true,
      onSuccess() {},
      onFailure() {}
    });
  } catch {
    // La app sigue funcionando aunque el servicio no acepte keepAlive.
  }
  heartbeat = setInterval(() => {
    const current = host?.getBridge();
    if (!current) {
      return;
    }
    try {
      current.request(uri, {
        method: "heartbeat",
        parameters: {},
        onSuccess() {},
        onFailure() {}
      });
    } catch {
      // Se reintenta en el siguiente intervalo.
    }
  }, 15000);
  return true;
}

export function stopWebOsKeepAlive(): boolean {
  stopHeartbeat();
  return true;
}

function stopHeartbeat(): void {
  if (heartbeat) {
    clearInterval(heartbeat);
    heartbeat = null;
  }
}
