const DAY_MS = 24 * 60 * 60 * 1000;

const SEOUL_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 서울 기준 오늘 0시부터 내일 0시까지(UTC ISO). */
export function seoulDayRange(now = new Date()): { start: string; end: string } {
  const day = SEOUL_DAY.format(now);
  const start = new Date(`${day}T00:00:00+09:00`);
  const end = new Date(start.getTime() + DAY_MS);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}
