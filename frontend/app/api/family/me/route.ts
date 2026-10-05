import { MESSAGES } from "@/lib/domain/messages";
import { requireUser } from "@/lib/server/auth";
import { getServices } from "@/lib/server/container";
import { json } from "@/lib/server/http/respond";
import { withRoute } from "@/lib/server/http/route";

/** 내 가족·초대 코드·오늘 위험 활동을 불러온다. */
export const GET = withRoute("family.me", { rateLimit: { limit: 60, windowMs: 60_000 } }, async (request) => {
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
    familyId: result.familyId,
    role: result.role,
    inviteCode: result.inviteCode,
    inviteExpiresAt: result.inviteExpiresAt,
    seniorCount: result.seniorCount,
    seniors: result.seniors,
    connected: result.connected,
    todayCount: result.todayCount,
    todayNewsCount: result.todayNewsCount,
    todayWatchSec: result.todayWatchSec,
    todayItems: result.todayItems,
  });
});
