import { buildDevServiceUrl } from "../../core/usecases/api/serviceRequest";
import { createServiceClient, type ServiceCallback } from "./service";

export interface ServiceConfig {
  serviceId?: string;
  devServiceUrl?: string;
  timeoutMs?: number | string;
  headers?: Record<string, string>;
}

export interface ServiceRuntimeDeps {
  getConfig(): ServiceConfig;
  canUseLuna(): boolean;
  getWebOs(): unknown;
}

export interface ServiceRequestOptions {
  method?: string;
  body?: unknown;
}

export interface ServiceRuntime {
  request(method: string, params: Record<string, unknown> | undefined, done: ServiceCallback): boolean;
  requestDev(url: string, done: ServiceCallback, options?: ServiceRequestOptions | null): boolean;
  ensureWebOsService(): boolean;
}

export function createServiceRuntime(deps: ServiceRuntimeDeps): ServiceRuntime {
  let client: ReturnType<typeof createServiceClient> | null = null;

  function requestDev(
    url: string,
    done: ServiceCallback,
    options?: ServiceRequestOptions | null
  ): boolean {
    const config = deps.getConfig();
    const request = new XMLHttpRequest();
    let finished = false;
    const timeout = parseInt(String(config.timeoutMs), 10) || 10000;

    function finish(error: string | null, response: unknown): void {
      if (!finished) {
        finished = true;
        done(error, response);
      }
    }

    request.open((options && options.method) || "GET", url, true);
    request.timeout = timeout;
    const headers = config.headers || {};
    for (const name of Object.keys(headers)) {
      if (Object.prototype.hasOwnProperty.call(headers, name)) {
        request.setRequestHeader(name, headers[name] as string);
      }
    }
    if (options && options.body !== undefined && !headers["Content-Type"] && !headers["content-type"]) {
      request.setRequestHeader("Content-Type", "application/json;charset=utf-8");
    }
    request.onreadystatechange = function onReadyStateChange() {
      if (request.readyState !== 4) {
        return;
      }
      if (request.status < 200 || request.status >= 300) {
        finish(`HTTP ${request.status}`, null);
        return;
      }
      try {
        finish(null, JSON.parse(request.responseText));
      } catch {
        finish("La API no devolvió JSON válido", null);
      }
    };
    request.onerror = function onError() {
      finish("Error de red o CORS", null);
    };
    request.ontimeout = function onTimeout() {
      finish("Tiempo de espera agotado", null);
    };
    try {
      request.send(options && options.body !== undefined ? JSON.stringify(options.body) : null);
    } catch (error) {
      finish(error instanceof Error ? error.message : "No se pudo iniciar la petición", null);
    }
    return true;
  }

  function getClient(): ReturnType<typeof createServiceClient> {
    if (!client) {
      client = createServiceClient({
        getServiceId: function getServiceId() {
          return deps.getConfig().serviceId || "com.webosflux.xuptertv.fidelity.service";
        },
        getTimeout: function getTimeout() {
          return parseInt(String(deps.getConfig().timeoutMs), 10) || 20000;
        },
        getDevServiceUrl: function getDevServiceUrl() {
          return deps.getConfig().devServiceUrl || undefined;
        },
        canUseLuna: deps.canUseLuna,
        getWebOs: function getWebOs() {
          return deps.getWebOs() as {
            service?: {
              request?(uri: string, options: {
                method: string;
                parameters: Record<string, unknown>;
                timeout: number;
                onSuccess(response: unknown): void;
                onFailure(error: { errorText?: string } | null): void;
              }): unknown;
            };
          };
        },
        buildDevUrl: function buildDevUrl(baseUrl, method, params) {
          return buildDevServiceUrl(baseUrl, method, params);
        },
        requestDev: function requestDevService(url, done) {
          requestDev(url, done);
        }
      });
    }
    return client;
  }

  return {
    request: function request(method, params, done) {
      return getClient().request(method, params, done);
    },
    requestDev,
    ensureWebOsService: function ensureWebOsService() {
      const target = window as unknown as {
        PalmServiceBridge?: unknown;
        webOS?: {
          service?: {
            request?(uri: string, options: unknown): unknown;
          };
        };
      };
      if (!target.PalmServiceBridge || (target.webOS && target.webOS.service)) {
        return Boolean(target.webOS && target.webOS.service && target.webOS.service.request);
      }
      target.webOS = target.webOS || {};
      target.webOS.service = {
        request: function request(uri: string, options: {
          method?: string;
          parameters?: Record<string, unknown>;
          onSuccess?(response: unknown): void;
          onFailure?(error: { returnValue?: boolean; errorText?: string }): void;
        }) {
          options = options || {};
          const bridge = new (window as unknown as { PalmServiceBridge: new () => {
            onservicecallback: (payload: string) => void;
            call(uri: string, payload: string): unknown;
          } }).PalmServiceBridge();
          bridge.onservicecallback = function onservicecallback(payload: string) {
            let response: { returnValue?: boolean; errorText?: string };
            try {
              response = JSON.parse(payload);
            } catch {
              response = { returnValue: false, errorText: payload };
            }
            if (response.returnValue === false) {
              if (options.onFailure) {
                options.onFailure(response);
              }
            } else if (options.onSuccess) {
              options.onSuccess(response);
            }
          };
          const targetUri = options.method ? uri.replace(/\/$/, "") + "/" + options.method : uri;
          return bridge.call(targetUri, JSON.stringify(options.parameters || {}));
        }
      };
      return Boolean(target.webOS && target.webOS.service && target.webOS.service.request);
    }
  };
}
