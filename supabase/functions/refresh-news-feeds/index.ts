/**
 * 뉴스 캐시 갱신 → news_feeds
 * 하루 2~3회만 호출. 화면은 이 테이블만 읽는다.
 *
 * Body: { "categoryId": "affairs" }
 * Header: x-cron-secret
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const CATEGORIES = [
  { id: "affairs", label: "시사", query: "국정 시사" },
  { id: "society", label: "사회", query: "사회 뉴스" },
  { id: "health", label: "건강", query: "어르신 건강" },
  { id: "welfare", label: "복지", query: "기초연금 노인 복지" },
  { id: "life", label: "생활", query: "생활 정보" },
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret || (req.headers.get("x-cron-secret") ?? "") !== cronSecret) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return jsonResponse({ error: "Server misconfigured" }, 503);

  let categoryId = "";
  try {
    const body = await req.json();
    categoryId = typeof body?.categoryId === "string" ? body.categoryId : "";
  } catch {
    categoryId = "";
  }

  const categories = categoryId
    ? CATEGORIES.filter((item) => item.id === categoryId)
    : CATEGORIES;
  if (categories.length === 0) return jsonResponse({ error: "Unknown category" }, 400);

  const supabase = createClient(supabaseUrl, serviceKey);
  const results = [];

  for (const category of categories) {
    try {
      const internalSecret = Deno.env.get("INTERNAL_API_SECRET") ?? Deno.env.get("EDGE_INTERNAL_SECRET") ?? "";
      const response = await fetch(`${supabaseUrl}/functions/v1/search-news`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          "Content-Type": "application/json",
          ...(internalSecret ? { "x-internal-secret": internalSecret } : {}),
        },
        body: JSON.stringify({ query: category.query, display: 8 }),
      });
      const payload = await response.json();
      if (!response.ok || !Array.isArray(payload?.articles)) {
        results.push({ category_id: category.id, ok: false, count: 0 });
        continue;
      }

      const { error } = await supabase.from("news_feeds").upsert({
        category_id: category.id,
        label: category.label,
        articles: payload.articles,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      results.push({ category_id: category.id, ok: true, count: payload.articles.length });
    } catch (error) {
      console.error("refresh news failed:", category.id, error);
      results.push({ category_id: category.id, ok: false, count: 0 });
    }
  }

  const refreshed = results.filter((row) => row.ok).length;
  return jsonResponse({ ok: refreshed > 0, refreshed, total: categories.length, results });
});
