import { cronAuthorized, invokeRefreshFunction } from "@/lib/server/cron/feeds";
import { getServerEnv } from "@/lib/server/env";
import { json } from "@/lib/server/http/respond";
import { withRoute } from "@/lib/server/http/route";

/** 뉴스만 갱신. 카테고리 5 × 기사 8 = 40건/회, 네이버 API 5회/회. */
export const maxDuration = 60;

/**
 * Vercel Cron → 뉴스 피드 갱신 (1시간마다).
 * Hobby는 표현식당 하루 1회만 허용해서 UTC 매시를 24개 cron 으로 나눈다.
 */
export const GET = withRoute("cron.refresh-news", {}, async (request, { log }) => {
  const env = getServerEnv();
  const cronSecret = env.cronSecret;
  if (!cronSecret) {
    log.error("cron_secret_missing");
    return json({ ok: false, message: "CRON_SECRET 이 없어요." }, { status: 503 });
  }
  if (!cronAuthorized(request, cronSecret)) {
    return json({ ok: false, message: "권한이 없어요." }, { status: 401 });
  }
  if (!env.supabaseUrl || !env.serviceRoleKey) {
    log.error("cron_supabase_missing");
    return json({ ok: false, message: "Supabase 설정이 없어요." }, { status: 503 });
  }

  const result = await invokeRefreshFunction(
    env.supabaseUrl,
    env.serviceRoleKey,
    cronSecret,
    "refresh-news-feeds",
  );
  log.info("cron_news_done", { ok: result.ok, status: result.status });
  if (!result.ok) {
    return json({ ok: false, results: [result] }, { status: 502 });
  }
  return json({ ok: true, results: [result] });
});
