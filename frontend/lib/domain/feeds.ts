import { isAllowedImageHost } from "@/lib/security/csp";
import type { NewsItem, VideoItem, WelfareCard } from "./types";
import { asString, collapseSpaces, decodeText } from "./text";
import { extractRawHttpUrls, hostnameOf } from "./url";

export const MAX_VIDEOS = 20;

/** 복지 카드: 65세·노인 관련만. '돌봄' 단독은 아이돌봄 등에 걸려 제외 목록으로 걸러 낸다. */
const SENIOR_TARGET_RE =
  /65\s*세|노인|어르신|고령|경로|기초연금|장기요양|노년|독거|실버|노후|요양|치매|재가|노인돌봄|어르신\s*돌봄|경로당|기초생활/;

/** 아동·청년·임신 등 65세+ 대상이 아닌 복지. */
const NON_SENIOR_RE =
  /아이돌봄|영유아|아동|청소년|임신|출산|육아|보육|어린이집|유치원|초등|중학|고등|청년|대학생|병역|다문화\s*가정\s*아동|산모|신생아/;

const VIDEO_ID = /^[\w-]{11}$/;

export function isVideoId(value: unknown): value is string {
  return typeof value === "string" && VIDEO_ID.test(value);
}

function records(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item));
}

function safeHttpsUrl(raw: unknown): string {
  if (typeof raw !== "string") return "";
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

/** 유튜브 등 화이트리스트 CDN만. */
function safeImageUrl(raw: unknown): string {
  if (typeof raw !== "string") return "";
  try {
    const url = new URL(raw.trim());
    if (url.protocol === "http:") url.protocol = "https:";
    if (url.protocol !== "https:") return "";
    if (!isAllowedImageHost(url.hostname)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

/** 뉴스 OG·파비콘: 매체마다 CDN이 달라 https 만 허용한다(CSP img-src https:). */
function safeNewsImageUrl(raw: unknown): string {
  if (typeof raw !== "string") return "";
  try {
    const url = new URL(raw.trim());
    if (url.protocol === "http:") url.protocol = "https:";
    if (url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

/** 설명 속 주소 중 유튜브 밖으로 나가는 첫 주소. */
export function suspiciousUrlIn(description: string): string {
  return extractRawHttpUrls(description).find((url) => !/youtube\.com|youtu\.be/i.test(url)) ?? "";
}

/** 선호 카테고리일수록 한 바퀴에 더 많이 뽑아 앞줄을 채운다. */
function preferenceWeight(rank: number, preferredCount: number): number {
  if (preferredCount <= 0) return 1;
  if (rank <= 0) return 3;
  if (rank === 1) return 2;
  return 1;
}

export function mapVideos(
  rows: ReadonlyArray<{ category_id?: unknown; videos?: unknown }>,
  options?: { preferredCategories?: readonly string[] },
): VideoItem[] {
  const seen = new Set<string>();
  const preferred = options?.preferredCategories ?? [];
  const orderedRows =
    preferred.length === 0
      ? [...rows]
      : [...rows].sort((a, b) => {
          const aId = typeof a.category_id === "string" ? a.category_id : "";
          const bId = typeof b.category_id === "string" ? b.category_id : "";
          const aRank = preferred.indexOf(aId);
          const bRank = preferred.indexOf(bId);
          const aScore = aRank === -1 ? preferred.length + 1 : aRank;
          const bScore = bRank === -1 ? preferred.length + 1 : bRank;
          return aScore - bScore;
        });

  const buckets = orderedRows
    .map((row) => {
      const categoryId = typeof row.category_id === "string" ? row.category_id : "";
      const items: VideoItem[] = [];
      for (const video of records(row.videos)) {
        const id = asString(video.video_id);
        if (!VIDEO_ID.test(id) || seen.has(id)) continue;
        seen.add(id);

        const description = decodeText(asString(video.description));
        items.push({
          id,
          title: decodeText(asString(video.title) || "영상"),
          thumbnail: safeHttpsUrl(video.thumbnail) || `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
          description,
          suspiciousUrl: suspiciousUrlIn(description),
          channel: decodeText(asString(video.channel)),
          categoryId: categoryId || undefined,
        });
      }
      return { categoryId, items };
    })
    .filter((bucket) => bucket.items.length > 0);

  // 관심·나이 순으로 가중 번갈아 넣어, 고른 주제가 앞쪽에 더 많이 보이게 한다.
  const videos: VideoItem[] = [];
  const cursors = buckets.map(() => 0);
  while (videos.length < MAX_VIDEOS) {
    let added = false;
    for (let bucketIndex = 0; bucketIndex < buckets.length; bucketIndex += 1) {
      const bucket = buckets[bucketIndex];
      const rank = preferred.length ? preferred.indexOf(bucket.categoryId) : -1;
      const weight = preferenceWeight(rank === -1 ? preferred.length + bucketIndex : rank, preferred.length);
      for (let take = 0; take < weight && videos.length < MAX_VIDEOS; take += 1) {
        const cursor = cursors[bucketIndex];
        if (cursor >= bucket.items.length) break;
        videos.push(bucket.items[cursor]);
        cursors[bucketIndex] = cursor + 1;
        added = true;
      }
    }
    if (!added) break;
  }

  return videos;
}

function sourceName(url: string, publisher: string): string {
  return hostnameOf(url) || publisher || "출처";
}

export function mapNews(
  rows: ReadonlyArray<{ category_id?: unknown; articles?: unknown }>,
  options?: { preferredCategories?: readonly string[]; maxItems?: number },
): NewsItem[] {
  const preferred = options?.preferredCategories ?? [];
  const maxItems = options?.maxItems ?? 24;
  const seen = new Set<string>();

  const orderedRows =
    preferred.length === 0
      ? [...rows]
      : [...rows].sort((a, b) => {
          const aId = typeof a.category_id === "string" ? a.category_id : "";
          const bId = typeof b.category_id === "string" ? b.category_id : "";
          const aRank = preferred.indexOf(aId);
          const bRank = preferred.indexOf(bId);
          const aScore = aRank === -1 ? preferred.length + 1 : aRank;
          const bScore = bRank === -1 ? preferred.length + 1 : bRank;
          return aScore - bScore;
        });

  const buckets = orderedRows
    .map((row) => {
      const categoryId = typeof row.category_id === "string" ? row.category_id : "";
      const items: NewsItem[] = [];
      for (const article of records(row.articles)) {
        const url = asString(article.originallink) || asString(article.link);
        if (!url.startsWith("http") || seen.has(url)) continue;
        seen.add(url);
        items.push({
          title: decodeText(asString(article.title) || "뉴스"),
          source: sourceName(url, asString(article.publisher)),
          date: decodeText(asString(article.pubDate)),
          url,
          image: safeNewsImageUrl(article.thumbnail) || safeNewsImageUrl(article.image),
          categoryId: categoryId || undefined,
        });
      }
      return { categoryId, items };
    })
    .filter((bucket) => bucket.items.length > 0);

  const articles: NewsItem[] = [];
  const cursors = buckets.map(() => 0);
  while (articles.length < maxItems) {
    let added = false;
    for (let bucketIndex = 0; bucketIndex < buckets.length; bucketIndex += 1) {
      const bucket = buckets[bucketIndex];
      const rank = preferred.length ? preferred.indexOf(bucket.categoryId) : -1;
      const weight = preferenceWeight(rank === -1 ? preferred.length + bucketIndex : rank, preferred.length);
      for (let take = 0; take < weight && articles.length < maxItems; take += 1) {
        const cursor = cursors[bucketIndex];
        if (cursor >= bucket.items.length) break;
        articles.push(bucket.items[cursor]);
        cursors[bucketIndex] = cursor + 1;
        added = true;
      }
    }
    if (!added) break;
  }
  return articles;
}

/** 키워드·동네 여부를 점수로 매겨 복지 카드를 앞에 둔다. */
export function rankWelfareCards(
  cards: WelfareCard[],
  keywords: readonly string[],
): WelfareCard[] {
  if (!keywords.length) {
    return [...cards].sort((a, b) => Number(b.kind === "우리 동네") - Number(a.kind === "우리 동네"));
  }
  const scoreOf = (card: WelfareCard) => {
    const text = `${card.title} ${card.target} ${card.apply}`;
    let score = card.kind === "우리 동네" ? 1 : 0;
    for (const keyword of keywords) {
      if (keyword && text.includes(keyword)) score += 3;
    }
    return score;
  };
  return [...cards].sort((a, b) => scoreOf(b) - scoreOf(a));
}

export type WelfarePayload = {
  region?: unknown;
  city?: unknown;
  services?: unknown;
  nationalServices?: unknown;
};

/** 신청 안내에서 URL·도메인 글씨를 빼고 읽기 쉬운 문장만 남긴다. */
function stripUrlLookalikes(text: string): string {
  return collapseSpaces(
    text
      .replace(/https?:\/\/\S+/gi, " ")
      .replace(/\b[\w.-]+\.(kr|com|go\.kr|or\.kr|net|org)\S*/gi, " "),
  );
}

function applyText(row: Record<string, unknown>): string {
  const method = stripUrlLookalikes(collapseSpaces(asString(row.applicationMethod)));
  if (method) return method;
  if (row.onlineAvailable === "Y") return "온라인으로 신청할 수 있습니다.";
  const site = stripUrlLookalikes(collapseSpaces(asString(row.site)));
  if (site && !/^www\./i.test(site)) return site;
  if (safeHttpsUrl(row.link) || safeHttpsUrl(row.site)) return "아래 버튼으로 신청 안내를 확인하세요.";
  return "안내가 없습니다.";
}

function targetText(row: Record<string, unknown>): string {
  const target = collapseSpaces(asString(row.target));
  if (target) return target;
  const summary = collapseSpaces(asString(row.summary));
  if (summary) return summary;
  return "대상 안내가 없습니다.";
}

export function mapWelfare(payload: WelfarePayload, requestedRegion: string): { place: string; cards: WelfareCard[] } {
  const place = [asString(payload.region), asString(payload.city)].filter(Boolean).join(" ") || requestedRegion;
  const cards = [...records(payload.services), ...records(payload.nationalServices)]
    .filter((row) => collapseSpaces(asString(row.servNm)))
    .map((row) => {
      const href = safeHttpsUrl(row.link) || safeHttpsUrl(row.site) || "https://www.bokjiro.go.kr/";
      return {
        title: collapseSpaces(asString(row.servNm)),
        target: targetText(row),
        apply: applyText(row),
        kind: row.source === "national" ? "전국" : "우리 동네",
        href,
      };
    })
    .filter((card) => {
      const haystack = `${card.title} ${card.target} ${card.apply}`;
      if (NON_SENIOR_RE.test(haystack)) return false;
      return SENIOR_TARGET_RE.test(haystack);
    });
  return { place, cards };
}
