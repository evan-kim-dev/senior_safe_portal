"use client";

import { useCallback, useEffect, useState } from "react";
import { loadChannelChoices } from "@/lib/client/feeds";
import {
  createFamily,
  leaveFamily,
  loadFamilyMe,
  removeFamilySenior,
  resetFamily,
  updateFamilySenior,
} from "@/lib/client/family-api";
import { clearFamilyCode, loadGuardian, saveCare, setFamilyCode } from "@/lib/client/guardian";
import type { FamilyActivityItem, FamilyRole, FamilySenior } from "@/lib/domain/family";
import { FAMILY_SENIOR_REMOVE_CONFIRM } from "@/lib/domain/family";
import { MESSAGES } from "@/lib/domain/messages";
import { buildSetupLink } from "@/lib/domain/setup";
import type { TextSize } from "@/lib/domain/types";
import { useAliveRef } from "./use-alive";
import { useAuth } from "./use-auth";

const QR_WIDTH = 280;
const POLL_MS = 5 * 60_000;
const AUTO_REFRESH_KEY = "care-auto-refresh";

function cssColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function readAutoRefresh(): boolean {
  try {
    const raw = window.localStorage.getItem(AUTO_REFRESH_KEY);
    if (raw == null) return true;
    return raw !== "0";
  } catch {
    return true;
  }
}

/** qrcode 는 저장을 누를 때만 받아 /care 첫 화면을 가볍게 한다. */
async function renderQr(link: string): Promise<string> {
  const { default: QRCode } = await import("qrcode");
  return QRCode.toDataURL(link, {
    margin: 1,
    width: QR_WIDTH,
    color: { dark: cssColor("--ink"), light: cssColor("--bg") },
  });
}

