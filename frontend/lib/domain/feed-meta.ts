/** 피드 행들의 updated_at 중 가장 최근 시각(ISO). */

export function maxUpdatedAt(rows: ReadonlyArray<{ updated_at?: unknown }>): string | undefined {
  let best = 0;
  for (const row of rows) {
    const raw = row.updated_at;
    if (typeof raw !== "string" && typeof raw !== "number") continue;
    const time = Date.parse(String(raw));
    if (Number.isFinite(time) && time > best) best = time;
  }
  return best > 0 ? new Date(best).toISOString() : undefined;
}

export function formatFeedUpdatedAt(iso: string | null | undefined): string {
  if (!iso) return "아직 없음";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "아직 없음";
  return date.toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
