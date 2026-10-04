"use client";

import { useEffect, useRef, useState } from "react";
import { postJson } from "@/lib/client/api";
import { onOpenChat } from "@/lib/client/chat-bridge";
import { prepareChatImage, type ChatImagePayload } from "@/lib/client/chat-image";
import { MESSAGES } from "@/lib/domain/messages";
import type { ChatResponse, ChatTurn } from "@/lib/domain/types";
import { MAX_CHAT_HISTORY, MAX_CHAT_MESSAGE_LENGTH } from "@/lib/domain/validation";
import { useAliveRef } from "./use-alive";

const CHAT_TIMEOUT_MS = 65_000;
const MAX_TURNS_KEPT = 100;

export type Turn = ChatTurn & { linkUrl?: string; at: number; imageUrl?: string };

export function useChat() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attachment, setAttachment] = useState<ChatImagePayload | null>(null);
  const sendingRef = useRef(false);
  const aliveRef = useAliveRef();
  const attachmentRef = useRef<ChatImagePayload | null>(null);

  useEffect(() => {
    attachmentRef.current = attachment;
  }, [attachment]);

  useEffect(
    () => () => {
      if (attachmentRef.current?.previewUrl) URL.revokeObjectURL(attachmentRef.current.previewUrl);
    },
    [],
  );

  useEffect(
    () =>
      onOpenChat((prefill) => {
        setOpen(true);
        if (prefill && !sendingRef.current) setText(prefill);
      }),
    [],
  );

  function clearAttachment() {
    setAttachment((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  }

  async function attachFile(file: File | null) {
    if (!file || sendingRef.current) return;
    setError("");
    try {
      const prepared = await prepareChatImage(file);
      setAttachment((current) => {
        if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
        return prepared;
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "";
      if (reason === "unsupported") setError(MESSAGES.chatImageUnsupported);
      else if (reason === "too-large") setError(MESSAGES.chatImageTooLarge);
      else setError(MESSAGES.chatImageFailed);
    }
  }

  async function send() {
    const message = text.trim().slice(0, MAX_CHAT_MESSAGE_LENGTH);
    const image = attachment;
    if ((!message && !image) || sendingRef.current) return;
    sendingRef.current = true;
    setText("");
    setError("");
    setAttachment(null);
    const history = turns.slice(-MAX_CHAT_HISTORY).map(({ role, content }) => ({ role, content }));
    const display = message || "사진을 보냈어요";
    setTurns((current) =>
      [
        ...current,
        {
          role: "user" as const,
          content: display,
          at: Date.now(),
          imageUrl: image?.previewUrl,
        },
      ].slice(-MAX_TURNS_KEPT),
    );
    setBusy(true);

    try {
      const data = await postJson<ChatResponse>(
        "/api/chat",
        {
          message,
          history,
          image: image ? { mimeType: image.mimeType, data: image.data } : undefined,
        },
        { timeoutMs: CHAT_TIMEOUT_MS },
      );
      if (!aliveRef.current) return;
      if (!data?.ok || !data.reply) {
        setError((data && !data.ok && data.message) || MESSAGES.chatNoReply);
        return;
      }
      const reply = data.reply;
      setTurns((current) =>
        [
          ...current,
          {
            role: "assistant" as const,
            content: reply,
            linkUrl: data.linkUrl || undefined,
            at: Date.now(),
          },
        ].slice(-MAX_TURNS_KEPT),
      );
    } catch {
      if (aliveRef.current) setError(MESSAGES.chatNoReply);
    } finally {
      sendingRef.current = false;
      if (aliveRef.current) setBusy(false);
    }
  }

  return {
    open,
    setOpen,
    text,
    setText,
    turns,
    busy,
    error,
    attachment,
    attachFile,
    clearAttachment,
    send,
  };
}
