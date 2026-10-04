"use client";

import { useEffect, useState } from "react";
import { applySetup } from "@/lib/guardian";
import { BigButton, Screen } from "@/components/ui";
import type { TextSize } from "@/lib/types";

function isTextSize(value: unknown): value is TextSize {
  return value === "normal" || value === "large" || value === "xlarge";
}

export default function SetupPage() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;

    try {
      const parsed = JSON.parse(decodeURIComponent(hash)) as {
        name?: unknown;
        phone?: unknown;
        textSize?: unknown;
        channels?: unknown;
        familyCode?: unknown;
      };
      applySetup({
        name: typeof parsed.name === "string" ? parsed.name : "",
        phone: typeof parsed.phone === "string" ? parsed.phone : "",
        textSize: isTextSize(parsed.textSize) ? parsed.textSize : "normal",
        channels: Array.isArray(parsed.channels) ? parsed.channels.filter((item) => typeof item === "string") : [],
        familyCode: typeof parsed.familyCode === "string" ? parsed.familyCode : "",
      });
      setDone(true);
    } catch {
      setDone(false);
    }

    window.history.replaceState(null, "", "/setup");
  }, []);

  return (
    <Screen
      title={done ? "이 폰에 넣었습니다" : "설정을 읽지 못했습니다"}
      primary={<BigButton href="/">홈으로</BigButton>}
    />
  );
}
