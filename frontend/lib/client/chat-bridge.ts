import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/domain/validation";

const EVENT = "ssp:open-chat";

type OpenChatDetail = { text: string };

/** 홈 카드 같은 다른 화면에서 마카 창을 연다. 질문은 채워 두기만 하고 보내지는 않는다. */
export function openChat(text = "") {
  window.dispatchEvent(new CustomEvent<OpenChatDetail>(EVENT, { detail: { text: text.slice(0, MAX_CHAT_MESSAGE_LENGTH) } }));
}

export function onOpenChat(listener: (text: string) => void): () => void {
  const handle = (event: Event) => {
    const detail = (event as CustomEvent<OpenChatDetail>).detail;
    listener(typeof detail?.text === "string" ? detail.text : "");
  };
  window.addEventListener(EVENT, handle);
  return () => window.removeEventListener(EVENT, handle);
}
