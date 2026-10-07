"use client";

import { openChat } from "@/lib/client/chat-bridge";

export function MakaMeetButton() {
  return (
    <button
      type="button"
      className="btn btn-primary maka-cta"
      onClick={() => openChat("안녕하세요, 마카! 자기소개 해주세요.")}
    >
      마카에게 인사하기
    </button>
  );
}
