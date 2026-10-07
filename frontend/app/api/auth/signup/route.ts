import { json } from "@/lib/server/http/respond";
import { withRoute } from "@/lib/server/http/route";

/**
 * 예전에는 service role 로 email_confirm 을 건너뛰었지만,
 * 이메일 소유 검증이 필요해 클라이언트의 supabase.auth.signUp 만 쓴다.
 */
export const POST = withRoute("auth.signup", { rateLimit: { limit: 8, windowMs: 60_000 } }, async () => {
  return json(
    {
      ok: false,
      message: "이 가입 경로는 닫혔어요. 화면에서 다시 가입해 주세요.",
    },
    { status: 410 },
  );
});
