"use client";

import Link from "next/link";
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
          <Field id="board-name" label="이름" required maxLength={BOARD_LIMITS.name} value={board.name} onChange={(event) => board.setName(event.target.value)} />
          <Field id="board-title" label="제목" required maxLength={BOARD_LIMITS.title} value={board.title} onChange={(event) => board.setTitle(event.target.value)} />
          <Field id="board-content" label="내용" required multiline maxLength={BOARD_LIMITS.content} value={board.content} onChange={(event) => board.setContent(event.target.value)} />
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
        : <BigButton href="/login?next=/board">로그인하고 글쓰기</BigButton>}
    >
      {board.message ? <Status>{board.message}</Status> : null}
      {board.posts.length === 0 ? (
        <div className="board-empty" role="status">
          <p className="board-empty-title">아직 글이 없어요</p>
          <p className="board-empty-lead">로그인하지 않아도 아래를 먼저 이용할 수 있어요.</p>
          <ul className="board-empty-links">
            <li><Link href="/">링크 검사하러 가기</Link></li>
            <li><Link href="/news">사기·보안 뉴스 보기</Link></li>
            <li><Link href="/welfare">복지 혜택 찾아보기</Link></li>
            <li><Link href="/#hotline">112에 전화하기</Link></li>
            {!board.user ? (
              <li><Link href="/login?next=/board">로그인하고 글쓰기</Link></li>
            ) : null}
          </ul>
        </div>
      ) : (
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
      )}
    </Screen>
  );
}
