import {
  familySeniorDisplayName,
  generateInviteCode,
  INVITE_TTL_MS,
  isInviteCode,
  normalizeInviteCode,
  type FamilyActivityItem,
  type FamilyRole,
  type FamilySenior,
} from "@/lib/domain/family";
import { buildSeniorRoster } from "@/lib/domain/senior-roster";
import { MESSAGES } from "@/lib/domain/messages";
import { isFamilyCode } from "@/lib/domain/validation";
import { resolveSeniorProfiles, updateSeniorAuthProfile } from "../gateways/auth-admin";
import type { ActivityService } from "./activity-service";
import type { FamilyRepository } from "../repositories/family-repository";

export type FamilyCreateResult =
  | { ok: true; familyId: string; inviteCode: string; inviteExpiresAt: string }
  | { ok: false; message: string; status: number };

export type FamilyJoinResult =
  | { ok: true; familyId: string; role: FamilyRole }
  | { ok: false; message: string; status: number };

export type FamilyMeResult =
  | {
      ok: true;
      familyId: string;
      role: FamilyRole;
      inviteCode: string;
      inviteExpiresAt: string;
      seniorCount: number;
      seniors: FamilySenior[];
      connected: boolean;
      todayCount: number;
      todayNewsCount: number;
      todayWatchSec: number;
      todayItems: FamilyActivityItem[];
    }
  | { ok: false; message: string; status: number; needsFamily?: boolean };

export type FamilyLeaveResult =
  | { ok: true; action: "leave" }
  | { ok: true; action: "reset"; inviteCode: string; inviteExpiresAt: string }
  | { ok: false; message: string; status: number };

export type FamilySeniorMutationResult =
  | { ok: true }
  | { ok: false; message: string; status: number };

export type FamilyService = {
  create(userId: string, options?: { refresh?: boolean }): Promise<FamilyCreateResult>;
  join(userId: string, code: unknown): Promise<FamilyJoinResult>;
  me(userId: string, now?: Date): Promise<FamilyMeResult>;
  leave(userId: string): Promise<FamilyLeaveResult>;
  reset(userId: string): Promise<FamilyLeaveResult>;
  updateSenior(
    guardianId: string,
    seniorUserId: string,
    patch: { displayName: string; birthYear: number | null },
  ): Promise<FamilySeniorMutationResult>;
  removeSenior(guardianId: string, seniorUserId: string): Promise<FamilySeniorMutationResult>;
  resolveFamilyForUser(userId: string): Promise<{ familyId: string; role: FamilyRole } | null>;
};

async function issueInvite(repo: FamilyRepository, familyId: string, userId: string, now: Date) {
  const expiresAt = new Date(now.getTime() + INVITE_TTL_MS).toISOString();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateInviteCode();
    const inserted = await repo.insertInvite({ code, familyId, createdBy: userId, expiresAt });
    if (inserted) return { code, expiresAt };
  }
  return null;
}

