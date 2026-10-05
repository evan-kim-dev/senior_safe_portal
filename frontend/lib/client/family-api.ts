"use client";

import type {
  FamilyJoinResponse,
  FamilyLeaveResponse,
  FamilyMeResponse,
  FamilySeniorRemoveResponse,
  FamilySeniorUpdateResponse,
} from "@/lib/domain/family";
import { getJson, postJson } from "./api";
import { authHeaders } from "./auth-headers";

export async function createFamily(options?: { refresh?: boolean }): Promise<FamilyMeResponse | { ok: true; familyId: string; inviteCode: string; inviteExpiresAt: string }> {
  return postJson("/api/family", { refresh: options?.refresh === true }, { headers: await authHeaders() });
}

export async function joinFamily(code: string): Promise<FamilyJoinResponse> {
  return postJson("/api/family/join", { code }, { headers: await authHeaders() });
}

export async function loadFamilyMe(): Promise<FamilyMeResponse> {
  return getJson("/api/family/me", { headers: await authHeaders() });
}

export async function leaveFamily(confirm: string): Promise<FamilyLeaveResponse> {
  return postJson("/api/family/leave", { action: "leave", confirm }, { headers: await authHeaders() });
}

export async function resetFamily(confirm: string): Promise<FamilyLeaveResponse> {
  return postJson("/api/family/leave", { action: "reset", confirm }, { headers: await authHeaders() });
}

export async function updateFamilySenior(input: {
  seniorUserId: string;
  displayName: string;
  birthYear: number | null;
}): Promise<FamilySeniorUpdateResponse> {
  return postJson(
    "/api/family/seniors",
    {
      action: "update",
      seniorUserId: input.seniorUserId,
      displayName: input.displayName,
      birthYear: input.birthYear,
    },
    { headers: await authHeaders() },
  );
}

export async function removeFamilySenior(seniorUserId: string, confirm: string): Promise<FamilySeniorRemoveResponse> {
  return postJson(
    "/api/family/seniors",
    { action: "remove", seniorUserId, confirm },
    { headers: await authHeaders() },
  );
}
