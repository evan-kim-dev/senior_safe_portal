"use client";

import { useEffect, useState } from "react";
import { loadViewMode, saveViewMode, type ViewMode } from "@/lib/client/view-mode";

const OPTIONS: { id: ViewMode; label: string }[] = [
  { id: "auto", label: "자동" },
  { id: "web", label: "컴퓨터" },
  { id: "app", label: "휴대폰" },
];

/** 푸터: 화면을 컴퓨터·휴대폰 레이아웃으로 바꾼다. */
export function ViewModeSwitch() {
  const [mode, setMode] = useState<ViewMode>("auto");

  useEffect(() => {
    setMode(loadViewMode());
  }, []);

  return (
    <div className="view-switch" role="group" aria-label="화면 보기">
      <span className="view-switch-label">화면</span>
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          className="view-switch-btn"
          aria-pressed={mode === option.id}
          onClick={() => setMode(saveViewMode(option.id))}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
