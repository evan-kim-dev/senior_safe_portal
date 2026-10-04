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

/** 설명 속 주소 중 유튜브 밖으로 나가는 첫 주소. */
export function suspiciousUrlIn(description: string): string {
  return extractRawHttpUrls(description).find((url) => !/youtube\.com|youtu\.be/i.test(url)) ?? "";
}

export function mapVideos(rows: ReadonlyArray<{ videos?: unknown }>): VideoItem[] {
  const seen = new Set<string>();
  const videos: VideoItem[] = [];

  for (const row of rows) {
    for (const video of records(row.videos)) {
      const id = asString(video.video_id);
      if (!VIDEO_ID.test(id) || seen.has(id)) continue;
      seen.add(id);

      const description = decodeText(asString(video.description));
      videos.push({
        id,
        title: decodeText(asString(video.title) || "영상"),
        thumbnail: safeHttpsUrl(video.thumbnail) || `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        description,
        suspiciousUrl: suspiciousUrlIn(description),
        channel: decodeText(asString(video.channel)),
      });
      if (videos.length >= MAX_VIDEOS) return videos;
    }
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
    .map((row) => ({
      title: collapseSpaces(asString(row.servNm)),
      target: targetText(row),
      apply: applyText(row),
      kind: row.source === "national" ? "전국" : "우리 동네",
    }));
  return { place, cards };
}
