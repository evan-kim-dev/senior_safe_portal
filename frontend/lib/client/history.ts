import type { RecentCheck } from "@/lib/domain/types";
import { isVerdict } from "@/lib/domain/verdict";
import { readJson, writeJson } from "./storage";

const STORAGE_KEY = "senior-safe-recent";
const MAX_RECENT = 5;

function isRecentCheck(value: unknown): value is RecentCheck {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<RecentCheck>;
  return typeof row.url === "string" && typeof row.title === "string" && isVerdict(row.verdict);
}

export function loadRecent(): RecentCheck[] {
  const parsed = readJson(STORAGE_KEY);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isRecentCheck).slice(0, MAX_RECENT);
}

/** 이 폰에 저장하지 못해도 이번 결과 목록은 돌려준다. */
export function rememberCheck(item: RecentCheck): RecentCheck[] {
  const next = [item, ...loadRecent().filter((row) => row.url !== item.url)].slice(0, MAX_RECENT);
  writeJson(STORAGE_KEY, next);
  return next;
}
