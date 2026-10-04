import "server-only";
import type { RestClient } from "../supabase/rest-client";

export type ActivityRepository = {
  insert(familyCode: string): Promise<void>;
  countBetween(familyCode: string, startIso: string, endIso: string): Promise<number>;
};

/** activity 에는 가족 코드와 시각만 남긴다. 주소·제목·영상 내용은 넣지 않는다. */
export function createActivityRepository(rest: RestClient): ActivityRepository {
  return {
    async insert(familyCode) {
      await rest.request("service", {
        path: "activity",
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: { family_code: familyCode },
        timeoutMs: 4_000,
      });
    },

    async countBetween(familyCode, startIso, endIso) {
      const result = await rest.request<unknown[]>("service", {
        path:
          `activity?family_code=eq.${encodeURIComponent(familyCode)}` +
          `&created_at=gte.${encodeURIComponent(startIso)}` +
          `&created_at=lt.${encodeURIComponent(endIso)}&select=id`,
        headers: { Prefer: "count=exact", Range: "0-0" },
        timeoutMs: 4_000,
      });
      if (!result.ok) return 0;
      const total = Number((result.headers.get("content-range") ?? "").split("/")[1]);
      return Number.isFinite(total) && total >= 0 ? total : 0;
    },
  };
}
