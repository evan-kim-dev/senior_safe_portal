import { mapNews, mapVideos, mapWelfare } from "@/lib/domain/feeds";
import { MESSAGES } from "@/lib/domain/messages";
import type { NewsResponse, VideosResponse, WelfareResponse } from "@/lib/domain/types";
import type { WelfareInput } from "@/lib/domain/validation";
import type { FeedRepository } from "../repositories/feed-repository";

export type FeedService = {
  videos(categoryId: string): Promise<VideosResponse>;
  news(categoryId: string): Promise<NewsResponse>;
  welfare(input: WelfareInput): Promise<WelfareResponse>;
};

/** 피드는 저장된 표만 읽는다. 바깥 API(YouTube·네이버·공공데이터)는 부르지 않는다. */
export function createFeedService(repo: FeedRepository): FeedService {
  return {
    async videos(categoryId) {
      const rows = await repo.videoRows(categoryId);
      if (!rows) return { ok: true, videos: [], message: MESSAGES.emptyFeed };
      return { ok: true, videos: mapVideos(rows) };
    },

    async news(categoryId) {
      const rows = await repo.newsRows(categoryId);
      if (!rows) return { ok: true, articles: [], message: MESSAGES.emptyFeed };
      return { ok: true, articles: mapNews(rows) };
    },

    async welfare({ region, category }) {
      const payload = await repo.welfarePayload(`${region}|${category}`);
      if (!payload) return { ok: true, place: region, cards: [], message: MESSAGES.emptyFeed };
      const { place, cards } = mapWelfare(payload, region);
      return { ok: true, place, cards };
    },
  };
}
