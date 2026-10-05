import { FAMILY_LEAVE_CONFIRM, FAMILY_RESET_CONFIRM } from "@/lib/domain/family";
import { MESSAGES } from "@/lib/domain/messages";
import { requireUser } from "@/lib/server/auth";
import { getServices } from "@/lib/server/container";
import { readJsonBody } from "@/lib/server/http/body";
import { json } from "@/lib/server/http/respond";
import { withRoute } from "@/lib/server/http/route";

type LeaveBody = { action?: unknown; confirm?: unknown };

/**
 * 로그인한 본인만 가족 연결을 해제하거나(leave) 초기화(reset)한다.
 * - leave: 멤버십 종료. 보호자면 가족 전체 정리.
 * - reset: 보호자만. 연결된 어르신·초대 코드를 지우고 새 코드를 발급.
 */
export const POST = withRoute("family.leave", { rateLimit: { limit: 10, windowMs: 60_000 } }, async (request) => {
  const user = await requireUser(request);
  if (!user) return json({ ok: false, message: MESSAGES.loginRequired }, { status: 401 });

  const body = await readJsonBody(request);
  if (!body.ok) {
    return body.reason === "too-large"
      ? json({ ok: false, message: MESSAGES.bodyTooLarge }, { status: 413 })
      : json({ ok: false, message: MESSAGES.familyLeaveFailed }, { status: 400 });
  }

  const raw = (body.value ?? {}) as LeaveBody;
  const action = raw.action === "reset" ? "reset" : raw.action === "leave" ? "leave" : "";
  const confirm = typeof raw.confirm === "string" ? raw.confirm.trim() : "";

  if (action === "leave") {
    if (confirm !== FAMILY_LEAVE_CONFIRM) {
      return json({ ok: false, message: MESSAGES.familyLeaveConfirm }, { status: 400 });
    }
    const result = await getServices().family.leave(user.id);
    if (!result.ok) return json({ ok: false, message: result.message }, { status: result.status });
    return json({ ok: true, action: "leave" });
  }

  if (action === "reset") {
    if (confirm !== FAMILY_RESET_CONFIRM) {
      return json({ ok: false, message: MESSAGES.familyResetConfirm }, { status: 400 });
    }
    const result = await getServices().family.reset(user.id);
    if (!result.ok) return json({ ok: false, message: result.message }, { status: result.status });
    if (result.action !== "reset") {
      return json({ ok: false, message: MESSAGES.familyResetFailed }, { status: 502 });
    }
    return json({
      ok: true,
      action: "reset",
      inviteCode: result.inviteCode,
      inviteExpiresAt: result.inviteExpiresAt,
    });
  }

  return json({ ok: false, message: MESSAGES.familyLeaveFailed }, { status: 400 });
});
