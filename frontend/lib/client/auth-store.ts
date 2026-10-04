"use client";

import type { User } from "@supabase/supabase-js";
import { getSupabase } from "./supabase-browser";

/**
 * 로그인 상태를 앱 전체에서 한 번만 구독한다.
 * 상단 바와 게시판이 각각 getUser() 를 부르던 중복 네트워크 요청을 없앤다.
 */

type Listener = () => void;

let currentUser: User | null = null;
let started = false;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

function start() {
  if (started) return;
  started = true;
  const supabase = getSupabase();
  if (!supabase) return;
  supabase.auth.onAuthStateChange((_event, session) => {
    const next = session?.user ?? null;
    if (next?.id === currentUser?.id && next?.updated_at === currentUser?.updated_at) return;
    currentUser = next;
    emit();
  });
}

export function subscribeAuth(listener: Listener): () => void {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAuthUser(): User | null {
  return currentUser;
}

export function getServerAuthUser(): User | null {
  return null;
}

export async function signOut(): Promise<void> {
  try {
    await getSupabase()?.auth.signOut();
  } finally {
    currentUser = null;
    emit();
  }
}
