import { MESSAGES } from "@/lib/domain/messages";
import { requireUser } from "@/lib/server/auth";
import { getServices } from "@/lib/server/container";
import { readJsonBody } from "@/lib/server/http/body";
import { json } from "@/lib/server/http/respond";
import { withRoute } from "@/lib/server/http/route";

/** 자녀(guardian)가 가족을 만들거나 초대 코드를 받는다. */
export const POST = withRoute("family.create", { rateLimit: { limit: 20, windowMs: 60_000 } }, async (request) => {
  const user = await requireUser(request);
  if (!user) return json({ ok: false, message: MESSAGES.loginRequired }, { status: 401 });

  const body = await readJsonBody(request);
  if (!body.ok && body.reason === "too-large") {
    return json({ ok: false, message: MESSAGES.bodyTooLarge }, { status: 413 });
  }
  const refresh = body.ok && body.value && typeof body.value === "object"
    ? Boolean((body.value as { refresh?: unknown }).refresh)
    : false;

  const result = await getServices().family.create(user.id, { refresh });
  if (!result.ok) return json({ ok: false, message: result.message }, { status: result.status });
  return json({
    ok: true,
    familyId: result.familyId,
    inviteCode: result.inviteCode,
    inviteExpiresAt: result.inviteExpiresAt,
  });
});
