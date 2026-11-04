export function normalizeText(value: unknown): string {
  const text = String(value ?? "").toLowerCase();
  const normalized = typeof text.normalize === "function" ? text.normalize("NFD") : text;
  return normalized.replace(/[\u0300-\u036f]/g, "");
}
