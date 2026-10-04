"use client";

import { useEffect, useState } from "react";
import { loadChannelChoices, loadDangerCount } from "@/lib/client/feeds";
import { ensureFamilyCode, loadGuardian, saveCare } from "@/lib/client/guardian";
import { buildSetupLink } from "@/lib/domain/setup";
import type { TextSize } from "@/lib/domain/types";
import { useAliveRef } from "./use-alive";

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
  const [name, setNameState] = useState("");
  const [phone, setPhoneState] = useState("");
  const [textSize, setTextSizeState] = useState<TextSize>("normal");
  const [channels, setChannels] = useState<string[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [dangerCount, setDangerCount] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [qr, setQr] = useState("");
  const aliveRef = useAliveRef();

  useEffect(() => {
    const familyCode = ensureFamilyCode();
    const stored = loadGuardian();
    setNameState(stored.name);
    setPhoneState(stored.phone);
    setTextSizeState(stored.textSize);
    setChannels(stored.channels);

    let active = true;
    void loadDangerCount(familyCode).then((count) => {
      if (active) setDangerCount(count);
    });
    void loadChannelChoices().then((names) => {
      if (active) setChoices(names);
    });
    return () => {
      active = false;
    };
  }, []);

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

  async function save() {
    const stored = saveCare({ name, phone, textSize, channels });
    const link = buildSetupLink(window.location.origin, {
      name: stored.name,
      phone: stored.phone,
      textSize: stored.textSize,
      channels: stored.channels,
      familyCode: stored.familyCode,
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
    name,
    phone,
    textSize,
    channels,
    choices,
    dangerCount,
    saved,
    qr,
    setName,
    setPhone,
    setTextSize,
    toggleChannel,
    save,
  };
}