export function useCare() {
  const { user, ready } = useAuth();
  const [name, setNameState] = useState("");
  const [phone, setPhoneState] = useState("");
  const [textSize, setTextSizeState] = useState<TextSize>("normal");
  const [channels, setChannels] = useState<string[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [dangerCount, setDangerCount] = useState<number | null>(null);
  const [newsCount, setNewsCount] = useState(0);
  const [watchSec, setWatchSec] = useState(0);
  const [todayItems, setTodayItems] = useState<FamilyActivityItem[]>([]);
  const [inviteCode, setInviteCode] = useState("");
  const [role, setRole] = useState<FamilyRole | null>(null);
  const [familyId, setFamilyId] = useState("");
  const [seniorCount, setSeniorCount] = useState(0);
  const [seniors, setSeniors] = useState<FamilySenior[]>([]);
  const [connected, setConnected] = useState(false);
  const [familyLoading, setFamilyLoading] = useState(true);
  const [familyMessage, setFamilyMessage] = useState("");
  const [familyBusy, setFamilyBusy] = useState(false);
  const [needsFamily, setNeedsFamily] = useState(false);
  const [saved, setSaved] = useState(false);
  const [qr, setQr] = useState("");
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [autoRefresh, setAutoRefreshState] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const aliveRef = useAliveRef();

  useEffect(() => {
    const stored = loadGuardian();
    setNameState(stored.name);
    setPhoneState(stored.phone);
    setTextSizeState(stored.textSize);
    setChannels(stored.channels);
    setAutoRefreshState(readAutoRefresh());
    void loadChannelChoices().then((names) => {
      if (aliveRef.current) setChoices(names);
    });
  }, [aliveRef]);

  const applyMe = useCallback(
    (data: Awaited<ReturnType<typeof loadFamilyMe>>) => {
      if (!data.ok) {
        setNeedsFamily(data.needsFamily === true);
        setRole(null);
        setInviteCode("");
        setFamilyId("");
        setSeniorCount(0);
        setSeniors([]);
        setConnected(false);
        setDangerCount(null);
        setNewsCount(0);
        setWatchSec(0);
        setTodayItems([]);
        if (!data.needsFamily) setFamilyMessage(data.message || MESSAGES.familyLoadFailed);
        return;
      }
      setNeedsFamily(false);
      setFamilyId(data.familyId);
      setRole(data.role);
      setInviteCode(data.inviteCode);
      setSeniorCount(data.seniorCount ?? 0);
      setSeniors(data.seniors ?? []);
      setConnected(data.connected === true || (data.seniorCount ?? 0) > 0);
      setDangerCount(data.todayCount);
      setNewsCount(data.todayNewsCount ?? 0);
      setWatchSec(data.todayWatchSec ?? 0);
      setTodayItems(data.todayItems);
      setFamilyCode(data.familyId);
      setLastRefreshedAt(new Date().toISOString());
    },
    [],
  );

  const refreshMe = useCallback(
    async (opts?: { quiet?: boolean }) => {
      if (!user) return;
      if (!opts?.quiet) {
        setFamilyLoading(true);
        setFamilyMessage("");
      } else {
        setRefreshing(true);
      }
      try {
        const data = await loadFamilyMe();
        if (!aliveRef.current) return;
        applyMe(data);
      } catch {
        if (aliveRef.current && !opts?.quiet) setFamilyMessage(MESSAGES.familyLoadFailed);
      } finally {
        if (!aliveRef.current) return;
        if (!opts?.quiet) setFamilyLoading(false);
        setRefreshing(false);
      }
    },
    [aliveRef, applyMe, user],
  );

  useEffect(() => {
    if (!ready) {
      setFamilyLoading(true);
      return;
    }
    if (!user) {
      setFamilyLoading(false);
      setNeedsFamily(false);
      setRole(null);
      setInviteCode("");
      setFamilyId("");
      setSeniorCount(0);
      setSeniors([]);
      setConnected(false);
      setDangerCount(null);
      setNewsCount(0);
      setWatchSec(0);
      setTodayItems([]);
      setLastRefreshedAt(null);
      return;
    }

    let active = true;
    setFamilyLoading(true);
    setFamilyMessage("");
    void loadFamilyMe().then((data) => {
      if (!active) return;
      setFamilyLoading(false);
      applyMe(data);
    });
    return () => {
      active = false;
    };
  }, [user, ready, applyMe]);

  // 연결 후 보호자 대시보드는 자동 새로고침이 켜져 있을 때만 주기 갱신한다.
  useEffect(() => {
    if (!user || role !== "guardian" || !connected || !autoRefresh) return;
    const timer = window.setInterval(() => {
      void refreshMe({ quiet: true });
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [user, role, connected, autoRefresh, refreshMe]);

  function setAutoRefresh(enabled: boolean) {
    setAutoRefreshState(enabled);
    try {
      window.localStorage.setItem(AUTO_REFRESH_KEY, enabled ? "1" : "0");
    } catch {
      // ignore
    }
  }

  function edited() {
    setSaved(false);
    setQr("");
  }

  function setName(value: string) {
    edited();
    setNameState(value);
  }

  function setPhone(value: string) {
    edited();
    setPhoneState(value);
  }

  function setTextSize(value: TextSize) {
    edited();
    setTextSizeState(value);
  }

  function toggleChannel(channel: string) {
    edited();
    setChannels((current) => (current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel]));
  }

  async function createFamilyGroup(refresh = false) {
    if (familyBusy) return;
    setFamilyBusy(true);
    setFamilyMessage("");
    try {
      const data = await createFamily({ refresh });
      if (!aliveRef.current) return;
      if (!data.ok || !("familyId" in data)) {
        setFamilyMessage(("message" in data && data.message) || MESSAGES.familyCreateFailed);
        return;
      }
      setNeedsFamily(false);
      setFamilyId(data.familyId);
      setRole("guardian");
      setInviteCode(data.inviteCode);
      setFamilyCode(data.familyId);
      await refreshMe({ quiet: true });
      if (refresh) setFamilyMessage("새 초대 코드를 만들었어요.");
    } catch {
      if (aliveRef.current) setFamilyMessage(MESSAGES.familyCreateFailed);
    } finally {
      if (aliveRef.current) setFamilyBusy(false);
    }
  }

  async function copyInvite() {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setFamilyMessage("초대 코드를 복사했어요.");
    } catch {
      setFamilyMessage("복사를 못 했어요. 코드를 손으로 적어 주세요.");
    }
  }

  async function leaveConnection(confirm: string) {
    if (familyBusy) return;
    setFamilyBusy(true);
    setFamilyMessage("");
    try {
      const result = await leaveFamily(confirm);
      if (!aliveRef.current) return;
      if (!result.ok) {
        setFamilyMessage(result.message || MESSAGES.familyLeaveFailed);
        return;
      }
      clearFamilyCode();
      setNeedsFamily(true);
      setRole(null);
      setInviteCode("");
      setFamilyId("");
      setSeniorCount(0);
      setSeniors([]);
      setConnected(false);
      setDangerCount(null);
      setNewsCount(0);
      setWatchSec(0);
      setTodayItems([]);
      setFamilyMessage("가족 연결을 해제했어요. 다시 만들거나 코드를 넣을 수 있어요.");
    } catch {
      if (aliveRef.current) setFamilyMessage(MESSAGES.familyLeaveFailed);
    } finally {
      if (aliveRef.current) setFamilyBusy(false);
    }
  }

  async function resetConnection(confirm: string) {
    if (familyBusy) return;
    setFamilyBusy(true);
    setFamilyMessage("");
    try {
      const result = await resetFamily(confirm);
      if (!aliveRef.current) return;
      if (!result.ok) {
        setFamilyMessage(result.message || MESSAGES.familyResetFailed);
        return;
      }
      if (result.action === "reset" && result.inviteCode) {
        setInviteCode(result.inviteCode);
      }
      setSeniorCount(0);
      setSeniors([]);
      setConnected(false);
      setDangerCount(0);
      setNewsCount(0);
      setWatchSec(0);
      setTodayItems([]);
      setFamilyMessage("연결을 초기화했어요. 새 초대 코드로 다시 연결해 주세요.");
      await refreshMe({ quiet: true });
    } catch {
      if (aliveRef.current) setFamilyMessage(MESSAGES.familyResetFailed);
    } finally {
      if (aliveRef.current) setFamilyBusy(false);
    }
  }

  async function updateSenior(input: {
    seniorUserId: string;
    displayName: string;
    birthYear: number | null;
  }): Promise<boolean> {
    if (familyBusy) return false;
    setFamilyBusy(true);
    setFamilyMessage("");
    try {
      const result = await updateFamilySenior(input);
      if (!aliveRef.current) return false;
      if (!result.ok) {
        setFamilyMessage(result.message || MESSAGES.familySeniorUpdateFailed);
        return false;
      }
      await refreshMe({ quiet: true });
      setFamilyMessage("어르신 정보를 저장했어요.");
      return true;
    } catch {
      if (aliveRef.current) setFamilyMessage(MESSAGES.familySeniorUpdateFailed);
      return false;
    } finally {
      if (aliveRef.current) setFamilyBusy(false);
    }
  }

  async function removeSenior(seniorUserId: string, confirm: string): Promise<boolean> {
    if (familyBusy) return false;
    if (confirm.trim() !== FAMILY_SENIOR_REMOVE_CONFIRM) {
      setFamilyMessage(MESSAGES.familySeniorRemoveConfirm);
      return false;
    }
    setFamilyBusy(true);
    setFamilyMessage("");
    try {
      const result = await removeFamilySenior(seniorUserId, FAMILY_SENIOR_REMOVE_CONFIRM);
      if (!aliveRef.current) return false;
      if (!result.ok) {
        setFamilyMessage(result.message || MESSAGES.familySeniorRemoveFailed);
        return false;
      }
      await refreshMe({ quiet: true });
      setFamilyMessage("어르신을 목록에서 빼 두었어요.");
      return true;
    } catch {
      if (aliveRef.current) setFamilyMessage(MESSAGES.familySeniorRemoveFailed);
      return false;
    } finally {
      if (aliveRef.current) setFamilyBusy(false);
    }
  }

  async function save() {
    if (!familyId) {
      setFamilyMessage("가족을 먼저 만든 뒤 설정 QR을 저장해 주세요.");
      return;
    }
    const stored = saveCare({ name, phone, textSize, channels });
    const link = buildSetupLink(window.location.origin, {
      name: stored.name,
      phone: stored.phone,
      textSize: stored.textSize,
      channels: stored.channels,
      familyCode: familyId,
    });

    let image = "";
    try {
      image = await renderQr(link);
    } catch {
      image = "";
    }
    if (!aliveRef.current) return;
    setQr(image);
    setSaved(true);
  }

  return {
    user,
    ready,
    name,
    phone,
    textSize,
    channels,
    choices,
    dangerCount,
    newsCount,
    watchSec,
    todayItems,
    inviteCode,
    role,
    familyId,
    seniorCount,
    seniors,
    connected,
    familyLoading,
    familyMessage,
    familyBusy,
    needsFamily,
    saved,
    qr,
    lastRefreshedAt,
    autoRefresh,
    refreshing,
    setName,
    setPhone,
    setTextSize,
    toggleChannel,
    save,
    createFamilyGroup,
    refreshInvite: () => createFamilyGroup(true),
    copyInvite,
    leaveConnection,
    resetConnection,
    refreshMe,
    setAutoRefresh,
    updateSenior,
    removeSenior,
  };
}
