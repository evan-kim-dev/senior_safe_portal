import { getServerEnv } from "@/lib/server/env";
import { json } from "@/lib/server/http/respond";
import { withRoute } from "@/lib/server/http/route";

/** Hobby: 함수당 최대 300초. 영상·뉴스·복지를 순서대로 Edge Function에 맡긴다. */
export const maxDuration = 300;

const FEEDS = ["refresh-youtube-feeds", "refresh-news-feeds", "refresh-welfare-feeds"] as const;

function authorized(request: Request, cronSecret: string): boolean {
  const bearer = request.headers.get("authorization");
  if (bearer === `Bearer ${cronSecret}`) return true;
  const header = request.headers.get("x-cron-secret");
  return header === cronSecret;
}

async function invokeFeed(
  baseUrl: string,
  serviceKey: string,
  cronSecret: string,
  name: (typeof FEEDS)[number],
): Promise<{ name: string; ok: boolean; status: number; body: unknown }> {
  const response = await fetch(`${baseUrl}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": "application/json",
      "x-cron-secret": cronSecret,
    },
    body: "{}",
  });
  const body = await response.json().catch(() => ({}));
  const ok = response.ok && Boolean((body as { ok?: boolean }).ok);
  return { name, ok, status: response.status, body };
}

/**
 * Vercel Cron → Supabase Edge Function 으로 영상·뉴스·복지 피드를 갱신한다.
 * 스케줄: KST 05·09·13·17·21 (UTC 20·00·04·08·12), vercel.json 참고.
 */
export const GET = withRoute("cron.refresh-feeds", {}, async (request, { log }) => {
  const env = getServerEnv();
  const cronSecret = env.cronSecret;
  if (!cronSecret) {
    log.error("cron_secret_missing");
    return json({ ok: false, message: "CRON_SECRET 이 없어요." }, { status: 503 });
  }
  if (!authorized(request, cronSecret)) {
    return json({ ok: false, message: "권한이 없어요." }, { status: 401 });
  }
  if (!env.supabaseUrl || !env.serviceRoleKey) {
    log.error("cron_supabase_missing");
    return json({ ok: false, message: "Supabase 설정이 없어요." }, { status: 503 });
  }

  const results = [];
  for (const name of FEEDS) {
    const result = await invokeFeed(env.supabaseUrl, env.serviceRoleKey, cronSecret, name);
    results.push(result);
    log.info("cron_feed_done", { name: result.name, ok: result.ok, status: result.status });
    if (!result.ok) {
      return json({ ok: false, results }, { status: 502 });
    }
  }

  return json({ ok: true, results });
});
