"use client";

import { useState } from "react";
import { postJson } from "./post-json";

type Turn = { role: "user" | "assistant"; content: string; linkUrl?: string };

export function useChat() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    const message = text.trim();
    if (!message || busy) return;
    setText("");
    setError("");
    const history = turns.map(({ role, content }) => ({ role, content }));
    setTurns((current) => [...current, { role: "user", content: message }]);
    setBusy(true);

    try {
      const data = await postJson<{ ok: boolean; reply?: string; linkUrl?: string; message?: string }>("/api/chat", { message, history });
      if (!data.ok || !data.reply) {
        setError(data.message || "답을 받지 못했습니다. 잠시 후 다시 물어봐 주세요.");
        return;
      }
      const reply = data.reply;
      setTurns((current) => [...current, { role: "assistant", content: reply, linkUrl: data.linkUrl }]);
    } catch {
      setError("답을 받지 못했습니다. 잠시 후 다시 물어봐 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return { open, setOpen, text, setText, turns, busy, error, send };
}
