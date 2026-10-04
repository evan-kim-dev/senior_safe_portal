import "server-only";
import { MESSAGES } from "@/lib/domain/messages";
import { requireUser } from "../auth";
import { clientIp } from "./client-ip";
import { RateLimiter } from "./rate-limit";
import { json } from "./respond";

/** 비회원 AI·검사 기능 공통 한도 (IP 기준, 인스턴스 메모리). */
export const GUEST_FEATURE_LIMIT = 3;
export const GUEST_FEATURE_WINDOW_MS = 24 * 60 * 60 * 1000;

const guestFeatureLimiter = new RateLimiter({
  limit: GUEST_FEATURE_LIMIT,
  windowMs: GUEST_FEATURE_WINDOW_MS,
});

export type GuestQuotaResult =
  | { ok: true; userId?: string }
  | { ok: false; response: Response };

/**
 * 로그인 사용자는 통과. 비회원은 IP당 하루 3회만 허용한다.
 * feature 인자는 로그용이며, 한도 키는 guest:${ip} 로 공유한다.
 */
export async function consumeGuestFeatureQuota(
  request: Request,
  feature: string,
): Promise<GuestQuotaResult> {
  const user = await requireUser(request);
  if (user) return { ok: true, userId: user.id };

  const decision = guestFeatureLimiter.hit(`guest:${clientIp(request.headers)}`);
  if (!decision.allowed) {
    return {
      ok: false,
      response: json(
        {
          ok: false,
          message: MESSAGES.guestLimitReached,
          loginSuggested: true,
          feature,
        },
        {
          status: 429,
          headers: { "Retry-After": String(decision.retryAfterSeconds) },
        },
      ),
    };
  }
  return { ok: true };
}