export function createFamilyService(repo: FamilyRepository, activity: ActivityService): FamilyService {
  return {
    async resolveFamilyForUser(userId) {
      const membership = await repo.findMembership(userId);
      if (!membership) return null;
      return { familyId: membership.family_id, role: membership.role };
    },

    async leave(userId) {
      const membership = await repo.findMembership(userId);
      if (!membership) return { ok: false, message: MESSAGES.familyNotFound, status: 404 };

      if (membership.role === "guardian") {
        // 보호자가 나가면 가족·초대·멤버를 모두 정리해 데모 엇갈림을 막는다.
        await repo.deleteInvites(membership.family_id);
        const cleared = await repo.removeAllMembers(membership.family_id);
        if (!cleared) return { ok: false, message: MESSAGES.familyLeaveFailed, status: 502 };
        return { ok: true, action: "leave" as const };
      }

      const removed = await repo.removeMember(membership.family_id, userId);
      if (!removed) return { ok: false, message: MESSAGES.familyLeaveFailed, status: 502 };
      return { ok: true, action: "leave" as const };
    },

    async reset(userId) {
      const membership = await repo.findMembership(userId);
      if (!membership) return { ok: false, message: MESSAGES.familyNotFound, status: 404 };
      if (membership.role !== "guardian") {
        return { ok: false, message: MESSAGES.familyGuardianOnly, status: 403 };
      }

      const seniors = await repo.listMembers(membership.family_id, "senior");
      for (const senior of seniors) {
        const removed = await repo.removeMember(membership.family_id, senior.user_id);
        if (!removed) return { ok: false, message: MESSAGES.familyResetFailed, status: 502 };
      }
      await repo.deleteInvites(membership.family_id);
      const issued = await issueInvite(repo, membership.family_id, userId, new Date());
      if (!issued) return { ok: false, message: MESSAGES.familyResetFailed, status: 502 };
      return {
        ok: true,
        action: "reset" as const,
        inviteCode: issued.code,
        inviteExpiresAt: issued.expiresAt,
      };
    },

    async updateSenior(guardianId, seniorUserId, patch) {
      const membership = await repo.findMembership(guardianId);
      if (!membership) return { ok: false, message: MESSAGES.familyNotFound, status: 404 };
      if (membership.role !== "guardian") {
        return { ok: false, message: MESSAGES.familyGuardianOnly, status: 403 };
      }

      const seniors = await repo.listMembers(membership.family_id, "senior");
      const target = seniors.find((row) => row.user_id === seniorUserId);
      if (!target) return { ok: false, message: MESSAGES.familySeniorNotFound, status: 404 };

      const updated = await updateSeniorAuthProfile(seniorUserId, patch);
      if (!updated) return { ok: false, message: MESSAGES.familySeniorUpdateFailed, status: 502 };
      return { ok: true };
    },

    async removeSenior(guardianId, seniorUserId) {
      const membership = await repo.findMembership(guardianId);
      if (!membership) return { ok: false, message: MESSAGES.familyNotFound, status: 404 };
      if (membership.role !== "guardian") {
        return { ok: false, message: MESSAGES.familyGuardianOnly, status: 403 };
      }

      const seniors = await repo.listMembers(membership.family_id, "senior");
      const target = seniors.find((row) => row.user_id === seniorUserId);
      if (!target) return { ok: false, message: MESSAGES.familySeniorNotFound, status: 404 };

      const removed = await repo.removeMember(membership.family_id, seniorUserId);
      if (!removed) return { ok: false, message: MESSAGES.familySeniorRemoveFailed, status: 502 };
      return { ok: true };
    },

    async create(userId, options = {}) {
      const existing = await repo.findMembership(userId);
      if (existing) {
        if (existing.role !== "guardian") {
          return { ok: false, message: MESSAGES.familyGuardianOnly, status: 403 };
        }
        const now = new Date();
        if (!options.refresh) {
          const invite = await repo.findActiveInvite(existing.family_id, now.toISOString());
          if (invite) {
            return {
              ok: true,
              familyId: existing.family_id,
              inviteCode: invite.code,
              inviteExpiresAt: invite.expires_at,
            };
          }
        }
        const issued = await issueInvite(repo, existing.family_id, userId, now);
        if (!issued) return { ok: false, message: MESSAGES.familyCreateFailed, status: 502 };
        return {
          ok: true,
          familyId: existing.family_id,
          inviteCode: issued.code,
          inviteExpiresAt: issued.expiresAt,
        };
      }

      const familyId = crypto.randomUUID();
      if (!isFamilyCode(familyId)) return { ok: false, message: MESSAGES.familyCreateFailed, status: 502 };
      const created = await repo.createFamily(userId, familyId);
      if (!created) return { ok: false, message: MESSAGES.familyCreateFailed, status: 502 };

      const issued = await issueInvite(repo, familyId, userId, new Date());
      if (!issued) return { ok: false, message: MESSAGES.familyCreateFailed, status: 502 };
      return { ok: true, familyId, inviteCode: issued.code, inviteExpiresAt: issued.expiresAt };
    },

    async join(userId, rawCode) {
      const existing = await repo.findMembership(userId);
      if (existing) return { ok: false, message: MESSAGES.familyAlreadyMember, status: 409 };

      const code = normalizeInviteCode(rawCode);
      if (!isInviteCode(code)) return { ok: false, message: MESSAGES.familyInviteInvalid, status: 400 };

      const invite = await repo.findInvite(code);
      if (!invite) return { ok: false, message: MESSAGES.familyInviteInvalid, status: 404 };
      if (invite.used_at) return { ok: false, message: MESSAGES.familyInviteUsed, status: 409 };
      if (new Date(invite.expires_at).getTime() <= Date.now()) {
        return { ok: false, message: MESSAGES.familyInviteExpired, status: 410 };
      }
      if (invite.created_by === userId) {
        return { ok: false, message: MESSAGES.familyInviteInvalid, status: 400 };
      }

      const usedAt = new Date().toISOString();
      const nowIso = usedAt;
      const claimed = await repo.claimInvite(code, userId, usedAt, nowIso);
      if (!claimed) {
        const again = await repo.findInvite(code);
        if (again?.used_at) return { ok: false, message: MESSAGES.familyInviteUsed, status: 409 };
        if (again && new Date(again.expires_at).getTime() <= Date.now()) {
          return { ok: false, message: MESSAGES.familyInviteExpired, status: 410 };
        }
        return { ok: false, message: MESSAGES.familyJoinFailed, status: 409 };
      }

      const added = await repo.addMember(claimed.family_id, userId, "senior");
      if (!added) {
        await repo.releaseInvite(code);
        return { ok: false, message: MESSAGES.familyJoinFailed, status: 502 };
      }
      return { ok: true, familyId: claimed.family_id, role: "senior" };
    },

    async me(userId, now = new Date()) {
      const membership = await repo.findMembership(userId);
      if (!membership) {
        return { ok: false, message: MESSAGES.familyNotFound, status: 404, needsFamily: true };
      }

      let inviteCode = "";
      let inviteExpiresAt = "";
      if (membership.role === "guardian") {
        const invite = await repo.findActiveInvite(membership.family_id, now.toISOString());
        if (invite) {
          inviteCode = invite.code;
          inviteExpiresAt = invite.expires_at;
        }
      }

      const seniorRows = await repo.listMembers(membership.family_id, "senior");
      const seniorIds = seniorRows.map((row) => row.user_id);
      const profiles = await resolveSeniorProfiles(seniorIds);
      const seniorSeeds = seniorRows.map((row, index) => ({
        userId: row.user_id,
        displayName: familySeniorDisplayName(index, profiles.get(row.user_id)?.displayName ?? ""),
      }));
      const nameByUserId = new Map(seniorSeeds.map((item) => [item.userId, item.displayName]));

      const summary = await activity.todaySummary(membership.family_id, now, {
        userIds: seniorIds,
        nameByUserId,
      });
      const seniors: FamilySenior[] = buildSeniorRoster(seniorSeeds, summary.rosterRows).map((senior) => {
        const profile = profiles.get(senior.userId);
        return {
          ...senior,
          birthYear: profile?.birthYear ?? undefined,
          ageLabel: profile?.ageLabel || undefined,
        };
      });

      return {
        ok: true,
        familyId: membership.family_id,
        role: membership.role,
        inviteCode,
        inviteExpiresAt,
        seniorCount: seniors.length,
        seniors,
        connected: seniors.length > 0,
        todayCount: summary.dangerCount,
        todayNewsCount: summary.newsCount,
        todayWatchSec: summary.watchSec,
        todayItems: summary.items,
      };
    },
  };
}
