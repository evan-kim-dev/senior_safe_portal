import type { User } from "@supabase/supabase-js";
import {
  accountRoleLabel,
  ageFromBirthYear,
  parseAccountProfileFromMeta,
  VIDEO_INTEREST_OPTIONS,
  type AccountProfile,
} from "./account-profile";

export type UserMetadata = Record<string, unknown>;

export function trimMetaString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** 메뉴·헤더 등 기본 표시 이름. */
export function menuDisplayName(user: User, fallback = "내 계정"): string {
  const meta = user.user_metadata ?? {};
  const name = [meta.full_name, meta.name, meta.nickname, user.email].find(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );
  return name?.trim() || fallback;
}

/** 계정 관리 화면용 이름·닉네임·역할. */
export function accountProfileFields(user: User): {
  name: string;
  nickname: string;
  phone: string;
  roleLabel: string;
  ageLabel: string;
  interestsLabel: string;
  profile: AccountProfile;
} {
  const meta = user.user_metadata ?? {};
  const profile = parseAccountProfileFromMeta(meta);
  const age = profile.birthYear != null ? ageFromBirthYear(profile.birthYear) : null;
  return {
    name: trimMetaString(meta.full_name) || trimMetaString(meta.name) || "—",
    nickname: trimMetaString(meta.nickname) || "—",
    phone: user.phone || trimMetaString(meta.phone) || "—",
    roleLabel: accountRoleLabel(profile.role),
    ageLabel:
      profile.role === "senior" && age != null && profile.birthYear != null
        ? `${age}세 (${profile.birthYear}년생)`
        : "—",
    interestsLabel:
      profile.role === "senior" && profile.interests.length
        ? profile.interests
            .map((id) => VIDEO_INTEREST_OPTIONS.find((item) => item.id === id)?.label ?? id)
            .join(", ")
        : profile.role === "senior"
          ? "전체"
          : "—",
    profile,
  };
}

/** 게시판 작성자 자동 입력(닉네임 우선). */
export function boardAuthorName(user: User | null): string {
  if (!user) return "";
  const meta = user.user_metadata ?? {};
  return (
    trimMetaString(meta.nickname) ||
    trimMetaString(meta.full_name) ||
    trimMetaString(meta.name) ||
    ""
  );
}

/** 서버에서 Auth metadata 로 표시 이름을 고른다. */
export function pickDisplayNameFromMeta(
  meta: UserMetadata | undefined,
  email?: string | null,
  maxLen = 40,
): string {
  const candidates = [meta?.full_name, meta?.name, meta?.nickname, email];
  for (const value of candidates) {
    const trimmed = trimMetaString(value);
    if (trimmed) return trimmed.slice(0, maxLen);
  }
  return "";
}

export function avatarUrlFromMeta(user: User): string {
  const meta = user.user_metadata ?? {};
  const url = [meta.avatar_url, meta.picture].find(
    (value): value is string => typeof value === "string" && /^https:\/\//i.test(value),
  );
  return url ?? "";
}

export function initialsFromDisplayName(displayName: string): string {
  const chars = Array.from(displayName.replace(/@.*/, "").replace(/\s+/g, ""));
  return (chars[0] ?? "나").slice(0, 1).toUpperCase();
}
