"use client";

import { useState } from "react";

type Props = {
  lastRefreshedAt: string | null;
  autoRefresh: boolean;
  refreshing?: boolean;
  busy?: boolean;
  onAutoRefreshChange: (enabled: boolean) => void;
  onRefresh: () => void;
};

function formatRefreshedAt(iso: string | null): string {
  if (!iso) return "아직 없음";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "아직 없음";
  return date.toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** 대시보드 마지막 새로고침 시각·자동/수동 갱신. */
export function CareRefreshBar({
  lastRefreshedAt,
  autoRefresh,
  refreshing = false,
  busy = false,
  onAutoRefreshChange,
  onRefresh,
}: Props) {
  return (
    <div className="care-refresh-bar" aria-live="polite">
      <p className="care-refresh-time">
        마지막 새로고침 <strong>{formatRefreshedAt(lastRefreshedAt)}</strong>
        {refreshing ? <span className="care-refresh-busy"> · 갱신 중</span> : null}
      </p>
      <div className="care-refresh-controls">
        <label className="care-refresh-toggle">
          <input
            type="checkbox"
            checked={autoRefresh}
            disabled={busy}
            onChange={(event) => onAutoRefreshChange(event.target.checked)}
          />
          <span>자동 새로고침</span>
        </label>
        <button
          type="button"
          className="care-refresh-manual"
          disabled={busy || refreshing}
          onClick={onRefresh}
        >
          {refreshing ? "새로고침 중…" : "지금 새로고침"}
        </button>
      </div>
    </div>
  );
}
