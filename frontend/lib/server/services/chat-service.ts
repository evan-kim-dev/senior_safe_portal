import { extractLinkUrl } from "@/lib/domain/chat";
import { assessChatRisk } from "@/lib/domain/chat-risk";
import { MESSAGES } from "@/lib/domain/messages";
import { toPublicMessage } from "@/lib/domain/sanitize";
import type { ChatResponse } from "@/lib/domain/types";
import type { ChatInput } from "@/lib/domain/validation";
import type { EdgeResult } from "../gateways/edge-functions";
import type { CheckOutcome } from "./check-service";

export const CHAT_TIMEOUT_MS = 50_000;

export type ChatOutcome = { status: number; body: ChatResponse };

export type ChatSeniorContext = {
  userId: string;
  familyCode: string;
};

export type ChatServiceDeps = {
  ask(payload: ChatInput): Promise<EdgeResult>;
  /** 링크가 있으면 검사 API와 동일하게 위험 영상·링크를 기록한다. */
  checkLink?(input: { url: string; familyCode: string; userId: string }): Promise<CheckOutcome>;
  recordChatDanger?(familyCode: string, userId: string, summary: string): Promise<void>;
  defer?(task: () => Promise<void>): void;
};

export type ChatService = {
  ask(input: ChatInput, senior?: ChatSeniorContext): Promise<ChatOutcome>;
};

async function recordChatRiskAfterReply(
  deps: ChatServiceDeps,
  senior: ChatSeniorContext,
  input: ChatInput,
  reply: string,
  linkUrl: string,
  linkAnalysis: unknown,
) {
  const hadImage = Boolean(input.image);
  let linkMarkedDanger = false;

  if (linkUrl && deps.checkLink) {
    const outcome = await deps.checkLink({
      url: linkUrl,
      familyCode: senior.familyCode,
      userId: senior.userId,
    });
    if (outcome.body.ok && outcome.body.verdict === "danger") {
      linkMarkedDanger = true;
    }
  }

  if (linkMarkedDanger || !deps.recordChatDanger) return;

  const risk = assessChatRisk({
    message: input.message,
    reply,
    linkAnalysis,
    hadImage,
  });
  if (!risk || risk.verdict !== "danger") return;

  await deps.recordChatDanger(senior.familyCode, senior.userId, risk.summary);
}

export function createChatService(deps: ChatServiceDeps): ChatService {
  return {
    async ask(input, senior) {
      const result = await deps.ask(input);
      if (result.kind === "missing-config") return { status: 503, body: { ok: false, message: MESSAGES.loadFailed } };
      if (result.kind !== "response") return { status: 502, body: { ok: false, message: MESSAGES.loadFailed } };

      const data = result.data ?? {};
      const reply = typeof data.reply === "string" ? data.reply.trim() : "";
      if (!result.ok || !reply) {
        return {
          status: result.ok ? 502 : result.status,
          body: { ok: false, message: toPublicMessage(data.message, MESSAGES.chatNoReply) },
        };
      }

      const linkUrl = extractLinkUrl(data.linkAnalysis, input.message, reply);
      const outcome: ChatOutcome = {
        status: 200,
        body: { ok: true, reply, linkUrl },
      };

      if (senior) {
        const task = () =>
          recordChatRiskAfterReply(deps, senior, input, reply, linkUrl, data.linkAnalysis).catch(() => undefined);
        if (deps.defer) deps.defer(task);
        else await task();
      }

      return outcome;
    },
  };
}
