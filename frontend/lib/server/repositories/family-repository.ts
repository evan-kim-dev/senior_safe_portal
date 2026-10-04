import "server-only";
import type { FamilyRole } from "@/lib/domain/family";
import type { RestClient } from "../supabase/rest-client";

export type FamilyMemberRow = {
  family_id: string;
  user_id: string;
  role: FamilyRole;
};

export type FamilyInviteRow = {
  code: string;
  family_id: string;
  created_by: string;
  expires_at: string;
  used_by: string | null;
  used_at: string | null;
};

export type FamilyRepository = {
  findMembership(userId: string): Promise<FamilyMemberRow | null>;
  createFamily(userId: string, familyId: string): Promise<boolean>;
  addMember(familyId: string, userId: string, role: FamilyRole): Promise<boolean>;
  removeMember(familyId: string, userId: string): Promise<boolean>;
  findActiveInvite(familyId: string, nowIso: string): Promise<FamilyInviteRow | null>;
  findInvite(code: string): Promise<FamilyInviteRow | null>;
  insertInvite(invite: { code: string; familyId: string; createdBy: string; expiresAt: string }): Promise<boolean>;
  /** used_at 이 비어 있고 만료 전일 때만 사용 처리. 성공 시 초대 행 반환. */
  claimInvite(code: string, userId: string, usedAt: string, nowIso: string): Promise<FamilyInviteRow | null>;
  releaseInvite(code: string): Promise<boolean>;
};

export function createFamilyRepository(rest: RestClient): FamilyRepository {
  async function addMember(familyId: string, userId: string, role: FamilyRole): Promise<boolean> {
    const result = await rest.request("service", {
      path: "family_members",
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: { family_id: familyId, user_id: userId, role },
      timeoutMs: 4_000,
    });
    return result.ok;
  }

  return {
    async findMembership(userId) {
      const result = await rest.request<FamilyMemberRow[]>("service", {
        path: `family_members?user_id=eq.${encodeURIComponent(userId)}&select=family_id,user_id,role&limit=1`,
        timeoutMs: 4_000,
      });
      if (!result.ok || !result.data?.[0]) return null;
      return result.data[0];
    },

    async createFamily(userId, familyId) {
      const group = await rest.request("service", {
        path: "family_groups",
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: { id: familyId, created_by: userId },
        timeoutMs: 4_000,
      });
      if (!group.ok) return false;
      return addMember(familyId, userId, "guardian");
    },

    addMember,

    async removeMember(familyId, userId) {
      const result = await rest.request("service", {
        path:
          `family_members?family_id=eq.${encodeURIComponent(familyId)}` +
          `&user_id=eq.${encodeURIComponent(userId)}`,
        method: "DELETE",
        headers: { Prefer: "return=minimal" },
        timeoutMs: 4_000,
      });
      return result.ok;
    },

    async findActiveInvite(familyId, nowIso) {
      const result = await rest.request<FamilyInviteRow[]>("service", {
        path:
          `family_invites?family_id=eq.${encodeURIComponent(familyId)}` +
          `&used_at=is.null&expires_at=gt.${encodeURIComponent(nowIso)}` +
          `&select=code,family_id,created_by,expires_at,used_by,used_at&order=created_at.desc&limit=1`,
        timeoutMs: 4_000,
      });
      if (!result.ok || !result.data?.[0]) return null;
      return result.data[0];
    },

    async findInvite(code) {
      const result = await rest.request<FamilyInviteRow[]>("service", {
        path: `family_invites?code=eq.${encodeURIComponent(code)}&select=code,family_id,created_by,expires_at,used_by,used_at&limit=1`,
        timeoutMs: 4_000,
      });
      if (!result.ok || !result.data?.[0]) return null;
      return result.data[0];
    },

    async insertInvite(invite) {
      const result = await rest.request("service", {
        path: "family_invites",
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: {
          code: invite.code,
          family_id: invite.familyId,
          created_by: invite.createdBy,
          expires_at: invite.expiresAt,
        },
        timeoutMs: 4_000,
      });
      return result.ok;
    },

    async claimInvite(code, userId, usedAt, nowIso) {
      const result = await rest.request<FamilyInviteRow[]>("service", {
        path:
          `family_invites?code=eq.${encodeURIComponent(code)}` +
          `&used_at=is.null&expires_at=gt.${encodeURIComponent(nowIso)}`,
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: { used_by: userId, used_at: usedAt },
        timeoutMs: 4_000,
      });
      if (!result.ok || !Array.isArray(result.data) || !result.data[0]) return null;
      return result.data[0];
    },

    async releaseInvite(code) {
      const result = await rest.request("service", {
        path: `family_invites?code=eq.${encodeURIComponent(code)}`,
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: { used_by: null, used_at: null },
        timeoutMs: 4_000,
      });
      return result.ok;
    },
  };
}
