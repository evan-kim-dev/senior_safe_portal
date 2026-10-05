"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlowPage } from "@/components/FlowPage";
import { BigButton, Field, LineButton, Status } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { postJson } from "@/lib/client/api";
import { authHeaders } from "@/lib/client/auth-headers";
import { MESSAGES } from "@/lib/domain/messages";
import { accountProfileFields } from "@/lib/domain/user-profile";

type DeleteResponse = { ok: true } | { ok: false; message?: string };

export default function AccountPage() {
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login?next=/account");
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <FlowPage showBand={false} title="계정 관리" lead="로그인 상태를 확인하고 있어요." busy>
        <Status>잠시만 기다려 주세요.</Status>
      </FlowPage>
    );
  }

  const profile = accountProfileFields(user);
  const email = user.email || "—";

  async function deleteAccount() {
    if (busy || done) return;
    if (confirmText.trim() !== "탈퇴") {
      setMessage(MESSAGES.accountDeleteConfirm);
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await postJson<DeleteResponse>(
        "/api/account/delete",
        { confirm: "탈퇴" },
        { headers: await authHeaders() },
      );
      if (!result.ok) {
        setMessage(result.message || MESSAGES.accountDeleteFailed);
        return;
      }
      setDone(true);
      await logout();
      router.replace("/");
    } catch {
      setMessage(MESSAGES.accountDeleteFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <FlowPage
      showBand={false}
      title="계정 관리"
      lead="내 정보를 확인하고, 필요하면 로그아웃할 수 있어요."
      secondary={<LineButton href="/">홈으로</LineButton>}
      primary={<BigButton onClick={() => void logout()}>로그아웃</BigButton>}
    >
      <section className="group" aria-label="내 정보">
        <h2 className="group-title">내 정보</h2>
        <dl className="account-meta">
          <div>
            <dt>이름</dt>
            <dd>{profile.name}</dd>
          </div>
          <div>
            <dt>닉네임</dt>
            <dd>{profile.nickname}</dd>
          </div>
          <div>
            <dt>이메일</dt>
            <dd>{email}</dd>
          </div>
          <div>
            <dt>휴대폰</dt>
            <dd>{profile.phone}</dd>
          </div>
          <div>
            <dt>역할</dt>
            <dd>{profile.roleLabel}</dd>
          </div>
          <div>
            <dt>나이</dt>
            <dd>{profile.ageLabel}</dd>
          </div>
          <div>
            <dt>관심 영상</dt>
            <dd>{profile.interestsLabel}</dd>
          </div>
        </dl>
      </section>

      <section className="group" aria-label="계정 안내">
        <h2 className="group-title">비밀번호</h2>
        <Status>비밀번호를 바꾸려면 로그인 화면의 비밀번호 찾기를 이용해 주세요.</Status>
        <LineButton href="/login?mode=reset&next=/account">비밀번호 찾기</LineButton>
      </section>

      <section className="group" aria-label="가족 연동">
        <h2 className="group-title">가족 연동</h2>
        <Status>연결이 엇갈렸다면 대시보드·계정연결에서 초기화하거나 연결을 해제할 수 있어요.</Status>
        <LineButton href="/care">대시보드</LineButton>
        <LineButton href="/link">계정연결</LineButton>
      </section>

      <section className="group account-danger" aria-label="회원 탈퇴">
        <h2 className="group-title">회원 탈퇴</h2>
        <Status>
          탈퇴하면 로그인할 수 없고, 게시글·가족 연결 등 계정 정보가 삭제됩니다.
          관계 법령에 따라 보관이 필요한 내용은 해당 기간 동안 남을 수 있습니다.
        </Status>
        <Field
          id="account-delete-confirm"
          label="확인 문구"
          value={confirmText}
          placeholder="탈퇴"
          disabled={busy || done}
          onChange={(event) => setConfirmText(event.target.value)}
        />
        <p className="account-danger-hint">위 칸에 <strong>탈퇴</strong>라고 정확히 적어 주세요.</p>
        <BigButton
          tone="danger"
          disabled={busy || done || confirmText.trim() !== "탈퇴"}
          onClick={() => void deleteAccount()}
        >
          {busy ? "탈퇴 처리 중…" : "회원 탈퇴"}
        </BigButton>
        {message ? <Status>{message}</Status> : null}
      </section>

      <p className="auth-links">
        <Link href="/privacy">개인정보처리방침</Link>
        <span className="auth-link-sep" aria-hidden="true">·</span>
        <Link href="/terms">이용약관</Link>
      </p>
    </FlowPage>
  );
}
