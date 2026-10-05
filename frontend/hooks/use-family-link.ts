"use client";

import { useCallback, useEffect, useState } from "react";
import { joinFamily, leaveFamily, loadFamilyMe, resetFamily } from "@/lib/client/family-api";
import { clearFamilyCode, setFamilyCode } from "@/lib/client/guardian";
import { isInviteCode, normalizeInviteCode, type FamilyRole } from "@/lib/domain/family";
import { MESSAGES } from "@/lib/domain/messages";
import { useAuth } from "./use-auth";

/** 계정연결(/link) 화면: 멤버십 조회·가입·해제·초기화. */
export function useFamilyLink() {
  const { user, ready } = useAuth();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [linkedFamilyId, setLinkedFamilyId] = useState("");
  const [linkedRole, setLinkedRole] = useState<FamilyRole | null>(null);

  const reload = useCallback(async () => {
    if (!user) {
      setChecking(false);
      setLinkedFamilyId("");
      setLinkedRole(null);
      return;
    }
    setChecking(true);
    try {
      const me = await loadFamilyMe();
      if (me.ok) {
        setFamilyCode(me.familyId);
        setLinkedFamilyId(me.familyId);
        setLinkedRole(me.role);
      } else {
        setLinkedFamilyId("");
        setLinkedRole(null);
      }
    } finally {
      setChecking(false);
    }
  }, [user]);

  useEffect(() => {
    if (!ready) return;
    void reload();
  }, [ready, reload]);

  async function submitJoin() {
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
      setLinkedRole(result.role);
      setMessage("계정연결을 완료했어요. 이제 검사·시청 활동이 자녀 대시보드에 보여요.");
      await reload();
    } catch {
      setMessage(MESSAGES.familyJoinFailed);
    } finally {
      setBusy(false);
    }
  }

  async function disconnect(confirm: string) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await leaveFamily(confirm);
      if (!result.ok) {
        setMessage(result.message || MESSAGES.familyLeaveFailed);
        return;
      }
      clearFamilyCode();
      setLinkedFamilyId("");
      setLinkedRole(null);
      setMessage("가족 연결을 해제했어요. 다시 코드를 넣을 수 있어요.");
    } catch {
      setMessage(MESSAGES.familyLeaveFailed);
    } finally {
      setBusy(false);
    }
  }

  async function resetConnections(confirm: string) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await resetFamily(confirm);
      if (!result.ok) {
        setMessage(result.message || MESSAGES.familyResetFailed);
        return;
      }
      setMessage("연결을 초기화했어요. 대시보드에서 새 초대 코드를 확인해 주세요.");
      await reload();
    } catch {
      setMessage(MESSAGES.familyResetFailed);
    } finally {
      setBusy(false);
    }
  }

  return {
    user,
    ready,
    code,
    setCode,
    message,
    busy,
    checking,
    linkedFamilyId,
    linkedRole,
    submitJoin,
    disconnect,
    resetConnections,
  };
}
