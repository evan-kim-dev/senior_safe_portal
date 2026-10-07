"use client";

import { formatFeedUpdatedAt } from "@/lib/domain/feed-meta";

type Props = {
  updatedAt: string | null;
  refreshing?: boolean;
  onRefresh: () => void;
  label?: string;
};

/** 피드 마지막 갱신 시각 + 수동 새로고침. */
export function FeedRefreshBar({
  updatedAt,
  refreshing = false,
  onRefresh,
  label = "저장 시각",
}: Props) {
  return (
    <div className="feed-refresh-bar" aria-live="polite">
      <p className="feed-refresh-time">
        {label} <strong>{formatFeedUpdatedAt(updatedAt)}</strong>
        {refreshing ? <span className="feed-refresh-busy"> · 불러오는 중</span> : null}
      </p>
      <button
        type="button"
        className="feed-refresh-manual"
        disabled={refreshing}
        onClick={onRefresh}
      >
        {refreshing ? "새로고침 중…" : "다시 불러오기"}
      </button>
    </div>
  );
}
