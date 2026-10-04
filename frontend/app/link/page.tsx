"use client";

import { useState } from "react";
import { BigButton, Field, LineButton, Screen, Status } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { joinFamily, loadFamilyMe } from "@/lib/client/family-api";
import { setFamilyCode } from "@/lib/client/guardian";
import { isInviteCode, normalizeInviteCode } from "@/lib/domain/family";
import { MESSAGES } from "@/lib/domain/messages";

export default function LinkPage() {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [linkedFamilyId, setLinkedFamilyId] = useState("");

  async function submit() {
    if (busy) return;
    const normalized = normalizeInviteCode(code);
    if (!isInviteCode(normalized)) {
      setMessage(MESSAGES.familyInviteInvalid);
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await joinFamily(normalized);
      if (!result.ok) {
        setMessage(result.message || MESSAGES.familyJoinFailed);
        return;
      }
      setFamilyCode(result.familyId);
      setLinkedFamilyId(result.familyId);
      setMessage("부모님 계정으로 연결했어요. 이제 검사한 위험 영상이 자녀 대시보드에 보여요.");
      const me = await loadFamilyMe();
      if (me.ok) setFamilyCode(me.familyId);
    } catch {
      setMessage(MESSAGES.familyJoinFailed);
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <Screen
        title="부모 계정 연결"
        lead="자녀가 알려 준 초대 코드를 넣으려면 먼저 로그인해 주세요."
        narrow
        primary={<BigButton href="/login?next=/link">로그인하기</BigButton>}
      >
        <Status>부모(어르신) 계정으로 로그인한 뒤 6자리 코드를 입력하세요.</Status>
        <LineButton href="/care">자녀 대시보드로</LineButton>
      </Screen>
    );
  }

  return (
    <Screen
      title="부모 계정 연결"
      lead="자녀 대시보드에 나온 6자리 초대 코드를 입력하세요."
      narrow
      primary={<BigButton disabled={busy} onClick={() => void submit()}>연결하기</BigButton>}
    >
      <Field
        id="invite-code"
        label="초대 코드"
        inputMode="numeric"
        maxLength={6}
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
      />
      {message ? <Status>{message}</Status> : null}
      {linkedFamilyId ? <LineButton href="/">홈에서 링크 검사하기</LineButton> : null}
      <LineButton href="/care">자녀 대시보드로</LineButton>
    </Screen>
  );
}
