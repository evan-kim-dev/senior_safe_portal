import {
  generateInviteCode,
  INVITE_TTL_MS,
  isInviteCode,
  normalizeInviteCode,
  type FamilyActivityItem,
  type FamilyRole,
} from "@/lib/domain/family";
import { MESSAGES } from "@/lib/domain/messages";
import { isFamilyCode } from "@/lib/domain/validation";
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
      todayCount: number;
      todayItems: FamilyActivityItem[];
    }
  | { ok: false; message: string; status: number; needsFamily?: boolean };

export type FamilyService = {
  create(userId: string, options?: { refresh?: boolean }): Promise<FamilyCreateResult>;
  join(userId: string, code: unknown): Promise<FamilyJoinResult>;
  me(userId: string, now?: Date): Promise<FamilyMeResult>;
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

      const [todayCount, todayItems] = await Promise.all([
        activity.countDangerVideosToday(membership.family_id, now),
        activity.listDangerVideosToday(membership.family_id, now),
      ]);

      return {
        ok: true,
        familyId: membership.family_id,
        role: membership.role,
        inviteCode,
        inviteExpiresAt,
        todayCount,
        todayItems,
      };
    },
  };
}
