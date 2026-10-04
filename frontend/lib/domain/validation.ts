import { MESSAGES } from "./messages";
import { err, ok, type Result } from "./result";
import type { ChatTurn } from "./types";
import { MAX_URL_LENGTH } from "./url";

export const MAX_CHAT_MESSAGE_LENGTH = 2000;
export const MAX_CHAT_HISTORY = 12;

const FAMILY_CODE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CATEGORY_ID = /^[a-z0-9_-]{1,40}$/i;
const REGION = /^[0-9A-Za-z가-힣 ]{1,40}$/;
const WELFARE_CATEGORY = /^[0-9A-Za-z가-힣_-]{1,40}$/;

function field(body: unknown, key: string): unknown {
  if (!body || typeof body !== "object" || Array.isArray(body)) return undefined;
  return (body as Record<string, unknown>)[key];
}

function trimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isFamilyCode(value: unknown): value is string {
  return typeof value === "string" && FAMILY_CODE.test(value);
}

export type CheckInput = { url: string; familyCode: string };

export function parseCheckInput(body: unknown): Result<CheckInput> {
  const url = trimmed(field(body, "url"));
  if (!url) return err(MESSAGES.urlRequired);
  if (url.length > MAX_URL_LENGTH) return err(MESSAGES.urlTooLong);
  const familyCode = trimmed(field(body, "familyCode"));
  return ok({ url, familyCode: isFamilyCode(familyCode) ? familyCode : "" });
}

export type ChatInput = { message: string; history: ChatTurn[] };

export function sanitizeHistory(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is ChatTurn => {
      if (!item || typeof item !== "object") return false;
      const turn = item as Partial<ChatTurn>;
      return (turn.role === "user" || turn.role === "assistant") && typeof turn.content === "string";
    })
    .slice(-MAX_CHAT_HISTORY)
    .map((item) => ({ role: item.role, content: item.content.slice(0, MAX_CHAT_MESSAGE_LENGTH) }));
}

export function parseChatInput(body: unknown): Result<ChatInput> {
  const message = trimmed(field(body, "message"));
  if (!message) return err(MESSAGES.chatEmpty);
  if (message.length > MAX_CHAT_MESSAGE_LENGTH) return err(MESSAGES.chatTooLong);
  return ok({ message, history: sanitizeHistory(field(body, "history")) });
}

/** 영상·뉴스 분류. 비어 있으면 전체를 읽는다. */
export function parseFeedInput(body: unknown): Result<{ categoryId: string }> {
  const categoryId = trimmed(field(body, "categoryId"));
  if (categoryId && !CATEGORY_ID.test(categoryId)) return err(MESSAGES.categoryInvalid);
  return ok({ categoryId });
}

export type WelfareInput = { region: string; category: string };

export function parseWelfareInput(body: unknown): Result<WelfareInput> {
  const region = trimmed(field(body, "region"));
  if (!region) return err(MESSAGES.welfareRegionRequired);
  if (!REGION.test(region)) return err(MESSAGES.welfareBadRequest);
  const category = trimmed(field(body, "category")) || "all";
  if (!WELFARE_CATEGORY.test(category)) return err(MESSAGES.welfareBadRequest);
  return ok({ region, category });
}
