import { collapseSpaces } from "./text";

const SENSITIVE = /api[_-]?key|gemini|supabase|stack|AIza|Bearer|token|NAVER_|DATA_GO|YouTube API/i;

/** 바깥 서비스가 돌려준 문장을 화면에 보여도 되는지 걸러 낸다. */
export function toPublicMessage(raw: unknown, fallback: string, maxLength = 140): string {
  if (typeof raw !== "string") return fallback;
  const message = collapseSpaces(raw);
  if (!message || SENSITIVE.test(message)) return fallback;
  return message.slice(0, maxLength);
}
