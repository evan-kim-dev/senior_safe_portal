import { MESSAGES } from "@/lib/domain/messages";
import { requireUser } from "@/lib/server/auth";
import { getServerEnv } from "@/lib/server/env";
import { json } from "@/lib/server/http/respond";
import { withRoute } from "@/lib/server/http/route";
import { createClient } from "@supabase/supabase-js";

type DeleteBody = { confirm?: unknown };

/** 로그인한 본인 계정을 삭제(회원 탈퇴)한다. 서비스 롤로 Auth Admin API 호출. */
export const POST = withRoute("account.delete", { rateLimit: { limit: 5, windowMs: 60_000 } }, async (request) => {
  const user = await requireUser(request);
  if (!user) return json({ ok: false, message: MESSAGES.loginRequired }, { status: 401 });

  let body: DeleteBody = {};
  try {
    body = (await request.json()) as DeleteBody;
  } catch {
    body = {};
  }

  const confirm = typeof body.confirm === "string" ? body.confirm.trim() : "";
  if (confirm !== "탈퇴" && body.confirm !== true) {
    return json({ ok: false, message: MESSAGES.accountDeleteConfirm }, { status: 400 });
  }

  const env = getServerEnv();
  if (!env.supabaseUrl || !env.serviceRoleKey) {
    return json({ ok: false, message: MESSAGES.accountDeleteFailed }, { status: 502 });
  }

  const admin = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return json({ ok: false, message: MESSAGES.accountDeleteFailed }, { status: 502 });
  }

  return json({ ok: true });
});
