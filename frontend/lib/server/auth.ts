import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "./env";

export type AuthUser = { id: string };

/** Authorization: Bearer <access_token> 으로 로그인한 사용자를 확인한다. */
export async function requireUser(request: Request): Promise<AuthUser | null> {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const token = match?.[1]?.trim() ?? "";
  if (!token) return null;

  const env = getServerEnv();
  if (!env.supabaseUrl || !env.anonKey) return null;

  const supabase = createClient(env.supabaseUrl, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.id) return null;
  return { id: data.user.id };
}
