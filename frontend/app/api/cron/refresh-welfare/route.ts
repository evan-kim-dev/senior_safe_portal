import { cronAuthorized, invokeRefreshFunction } from "@/lib/server/cron/feeds";
import { getServerEnv } from "@/lib/server/env";
import { json } from "@/lib/server/http/respond";
import { withRoute } from "@/lib/server/http/route";

/** Hobby: 지역별 all 카테고리만 갱신. 공공데이터 API 부하를 줄인다. */
export const maxDuration = 300;

const WELFARE_REGIONS = [
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
] as const;

export const GET = withRoute(
  "cron.refresh-welfare",
  { rateLimit: { limit: 6, windowMs: 60_000 } },
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

    const results = [];
    for (const region of WELFARE_REGIONS) {
      const result = await invokeRefreshFunction(
        env.supabaseUrl,
        env.serviceRoleKey,
        cronSecret,
        "refresh-welfare-feeds",
        { region, category: "all" },
      );
      results.push({ region, ...result });
      log.info("cron_welfare_region", { region, ok: result.ok, status: result.status });
    }

    const okCount = results.filter((row) => row.ok).length;
    const ok = okCount > 0;
    return json(
      { ok, refreshed: okCount, total: WELFARE_REGIONS.length, results },
      { status: ok ? 200 : 502 },
    );
  },
);
