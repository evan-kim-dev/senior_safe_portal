import { asAnalyzeLinkBody, toCheckSuccess } from "./check";

const DANGER_HINTS =
  /누르지\s*마|클릭\s*하지\s*마|보이스피싱|스미싱|피싱|사칭|택갈|원격\s*제어|악성\s*앱|개인정보\s*탈취|송금\s*하지|OTP|인증\s*번호.*(?:주|알|입)/i;
const DANGER_SOFT = /사기|위험(?:해|한|합니다|해요)|의심(?:스|됩)|속지\s*마/i;
const SAFE_HINTS = /안전(?:해|합니다|해요)|괜찮(?:아|습니다|아요)|문제\s*없|클릭\s*해도\s*(?:괜|안)/i;

export type ChatRiskVerdict = "danger" | "safe";

export type ChatRiskAssessment = {
  verdict: ChatRiskVerdict;
  /** 보호자 대시보드 요약(사용자 질문 일부). */
  summary: string;
};

export function chatRiskSummary(message: string): string {
  const text = message.replace(/\s+/g, " ").trim();
  if (!text) return "챗봇 상담";
  return text.slice(0, 80);
}

/** Edge linkAnalysis 또는 답변 문장으로 챗 상담 위험도를 추정한다. */
export function assessChatRisk(input: {
  message: string;
  reply: string;
  linkAnalysis?: unknown;
  hadImage?: boolean;
}): ChatRiskAssessment | null {
  const message = input.message.trim();
  const reply = input.reply.trim();
  if (!reply) return null;

  const body = asAnalyzeLinkBody(input.linkAnalysis);
  if (body) {
    const url =
      typeof body.scraped?.url === "string" && body.scraped.url.trim()
        ? body.scraped.url.trim()
        : "";
    const fromLink = url ? toCheckSuccess(url, body) : null;
    if (fromLink?.verdict === "danger") {
      return { verdict: "danger", summary: chatRiskSummary(message) };
    }
    if (fromLink?.verdict === "safe") {
      return { verdict: "safe", summary: chatRiskSummary(message) };
    }
  }

  return inferChatRiskFromReply(message, reply, Boolean(input.hadImage));
}

export function inferChatRiskFromReply(
  message: string,
  reply: string,
  hadImage: boolean,
): ChatRiskAssessment | null {
  const text = reply.replace(/\s+/g, " ");
  const strong = DANGER_HINTS.test(text);
  const soft = DANGER_SOFT.test(text);
  const safe = SAFE_HINTS.test(text);

  if (safe && !strong && !soft) {
    return { verdict: "safe", summary: chatRiskSummary(message) };
  }

  if (strong || (soft && !safe) || (hadImage && (strong || soft))) {
    return { verdict: "danger", summary: chatRiskSummary(message) };
  }

  return null;
}
