export type ServiceCallback = (error: string | null, response: unknown) => void;

export interface WebOsServiceRequestOptions {
  method: string;
  parameters: Record<string, unknown>;
  timeout: number;
  onSuccess(response: unknown): void;
  onFailure(error: { errorText?: string } | null): void;
}

export interface WebOsServiceBridge {
  service?: {
    request?(uri: string, options: WebOsServiceRequestOptions): unknown;
  };
}

export interface ServiceDependencies {
  getServiceId(): string;
  getTimeout(): number;
  getDevServiceUrl(): string | undefined;
  canUseLuna(): boolean;
  getWebOs(): WebOsServiceBridge | undefined;
  buildDevUrl(baseUrl: string, method: string, params: Record<string, unknown>): string;
  requestDev(url: string, done: ServiceCallback): void;
}

export interface ServiceClient {
  request(method: string, params: Record<string, unknown> | undefined, done: ServiceCallback): boolean;
}

export function createServiceClient(dependencies: ServiceDependencies): ServiceClient {
  return {
    request(method, params, done) {
      let finished = false;
      const finish = (error: string | null, response: unknown) => {
        if (!finished) {
          finished = true;
          done(error, response);
        }
      };

      if (dependencies.canUseLuna()) {
        try {
          const webOs = dependencies.getWebOs();
          const request = webOs?.service?.request;
          if (!request) {
            throw new Error("webOS service bridge unavailable");
          }
          request(`luna://${dependencies.getServiceId()}`, {
            method,
            parameters: params || {},
            timeout: dependencies.getTimeout(),
            onSuccess(response) {
              finish(null, response);
            },
            onFailure(error) {
              finish(error?.errorText || "Error del servicio TutyTV", null);
            }
          });
          return true;
        } catch (error) {
          if (!dependencies.getDevServiceUrl()) {
            const message = error instanceof Error ? error.message : String(error);
            finish(`Error comunicando con el servicio: ${message}`, null);
            return false;
          }
        }
      }

      const devServiceUrl = dependencies.getDevServiceUrl();
      if (devServiceUrl) {
        dependencies.requestDev(
          dependencies.buildDevUrl(devServiceUrl, method, params || {}),
          finish
        );
        return true;
      }

      finish("El servicio TutyTV no está disponible", null);
      return false;
    }
  };
}
