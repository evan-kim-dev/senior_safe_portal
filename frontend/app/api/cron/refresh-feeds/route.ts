import { cronAuthorized, invokeRefreshFunction } from "@/lib/server/cron/feeds";
import { getServerEnv } from "@/lib/server/env";
import { json } from "@/lib/server/http/respond";
import { withRoute } from "@/lib/server/http/route";

/** Hobby: 함수당 최대 300초. 영상 피드만 갱신한다. */
export const maxDuration = 300;

export const GET = withRoute(
  "cron.refresh-feeds",
  { rateLimit: { limit: 12, windowMs: 60_000 } },
  async (request, { log }) => {
    const env = getServerEnv();
    const cronSecret = env.cronSecret;
    if (!cronSecret || !env.supabaseUrl || !env.serviceRoleKey) {
      log.error("cron_misconfigured");
      return json({ ok: false, message: "지금은 실행할 수 없어요." }, { status: 503 });
    }
    if (!cronAuthorized(request, cronSecret)) {
      return json({ ok: false, message: "권한이 없어요." }, { status: 401 });
    }

    const result = await invokeRefreshFunction(
      env.supabaseUrl,
      env.serviceRoleKey,
      cronSecret,
      "refresh-youtube-feeds",
    );
    log.info("cron_feed_done", {
      name: result.name,
      ok: result.ok,
      status: result.status,
      refreshed: result.refreshed,
    });
    if (!result.ok) return json({ ok: false, results: [result] }, { status: 502 });
    return json({ ok: true, results: [result] });
  },
);
