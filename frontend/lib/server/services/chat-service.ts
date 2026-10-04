import { extractLinkUrl } from "@/lib/domain/chat";
import { MESSAGES } from "@/lib/domain/messages";
import { toPublicMessage } from "@/lib/domain/sanitize";
import type { ChatResponse } from "@/lib/domain/types";
import type { ChatInput } from "@/lib/domain/validation";
import type { EdgeResult } from "../gateways/edge-functions";

export const CHAT_TIMEOUT_MS = 50_000;

export type ChatOutcome = { status: number; body: ChatResponse };

export type ChatServiceDeps = {
  ask(payload: ChatInput): Promise<EdgeResult>;
};

export type ChatService = { ask(input: ChatInput): Promise<ChatOutcome> };

export function createChatService(deps: ChatServiceDeps): ChatService {
  return {
    async ask(input) {
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

      return {
        status: 200,
        body: { ok: true, reply, linkUrl: extractLinkUrl(data.linkAnalysis, input.message, reply) },
      };
    },
  };
}
