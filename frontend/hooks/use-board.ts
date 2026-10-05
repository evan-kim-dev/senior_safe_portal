"use client";

import { useEffect, useRef, useState } from "react";
import { createPost, isBoardAvailable, listPosts } from "@/lib/client/board-repository";
import { boardAuthorName } from "@/lib/domain/user-profile";
import { parseBoardDraft } from "@/lib/domain/board";
import { formatDate } from "@/lib/domain/date";
import type { BoardPost } from "@/lib/domain/types";
import { useAliveRef } from "./use-alive";
import { useAuth } from "./use-auth";

type View = { name: "list" } | { name: "read"; post: BoardPost } | { name: "write" };

const LOADING = "글을 불러오고 있습니다.";

export function useBoard() {
  const { user, logout: signOut } = useAuth();
  const [view, setView] = useState<View>({ name: "list" });
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [message, setMessage] = useState(LOADING);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const savingRef = useRef(false);
  const aliveRef = useAliveRef();

  useEffect(() => {
    if (view.name !== "list") return;
    if (!isBoardAvailable()) {
      setMessage("게시판을 열 수 없습니다. 잠시 후 다시 눌러 주세요.");
      return;
    }

    let active = true;
    setMessage(LOADING);
    void listPosts().then((result) => {
      if (!active) return;
      if (!result.ok) {
        setPosts([]);
        setMessage("글을 불러오지 못했습니다. 잠시 후 다시 눌러 주세요.");
        return;
      }
      setPosts(result.posts);
      setMessage(result.posts.length ? "" : "아직 올라온 글이 없습니다.");
    });
    return () => {
      active = false;
    };
  }, [view.name]);

  useEffect(() => {
    if (view.name !== "write") return;
    setName(boardAuthorName(user));
  }, [view.name, user]);

  async function savePost() {
    if (!user || savingRef.current) return;
    const draft = parseBoardDraft({ name, title, content });
    if (!draft.ok) {
      setMessage(draft.message);
      return;
    }

    savingRef.current = true;
    try {
      const saved = await createPost(user, draft.value);
      if (!aliveRef.current) return;
      if (!saved) {
        setMessage("글을 올리지 못했습니다. 잠시 후 다시 눌러 주세요.");
        return;
      }
      setName(boardAuthorName(user));
      setTitle("");
      setContent("");
      setMessage("");
      setView({ name: "list" });
    } finally {
      savingRef.current = false;
    }
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
