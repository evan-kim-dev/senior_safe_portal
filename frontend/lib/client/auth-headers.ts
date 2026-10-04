"use client";

import { getSupabase } from "./supabase-browser";

/** 로그인한 사용자의 access_token 을 API Authorization 헤더로 만든다. */
export async function authHeaders(): Promise<Record<string, string>> {
  const supabase = getSupabase();
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
