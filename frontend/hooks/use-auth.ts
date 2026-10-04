"use client";

import { useSyncExternalStore } from "react";
import type { User } from "@supabase/supabase-js";
import {
  getAuthReady,
  getAuthUser,
  getServerAuthReady,
  getServerAuthUser,
  signOut,
  subscribeAuth,
} from "@/lib/client/auth-store";

export function useAuth(): { user: User | null; ready: boolean; logout: () => Promise<void> } {
  const user = useSyncExternalStore(subscribeAuth, getAuthUser, getServerAuthUser);
  const ready = useSyncExternalStore(subscribeAuth, getAuthReady, getServerAuthReady);
  return { user, ready, logout: signOut };
}
