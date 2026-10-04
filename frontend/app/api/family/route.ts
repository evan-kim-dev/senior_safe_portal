import { MESSAGES } from "@/lib/domain/messages";
import { requireUser } from "@/lib/server/auth";
import { getServices } from "@/lib/server/container";
import { json } from "@/lib/server/http/respond";
import { withRoute } from "@/lib/server/http/route";

/** 자녀가 가족을 만들고 초대 코드를 받는다. */
export const POST = withRoute("family.create", { rateLimit: { limit: 20, windowMs: 60_000 } }, async (request) => {
  const user = await requireUser(request);
  if (!user) return json({ ok: false, message: MESSAGES.loginRequired }, { status: 401 });

  const result = await getServices().family.create(user.id);
  if (!result.ok) return json({ ok: false, message: result.message }, { status: result.status });
  return json({
    ok: true,
    familyId: result.familyId,
    inviteCode: result.inviteCode,
    inviteExpiresAt: result.inviteExpiresAt,
  });
});
