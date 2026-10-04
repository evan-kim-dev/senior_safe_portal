import { MESSAGES } from "@/lib/domain/messages";
import { requireUser } from "@/lib/server/auth";
import { getServices } from "@/lib/server/container";
import { json } from "@/lib/server/http/respond";
import { withRoute } from "@/lib/server/http/route";

/** 멤버십 확인 후 오늘 위험 영상 활동을 돌려준다. */
export const GET = withRoute("family.activity", { rateLimit: { limit: 60, windowMs: 60_000 } }, async (request) => {
  const user = await requireUser(request);
  if (!user) return json({ ok: false, message: MESSAGES.loginRequired }, { status: 401 });

  const result = await getServices().family.me(user.id);
  if (!result.ok) {
    return json(
      { ok: false, message: result.message, needsFamily: result.needsFamily === true },
      { status: result.status },
    );
  }
  return json({
    ok: true,
    count: result.todayCount,
    items: result.todayItems,
  });
});
