import { FAMILY_SENIOR_REMOVE_CONFIRM } from "@/lib/domain/family";
import { validateSeniorProfileEdit } from "@/lib/domain/auth-form";
import { MESSAGES } from "@/lib/domain/messages";
import { requireUser } from "@/lib/server/auth";
import { getServices } from "@/lib/server/container";
import { readJsonBody } from "@/lib/server/http/body";
import { json } from "@/lib/server/http/respond";
import { withRoute } from "@/lib/server/http/route";

type SeniorBody = {
  action?: unknown;
  seniorUserId?: unknown;
  displayName?: unknown;
  birthYear?: unknown;
  confirm?: unknown;
};

/**
 * 보호자만 연결된 어르신 프로필을 고치거나(update) 목록에서 뺀다(remove).
 * remove 는 계정 탈퇴가 아니라 가족 연결만 끊는다.
 */
export const POST = withRoute("family.seniors", { rateLimit: { limit: 20, windowMs: 60_000 } }, async (request) => {
  const user = await requireUser(request);
  if (!user) return json({ ok: false, message: MESSAGES.loginRequired }, { status: 401 });

  const body = await readJsonBody(request);
  if (!body.ok) {
    return body.reason === "too-large"
      ? json({ ok: false, message: MESSAGES.bodyTooLarge }, { status: 413 })
      : json({ ok: false, message: MESSAGES.unexpected }, { status: 400 });
  }

  const raw = (body.value ?? {}) as SeniorBody;
  const seniorUserId = typeof raw.seniorUserId === "string" ? raw.seniorUserId.trim() : "";
  if (!seniorUserId) {
    return json({ ok: false, message: MESSAGES.familySeniorNotFound }, { status: 400 });
  }

  const family = getServices().family;

  if (raw.action === "update") {
    const checked = validateSeniorProfileEdit({
      name: typeof raw.displayName === "string" ? raw.displayName : "",
      birthYear: raw.birthYear == null ? "" : String(raw.birthYear),
    });
    if (!checked.ok) return json({ ok: false, message: checked.message }, { status: 400 });

    const result = await family.updateSenior(user.id, seniorUserId, {
      displayName: checked.value.name,
      birthYear: checked.value.birthYear,
    });
    if (!result.ok) return json({ ok: false, message: result.message }, { status: result.status });
    return json({ ok: true });
  }

  if (raw.action === "remove") {
    const confirm = typeof raw.confirm === "string" ? raw.confirm.trim() : "";
    if (confirm !== FAMILY_SENIOR_REMOVE_CONFIRM) {
      return json({ ok: false, message: MESSAGES.familySeniorRemoveConfirm }, { status: 400 });
    }
    const result = await family.removeSenior(user.id, seniorUserId);
    if (!result.ok) return json({ ok: false, message: result.message }, { status: result.status });
    return json({ ok: true });
  }

  return json({ ok: false, message: MESSAGES.unexpected }, { status: 400 });
});
