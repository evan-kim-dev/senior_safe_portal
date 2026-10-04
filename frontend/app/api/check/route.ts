import { MESSAGES } from "@/lib/domain/messages";
import { parseCheckInput } from "@/lib/domain/validation";
import { requireUser } from "@/lib/server/auth";
import { getServices } from "@/lib/server/container";
import { readJsonBody } from "@/lib/server/http/body";
import { json } from "@/lib/server/http/respond";
import { withRoute } from "@/lib/server/http/route";

export const maxDuration = 60;

export const POST = withRoute("check", { rateLimit: { limit: 20, windowMs: 60_000 } }, async (request) => {
  const body = await readJsonBody(request);
  if (!body.ok) {
    return body.reason === "too-large"
      ? json({ ok: false, message: MESSAGES.bodyTooLarge }, { status: 413 })
      : json({ ok: false, message: MESSAGES.urlRequired }, { status: 400 });
  }

  const input = parseCheckInput(body.value);
  if (!input.ok) return json({ ok: false, message: input.message }, { status: 400 });

  // 활동 기록은 로그인·가족 멤버만. 클라이언트 familyCode 는 신뢰하지 않는다.
  let familyCode = "";
  let userId: string | undefined;
  const user = await requireUser(request);
  if (user) {
    const membership = await getServices().family.resolveFamilyForUser(user.id);
    if (membership) {
      familyCode = membership.familyId;
      userId = user.id;
    }
  }

  const outcome = await getServices().check.check({
    url: input.value.url,
    familyCode,
    userId,
  });
  return json(outcome.body, { status: outcome.status });
});
