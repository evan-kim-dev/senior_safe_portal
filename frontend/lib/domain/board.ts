import { MESSAGES } from "./messages";
import { err, ok, type Result } from "./result";

export const BOARD_LIMITS = { name: 32, title: 100, content: 2000 } as const;

export type BoardDraft = { name: string; title: string; content: string };

export function parseBoardDraft(draft: BoardDraft): Result<BoardDraft> {
  const name = draft.name.trim();
  const title = draft.title.trim();
  const content = draft.content.trim();
  if (!name || !title || !content) return err(MESSAGES.boardDraftRequired);
  return ok({
    name: name.slice(0, BOARD_LIMITS.name),
    title: title.slice(0, BOARD_LIMITS.title),
    content: content.slice(0, BOARD_LIMITS.content),
  });
}

/** 게시판 author_id 로 남길 이름. 이메일 앞부분만 쓰고 기호는 뺀다. */
export function boardAuthorId(email: string | undefined): string {
  const local = email?.split("@")[0] ?? "회원";
  return local.replace(/[^\w.\-가-힣]/g, "").slice(0, 32) || "회원";
}
