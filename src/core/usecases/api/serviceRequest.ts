export function buildQueryString(parameters: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const key of Object.keys(parameters)) {
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(parameters[key]))}`);
  }
  return parts.join("&");
}

export function buildDevServiceUrl(
  baseUrl: string,
  method: string,
  parameters: Record<string, unknown>
): string {
  return `${String(baseUrl).replace(/\/$/, "")}/${method}?${buildQueryString(parameters)}`;
}
