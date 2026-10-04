import type { CheckKind } from "./types";

const HTTP_URL = /https?:\/\/[^\s<>"']+/i;

export function extractHttpUrl(text: string): string | null {
  const match = text.match(HTTP_URL);
  if (!match) return null;

  const raw = match[0].replace(/[),.;]+$/g, "");
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeSubmittedUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const found = extractHttpUrl(trimmed);
  if (found) return found;
  if (/\s/.test(trimmed)) return null;
  return trimmed;
}

/** http(s) 주소이거나, 공백 없는 도메인만 검사한다. */
export function isCheckableAddress(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed || /\s/.test(trimmed)) return Boolean(extractHttpUrl(trimmed));
  if (extractHttpUrl(trimmed)) return true;
  return /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:[/?#].*)?$/i.test(trimmed);
}

/** 같은 주소는 호스트·경로 기준으로 한 키로 묶는다. */
export function cacheUrlKey(raw: string): string {
  const normalized = normalizeSubmittedUrl(raw) ?? raw.trim();
  const withProtocol = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
  const url = new URL(withProtocol);
  url.hash = "";
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const path = url.pathname.replace(/\/$/, "") || "/";
  return `${url.protocol}//${host}${path}${url.search}`;
}

/** 유튜브·쇼츠·youtu.be 는 영상, 그 외 주소는 링크. */
export function classifyKind(url: string): CheckKind {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com")) {
      return "video";
    }
  } catch {
    return "link";
  }
  return "link";
}

export function kindLabel(kind: CheckKind): "영상" | "링크" {
  return kind === "video" ? "영상" : "링크";
}

export function toTwoLineReason(reason: string): string {
  const clean = reason.replace(/\s+/g, " ").trim();
  if (!clean) return "이유를 확인하지 못했습니다. 주소를 다시 검사해 주세요.";

  const parts = clean.split(/(?<=[.!?。])\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]} ${parts[1]}`;
  return clean;
}

export function titleFromUrl(url: string, scrapedTitle?: string): string {
  const title = scrapedTitle?.replace(/\s+/g, " ").trim();
  if (title) return title.slice(0, 80);

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "주소";
  }
}
