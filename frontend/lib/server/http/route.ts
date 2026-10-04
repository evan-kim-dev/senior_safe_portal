import "server-only";
import { MESSAGES } from "@/lib/domain/messages";
import { logger, type Logger } from "../logger";
import { clientIp } from "./client-ip";
import { RateLimiter, type RateLimitRule } from "./rate-limit";
import { json } from "./respond";

export type RouteContext = { requestId: string; log: Logger };
export type RouteHandler = (request: Request, context: RouteContext) => Promise<Response>;

type RouteOptions = { rateLimit?: RateLimitRule };

/**
 * 모든 API 가 같은 방식으로 요청 제한·로그·예외 처리를 하게 감싼다.
 * 처리하지 못한 예외는 기록만 하고 화면에는 정해진 문장만 보낸다.
 */
export function withRoute(name: string, options: RouteOptions, handler: RouteHandler) {
  const limiter = options.rateLimit ? new RateLimiter(options.rateLimit) : null;

  return async function route(request: Request): Promise<Response> {
    const requestId = request.headers.get("x-vercel-id") || crypto.randomUUID();
    const log = logger.child({ route: name, requestId });
    const started = Date.now();

    if (limiter) {
      const decision = limiter.hit(clientIp(request.headers));
      if (!decision.allowed) {
        log.warn("rate_limited", { retryAfterSeconds: decision.retryAfterSeconds });
        return json(
          { ok: false, message: MESSAGES.tooManyRequests },
          { status: 429, headers: { "Retry-After": String(decision.retryAfterSeconds), "X-Request-Id": requestId } },
        );
      }
    }

    try {
      const response = await handler(request, { requestId, log });
      response.headers.set("X-Request-Id", requestId);
      log.debug("request_completed", { status: response.status, durationMs: Date.now() - started });
      return response;
    } catch (error) {
      log.error("request_failed", { error, durationMs: Date.now() - started });
      return json({ ok: false, message: MESSAGES.unexpected }, { status: 500, headers: { "X-Request-Id": requestId } });
    }
  };
}
