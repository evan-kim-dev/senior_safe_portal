"use client";

import { BigButton, Field, Group, Info, LineButton, Row, Screen, Status } from "@/components/ui";
import { useBoard } from "@/lib/use-board";

export default function BoardPage() {
  const board = useBoard();

  if (board.view.name === "write") {
    return (
      <Screen
        title="글쓰기"
        secondary={<LineButton onClick={() => { board.setMessage(""); board.setView({ name: "list" }); }}>목록</LineButton>}
        primary={<BigButton type="submit" form="board-form">올리기</BigButton>}
      >
        <form id="board-form" onSubmit={(event) => { event.preventDefault(); void board.savePost(); }}>
          <Field id="board-name" label="이름" value={board.name} onChange={(event) => board.setName(event.target.value)} />
          <Field id="board-title" label="제목" value={board.title} onChange={(event) => board.setTitle(event.target.value)} />
          <Field id="board-content" label="내용" multiline value={board.content} onChange={(event) => board.setContent(event.target.value)} />
          {board.message ? <Status>{board.message}</Status> : null}
        </form>
      </Screen>
    );
  }

  if (board.view.name === "read") {
    return (
      <Screen title="글보기" primary={<BigButton onClick={() => board.setView({ name: "list" })}>목록</BigButton>}>
        <Info
          title={board.view.post.title}
          lines={[
            board.view.post.author_name,
            board.formatDate(board.view.post.created_at),
            board.view.post.content,
          ]}
        />
      </Screen>
    );
  }

  return (
    <Screen
      title="게시판"
      secondary={board.user ? <LineButton onClick={() => void board.logout()}>로그아웃</LineButton> : null}
      primary={board.user
        ? <BigButton onClick={() => { board.setMessage(""); board.setView({ name: "write" }); }}>글쓰기</BigButton>
        : <BigButton href="/login">로그인하고 글쓰기</BigButton>}
    >
      {board.message ? <Status>{board.message}</Status> : null}
      <Group label="게시판">
        {board.posts.map((post) => (
          <Row key={post.id} onClick={() => board.setView({ name: "read", post })}>{post.title}</Row>
        ))}
      </Group>
    </Screen>
  );
}
