import { MESSAGES } from "@/lib/domain/messages";
import { parseActivityEventInput } from "@/lib/domain/validation";
import { requireUser } from "@/lib/server/auth";
import { getServices } from "@/lib/server/container";
import { readJsonBody } from "@/lib/server/http/body";
import { json } from "@/lib/server/http/respond";
import { withRoute } from "@/lib/server/http/route";

/** 오늘 위험 검사 건수. 로그인한 가족 멤버의 코드만 사용한다. */
export const GET = withRoute("activity", { rateLimit: { limit: 60, windowMs: 60_000 } }, async (request) => {
  const user = await requireUser(request);
  if (!user) return json({ ok: false, message: MESSAGES.loginRequired, count: 0 }, { status: 401 });

  const membership = await getServices().family.resolveFamilyForUser(user.id);
  if (!membership) return json({ ok: true, count: 0 });

  const count = await getServices().activity.countDangerVideosToday(membership.familyId);
  return json({ ok: true, count });
});

/** 영상 시청·기사 열람 기록. 가족에 연결된 로그인 사용자만. */
export const POST = withRoute("activity.record", { rateLimit: { limit: 40, windowMs: 60_000 } }, async (request) => {
  const user = await requireUser(request);
  if (!user) return json({ ok: false, message: MESSAGES.loginRequired }, { status: 401 });

  const body = await readJsonBody(request);
  if (!body.ok) {
    return body.reason === "too-large"
      ? json({ ok: false, message: MESSAGES.bodyTooLarge }, { status: 413 })
      : json({ ok: false, message: MESSAGES.categoryInvalid }, { status: 400 });
  }

  const input = parseActivityEventInput(body.value);
  if (!input.ok) return json({ ok: false, message: input.message }, { status: 400 });

  const membership = await getServices().family.resolveFamilyForUser(user.id);
  // 보호자 본인 시청·열람은 케어 통계에 넣지 않는다.
  if (!membership || membership.role !== "senior") return json({ ok: true, skipped: true });

  await getServices().activity.record(membership.familyId, input.value.kind, {
    userId: user.id,
    summary: input.value.summary,
    durationSec: input.value.durationSec,
  });
  return json({ ok: true });
});
