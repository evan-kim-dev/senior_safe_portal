import "server-only";
import type { WelfarePayload } from "@/lib/domain/feeds";
import type { RestClient } from "../supabase/rest-client";

/** 영상은 하루 다섯 번, 뉴스는 매시 갱신. 서버 캐시는 그에 맞춰 짧게 둔다. */
export const VIDEO_FEED_REVALIDATE_SECONDS = 300;
export const NEWS_FEED_REVALIDATE_SECONDS = 60;
export const WELFARE_FEED_REVALIDATE_SECONDS = 300;

export type FeedRepository = {
  videoRows(categoryId: string): Promise<Array<{ category_id?: unknown; videos?: unknown }> | null>;
  newsRows(categoryId: string): Promise<Array<{ category_id?: unknown; articles?: unknown }> | null>;
  welfarePayload(feedKey: string): Promise<WelfarePayload | null>;
};

function byCategory(table: string, columns: string, categoryId: string): string {
  return categoryId
    ? `${table}?category_id=eq.${encodeURIComponent(categoryId)}&select=${columns}`
    : `${table}?select=${columns}`;
}

export function createFeedRepository(rest: RestClient): FeedRepository {
  async function rows<T>(path: string, tag: string, revalidateSeconds: number): Promise<T[] | null> {
    const result = await rest.request<T[]>("anon", {
      path,
      revalidateSeconds,
      tags: [tag],
    });
    if (!result.ok || !Array.isArray(result.data)) return null;
    return result.data;
  }

  return {
    videoRows: (categoryId) =>
      rows(
        byCategory("youtube_feeds", "category_id,videos", categoryId),
        "youtube_feeds",
        VIDEO_FEED_REVALIDATE_SECONDS,
      ),
    newsRows: (categoryId) =>
      rows(
        byCategory("news_feeds", "category_id,articles", categoryId),
        "news_feeds",
        NEWS_FEED_REVALIDATE_SECONDS,
      ),
    async welfarePayload(feedKey) {
      const found = await rows<{ payload?: WelfarePayload }>(
        `welfare_feeds?feed_key=eq.${encodeURIComponent(feedKey)}&select=payload&limit=1`,
        "welfare_feeds",
        WELFARE_FEED_REVALIDATE_SECONDS,
      );
      const payload = found?.[0]?.payload;
      return payload && typeof payload === "object" ? payload : null;
    },
  };
}
