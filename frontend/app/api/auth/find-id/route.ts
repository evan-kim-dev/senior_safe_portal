import { withRoute } from "@/lib/server/http/route";
import { json } from "@/lib/server/http/respond";

/**
 * 휴대폰 SMS 본인확인 전에는 이메일 조회를 열지 않는다.
 * (이름+번호만으로는 계정 존재를 추측할 수 있음)
 */
export const POST = withRoute("auth.find-id", { rateLimit: { limit: 8, windowMs: 60_000 } }, async () => {
  return json(
    {
      ok: false,
      message: "휴대폰 확인 기능이 준비되면 아이디 찾기를 열 예정이에요. 지금은 비밀번호 찾기로 가입 이메일을 확인해 주세요.",
    },
    { status: 503 },
  );
});
