"use client";

import { createClient, type Provider, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** 브라우저에는 공개 anon 키만 있다. 쓰기 권한은 board_posts RLS 가 막는다. */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key);
  return client;
}

export async function signInWith(provider: Provider): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) return "로그인을 시작할 수 없습니다. 잠시 후 다시 눌러 주세요.";

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/board` },
    });
    return error ? "로그인하지 못했습니다. 잠시 후 다시 눌러 주세요." : "";
  } catch {
    return "로그인하지 못했습니다. 잠시 후 다시 눌러 주세요.";
  }
}
