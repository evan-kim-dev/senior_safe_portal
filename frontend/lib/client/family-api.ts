"use client";

import type { FamilyJoinResponse, FamilyMeResponse } from "@/lib/domain/family";
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
