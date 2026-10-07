/**
 * 유튜브 추천 영상 일괄 수집 → youtube_feeds 테이블 저장
 *
 * 하루 1~2회 실행 시 YouTube API를 약 5~10회만 사용합니다.
 *
 * Secrets: SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET (+ search-videos 와 동일 YOUTUBE_API_KEY)
 * 호출: POST + Header x-cron-secret: <CRON_SECRET>
 *
 * node scripts/refresh-youtube-feeds.mjs
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const FEED_CATEGORIES = [
  { id: "scam", label: "보이스피싱", query: "보이스피싱 예방 어르신 경찰청" },
  { id: "smishing", label: "문자·링크 사기", query: "스미싱 예방 방법 문자 사기" },
  { id: "finance", label: "금융 사기", query: "금융사기 예방 계좌이체 사기" },
  { id: "digital", label: "디지털 안전", query: "어르신 디지털 안전 원격조종 앱" },
  { id: "family", label: "가족 사칭", query: "가족사칭 메신저 사기 예방" },
];

const FEED_LIMIT = 50;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok");
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  const headerSecret = req.headers.get("x-cron-secret") ?? "";
  const internalSecret = Deno.env.get("INTERNAL_API_SECRET") ?? Deno.env.get("EDGE_INTERNAL_SECRET") ?? "";
  const headerInternal = req.headers.get("x-internal-secret") ?? "";
  const cronOk = Boolean(cronSecret && headerSecret === cronSecret);
  const internalOk = Boolean(internalSecret && headerInternal === internalSecret);
  if (!cronOk && !internalOk) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: "Server misconfigured" }, 503);
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const results: Array<{ category_id: string; count: number; ok: boolean; message?: string }> = [];

  for (const category of FEED_CATEGORIES) {
    try {
      const internalSecret = Deno.env.get("INTERNAL_API_SECRET") ?? Deno.env.get("EDGE_INTERNAL_SECRET") ?? "";
      const response = await fetch(`${supabaseUrl}/functions/v1/search-videos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          "Content-Type": "application/json",
          ...(internalSecret ? { "x-internal-secret": internalSecret } : {}),
        },
        body: JSON.stringify({
          query: category.query,
          limit: FEED_LIMIT,
          skipAnalysis: true,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !Array.isArray(payload?.videos)) {
        results.push({
          category_id: category.id,
          count: 0,
          ok: false,
          message: payload?.message || `HTTP ${response.status}`,
        });
        continue;
      }

      const { error } = await supabase.from("youtube_feeds").upsert({
        category_id: category.id,
        label: category.label,
        videos: payload.videos,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      results.push({ category_id: category.id, count: payload.videos.length, ok: true });
    } catch (error) {
      console.error("refresh category failed:", category.id, error);
      results.push({
        category_id: category.id,
        count: 0,
        ok: false,
        message: error instanceof Error ? error.message : "unknown error",
      });
    }
  }

  // 예전 카테고리(예: documentary)가 남으면 홈 피드에 섞이므로 정리한다.
  const keepIds = FEED_CATEGORIES.map((category) => category.id);
  const keepList = `(${keepIds.map((id) => `"${id}"`).join(",")})`;
  const { error: cleanupError } = await supabase.from("youtube_feeds").delete().not("category_id", "in", keepList);
  if (cleanupError) {
    console.error("youtube_feeds cleanup failed:", cleanupError);
  }

  const successCount = results.filter((row) => row.ok).length;
  return jsonResponse({
    ok: successCount > 0,
    refreshed: successCount,
    total: FEED_CATEGORIES.length,
    results,
  });
});
