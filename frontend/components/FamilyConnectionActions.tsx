"use client";

import { useState } from "react";
import { BigButton, Field, LineButton, Status } from "@/components/ui";
import { FAMILY_LEAVE_CONFIRM, FAMILY_RESET_CONFIRM } from "@/lib/domain/family";
import { MESSAGES } from "@/lib/domain/messages";

type Props = {
  role: "guardian" | "senior" | null;
  busy?: boolean;
  onLeave: (confirm: string) => Promise<void> | void;
  onReset?: (confirm: string) => Promise<void> | void;
};

/** 로그인된 본인만 연결 해제·초기화. 확인 문구 입력 후에만 실행. */
export function FamilyConnectionActions({ role, busy = false, onLeave, onReset }: Props) {
  const [mode, setMode] = useState<"idle" | "leave" | "reset">("idle");
  const [confirm, setConfirm] = useState("");
  const [hint, setHint] = useState("");

  if (!role) return null;

  async function run() {
    if (busy) return;
    if (mode === "leave") {
      if (confirm.trim() !== FAMILY_LEAVE_CONFIRM) {
        setHint(MESSAGES.familyLeaveConfirm);
        return;
      }
      setHint("");
      await onLeave(FAMILY_LEAVE_CONFIRM);
      setMode("idle");
      setConfirm("");
      return;
    }
    if (mode === "reset") {
      if (confirm.trim() !== FAMILY_RESET_CONFIRM) {
        setHint(MESSAGES.familyResetConfirm);
        return;
      }
      setHint("");
      await onReset?.(FAMILY_RESET_CONFIRM);
      setMode("idle");
      setConfirm("");
    }
  }

  return (
    <div className="group account-danger" aria-label="연결 관리">
      <h2 className="group-title">연결 관리</h2>
      <Status>
        {role === "guardian"
          ? "연결이 엇갈렸다면 초기화 후 새 코드로 다시 이으세요. 가족 나가기는 가족 전체를 끝냅니다."
          : "연결을 끊으면 자녀 대시보드에 더 이상 활동이 전달되지 않아요."}
      </Status>

      {mode === "idle" ? (
        <div className="care-actions-row">
          {role === "guardian" && onReset ? (
            <LineButton disabled={busy} onClick={() => { setMode("reset"); setConfirm(""); setHint(""); }}>
              연결 초기화
            </LineButton>
          ) : null}
          <LineButton disabled={busy} onClick={() => { setMode("leave"); setConfirm(""); setHint(""); }}>
            {role === "guardian" ? "가족 나가기" : "연결 해제"}
          </LineButton>
        </div>
      ) : (
        <>
          <Field
            id={`family-${mode}-confirm`}
            label="확인 문구"
            value={confirm}
            placeholder={mode === "leave" ? FAMILY_LEAVE_CONFIRM : FAMILY_RESET_CONFIRM}
            disabled={busy}
            onChange={(event) => setConfirm(event.target.value)}
          />
          <p className="account-danger-hint">
            위 칸에 <strong>{mode === "leave" ? FAMILY_LEAVE_CONFIRM : FAMILY_RESET_CONFIRM}</strong>라고 정확히 적어 주세요.
          </p>
          <div className="care-actions-row">
            <BigButton
              tone="danger"
              disabled={
                busy ||
                (mode === "leave" ? confirm.trim() !== FAMILY_LEAVE_CONFIRM : confirm.trim() !== FAMILY_RESET_CONFIRM)
              }
              onClick={() => void run()}
            >
              {busy ? "처리 중…" : mode === "leave" ? "연결 해제하기" : "초기화하기"}
            </BigButton>
            <LineButton
              disabled={busy}
              onClick={() => {
                setMode("idle");
                setConfirm("");
                setHint("");
              }}
            >
              취소
            </LineButton>
          </div>
          {hint ? <Status>{hint}</Status> : null}
        </>
      )}
    </div>
  );
}
