"use client";

import { useSyncExternalStore } from "react";
import type { User } from "@supabase/supabase-js";
import { getAuthUser, getServerAuthUser, signOut, subscribeAuth } from "@/lib/client/auth-store";

export function useAuth(): { user: User | null; logout: () => Promise<void> } {
  const user = useSyncExternalStore(subscribeAuth, getAuthUser, getServerAuthUser);
  return { user, logout: signOut };
}
