import { sanitizePhone } from "./setup";

/** 가족 연동(부모·자녀) 도메인. */

export type FamilyLinks = { kakao: string; sms: string };

/** "가족에게 말하기" 가 여는 카카오톡·문자 주소. 번호가 없으면 null. */
export function buildFamilyLinks(rawPhone: string, url: string, isIOS: boolean): FamilyLinks | null {
  const phone = sanitizePhone(rawPhone);
  if (!phone) return null;

  const text = encodeURIComponent(`이 주소는 누르지 마세요\n${url}`);
  return {
    kakao: `kakaotalk://send?text=${text}`,
    sms: isIOS ? `sms:${phone}&body=${text}` : `sms:${phone}?body=${text}`,
  };
}

export type FamilyRole = "guardian" | "senior";

export type ActivityKind = "danger_video" | "danger_link" | "danger_chat" | "video_watch" | "news_view";

export type FamilyMembership = {
  familyId: string;
  role: FamilyRole;
};

export type FamilySeniorStatus = "attention" | "active" | "quiet";

export type FamilySenior = {
  userId: string;
  displayName: string;
  /** 오늘 위험 감지(영상·링크·챗봇). */
  dangerCount: number;
  newsCount: number;
  watchSec: number;
  lastActivityAt?: string;
  lastActivityLabel?: string;
  status: FamilySeniorStatus;
  birthYear?: number;
  ageLabel?: string;
};

export type FamilyActivityItem = {
  id: string;
  createdAt: string;
  kind: ActivityKind;
  label: string;
  userId?: string;
  memberLabel?: string;
};

export type FamilyMeResponse = {
  ok: true;
  familyId: string;
  role: FamilyRole;
  inviteCode: string;
  inviteExpiresAt: string;
  seniorCount: number;
  seniors: FamilySenior[];
  connected: boolean;
  todayCount: number;
  todayNewsCount: number;
  todayWatchSec: number;
  todayItems: FamilyActivityItem[];
} | {
  ok: false;
  message: string;
  needsFamily?: boolean;
};

export type FamilyLeaveResponse =
  | { ok: true; action: "leave" | "reset"; inviteCode?: string; inviteExpiresAt?: string }
  | { ok: false; message: string };

export type FamilyJoinResponse = {
  ok: true;
  familyId: string;
  role: FamilyRole;
} | {
  ok: false;
  message: string;
};

/** 혼동 글자(0/O, 1/I)를 뺀 8자리. 약 1.1조 조합. */
export const INVITE_CODE_LENGTH = 8;
export const INVITE_TTL_MS = 24 * 60 * 60 * 1000;
export const INVITE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** 연결 해제·초기화 확인 문구(서버·UI 공통). */
export const FAMILY_LEAVE_CONFIRM = "해제";
export const FAMILY_RESET_CONFIRM = "초기화";

export function familySeniorDisplayName(index: number, name: string): string {
  return name.trim() || `부모님 ${index + 1}`;
}

const INVITE_CODE = new RegExp(`^[${INVITE_ALPHABET}]{${INVITE_CODE_LENGTH}}$`);

export function isInviteCode(value: unknown): value is string {
  return typeof value === "string" && INVITE_CODE.test(normalizeInviteCode(value));
}

export function normalizeInviteCode(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, "").toUpperCase() : "";
}

/** 암호학적으로 안전한 초대 코드. */
export function generateInviteCode(): string {
  const bytes = new Uint8Array(INVITE_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const byte of bytes) out += INVITE_ALPHABET[byte % INVITE_ALPHABET.length];
  return out;
}

export function isFamilyRole(value: unknown): value is FamilyRole {
  return value === "guardian" || value === "senior";
}
