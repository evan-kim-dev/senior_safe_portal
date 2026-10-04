import { MESSAGES } from "@/lib/domain/messages";
import { requireUser } from "@/lib/server/auth";
import { getServices } from "@/lib/server/container";
import { json } from "@/lib/server/http/respond";
import { withRoute } from "@/lib/server/http/route";

/** 오늘 위험 영상 건수. 로그인한 가족 멤버의 코드만 사용한다(쿼리 familyCode 는 무시). */
export const GET = withRoute("activity", { rateLimit: { limit: 60, windowMs: 60_000 } }, async (request) => {
  const user = await requireUser(request);
  if (!user) return json({ ok: false, message: MESSAGES.loginRequired, count: 0 }, { status: 401 });

  const membership = await getServices().family.resolveFamilyForUser(user.id);
  if (!membership) return json({ ok: true, count: 0 });

  const count = await getServices().activity.countDangerVideosToday(membership.familyId);
  return json({ ok: true, count });
});
