"use client";

import { Icon } from "@/components/icons";
import { formatFeedUpdatedAt } from "@/lib/domain/feed-meta";

type Props = {
  updatedAt: string | null;
  refreshing?: boolean;
  onRefresh: () => void;
  label?: string;
};

/** 제목 옆 회색·희미한 저장 시각 + 수동 새로고침. */
export function FeedRefreshBar({
  updatedAt,
  refreshing = false,
  onRefresh,
  label = "저장 시각",
}: Props) {
  return (
    <div className="feed-refresh-bar" aria-live="polite">
      <p className="feed-refresh-time">
        <span className="sr-only">{label}</span>
        {formatFeedUpdatedAt(updatedAt)}
        {refreshing ? <span className="feed-refresh-busy"> · 불러오는 중</span> : null}
      </p>
      <button
        type="button"
        className={`feed-refresh-manual${refreshing ? " is-busy" : ""}`}
        disabled={refreshing}
        onClick={onRefresh}
        aria-label={refreshing ? "새로고침 중" : `${label} 다시 불러오기`}
      >
        <Icon name="refresh" className="feed-refresh-icon" />
      </button>
    </div>
  );
}
