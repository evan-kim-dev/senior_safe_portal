/** 가입·추천에 쓰는 계정 역할·어르신 프로필. Auth user_metadata 에 둔다. */

export const ACCOUNT_ROLES = ["senior", "guardian"] as const;
export type AccountRole = (typeof ACCOUNT_ROLES)[number];

export const VIDEO_INTEREST_IDS = ["music", "affairs", "history", "entertainment", "health"] as const;
export type VideoInterestId = (typeof VIDEO_INTEREST_IDS)[number];

export const VIDEO_INTEREST_OPTIONS: ReadonlyArray<{
  id: VideoInterestId;
  label: string;
  description: string;
}> = [
  { id: "music", label: "노래", description: "트로트·가요 명곡을 먼저 보여 드려요." },
  { id: "affairs", label: "시사·뉴스", description: "요즘 소식·뉴스를 위주로 골라요." },
  { id: "history", label: "역사", description: "우리 역사·다큐를 앞쪽에 둬요." },
  { id: "entertainment", label: "예능", description: "웃고 즐기는 예능을 추천해요." },
  { id: "health", label: "건강·체조", description: "체조·건강 영상을 우선 보여 드려요." },
];

/** 관심사 라벨을 쉼표로 이어 화면 문구에 쓴다. */
export function videoInterestLabels(ids: readonly VideoInterestId[]): string {
  return ids
    .map((id) => VIDEO_INTEREST_OPTIONS.find((item) => item.id === id)?.label ?? id)
    .join(", ");
}

export const DEFAULT_VIDEO_CATEGORY_ORDER: readonly VideoInterestId[] = [
  "music",
  "affairs",
  "history",
  "entertainment",
  "health",
];

export type AccountProfile = {
  role: AccountRole | null;
  birthYear: number | null;
  interests: VideoInterestId[];
};

export function isAccountRole(value: unknown): value is AccountRole {
  return value === "senior" || value === "guardian";
}

export function isVideoInterestId(value: unknown): value is VideoInterestId {
  return typeof value === "string" && (VIDEO_INTEREST_IDS as readonly string[]).includes(value);
}

export function accountRoleLabel(role: AccountRole | null | undefined): string {
  if (role === "senior") return "어르신(senior)";
  if (role === "guardian") return "관리자(guardian)";
  return "미설정";
}

/** 가입 시 고른 관리자 역할. 대시보드를 기본 화면으로 쓴다. */
export function isGuardianAccount(user: { user_metadata?: Record<string, unknown> | null } | null | undefined): boolean {
  if (!user) return false;
  return parseAccountProfileFromMeta(user.user_metadata ?? undefined).role === "guardian";
}

/** 로그인 후·홈 진입 시 기본 경로. */
export function homePathForAccount(user: { user_metadata?: Record<string, unknown> | null } | null | undefined): string {
  return isGuardianAccount(user) ? "/care" : "/";
}

export function ageFromBirthYear(birthYear: number, now = new Date()): number | null {
  if (!Number.isInteger(birthYear)) return null;
  const age = now.getFullYear() - birthYear;
  return age >= 0 && age <= 120 ? age : null;
}

/** 나이대·관심 주제로 영상 카테고리 우선순위를 잡는다. */
export function preferredVideoCategories(
  profile: Pick<AccountProfile, "role" | "birthYear" | "interests">,
  now = new Date(),
): VideoInterestId[] {
  const base = baseOrderForAge(profile.role === "senior" ? ageFromBirthYear(profile.birthYear ?? 0, now) : null);
  const picked = profile.interests.filter(isVideoInterestId);
  if (!picked.length) return [...base];

  const rest = base.filter((id) => !picked.includes(id));
  return [...picked, ...rest];
}

function baseOrderForAge(age: number | null): VideoInterestId[] {
  if (age == null) return [...DEFAULT_VIDEO_CATEGORY_ORDER];
  if (age >= 80) return ["health", "music", "affairs", "history", "entertainment"];
  if (age >= 70) return ["music", "health", "affairs", "entertainment", "history"];
  if (age >= 60) return ["entertainment", "health", "music", "affairs", "history"];
  return ["health", "entertainment", "affairs", "music", "history"];
}

export function parseAccountProfileFromMeta(meta: Record<string, unknown> | null | undefined): AccountProfile {
  const raw = meta ?? {};
  const role = isAccountRole(raw.account_role) ? raw.account_role : null;
  const birthRaw = raw.birth_year;
  const birthYear =
    typeof birthRaw === "number"
      ? birthRaw
      : typeof birthRaw === "string" && /^\d{4}$/.test(birthRaw.trim())
        ? Number(birthRaw.trim())
        : null;
  const interestsRaw = raw.interests;
  const interests = Array.isArray(interestsRaw)
    ? interestsRaw.filter(isVideoInterestId)
    : typeof interestsRaw === "string"
      ? interestsRaw.split(",").map((item) => item.trim()).filter(isVideoInterestId)
      : [];
  return {
    role,
    birthYear: birthYear != null && Number.isInteger(birthYear) ? birthYear : null,
    interests,
  };
}
