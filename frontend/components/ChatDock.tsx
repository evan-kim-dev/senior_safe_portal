"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useChat } from "@/hooks/use-chat";
import { sendToCheck } from "@/lib/client/check-bridge";
import { isStandaloneRoute } from "@/lib/domain/routes";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/domain/validation";
import { BigButton, Field, LineButton, Status } from "@/components/ui";
import { Icon } from "./icons";

export function ChatDock() {
  const pathname = usePathname();
  const chat = useChat();
  const logRef = useRef<HTMLDivElement>(null);
  const { open, setOpen } = chat;

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.turns.length, chat.busy, open]);

  useEffect(() => {
    if (!open) return;
    document.getElementById("chat-text")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (isStandaloneRoute(pathname)) return null;

  if (!open) {
    return (
      <button type="button" className="chat-fab" onClick={() => setOpen(true)}>
        <Icon name="chat" />
        <span>단디에게 물어보기</span>
      </button>
    );
  }

  return (
    <section className="chat-panel" role="dialog" aria-label="단디와 대화">
      <header className="chat-head">
        <span className="chat-avatar"><Icon name="shield" /></span>
        <div className="chat-title">
          <h1>단디</h1>
          <p>사기·보안 궁금증을 물어보세요</p>
        </div>
        <button type="button" className="chat-close" onClick={() => setOpen(false)}>
          <Icon name="close" />
          <span>닫기</span>
        </button>
      </header>
      <div className="chat-log" role="log" ref={logRef}>
        {chat.turns.length === 0 ? <Status>궁금한 점을 적어 주세요.</Status> : null}
        {chat.turns.map((turn, index) => (
          <div key={`${turn.role}-${index}`} className={turn.role === "user" ? "chat-turn user" : "chat-turn"}>
            <p className="chat-bubble">{turn.content}</p>
            {turn.linkUrl ? (
              <LineButton icon="link" onClick={() => sendToCheck(turn.linkUrl ?? "", true)}>이 주소 검사하기</LineButton>
            ) : null}
          </div>
        ))}
        {chat.busy ? <Status>답을 준비하고 있어요</Status> : null}
        {chat.error ? <Status>{chat.error}</Status> : null}
      </div>
      <form
        className="chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          void chat.send();
        }}
      >
        <Field
          id="chat-text"
          label="질문"
          hideLabel
          multiline
          value={chat.text}
          placeholder="궁금한 점을 적어 주세요"
          maxLength={MAX_CHAT_MESSAGE_LENGTH}
          onChange={(event) => chat.setText(event.target.value)}
        />
        <BigButton type="submit" disabled={chat.busy}>보내기</BigButton>
      </form>
    </section>
  );
}
