const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  quot: "\"",
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  bull: "•",
  midast: "*",
  "#39": "'",
};

/** HTML 엔티티(&quot;, &hellip;, &#8230; 등)를 사람이 읽는 글자로 바꾼다. */
export function decodeText(value: string): string {
  return value
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
      const key = entity.toLowerCase();
      if (key in NAMED_ENTITIES) return NAMED_ENTITIES[key];
      if (key.startsWith("#x")) {
        const code = Number.parseInt(key.slice(2), 16);
        return Number.isFinite(code) ? String.fromCodePoint(code) : match;
      }
      if (key.startsWith("#")) {
        const code = Number.parseInt(key.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : match;
      }
      return match;
    })
    .replace(/\s+/g, " ")
    .trim();
}

export function collapseSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}
