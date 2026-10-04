import "server-only";
import type { CheckSuccess } from "@/lib/domain/types";
import { headlineFor, isVerdict } from "@/lib/domain/verdict";
import type { RestClient } from "../supabase/rest-client";

export const LINK_CHECK_TTL_MS = 6 * 60 * 60 * 1000;

type StoredCheck = {
  url: string;
  kind: string;
  verdict: string;
  title: string;
  reason: string;
};

export type LinkCheckRepository = {
  findFresh(urlKey: string, now?: Date): Promise<CheckSuccess | null>;
  save(urlKey: string, result: CheckSuccess, now?: Date): Promise<void>;
};

/** link_checks 는 RLS 정책이 없어 service role 로만 읽고 쓴다. 키가 없으면 캐시 없이 동작한다. */
export function createLinkCheckRepository(rest: RestClient): LinkCheckRepository {
  return {
    async findFresh(urlKey, now = new Date()) {
      const cutoff = new Date(now.getTime() - LINK_CHECK_TTL_MS).toISOString();
      const result = await rest.request<StoredCheck[]>("service", {
        path:
          `link_checks?url_key=eq.${encodeURIComponent(urlKey)}` +
          `&checked_at=gte.${encodeURIComponent(cutoff)}` +
          "&select=url,kind,verdict,title,reason&limit=1",
        timeoutMs: 4_000,
      });
      if (!result.ok || !Array.isArray(result.data)) return null;

      const row = result.data[0];
      if (!row || !isVerdict(row.verdict) || typeof row.url !== "string") return null;
      return {
        ok: true,
        url: row.url,
        kind: row.kind === "video" ? "video" : "link",
        verdict: row.verdict,
        headline: headlineFor(row.verdict),
        title: typeof row.title === "string" ? row.title : "",
        reason: typeof row.reason === "string" ? row.reason : "",
      };
    },

    async save(urlKey, result, now = new Date()) {
      await rest.request("service", {
        path: "link_checks",
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: {
          url_key: urlKey,
          url: result.url,
          kind: result.kind,
          verdict: result.verdict,
          headline: result.headline,
          title: result.title,
          reason: result.reason,
          checked_at: now.toISOString(),
        },
      });
    },
  };
}
