import type { CheckKind } from "./types";
import { collapseSpaces } from "./text";

export const MAX_URL_LENGTH = 2048;

const HTTP_URL = /https?:\/\/[^\s<>"']+/i;
const HTTP_URLS = /https?:\/\/[^\s<>"']+/gi;
const TRAILING_PUNCTUATION = /[),.;]+$/;
const BARE_DOMAIN = /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:[/?#].*)?$/i;

export function stripTrailingPunctuation(raw: string): string {
  return raw.replace(TRAILING_PUNCTUATION, "");
}

/** 글 안의 모든 http(s) 주소를 적힌 그대로(끝 문장부호만 떼고) 꺼낸다. */
export function extractRawHttpUrls(text: string): string[] {
  return (text.match(HTTP_URLS) ?? []).map(stripTrailingPunctuation).filter(Boolean);
}

/** 글 안의 첫 http(s) 주소를 URL 표준 형태로 꺼낸다. 없으면 null. */
export function extractHttpUrl(text: string): string | null {
  const match = text.match(HTTP_URL);
  if (!match) return null;

  try {
    const url = new URL(stripTrailingPunctuation(match[0]));
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
  return BARE_DOMAIN.test(trimmed);
}

/** 같은 주소는 호스트·경로 기준으로 한 키로 묶는다. 주소가 아니면 던진다. */
export function cacheUrlKey(raw: string): string {
  const normalized = normalizeSubmittedUrl(raw) ?? raw.trim();
  const withProtocol = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
  const url = new URL(withProtocol);
  url.hash = "";
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const path = url.pathname.replace(/\/$/, "") || "/";
  return `${url.protocol}//${host}${path}${url.search}`;
}

export function tryCacheUrlKey(raw: string): string | null {
  try {
    return cacheUrlKey(raw);
  } catch {
    return null;
  }
}

export function hostnameOf(raw: string): string {
  try {
    return new URL(raw).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

const YOUTUBE_HOST = /(^|\.)youtube\.com$/;

export function isYoutubeHost(host: string): boolean {
  return host === "youtu.be" || YOUTUBE_HOST.test(host);
}

/** 유튜브·쇼츠·youtu.be 는 영상, 그 외 주소는 링크. */
export function classifyKind(url: string): CheckKind {
  return isYoutubeHost(hostnameOf(url)) ? "video" : "link";
}

export function kindLabel(kind: CheckKind): "영상" | "링크" {
  return kind === "video" ? "영상" : "링크";
}

export function toTwoLineReason(reason: string): string {
  const clean = collapseSpaces(reason);
  if (!clean) return "이유를 확인하지 못했습니다. 주소를 다시 검사해 주세요.";

  const parts = clean.split(/(?<=[.!?。])\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]} ${parts[1]}`;
  return clean;
}

export function titleFromUrl(url: string, scrapedTitle?: string): string {
  const title = scrapedTitle ? collapseSpaces(scrapedTitle) : "";
  if (title) return title.slice(0, 80);
  return hostnameOf(url) || "주소";
}

export function isHttpUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
