import { MESSAGES } from "@/lib/domain/messages";
import { requireUser } from "@/lib/server/auth";
import { getServices } from "@/lib/server/container";
import { readJsonBody } from "@/lib/server/http/body";
import { json } from "@/lib/server/http/respond";
import { withRoute } from "@/lib/server/http/route";

/** 부모가 초대 코드로 가족에 연결된다. */
export const POST = withRoute("family.join", { rateLimit: { limit: 5, windowMs: 60_000 } }, async (request) => {
  const user = await requireUser(request);
  if (!user) return json({ ok: false, message: MESSAGES.loginRequired }, { status: 401 });

  const body = await readJsonBody(request);
  if (!body.ok) {
    return body.reason === "too-large"
      ? json({ ok: false, message: MESSAGES.bodyTooLarge }, { status: 413 })
      : json({ ok: false, message: MESSAGES.familyInviteInvalid }, { status: 400 });
  }

  const code = body.value && typeof body.value === "object" ? (body.value as { code?: unknown }).code : undefined;
  const result = await getServices().family.join({ userId: user.id, metadata: user.metadata }, code);
  if (!result.ok) return json({ ok: false, message: result.message }, { status: result.status });
  return json({ ok: true, familyId: result.familyId, role: result.role });
});
