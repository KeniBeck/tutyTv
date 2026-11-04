export interface ApiSessionSource {
  userId?: unknown;
  userToken?: unknown;
  portalCode?: unknown;
  homePageCode?: unknown;
  version?: unknown;
}

export interface ApiSession {
  userId: string;
  userToken: string;
  portalCode: string;
  homePageCode: string;
  version: string;
}

export type ServiceParams = Record<string, unknown>;

export function normalizeApiSession(session: ApiSessionSource | null | undefined): ApiSession {
  const source = session || {};
  return {
    userId: String(source.userId || ""),
    userToken: String(source.userToken || ""),
    portalCode: String(source.portalCode || ""),
    homePageCode: String(source.homePageCode || ""),
    version: String(source.version || "4.34.4")
  };
}

export function hasApiSession(session: ApiSessionSource | null | undefined): boolean {
  const normalized = normalizeApiSession(session);
  return Boolean(normalized.userId && normalized.userToken && normalized.portalCode);
}

export function buildServiceParams(kind: string, value: unknown, session: ApiSessionSource | null | undefined): ServiceParams {
  const normalized = normalizeApiSession(session);

  if (kind === "catalog") {
    return {
      userId: normalized.userId,
      userToken: normalized.userToken,
      portalCode: normalized.portalCode,
      homePageCode: normalized.homePageCode,
      version: normalized.version
    };
  }

  if (kind === "search") {
    return {
      userToken: normalized.userToken,
      userId: normalized.userId,
      portalCode: normalized.portalCode,
      columnId: "",
      value: value || "",
      type: "",
      pageSize: 20,
      pageNum: 1,
      filter: ""
    };
  }

  return {
    userToken: normalized.userToken,
    userId: normalized.userId,
    portalCode: normalized.portalCode,
    programId: value
  };
}

export function resolveServiceUrl(config: Record<string, unknown>, method: string): string {
  const explicit = config[method + "Url"];
  if (explicit) return String(explicit);

  const base = String(config.baseUrl || "").replace(/\/$/, "");
  const path = String(config[method + "Path"] || "");
  return base && path ? base + (path.charAt(0) === "/" ? path : "/" + path) : "";
}

export function describeServiceError(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const source = payload as Record<string, unknown>;
  const code = source.returnCode || source.code || source.errorCode || "";
  const message = source.errorMessage || source.message || source.msg || "";
  if (!code && !message) return "";
  return (code ? String(code) + ": " : "") + (message ? String(message) : "La API rechazó la petición");
}
