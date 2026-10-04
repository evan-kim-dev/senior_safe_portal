import { isVideoId } from "./feeds";
import { FEED_MESSAGES } from "./messages";
import type { NewsItem, NewsResponse, VideoItem, VideosResponse, WelfareCard, WelfareResponse } from "./types";

/** 응답(실패면 null)을 화면 상태로 바꾼다. 화면 문구 규칙은 여기 한 곳에만 둔다. */

export type VideoView = { videos: VideoItem[]; message: string };

export function toVideoView(data: VideosResponse | null, allowedChannels: readonly string[]): VideoView {
  const copy = FEED_MESSAGES.videos;
  if (!data) return { videos: [], message: copy.failed };
  if (!data.ok || !data.videos) return { videos: [], message: data.message || copy.failed };

  const videos = allowedChannels.length
    ? data.videos.filter((video) => allowedChannels.includes(video.channel))
    : data.videos;
  return { videos, message: videos.length ? "" : copy.empty };
}

export type NewsView = { articles: NewsItem[]; message: string };

export function toNewsView(data: NewsResponse | null): NewsView {
  const copy = FEED_MESSAGES.news;
  if (!data) return { articles: [], message: copy.failed };
  if (!data.ok || !data.articles) return { articles: [], message: data.message || copy.failed };
  return {
    articles: data.articles,
    message: data.articles.length ? "" : (data.message || copy.empty),
  };
}

export type WelfareView = { cards: WelfareCard[]; placeLabel: string; message: string };

export function toWelfareView(data: WelfareResponse | null, region: string): WelfareView {
  const copy = FEED_MESSAGES.welfare;
  if (!data) return { cards: [], placeLabel: "", message: copy.failed };
  if (!data.ok || !data.cards) return { cards: [], placeLabel: "", message: data.message || copy.failed };
  return {
    cards: data.cards,
    placeLabel: data.place || region,
    message: data.cards.length ? "" : (data.message || copy.empty),
  };
}

/** /videos?v=<id> 로 들어오면 목록에 있는 영상만 바로 연다. */
export function findVideo(videos: readonly VideoItem[], id: string | null): VideoItem | null {
  if (!isVideoId(id)) return null;
  return videos.find((video) => video.id === id) ?? null;
}

export function videoHref(id: string): string {
  return `/videos?v=${encodeURIComponent(id)}`;
}

export function channelChoices(videos: readonly VideoItem[]): string[] {
  return [...new Set(videos.map((video) => video.channel).filter(Boolean))].sort();
}
