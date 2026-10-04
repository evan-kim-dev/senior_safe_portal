import { extractRawHttpUrls } from "./url";

function urlOf(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const url = (value as { url?: unknown }).url;
  return typeof url === "string" ? url : "";
}

/** 답에 붙일 "이 주소 검사하기" 주소. 분석 결과 → 질문 → 답 순서로 찾는다. */
export function extractLinkUrl(analysis: unknown, message: string, reply: string): string {
  const analyzed = Array.isArray(analysis) ? urlOf(analysis[0]) : urlOf(analysis);
  if (analyzed) return analyzed;
  return extractRawHttpUrls(`${message}\n${reply}`)[0] ?? "";
}
