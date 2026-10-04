"use client";

import { BigButton, Field, Group, Info, LineButton, Row, Screen, Status } from "@/components/ui";
import { useBoard } from "@/hooks/use-board";
import { BOARD_LIMITS } from "@/lib/domain/board";

export default function BoardPage() {
  const board = useBoard();

  if (board.view.name === "write") {
    return (
      <Screen
        title="글쓰기"
        lead="겪은 일이나 조심할 점을 나눠 주세요."
        narrow
        secondary={<LineButton onClick={() => { board.setMessage(""); board.setView({ name: "list" }); }}>목록</LineButton>}
        primary={<BigButton type="submit" form="board-form">올리기</BigButton>}
      >
        <form id="board-form" onSubmit={(event) => { event.preventDefault(); void board.savePost(); }}>
          <Field id="board-name" label="이름" maxLength={BOARD_LIMITS.name} value={board.name} onChange={(event) => board.setName(event.target.value)} />
          <Field id="board-title" label="제목" maxLength={BOARD_LIMITS.title} value={board.title} onChange={(event) => board.setTitle(event.target.value)} />
          <Field id="board-content" label="내용" multiline maxLength={BOARD_LIMITS.content} value={board.content} onChange={(event) => board.setContent(event.target.value)} />
          {board.message ? <Status>{board.message}</Status> : null}
        </form>
      </Screen>
    );
  }

  if (board.view.name === "read") {
    const { post } = board.view;
    return (
      <Screen title="글보기" narrow primary={<BigButton onClick={() => board.setView({ name: "list" })}>목록</BigButton>}>
        <Info
          title={post.title}
          lines={[`${post.author_name} · ${board.formatDate(post.created_at)}`, post.content]}
        />
      </Screen>
    );
  }

  return (
    <Screen
      title="게시판"
      lead="서로 겪은 일을 나누고 조심할 점을 알려 주세요."
      secondary={board.user ? <LineButton onClick={() => void board.logout()}>로그아웃</LineButton> : null}
      primary={board.user
        ? <BigButton icon="board" onClick={() => { board.setMessage(""); board.setView({ name: "write" }); }}>글쓰기</BigButton>
        : <BigButton href="/login">로그인하고 글쓰기</BigButton>}
    >
      {board.message ? <Status>{board.message}</Status> : null}
      <Group label="게시판">
        {board.posts.map((post) => (
          <Row
            key={post.id}
            meta={`${post.author_name} · ${board.formatDate(post.created_at)}`}
            onClick={() => board.setView({ name: "read", post })}
          >
            {post.title}
          </Row>
        ))}
      </Group>
    </Screen>
  );
}
