"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ensureFamilyCode, loadGuardian, saveCare } from "@/lib/guardian";
import type { TextSize } from "@/lib/types";
import { useCareReads } from "@/lib/use-cache";
import { BigButton, Count, Field, Screen, Status } from "@/components/ui";

const SIZES: { id: TextSize; label: string }[] = [
  { id: "normal", label: "보통" },
  { id: "large", label: "크게" },
  { id: "xlarge", label: "더 크게" },
];

export default function CarePage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [textSize, setTextSize] = useState<TextSize>("normal");
  const [channels, setChannels] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [qr, setQr] = useState("");
  const { choices, dangerCount } = useCareReads();

  useEffect(() => {
    ensureFamilyCode();
    const stored = loadGuardian();
    setName(stored.name);
    setPhone(stored.phone);
    setTextSize(stored.textSize);
    setChannels(stored.channels);
    return () => setQr("");
  }, []);

  function toggleChannel(channel: string) {
    setSaved(false);
    setQr("");
    setChannels((current) =>
      current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel],
    );
  }

  async function onSave() {
    saveCare({ name, phone, textSize, channels });
    const stored = loadGuardian();
    const payload = {
      name: stored.name,
      phone: stored.phone,
      textSize: stored.textSize,
      channels: stored.channels,
      familyCode: stored.familyCode,
    };
    const css = getComputedStyle(document.documentElement);
    const link = `${window.location.origin}/setup#${encodeURIComponent(JSON.stringify(payload))}`;
    const image = await QRCode.toDataURL(link, {
      margin: 1,
      width: 280,
      color: {
        dark: css.getPropertyValue("--ink").trim(),
        light: css.getPropertyValue("--bg").trim(),
      },
    });
    setQr(image);
    setSaved(true);
  }

  return (
    <Screen title="자녀 대시보드" primary={<BigButton type="submit" form="care-form">저장</BigButton>}>
      <Count value={dangerCount} />
      <form
        id="care-form"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave();
        }}
      >
        <Field id="care-name" label="받을 사람 이름" value={name} onChange={(event) => { setSaved(false); setQr(""); setName(event.target.value); }} />
        <Field id="care-phone" label="받을 전화번호" inputMode="tel" value={phone} onChange={(event) => { setSaved(false); setQr(""); setPhone(event.target.value); }} />
        <fieldset>
          <legend>글자 크기</legend>
          {SIZES.map((item) => (
            <label key={item.id}>
              <input
                type="radio"
                name="text-size"
                checked={textSize === item.id}
                onChange={() => { setSaved(false); setQr(""); setTextSize(item.id); }}
              />
              {item.label}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>영상 채널</legend>
          {choices.length === 0 ? <p>저장된 영상이 없어 채널을 고를 수 없습니다.</p> : null}
          {choices.map((channel) => (
            <label key={channel}>
              <input type="checkbox" checked={channels.includes(channel)} onChange={() => toggleChannel(channel)} />
              {channel}
            </label>
          ))}
        </fieldset>
      </form>
      {saved ? <Status>저장했어요</Status> : null}
      {qr ? <img className="qr" src={qr} alt="어르신 폰에 넣을 설정" /> : null}
    </Screen>
  );
}
