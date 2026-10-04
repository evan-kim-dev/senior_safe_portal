import type { CheckSuccess } from "./types";
import { classifyKind, titleFromUrl, toTwoLineReason } from "./url";
import { headlineFor, verdictFromStatus } from "./verdict";

/** analyze-link Edge Function 응답 중 쓰는 부분. */
export type AnalyzeLinkBody = {
  status?: unknown;
  reason?: unknown;
  message?: unknown;
  scraped?: { title?: unknown; url?: unknown } | null;
};

export function asAnalyzeLinkBody(data: unknown): AnalyzeLinkBody | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  return data as AnalyzeLinkBody;
}

/** 판정이 "안전"/"위험" 이 아니면 null 을 돌려 실패로 처리하게 한다. */
export function toCheckSuccess(requestedUrl: string, body: AnalyzeLinkBody): CheckSuccess | null {
  const verdict = verdictFromStatus(body.status);
  if (!verdict) return null;

  const scrapedUrl = typeof body.scraped?.url === "string" ? body.scraped.url.trim() : "";
  const scrapedTitle = typeof body.scraped?.title === "string" ? body.scraped.title : undefined;
  const url = scrapedUrl || requestedUrl;

  return {
    ok: true,
    url,
    kind: classifyKind(url),
    verdict,
    headline: headlineFor(verdict),
    title: titleFromUrl(url, scrapedTitle),
    reason: toTwoLineReason(typeof body.reason === "string" ? body.reason : ""),
  };
}
