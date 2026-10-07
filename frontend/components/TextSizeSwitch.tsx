"use client";

import { useEffect, useState } from "react";
import { loadGuardian, saveTextSize } from "@/lib/client/guardian";
import type { TextSize } from "@/lib/domain/types";

const OPTIONS: { id: TextSize; label: string; short: string }[] = [
  { id: "normal", label: "글자 보통", short: "보통" },
  { id: "large", label: "글자 크게", short: "크게" },
  { id: "xlarge", label: "글자 더 크게", short: "최대" },
];

export function TextSizeSwitch() {
  const [size, setSize] = useState<TextSize>("normal");

  useEffect(() => {
    setSize(loadGuardian().textSize);
  }, []);

  return (
    <div className="text-switch" role="group" aria-label="글자 크기">
      <span className="text-switch-label">글자 크게</span>
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          className="text-switch-btn"
          aria-pressed={size === option.id}
          aria-label={option.label}
          title={option.label}
          onClick={() => setSize(saveTextSize(option.id).textSize)}
        >
          {option.short}
        </button>
      ))}
    </div>
  );
}
