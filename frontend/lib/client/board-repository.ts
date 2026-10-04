"use client";

import type { User } from "@supabase/supabase-js";
import { boardAuthorId, type BoardDraft } from "@/lib/domain/board";
import type { BoardPost } from "@/lib/domain/types";
import { getSupabase } from "./supabase-browser";

const PAGE_SIZE = 20;

export type BoardListResult = { ok: true; posts: BoardPost[] } | { ok: false };

export function isBoardAvailable(): boolean {
  return getSupabase() !== null;
}

export async function listPosts(): Promise<BoardListResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false };
  try {
    const { data, error } = await supabase
      .from("board_posts")
      .select("id, user_id, author_name, title, content, created_at")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    if (error) return { ok: false };
    return { ok: true, posts: (data ?? []) as BoardPost[] };
  } catch {
    return { ok: false };
  }
}

/** user_id 는 RLS(auth.uid() = user_id)가 다시 확인한다. */
export async function createPost(user: User, draft: BoardDraft): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("board_posts").insert({
      user_id: user.id,
      author_name: draft.name,
      author_id: boardAuthorId(user.email),
      title: draft.title,
      content: draft.content,
    });
    return !error;
  } catch {
    return false;
  }
}
