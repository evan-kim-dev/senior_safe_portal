import "server-only";
import type { RestClient } from "../supabase/rest-client";
import type { ActivityKind } from "@/lib/domain/family";

export type ActivityRow = {
  id: string;
  created_at: string;
  kind: ActivityKind;
  summary: string;
  duration_sec: number;
  user_id: string | null;
};

export type ActivityInsert = {
  familyCode: string;
  userId?: string;
  kind: ActivityKind;
  summary?: string;
  durationSec?: number;
};

export type ActivityRepository = {
  insert(row: ActivityInsert): Promise<void>;
  countBetween(
    familyCode: string,
    startIso: string,
    endIso: string,
    kinds?: ActivityKind[],
    userIds?: string[],
  ): Promise<number>;
  sumDurationBetween(
    familyCode: string,
    startIso: string,
    endIso: string,
    kind: ActivityKind,
    userIds?: string[],
  ): Promise<number>;
  listBetween(
    familyCode: string,
    startIso: string,
    endIso: string,
    limit?: number,
    userIds?: string[],
  ): Promise<ActivityRow[]>;
};

function kindFilter(kinds?: ActivityKind[]): string {
  if (!kinds?.length) return "";
  return `&kind=in.(${kinds.join(",")})`;
}

function userFilter(userIds?: string[]): string {
  if (!userIds) return "";
  if (!userIds.length) return `&user_id=eq.__none__`;
  return `&user_id=in.(${userIds.map(encodeURIComponent).join(",")})`;
}

/** activity 에는 짧은 요약만 둔다. 전문 URL·본문은 넣지 않는다. */
export function createActivityRepository(rest: RestClient): ActivityRepository {
  return {
    async insert(row) {
      const body: Record<string, unknown> = {
        family_code: row.familyCode,
        kind: row.kind,
        summary: (row.summary ?? "").slice(0, 120),
        duration_sec: Math.max(0, Math.min(row.durationSec ?? 0, 86_400)),
      };
      if (row.userId) body.user_id = row.userId;
      await rest.request("service", {
        path: "activity",
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body,
        timeoutMs: 4_000,
      });
    },

    async countBetween(familyCode, startIso, endIso, kinds, userIds) {
      const result = await rest.request<unknown[]>("service", {
        path:
          `activity?family_code=eq.${encodeURIComponent(familyCode)}` +
          `&created_at=gte.${encodeURIComponent(startIso)}` +
          `&created_at=lt.${encodeURIComponent(endIso)}` +
          `${kindFilter(kinds)}${userFilter(userIds)}&select=id`,
        headers: { Prefer: "count=exact", Range: "0-0" },
        timeoutMs: 4_000,
      });
      if (!result.ok) return 0;
      const total = Number((result.headers.get("content-range") ?? "").split("/")[1]);
      return Number.isFinite(total) && total >= 0 ? total : 0;
    },

    async sumDurationBetween(familyCode, startIso, endIso, kind, userIds) {
      const result = await rest.request<Array<{ duration_sec?: number }>>("service", {
        path:
          `activity?family_code=eq.${encodeURIComponent(familyCode)}` +
          `&created_at=gte.${encodeURIComponent(startIso)}` +
          `&created_at=lt.${encodeURIComponent(endIso)}` +
          `&kind=eq.${encodeURIComponent(kind)}${userFilter(userIds)}&select=duration_sec&limit=500`,
        timeoutMs: 4_000,
      });
      if (!result.ok || !Array.isArray(result.data)) return 0;
      return result.data.reduce((sum, row) => sum + (Number(row.duration_sec) || 0), 0);
    },

    async listBetween(familyCode, startIso, endIso, limit = 30, userIds) {
      const result = await rest.request<ActivityRow[]>("service", {
        path:
          `activity?family_code=eq.${encodeURIComponent(familyCode)}` +
          `&created_at=gte.${encodeURIComponent(startIso)}` +
          `&created_at=lt.${encodeURIComponent(endIso)}` +
          `${userFilter(userIds)}` +
          `&select=id,created_at,kind,summary,duration_sec,user_id&order=created_at.desc&limit=${Math.max(1, Math.min(limit, 200))}`,
        timeoutMs: 4_000,
      });
      if (!result.ok || !Array.isArray(result.data)) return [];
      return result.data.map((row) => ({
        id: row.id,
        created_at: row.created_at,
        kind: row.kind,
        summary: typeof row.summary === "string" ? row.summary : "",
        duration_sec: Number(row.duration_sec) || 0,
        user_id: typeof row.user_id === "string" ? row.user_id : null,
      }));
    },
  };
}
