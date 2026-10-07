"use client";

import { useEffect, useState } from "react";
import {
  loadViewMode,
  naturalShell,
  resolveShell,
  saveViewMode,
  WEB_MQ,
  type ShellKind,
  type ViewMode,
} from "@/lib/client/view-mode";

/**
 * 기본은 자동.
 * 휴대폰 화면일 땐 「컴퓨터 화면」만, 컴퓨터 화면일 땐 「휴대폰 화면」만 보여 준다.
 * 강제로 바꾼 뒤에는 「자동으로」로 되돌린다.
 */
export function ViewModeSwitch() {
  const [mode, setMode] = useState<ViewMode>("auto");
  const [shell, setShell] = useState<ShellKind>("app");
  const [natural, setNatural] = useState<ShellKind>("app");

  useEffect(() => {
    function sync() {
      const nextMode = loadViewMode();
      setMode(nextMode);
      setNatural(naturalShell());
      setShell(resolveShell(nextMode));
    }
    sync();
    const mq = window.matchMedia(WEB_MQ);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const forcedAway = mode !== "auto" && mode !== natural;
  const label = forcedAway
    ? "자동으로"
    : shell === "app"
      ? "컴퓨터 화면"
      : "휴대폰 화면";

  function onToggle() {
    const next: ViewMode = forcedAway ? "auto" : shell === "app" ? "web" : "app";
    const saved = saveViewMode(next);
    setMode(saved);
    setNatural(naturalShell());
    setShell(resolveShell(saved));
  }

  return (
    <div className="view-switch" role="group" aria-label="화면 보기">
      <button
        type="button"
        className="view-switch-btn"
        aria-pressed={mode !== "auto"}
        onClick={onToggle}
      >
        {label}
      </button>
    </div>
  );
}
