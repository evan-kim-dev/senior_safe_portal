import { MAX_URL_LENGTH } from "@/lib/domain/url";
import { readJson, removeItem, writeJson } from "./storage";

const KEY = "pending-check";

/** 다른 화면에서 고른 주소를 홈 검사 화면으로 넘긴다. */
export function sendToCheck(url: string, run = false) {
  writeJson(KEY, { url: url.slice(0, MAX_URL_LENGTH), run }, "session");
  window.location.assign("/");
}

export function readPendingCheck(): { url: string; run: boolean } | null {
  const parsed = readJson(KEY, "session");
  removeItem(KEY, "session");
  if (!parsed || typeof parsed !== "object") return null;

  const value = parsed as { url?: unknown; run?: unknown };
  if (typeof value.url !== "string" || !value.url.trim()) return null;
  return { url: value.url.trim().slice(0, MAX_URL_LENGTH), run: value.run === true };
}
