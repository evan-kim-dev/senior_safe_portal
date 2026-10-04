import type { RecentCheck } from "./types";

const STORAGE_KEY = "senior-safe-recent";
const MAX_RECENT = 5;

export function loadRecent(): RecentCheck[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isRecentCheck).slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function rememberCheck(item: RecentCheck): RecentCheck[] {
  const next = [item, ...loadRecent().filter((row) => row.url !== item.url)].slice(0, MAX_RECENT);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 이 폰에 저장하지 못해도 이번 결과는 보여 준다.
  }

  return next;
}

function isRecentCheck(value: unknown): value is RecentCheck {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<RecentCheck>;
  return (
    typeof row.url === "string" &&
    typeof row.title === "string" &&
    (row.verdict === "safe" || row.verdict === "danger")
  );
}
