/** 가입·추천에 쓰는 계정 역할·어르신 프로필. Auth user_metadata 에 둔다. */

export const ACCOUNT_ROLES = ["senior", "guardian"] as const;
export type AccountRole = (typeof ACCOUNT_ROLES)[number];

/** 영상 관심 = 사기·예방 주제 (refresh-youtube-feeds 와 같음). */
export const VIDEO_INTEREST_IDS = ["scam", "smishing", "finance", "digital", "family"] as const;
export type VideoInterestId = (typeof VIDEO_INTEREST_IDS)[number];

export const VIDEO_INTEREST_OPTIONS: ReadonlyArray<{
  id: VideoInterestId;
  label: string;
  description: string;
}> = [
  { id: "scam", label: "보이스피싱", description: "전화·검찰 사칭 예방 영상을 먼저 보여 드려요." },
  { id: "smishing", label: "문자·링크 사기", description: "스미싱·악성 링크 주의 영상을 골라요." },
  { id: "finance", label: "금융 사기", description: "계좌·투자 사기 예방 영상을 앞쪽에 둬요." },
  { id: "digital", label: "디지털 안전", description: "원격앱·개인정보 지키는 방법을 추천해요." },
  { id: "family", label: "가족 사칭", description: "메신저·가족 사칭 예방 영상을 보여 드려요." },
];

/** 관심사 라벨을 쉼표로 이어 화면 문구에 쓴다. */
export function videoInterestLabels(ids: readonly VideoInterestId[]): string {
  return ids
    .map((id) => VIDEO_INTEREST_OPTIONS.find((item) => item.id === id)?.label ?? id)
    .join(", ");
}

export const DEFAULT_VIDEO_CATEGORY_ORDER: readonly VideoInterestId[] = [
  "scam",
  "smishing",
  "finance",
  "digital",
  "family",
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
  if (role === "senior") return "어르신";
  if (role === "guardian") return "보호자";
  return "미설정";
}

/** 가입 시 고른 보호자 역할. 대시보드를 기본 화면으로 쓴다. */
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
  if (age >= 80) return ["scam", "family", "finance", "smishing", "digital"];
  if (age >= 70) return ["scam", "smishing", "family", "finance", "digital"];
  if (age >= 60) return ["scam", "smishing", "finance", "family", "digital"];
  return [...DEFAULT_VIDEO_CATEGORY_ORDER];
}

/** 뉴스 피드 category_id (refresh-news-feeds 와 같음). 사기·보안 중심. */
export const NEWS_CATEGORY_IDS = ["scam", "security", "finance", "digital", "alert"] as const;
export type NewsCategoryId = (typeof NEWS_CATEGORY_IDS)[number];

export const DEFAULT_NEWS_CATEGORY_ORDER: readonly NewsCategoryId[] = [
  "scam",
  "security",
  "finance",
  "digital",
  "alert",
];

const VIDEO_INTEREST_TO_NEWS: Record<VideoInterestId, readonly NewsCategoryId[]> = {
  scam: ["scam", "alert"],
  smishing: ["security", "digital"],
  finance: ["finance", "scam"],
  digital: ["digital", "security"],
  family: ["scam", "alert"],
};

function isNewsCategoryId(value: unknown): value is NewsCategoryId {
  return typeof value === "string" && (NEWS_CATEGORY_IDS as readonly string[]).includes(value);
}

function newsBaseOrderForAge(age: number | null): NewsCategoryId[] {
  if (age == null) return [...DEFAULT_NEWS_CATEGORY_ORDER];
  if (age >= 80) return ["scam", "finance", "security", "alert", "digital"];
  if (age >= 70) return ["scam", "security", "finance", "alert", "digital"];
  if (age >= 60) return ["scam", "security", "alert", "finance", "digital"];
  return [...DEFAULT_NEWS_CATEGORY_ORDER];
}

/** 관심·나이로 뉴스 카테고리 우선순위를 잡는다. */
export function preferredNewsCategories(
  profile: Pick<AccountProfile, "role" | "birthYear" | "interests">,
  now = new Date(),
): NewsCategoryId[] {
  const age = profile.role === "senior" ? ageFromBirthYear(profile.birthYear ?? 0, now) : null;
  const base = newsBaseOrderForAge(age);
  const fromInterests: NewsCategoryId[] = [];
  for (const interest of profile.interests.filter(isVideoInterestId)) {
    for (const newsId of VIDEO_INTEREST_TO_NEWS[interest]) {
      if (!fromInterests.includes(newsId)) fromInterests.push(newsId);
    }
  }
  if (!fromInterests.length) return base;
  const rest = base.filter((id) => !fromInterests.includes(id));
  return [...fromInterests, ...rest].filter(isNewsCategoryId);
}

/** 복지 카드 정렬에 쓰는 한글 키워드. */
export function welfarePreferenceKeywords(
  profile: Pick<AccountProfile, "role" | "birthYear" | "interests">,
  now = new Date(),
): string[] {
  const age = profile.role === "senior" ? ageFromBirthYear(profile.birthYear ?? 0, now) : null;
  const keywords: string[] = [];
  const push = (...items: string[]) => {
    for (const item of items) {
      if (!keywords.includes(item)) keywords.push(item);
    }
  };

  if (profile.role === "senior" || age != null) {
    push("노인", "어르신", "기초연금", "장기요양", "경로");
  }
  if (age != null && age >= 75) push("요양", "방문", "재가", "치매");
  for (const interest of profile.interests.filter(isVideoInterestId)) {
    if (interest === "finance") push("금융", "기초연금", "수당");
    if (interest === "scam" || interest === "family") push("안전", "보이스피싱");
    if (interest === "digital" || interest === "smishing") push("디지털", "정보");
  }
  return keywords;
}

/** 피드 맞춤을 켤지. 어르신 역할이거나 관심·나이가 있을 때. */
export function shouldPersonalizeFeeds(profile: AccountProfile): boolean {
  return profile.role === "senior" || profile.interests.length > 0 || profile.birthYear != null;
}

/** 화면 lead 문구. */
export function personalizedFeedLead(
  kind: "videos" | "news" | "welfare",
  profile: AccountProfile,
): string | null {
  if (!shouldPersonalizeFeeds(profile)) return null;
  if (kind === "videos" && profile.interests.length) {
    return `${videoInterestLabels(profile.interests)} 관심에 맞춰 예방 영상을 먼저 보여 드려요.`;
  }
  if (kind === "news") {
    if (profile.interests.length) {
      return `${videoInterestLabels(profile.interests)} 관심에 맞는 사기·보안 소식을 앞에 두었어요.`;
    }
    return "사기·보안 관련 소식을 모았어요.";
  }
  if (kind === "welfare") {
    return "65세 이상 어르신 혜택을 앞에 두었어요. 사는 곳도 맞춰 보세요.";
  }
  return null;
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
