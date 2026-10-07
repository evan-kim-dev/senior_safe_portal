"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChat } from "@/hooks/use-chat";
import { sendToCheck } from "@/lib/client/check-bridge";
import { CHAT_IMAGE_ACCEPT } from "@/lib/client/chat-image";
import { isStandaloneRoute } from "@/lib/domain/routes";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/domain/validation";
import { LineButton, Status } from "@/components/ui";
import { Icon } from "./icons";

const QUICK_PROMPTS = [
  "이 링크가 위험할까요?",
  "보이스피싱인지 알려 주세요",
  "문자에 온 사진을 검사해 주세요",
] as const;

function formatChatTime(at: number) {
  return new Date(at).toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ChatDock() {
  const pathname = usePathname();
  const chat = useChat();
  const logRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { open, setOpen } = chat;

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.turns.length, chat.busy, open, chat.attachment]);

  useEffect(() => {
    if (!open) return;
    document.body.dataset.chatOpen = "1";
    document.getElementById("chat-text")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      delete document.body.dataset.chatOpen;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  if (isStandaloneRoute(pathname)) return null;

  if (!open) {
    return (
      <button type="button" className="chat-fab" onClick={() => setOpen(true)} aria-label="마카에게 질문하기">
        <span className="chat-fab-icon" aria-hidden="true">
          <img src="/mascot.png" alt="" width={28} height={28} />
        </span>
        <span className="chat-fab-label">마카에게 질문하기</span>
      </button>
    );
  }

  const canSend = Boolean(chat.text.trim() || chat.attachment) && !chat.busy && !chat.needsLogin;
  const showWelcome = !chat.needsLogin && chat.turns.length === 0 && !chat.busy;

  return (
    <section className="chat-panel" role="dialog" aria-modal="true" aria-label="마카와 대화">
      <header className="chat-head">
        <span className="chat-avatar">
          <img src="/mascot-face.png" alt="" width={40} height={40} />
        </span>
        <div className="chat-title">
          <h1>마카</h1>
          <p>사기·보안 궁금증을 물어보세요</p>
        </div>
        <button type="button" className="chat-close" onClick={() => setOpen(false)} aria-label="대화 닫기">
          <Icon name="close" />
          <span className="chat-close-label">닫기</span>
        </button>
      </header>

      <div className="chat-log" role="log" ref={logRef}>
        {chat.needsLogin ? (
          <div className="chat-welcome">
            <Status>
              마카와 대화하려면{" "}
              <Link href="/login?next=/">로그인해 주세요</Link>.
            </Status>
            <LineButton href="/login?next=/">로그인하기</LineButton>
          </div>
        ) : null}

        {showWelcome ? (
          <div className="chat-welcome">
            <div className="chat-welcome-card">
              <img src="/mascot.png" alt="" width={56} height={56} className="chat-welcome-mascot" />
              <p className="chat-welcome-title">안녕하세요, 마카예요</p>
              <p className="chat-welcome-text">링크·문자·사진이 걱정되면 편하게 물어보세요.</p>
              <Link href="/maka" className="chat-welcome-about">
                마카 소개 보기
              </Link>
            </div>
            <div className="chat-quick" role="group" aria-label="자주 묻는 질문">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="chat-quick-chip"
                  disabled={chat.busy}
                  onClick={() => {
                    chat.setText(prompt);
                    window.setTimeout(() => document.getElementById("chat-text")?.focus(), 0);
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {chat.turns.map((turn, index) => (
          <div key={`${turn.role}-${index}`} className={turn.role === "user" ? "chat-turn user" : "chat-turn"}>
            {turn.role === "assistant" ? (
              <span className="chat-turn-avatar" aria-hidden="true">
                <img src="/mascot-face.png" alt="" width={44} height={44} />
              </span>
            ) : null}
            <div className="chat-turn-body">
              {turn.imageUrl ? (
                <div className="chat-bubble chat-bubble-media">
                  <img src={turn.imageUrl} alt="보낸 사진" className="chat-image" />
                  {turn.content && turn.content !== "사진을 보냈어요" ? <p>{turn.content}</p> : null}
                </div>
              ) : (
                <p className="chat-bubble">{turn.content}</p>
              )}
              <time className="chat-time" dateTime={new Date(turn.at).toISOString()}>
                {formatChatTime(turn.at)}
              </time>
              {turn.linkUrl ? (
                <LineButton icon="link" onClick={() => sendToCheck(turn.linkUrl ?? "", true)}>
                  이 주소 검사하기
                </LineButton>
              ) : null}
            </div>
          </div>
        ))}

        {chat.busy ? (
          <div className="chat-turn" aria-live="polite" aria-label="마카가 답을 준비하고 있어요">
            <span className="chat-turn-avatar" aria-hidden="true">
              <img src="/mascot-face.png" alt="" width={44} height={44} />
            </span>
            <div className="chat-turn-body">
              <div className="chat-bubble chat-typing" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        ) : null}

        {chat.error ? <Status>{chat.error}</Status> : null}
      </div>

      <form
        className="chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          void chat.send();
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept={CHAT_IMAGE_ACCEPT}
          className="chat-file"
          tabIndex={-1}
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            event.target.value = "";
            void chat.attachFile(file);
          }}
        />
        {chat.attachment ? (
          <div className="chat-attach-preview">
            <img src={chat.attachment.previewUrl} alt="" className="chat-attach-thumb" />
            <span className="chat-attach-name">{chat.attachment.name}</span>
            <button type="button" className="chat-attach-remove" onClick={chat.clearAttachment} disabled={chat.busy}>
              <Icon name="close" />
              <span className="sr-only">첨부 삭제</span>
            </button>
          </div>
        ) : null}
        <div className="chat-composer">
          <button
            type="button"
            className="chat-attach"
            disabled={chat.busy || chat.needsLogin}
            aria-label="사진 첨부"
            onClick={() => fileRef.current?.click()}
          >
            <Icon name="plus" />
          </button>
          <label className="chat-input" htmlFor="chat-text">
            <span className="sr-only">질문</span>
            <textarea
              id="chat-text"
              rows={1}
              value={chat.text}
              placeholder={chat.attachment ? "사진에 대해 궁금한 점을 적어 주세요" : "궁금한 점을 적어 주세요"}
              maxLength={MAX_CHAT_MESSAGE_LENGTH}
              disabled={chat.busy || chat.needsLogin}
              enterKeyHint="send"
              onChange={(event) => chat.setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
                event.preventDefault();
                if (canSend) void chat.send();
              }}
            />
          </label>
          <button type="submit" className="chat-send" disabled={!canSend} aria-label="보내기">
            <Icon name="send" />
          </button>
        </div>
      </form>
    </section>
  );
}
