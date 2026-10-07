import type { NewsItem, VideoItem, WelfareCard } from "./types";
import { asString, collapseSpaces, decodeText } from "./text";
import { extractRawHttpUrls, hostnameOf } from "./url";

export const MAX_VIDEOS = 20;

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

/** 뉴스 썸네일. https 우선, http 는 https 로 올려 본다. */
function safeImageUrl(raw: unknown): string {
  if (typeof raw !== "string") return "";
  try {
    const url = new URL(raw.trim());
    if (url.protocol === "https:") return url.toString();
    if (url.protocol === "http:") {
      url.protocol = "https:";
      return url.toString();
    }
    return "";
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

export function mapNews(rows: ReadonlyArray<{ articles?: unknown }>): NewsItem[] {
  return rows
    .flatMap((row) => records(row.articles))
    .map((article) => {
      const url = asString(article.originallink) || asString(article.link);
      return {
        title: decodeText(asString(article.title) || "뉴스"),
        source: sourceName(url, asString(article.publisher)),
        date: decodeText(asString(article.pubDate)),
        url,
        image: safeImageUrl(article.thumbnail) || safeImageUrl(article.image),
      };
    })
    .filter((article) => article.url.startsWith("http"));
}

export type WelfarePayload = {
  region?: unknown;
  city?: unknown;
  services?: unknown;
  nationalServices?: unknown;
};

function applyText(row: Record<string, unknown>): string {
  const method = collapseSpaces(asString(row.applicationMethod));
  if (method) return method;
  if (row.onlineAvailable === "Y") return "온라인으로 신청할 수 있습니다.";
  const site = collapseSpaces(asString(row.site));
  if (site) return site;
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
    });
  return { place, cards };
}
