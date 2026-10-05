import "server-only";
import type { WelfarePayload } from "@/lib/domain/feeds";
import type { RestClient } from "../supabase/rest-client";

/** 피드는 하루 다섯 번 갱신되므로 5분 동안 서버 캐시를 쓴다. */
export const FEED_REVALIDATE_SECONDS = 300;

export type FeedRepository = {
  videoRows(categoryId: string): Promise<Array<{ videos?: unknown }> | null>;
  newsRows(categoryId: string): Promise<Array<{ articles?: unknown }> | null>;
  welfarePayload(feedKey: string): Promise<WelfarePayload | null>;
};

function byCategory(table: string, column: string, categoryId: string): string {
  return categoryId
    ? `${table}?category_id=eq.${encodeURIComponent(categoryId)}&select=${column}`
    : `${table}?select=${column}`;
}

export function createFeedRepository(rest: RestClient): FeedRepository {
  async function rows<T>(path: string, tag: string): Promise<T[] | null> {
    const result = await rest.request<T[]>("anon", {
      path,
      revalidateSeconds: FEED_REVALIDATE_SECONDS,
      tags: [tag],
    });
    if (!result.ok || !Array.isArray(result.data)) return null;
    return result.data;
  }

  return {
    videoRows: (categoryId) => rows(byCategory("youtube_feeds", "videos", categoryId), "youtube_feeds"),
    newsRows: (categoryId) => rows(byCategory("news_feeds", "articles", categoryId), "news_feeds"),
    async welfarePayload(feedKey) {
      const found = await rows<{ payload?: WelfarePayload }>(
        `welfare_feeds?feed_key=eq.${encodeURIComponent(feedKey)}&select=payload&limit=1`,
        "welfare_feeds",
      );
      const payload = found?.[0]?.payload;
      return payload && typeof payload === "object" ? payload : null;
    },
  };
}
