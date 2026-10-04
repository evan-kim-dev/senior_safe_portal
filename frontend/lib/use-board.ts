"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { formatDate } from "./date";
import { getSupabase } from "./supabase-browser";
import { useAuth } from "./use-auth";

export type BoardPost = {
  id: string;
  user_id: string;
  author_name: string;
  title: string;
  content: string;
  created_at: string;
};

type View = { name: "list" } | { name: "read"; post: BoardPost } | { name: "write" };

function displayName(user: User) {
  const email = user.email?.split("@")[0] ?? "회원";
  return email.replace(/[^\w.\-가-힣]/g, "").slice(0, 32) || "회원";
}

export function useBoard() {
  const { user, logout: signOut } = useAuth();
  const [view, setView] = useState<View>({ name: "list" });
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [message, setMessage] = useState("글을 불러오고 있습니다.");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!getSupabase()) setMessage("게시판을 열 수 없습니다. 잠시 후 다시 눌러 주세요.");
  }, []);

  useEffect(() => {
    if (view.name !== "list") return;
    void loadPosts();
  }, [view.name]);

  async function loadPosts() {
    const supabase = getSupabase();
    if (!supabase) return;
    setMessage("글을 불러오고 있습니다.");
    const { data, error } = await supabase
      .from("board_posts")
      .select("id, user_id, author_name, title, content, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      setPosts([]);
      setMessage("글을 불러오지 못했습니다. 잠시 후 다시 눌러 주세요.");
      return;
    }

    const rows = (data ?? []) as BoardPost[];
    setPosts(rows);
    setMessage(rows.length ? "" : "아직 올라온 글이 없습니다.");
  }

  async function savePost() {
    const supabase = getSupabase();
    if (!supabase || !user) return;
    const nextName = name.trim();
    const nextTitle = title.trim();
    const nextContent = content.trim();
    if (!nextName || !nextTitle || !nextContent) {
      setMessage("이름, 제목, 내용을 모두 적어 주세요.");
      return;
    }

    const { error } = await supabase.from("board_posts").insert({
      user_id: user.id,
      author_name: nextName.slice(0, 32),
      author_id: displayName(user),
      title: nextTitle.slice(0, 100),
      content: nextContent.slice(0, 2000),
    });

    if (error) {
      setMessage("글을 올리지 못했습니다. 잠시 후 다시 눌러 주세요.");
      return;
    }

    setName("");
    setTitle("");
    setContent("");
    setMessage("");
    setView({ name: "list" });
  }

  async function logout() {
    await signOut();
    setView({ name: "list" });
  }

  return {
    user,
    view,
    setView,
    posts,
    message,
    setMessage,
    name,
    setName,
    title,
    setTitle,
    content,
    setContent,
    savePost,
    logout,
    formatDate,
  };
}
