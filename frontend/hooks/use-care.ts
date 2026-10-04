"use client";

import { useEffect, useState } from "react";
import { loadChannelChoices } from "@/lib/client/feeds";
import { createFamily, loadFamilyMe } from "@/lib/client/family-api";
import { ensureFamilyCode, loadGuardian, saveCare, setFamilyCode } from "@/lib/client/guardian";
import type { FamilyActivityItem, FamilyRole } from "@/lib/domain/family";
import { MESSAGES } from "@/lib/domain/messages";
import { buildSetupLink } from "@/lib/domain/setup";
import type { TextSize } from "@/lib/domain/types";
import { useAliveRef } from "./use-alive";
import { useAuth } from "./use-auth";

const QR_WIDTH = 280;

function cssColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
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
  const [todayItems, setTodayItems] = useState<FamilyActivityItem[]>([]);
  const [inviteCode, setInviteCode] = useState("");
  const [role, setRole] = useState<FamilyRole | null>(null);
  const [familyId, setFamilyId] = useState("");
  const [familyLoading, setFamilyLoading] = useState(true);
  const [familyMessage, setFamilyMessage] = useState("");
  const [familyBusy, setFamilyBusy] = useState(false);
  const [needsFamily, setNeedsFamily] = useState(false);
  const [saved, setSaved] = useState(false);
  const [qr, setQr] = useState("");
  const aliveRef = useAliveRef();

  useEffect(() => {
    const stored = loadGuardian();
    setNameState(stored.name);
    setPhoneState(stored.phone);
    setTextSizeState(stored.textSize);
    setChannels(stored.channels);
    void loadChannelChoices().then((names) => {
      if (aliveRef.current) setChoices(names);
    });
  }, [aliveRef]);

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
      setDangerCount(null);
      setTodayItems([]);
      return;
    }

    let active = true;
    setFamilyLoading(true);
    setFamilyMessage("");
    void loadFamilyMe().then((data) => {
      if (!active) return;
      setFamilyLoading(false);
      if (!data.ok) {
        setNeedsFamily(data.needsFamily === true);
        setRole(null);
        setInviteCode("");
        setFamilyId("");
        setDangerCount(null);
        setTodayItems([]);
        if (!data.needsFamily) setFamilyMessage(data.message || MESSAGES.familyLoadFailed);
        return;
      }
      setNeedsFamily(false);
      setFamilyId(data.familyId);
      setRole(data.role);
      setInviteCode(data.inviteCode);
      setDangerCount(data.todayCount);
      setTodayItems(data.todayItems);
      setFamilyCode(data.familyId);
    });
    return () => {
      active = false;
    };
  }, [user, ready]);

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
      const me = await loadFamilyMe();
      if (!aliveRef.current) return;
      if (me.ok) {
        setDangerCount(me.todayCount);
        setTodayItems(me.todayItems);
        setInviteCode(me.inviteCode || data.inviteCode);
      }
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

  async function save() {
    ensureFamilyCode();
    const stored = saveCare({ name, phone, textSize, channels });
    const code = familyId || stored.familyCode;
    const link = buildSetupLink(window.location.origin, {
      name: stored.name,
      phone: stored.phone,
      textSize: stored.textSize,
      channels: stored.channels,
      familyCode: code,
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
    todayItems,
    inviteCode,
    role,
    familyId,
    familyLoading,
    familyMessage,
    familyBusy,
    needsFamily,
    saved,
    qr,
    setName,
    setPhone,
    setTextSize,
    toggleChannel,
    save,
    createFamilyGroup,
    refreshInvite: () => createFamilyGroup(true),
    copyInvite,
  };
}
