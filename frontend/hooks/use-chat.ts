"use client";

import { useEffect, useRef, useState } from "react";
import { postJson } from "@/lib/client/api";
import { onOpenChat } from "@/lib/client/chat-bridge";
import { MESSAGES } from "@/lib/domain/messages";
import type { ChatResponse, ChatTurn } from "@/lib/domain/types";
import { MAX_CHAT_HISTORY, MAX_CHAT_MESSAGE_LENGTH } from "@/lib/domain/validation";
import { useAliveRef } from "./use-alive";

const CHAT_TIMEOUT_MS = 65_000;
const MAX_TURNS_KEPT = 100;

export type Turn = ChatTurn & { linkUrl?: string };

export function useChat() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sendingRef = useRef(false);
  const aliveRef = useAliveRef();

  useEffect(
    () =>
      onOpenChat((prefill) => {
        setOpen(true);
        if (prefill && !sendingRef.current) setText(prefill);
      }),
    [],
  );

  async function send() {
    const message = text.trim().slice(0, MAX_CHAT_MESSAGE_LENGTH);
    if (!message || sendingRef.current) return;
    sendingRef.current = true;
    setText("");
    setError("");
    const history = turns.slice(-MAX_CHAT_HISTORY).map(({ role, content }) => ({ role, content }));
    setTurns((current) => [...current, { role: "user" as const, content: message }].slice(-MAX_TURNS_KEPT));
    setBusy(true);

    try {
      const data = await postJson<ChatResponse>("/api/chat", { message, history }, { timeoutMs: CHAT_TIMEOUT_MS });
      if (!aliveRef.current) return;
      if (!data?.ok || !data.reply) {
        setError((data && !data.ok && data.message) || MESSAGES.chatNoReply);
        return;
      }
      const reply = data.reply;
      setTurns((current) =>
        [...current, { role: "assistant" as const, content: reply, linkUrl: data.linkUrl || undefined }].slice(-MAX_TURNS_KEPT),
      );
    } catch {
      if (aliveRef.current) setError(MESSAGES.chatNoReply);
    } finally {
      sendingRef.current = false;
      if (aliveRef.current) setBusy(false);
    }
  }

  return { open, setOpen, text, setText, turns, busy, error, send };
}
