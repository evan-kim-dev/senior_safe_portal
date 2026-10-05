import { channelChoices, toNewsView, toVideoView, toWelfareView, type NewsView, type VideoView, type WelfareView } from "@/lib/domain/feed-view";
import type { ActivityResponse, NewsResponse, VideosResponse, WelfareResponse } from "@/lib/domain/types";
import { authHeaders } from "./auth-headers";
import { cachedPostJson, getJson } from "./api";
import { loadGuardian } from "./guardian";

const VIDEO_FEED_TTL_MS = 5 * 60 * 1000;
const NEWS_FEED_TTL_MS = 60 * 1000;
const WELFARE_FEED_TTL_MS = 5 * 60 * 1000;
const DEFAULT_REGION = "서울";

const isOk = (data: { ok?: boolean }) => data?.ok === true;

function fetchVideos(): Promise<VideosResponse> {
  return cachedPostJson<VideosResponse>("/api/videos", {}, VIDEO_FEED_TTL_MS, isOk);
}

/** 아래 함수들은 던지지 않는다. 실패는 화면 문구로 바뀐다. */

export async function loadVideoView(): Promise<VideoView> {
  const data = await fetchVideos().catch(() => null);
  return toVideoView(data, loadGuardian().channels);
}

export async function loadNewsView(): Promise<NewsView> {
  const data = await cachedPostJson<NewsResponse>("/api/news", {}, NEWS_FEED_TTL_MS, isOk).catch(() => null);
  return toNewsView(data);
}

export async function loadWelfareView(): Promise<WelfareView> {
  const region = loadGuardian().region || DEFAULT_REGION;
  const data = await cachedPostJson<WelfareResponse>("/api/welfare", { region, category: "all" }, WELFARE_FEED_TTL_MS, isOk).catch(
    () => null,
  );
  return toWelfareView(data, region);
}

export async function loadChannelChoices(): Promise<string[]> {
  const data = await fetchVideos().catch(() => null);
  return channelChoices(data?.videos ?? []);
}

export async function loadDangerCount(): Promise<number> {
  try {
    const data = await getJson<ActivityResponse>("/api/activity", { headers: await authHeaders() });
    return typeof data.count === "number" ? data.count : 0;
  } catch {
    return 0;
  }
}
