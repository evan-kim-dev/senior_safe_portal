import "server-only";
import { createClient } from "@supabase/supabase-js";
import { ageFromBirthYear, parseAccountProfileFromMeta } from "@/lib/domain/account-profile";
import { pickDisplayNameFromMeta } from "@/lib/domain/user-profile";
import { getServerEnv } from "../env";

export type SeniorAuthProfile = {
  displayName: string;
  birthYear: number | null;
  ageLabel: string;
};

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

  const env = getServerEnv();
  if (!env.supabaseUrl || !env.serviceRoleKey) return out;

  const admin = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  await Promise.all(
    unique.map(async (userId) => {
      try {
        const { data, error } = await admin.auth.admin.getUserById(userId);
        if (error || !data.user) return;
        const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
        const displayName = pickDisplayNameFromMeta(meta, data.user.email);
        const profile = parseAccountProfileFromMeta(meta);
        const age = profile.birthYear != null ? ageFromBirthYear(profile.birthYear) : null;
        out.set(userId, {
          displayName,
          birthYear: profile.birthYear,
          ageLabel:
            age != null && profile.birthYear != null ? `${age}세 · ${profile.birthYear}년생` : "",
        });
      } catch {
        // ignore
      }
    }),
  );

  return out;
}
