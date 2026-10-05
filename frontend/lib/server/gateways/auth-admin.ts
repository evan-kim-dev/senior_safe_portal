import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ageFromBirthYear, parseAccountProfileFromMeta } from "@/lib/domain/account-profile";
import { pickDisplayNameFromMeta } from "@/lib/domain/user-profile";
import { getServerEnv } from "../env";

export type SeniorAuthProfile = {
  displayName: string;
  birthYear: number | null;
  ageLabel: string;
};

function createAdminClient(): SupabaseClient | null {
  const env = getServerEnv();
  if (!env.supabaseUrl || !env.serviceRoleKey) return null;
  return createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function toSeniorProfile(meta: Record<string, unknown>, email?: string | null): SeniorAuthProfile {
  const displayName = pickDisplayNameFromMeta(meta, email);
  const profile = parseAccountProfileFromMeta(meta);
  const age = profile.birthYear != null ? ageFromBirthYear(profile.birthYear) : null;
  return {
    displayName,
    birthYear: profile.birthYear,
    ageLabel: age != null && profile.birthYear != null ? `${age}세 · ${profile.birthYear}년생` : "",
  };
}

/** 서비스 롤로 Auth 사용자 표시 이름을 조회한다. 실패·미설정 시 빈 맵. */
export async function resolveDisplayNames(userIds: string[]): Promise<Map<string, string>> {
  const profiles = await resolveSeniorProfiles(userIds);
  const out = new Map<string, string>();
  for (const [userId, profile] of profiles) {
    if (profile.displayName) out.set(userId, profile.displayName);
  }
  return out;
}

/** 어르신 카드용 이름·나이. */
export async function resolveSeniorProfiles(userIds: string[]): Promise<Map<string, SeniorAuthProfile>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const out = new Map<string, SeniorAuthProfile>();
  if (!unique.length) return out;

  const admin = createAdminClient();
  if (!admin) return out;

  await Promise.all(
    unique.map(async (userId) => {
      try {
        const { data, error } = await admin.auth.admin.getUserById(userId);
        if (error || !data.user) return;
        const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
        out.set(userId, toSeniorProfile(meta, data.user.email));
      } catch {
        // ignore
      }
    }),
  );

  return out;
}

/** 보호자가 어르신 표시 이름·출생연도를 고친다. */
export async function updateSeniorAuthProfile(
  userId: string,
  patch: { displayName: string; birthYear: number | null },
): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin || !userId) return false;

  try {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data.user) return false;
    const prev = (data.user.user_metadata ?? {}) as Record<string, unknown>;
    const nextMeta: Record<string, unknown> = {
      ...prev,
      full_name: patch.displayName,
      name: patch.displayName,
    };
    if (patch.birthYear == null) {
      nextMeta.birth_year = null;
    } else {
      nextMeta.birth_year = patch.birthYear;
    }

    const updated = await admin.auth.admin.updateUserById(userId, { user_metadata: nextMeta });
    return !updated.error;
  } catch {
    return false;
  }
}
