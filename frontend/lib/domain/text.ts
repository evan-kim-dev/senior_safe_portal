export function decodeText(value: string): string {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function collapseSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}
