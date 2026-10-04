import { asAnalyzeLinkBody, toCheckSuccess } from "@/lib/domain/check";
import { MESSAGES } from "@/lib/domain/messages";
import { toPublicMessage } from "@/lib/domain/sanitize";
import type { CheckResponse, CheckSuccess } from "@/lib/domain/types";
import { hostnameOf, tryCacheUrlKey } from "@/lib/domain/url";
import type { CheckInput } from "@/lib/domain/validation";
import type { EdgeResult } from "../gateways/edge-functions";
import type { Logger } from "../logger";

export const ANALYZE_TIMEOUT_MS = 45_000;

export type CheckOutcome = { status: number; body: CheckResponse };

export type CheckServiceDeps = {
  findFresh(urlKey: string): Promise<CheckSuccess | null>;
  analyze(url: string): Promise<EdgeResult>;
  save(urlKey: string, result: CheckSuccess): Promise<void>;
  recordDangerVideo(familyCode: string): Promise<void>;
  /** 응답을 보낸 뒤 할 일(캐시 저장, 집계). 실패해도 화면 결과에는 영향이 없어야 한다. */
  defer(task: () => Promise<void>): void;
  log: Logger;
};

export type CheckService = { check(input: CheckInput): Promise<CheckOutcome> };

function failure(status: number, message: string = MESSAGES.checkFailed): CheckOutcome {
  return { status, body: { ok: false, message } };
}

export function createCheckService(deps: CheckServiceDeps): CheckService {
  /** 같은 주소를 동시에 여러 번 누르면 Gemini 는 한 번만 부른다. */
  const inFlight = new Map<string, Promise<CheckOutcome>>();

  async function analyzeFresh(url: string, urlKey: string | null): Promise<CheckOutcome> {
    if (urlKey) {
      const cached = await deps.findFresh(urlKey).catch((error: unknown) => {
        deps.log.warn("link_cache_read_failed", { error });
        return null;
      });
      if (cached) return { status: 200, body: cached };
    }

    const result = await deps.analyze(url);
    if (result.kind === "missing-config") return failure(503);
    if (result.kind !== "response") return failure(502);

    const body = asAnalyzeLinkBody(result.data);
    const success = result.ok && body ? toCheckSuccess(url, body) : null;
    if (!success) {
      deps.log.warn("link_analysis_rejected", { host: hostnameOf(url), status: result.status });
      return failure(result.ok ? 502 : result.status, toPublicMessage(body?.message, MESSAGES.checkFailed, 120));
    }

    const saveKey = tryCacheUrlKey(success.url) ?? urlKey;
    if (saveKey) deps.defer(() => deps.save(saveKey, success));
    return { status: 200, body: success };
  }

  return {
    async check(input) {
      const urlKey = tryCacheUrlKey(input.url);
      const lockKey = urlKey ?? input.url;

      let pending = inFlight.get(lockKey);
      if (!pending) {
        pending = analyzeFresh(input.url, urlKey)
          .catch((error: unknown) => {
            deps.log.error("link_check_failed", { error, host: hostnameOf(input.url) });
            return failure(502);
          })
          .finally(() => inFlight.delete(lockKey));
        inFlight.set(lockKey, pending);
      }

      const outcome = await pending;
      if (outcome.body.ok && outcome.body.verdict === "danger" && outcome.body.kind === "video" && input.familyCode) {
        const familyCode = input.familyCode;
        deps.defer(() => deps.recordDangerVideo(familyCode));
      }
      return outcome;
    },
  };
}
