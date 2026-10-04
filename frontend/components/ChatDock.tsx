"use client";

import { usePathname } from "next/navigation";
import { sendToCheck } from "@/lib/check-bridge";
import { useChat } from "@/lib/use-chat";
import { BigButton, Field, LineButton, Status } from "@/components/ui";

export function ChatDock() {
  const pathname = usePathname();
  const chat = useChat();

  if (pathname === "/care" || pathname === "/setup") return null;

  if (!chat.open) {
    return (
      <div className="chat-launch">
        <BigButton onClick={() => chat.setOpen(true)}>단디에게 물어보기</BigButton>
      </div>
    );
  }

  return (
    <section className="chat-panel" role="dialog" aria-label="단디와 대화">
      <h1>단디</h1>
      <div className="chat-log" role="log">
        {chat.turns.length === 0 ? <Status>궁금한 점을 적어 주세요.</Status> : null}
        {chat.turns.map((turn, index) => (
          <div key={`${turn.role}-${index}`}>
            <p className={turn.role === "user" ? "chat-bubble user" : "chat-bubble"}>{turn.content}</p>
            {turn.linkUrl ? (
              <LineButton onClick={() => sendToCheck(turn.linkUrl!, true)}>이 주소 검사하기</LineButton>
            ) : null}
          </div>
        ))}
        {chat.busy ? <Status>답을 준비하고 있어요</Status> : null}
        {chat.error ? <Status>{chat.error}</Status> : null}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void chat.send();
        }}
      >
        <Field id="chat-text" label="질문" multiline value={chat.text} placeholder="궁금한 점을 적어 주세요" onChange={(event) => chat.setText(event.target.value)} />
        <BigButton type="submit" disabled={chat.busy}>보내기</BigButton>
        <LineButton onClick={() => chat.setOpen(false)}>닫기</LineButton>
      </form>
    </section>
  );
}
