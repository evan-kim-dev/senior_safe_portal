import type { GuardianSettings, TextSize } from "./types";
import { isFamilyCode } from "./validation";

export type SetupPayload = Pick<GuardianSettings, "name" | "phone" | "textSize" | "channels" | "familyCode">;

export const MAX_NAME_LENGTH = 32;
export const MAX_PHONE_LENGTH = 20;
const MAX_CHANNELS = 50;
const MAX_CHANNEL_LENGTH = 100;

export function isTextSize(value: unknown): value is TextSize {
  return value === "normal" || value === "large" || value === "xlarge";
}

export function textSizeLabel(size: TextSize): string {
  if (size === "large") return "크게";
  if (size === "xlarge") return "더 크게";
  return "보통";
}

export function sanitizePhone(raw: string): string {
  return raw.replace(/[^\d+]/g, "").slice(0, MAX_PHONE_LENGTH);
}

export function sanitizeName(raw: string): string {
  return raw.trim().slice(0, MAX_NAME_LENGTH);
}

export function sanitizeChannels(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.slice(0, MAX_CHANNEL_LENGTH))
    .slice(0, MAX_CHANNELS);
}

/** 어르신 폰에 넣을 QR 주소. 설정은 # 뒤에만 실어 서버로 가지 않게 한다. */
export function buildSetupLink(origin: string, payload: SetupPayload): string {
  const body: SetupPayload = {
    name: payload.name,
    phone: payload.phone,
    textSize: payload.textSize,
    channels: payload.channels,
    familyCode: payload.familyCode,
  };
  return `${origin}/setup#${encodeURIComponent(JSON.stringify(body))}`;
}

/** /setup 의 # 뒤를 읽는다. 형식이 틀리면 null. */
export function parseSetupHash(hash: string): SetupPayload | null {
  const raw = hash.replace(/^#/, "");
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

  const value = parsed as Record<string, unknown>;
  return {
    name: typeof value.name === "string" ? sanitizeName(value.name) : "",
    phone: typeof value.phone === "string" ? sanitizePhone(value.phone) : "",
    textSize: isTextSize(value.textSize) ? value.textSize : "normal",
    channels: sanitizeChannels(value.channels),
    familyCode: isFamilyCode(value.familyCode) ? value.familyCode : "",
  };
}
