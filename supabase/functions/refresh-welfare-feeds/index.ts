/**
 * 복지 캐시 갱신 → welfare_feeds
 * 하루 2~3회, 지역·종류 하나씩. 화면은 이 테이블만 읽는다.
 *
 * Body: { "region": "서울", "category": "all" }
 * Header: x-cron-secret
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const CATEGORIES = ["all", "care", "pension", "health", "housing"];

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

  let region = "";
  let category = "all";
  try {
    const body = await req.json();
    region = typeof body?.region === "string" ? body.region.trim() : "";
    category = typeof body?.category === "string" && CATEGORIES.includes(body.category) ? body.category : "all";
  } catch {
    region = "";
  }

  if (!region) return jsonResponse({ error: "region required" }, 400);

  try {
    const internalSecret = Deno.env.get("INTERNAL_API_SECRET") ?? Deno.env.get("EDGE_INTERNAL_SECRET") ?? "";
    const response = await fetch(`${supabaseUrl}/functions/v1/search-welfare`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": "application/json",
        ...(internalSecret ? { "x-internal-secret": internalSecret } : {}),
      },
      body: JSON.stringify({ region, city: region, category, limit: 6 }),
    });
    const payload = await response.json();
    if (!response.ok || !Array.isArray(payload?.services) || !Array.isArray(payload?.nationalServices)) {
      return jsonResponse({ ok: false, region, category }, 502);
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { error } = await supabase.from("welfare_feeds").upsert({
      feed_key: `${region}|${category}`,
      region,
      category,
      payload,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;

    return jsonResponse({
      ok: true,
      region,
      category,
      count: payload.services.length + payload.nationalServices.length,
    });
  } catch (error) {
    console.error("refresh welfare failed:", region, category, error);
    return jsonResponse({ ok: false, region, category }, 500);
  }
});
