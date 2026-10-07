import "server-only";
import type { WelfarePayload } from "@/lib/domain/feeds";
import type { RestClient } from "../supabase/rest-client";

/** 영상은 하루 다섯 번, 뉴스는 매시 갱신. 서버 캐시는 그에 맞춰 짧게 둔다. */
export const VIDEO_FEED_REVALIDATE_SECONDS = 300;
export const NEWS_FEED_REVALIDATE_SECONDS = 60;
export const WELFARE_FEED_REVALIDATE_SECONDS = 300;

export type FeedRow = { category_id?: unknown; videos?: unknown; articles?: unknown; updated_at?: unknown };

export type FeedRepository = {
  videoRows(categoryId: string, options?: { fresh?: boolean }): Promise<FeedRow[] | null>;
  newsRows(categoryId: string, options?: { fresh?: boolean }): Promise<FeedRow[] | null>;
  welfarePayload(
    feedKey: string,
    options?: { fresh?: boolean },
  ): Promise<{ payload: WelfarePayload; updatedAt?: string } | null>;
};

function byCategory(table: string, columns: string, categoryId: string): string {
  return categoryId
    ? `${table}?category_id=eq.${encodeURIComponent(categoryId)}&select=${columns}`
    : `${table}?select=${columns}`;
}

export function createFeedRepository(rest: RestClient): FeedRepository {
  async function rows<T>(
    path: string,
    tag: string,
    revalidateSeconds: number,
    fresh?: boolean,
  ): Promise<T[] | null> {
    const result = await rest.request<T[]>("anon", {
      path,
      revalidateSeconds: fresh ? undefined : revalidateSeconds,
      tags: [tag],
    });
    if (!result.ok || !Array.isArray(result.data)) return null;
    return result.data;
  }

  return {
    videoRows: (categoryId, options) =>
      rows<FeedRow>(
        byCategory("youtube_feeds", "category_id,videos,updated_at", categoryId),
        "youtube_feeds",
        VIDEO_FEED_REVALIDATE_SECONDS,
        options?.fresh,
      ),
    newsRows: (categoryId, options) =>
      rows<FeedRow>(
        byCategory("news_feeds", "category_id,articles,updated_at", categoryId),
        "news_feeds",
        NEWS_FEED_REVALIDATE_SECONDS,
        options?.fresh,
      ),
    async welfarePayload(feedKey, options) {
      const found = await rows<{ payload?: WelfarePayload; updated_at?: unknown }>(
        `welfare_feeds?feed_key=eq.${encodeURIComponent(feedKey)}&select=payload,updated_at&limit=1`,
        "welfare_feeds",
        WELFARE_FEED_REVALIDATE_SECONDS,
        options?.fresh,
      );
      const row = found?.[0];
      const payload = row?.payload;
      if (!payload || typeof payload !== "object") return null;
      const updatedRaw = row?.updated_at;
      const updatedAt =
        typeof updatedRaw === "string" || typeof updatedRaw === "number"
          ? new Date(updatedRaw).toISOString()
          : undefined;
      return {
        payload,
        updatedAt: updatedAt && !Number.isNaN(Date.parse(updatedAt)) ? updatedAt : undefined,
      };
    },
  };
}
