import { channelChoices, toNewsView, toVideoView, toWelfareView, type NewsView, type VideoView, type WelfareView } from "@/lib/domain/feed-view";
import type { ActivityResponse, NewsResponse, VideosResponse, WelfareResponse } from "@/lib/domain/types";
import { authHeaders } from "./auth-headers";
import { cachedPostJson, getJson } from "./api";
import { loadGuardian } from "./guardian";
import { getSupabase } from "./supabase-browser";

const VIDEO_FEED_TTL_MS = 5 * 60 * 1000;
const NEWS_FEED_TTL_MS = 60 * 1000;
const WELFARE_FEED_TTL_MS = 5 * 60 * 1000;
const DEFAULT_REGION = "서울";

const isOk = (data: { ok?: boolean }) => data?.ok === true;

/** 관심·나이 맞춤이 바뀌면 캐시를 갈라 쓴다. */
async function profileCacheKey(): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) return "guest";
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return "guest";
  const meta = user.user_metadata ?? {};
  return `${user.id}:${String(meta.account_role ?? "")}:${String(meta.birth_year ?? "")}:${JSON.stringify(meta.interests ?? [])}`;
}

async function fetchVideos(): Promise<VideosResponse> {
  const headers = await authHeaders();
  return cachedPostJson<VideosResponse>("/api/videos", {}, VIDEO_FEED_TTL_MS, isOk, {
    headers,
    cacheKey: await profileCacheKey(),
  });
}

async function fetchNews(): Promise<NewsResponse> {
  const headers = await authHeaders();
  return cachedPostJson<NewsResponse>("/api/news", {}, NEWS_FEED_TTL_MS, isOk, {
    headers,
    cacheKey: await profileCacheKey(),
  });
}

/** 아래 함수들은 던지지 않는다. 실패는 화면 문구로 바뀐다. */

export async function loadVideoView(): Promise<VideoView> {
  const data = await fetchVideos().catch(() => null);
  return toVideoView(data, loadGuardian().channels);
}

export async function loadNewsView(): Promise<NewsView> {
  const data = await fetchNews().catch(() => null);
  return toNewsView(data);
}

export async function loadWelfareView(): Promise<WelfareView> {
  const region = loadGuardian().region || DEFAULT_REGION;
  const headers = await authHeaders();
  const data = await cachedPostJson<WelfareResponse>(
    "/api/welfare",
    { region, category: "all" },
    WELFARE_FEED_TTL_MS,
    isOk,
    { headers, cacheKey: `${region}:${await profileCacheKey()}` },
  ).catch(() => null);
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
