"use client";

import type { FamilyActivityItem, FamilySenior, FamilySeniorStatus } from "@/lib/domain/family";
import { formatWatchDuration } from "@/lib/domain/duration";
import { seniorStatusLabel } from "@/lib/domain/senior-roster";
import { LineButton, Status } from "@/components/ui";

type FilterId = "all" | FamilySeniorStatus;

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "attention", label: "주의" },
  { id: "active", label: "활동" },
  { id: "quiet", label: "없음" },
];

type RosterProps = {
  seniors: FamilySenior[];
  filter: FilterId;
  query: string;
  onFilterChange: (filter: FilterId) => void;
  onQueryChange: (query: string) => void;
  onOpen: (userId: string) => void;
};

export function CareSeniorRoster({
  seniors,
  filter,
  query,
  onFilterChange,
  onQueryChange,
  onOpen,
}: RosterProps) {
  const normalized = query.trim().toLowerCase();
  const visible = seniors.filter((senior) => {
    if (filter !== "all" && senior.status !== filter) return false;
    if (!normalized) return true;
    return senior.displayName.toLowerCase().includes(normalized);
  });

  return (
    <div className="group care-roster">
      <div className="care-section-head">
        <h2 className="group-title">어르신 목록</h2>
        <p className="care-roster-count">{seniors.length}명</p>
      </div>
      <p className="care-roster-hint">박스를 누르면 그 분의 상세 활동으로 들어갑니다.</p>

      <div className="care-roster-tools">
        <label className="care-roster-search">
          <span className="sr-only">이름 찾기</span>
          <input
            type="search"
            value={query}
            placeholder="이름 찾기"
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>
        <div className="care-roster-filters" role="tablist" aria-label="상태 필터">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              className={`care-roster-filter ${filter === item.id ? "is-active" : ""}`}
              onClick={() => onFilterChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="care-roster-empty">조건에 맞는 어르신이 없어요.</p>
      ) : (
        <ul className="care-senior-grid">
          {visible.map((senior) => (
            <li key={senior.userId}>
              <button
                type="button"
                className={`care-senior-card care-senior-card-${senior.status}`}
                onClick={() => onOpen(senior.userId)}
              >
                <span className="care-senior-card-top">
                  <span className="care-senior-card-name">{senior.displayName}</span>
                  <span className={`care-roster-badge care-roster-badge-${senior.status}`}>
                    {seniorStatusLabel(senior.status)}
                  </span>
                </span>

                {senior.ageLabel ? <span className="care-senior-card-meta">{senior.ageLabel}</span> : null}

                {senior.dangerCount > 0 ? (
                  <span className="care-senior-card-alert" role="status">
                    경고 · 오늘 위험 {senior.dangerCount}건
                  </span>
                ) : (
                  <span className="care-senior-card-ok">오늘 위험 없음</span>
                )}

                <span className="care-senior-card-stats">
                  <span>시청 {formatWatchDuration(senior.watchSec)}</span>
                  <span>기사 {senior.newsCount}건</span>
                </span>

                <span className="care-senior-card-last">
                  {senior.lastActivityLabel ? `최근 ${senior.lastActivityLabel}` : "오늘 활동 없음"}
                </span>
                <span className="care-senior-card-cta">상세 보기</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type DetailProps = {
  senior: FamilySenior;
  items: FamilyActivityItem[];
  onBack: () => void;
  onRefresh: () => void;
};

export function CareSeniorDetail({ senior, items, onBack, onRefresh }: DetailProps) {
  return (
    <div className="group care-senior-detail">
      <div className="care-section-head">
        <LineButton onClick={onBack}>← 목록으로</LineButton>
        <LineButton onClick={onRefresh}>새로고침</LineButton>
      </div>

      <div className={`care-senior-detail-hero care-senior-detail-hero-${senior.status}`}>
        <div className="care-senior-detail-head">
          <h2 className="care-senior-detail-name">{senior.displayName}</h2>
          <span className={`care-roster-badge care-roster-badge-${senior.status}`}>
            {seniorStatusLabel(senior.status)}
          </span>
        </div>
        {senior.ageLabel ? <p className="care-senior-detail-meta">{senior.ageLabel}</p> : null}
        {senior.dangerCount > 0 ? (
          <p className="care-senior-detail-alert" role="status">
            경고: 오늘 위험 감지 {senior.dangerCount}건이 있어요. 아래 활동을 확인해 주세요.
          </p>
        ) : (
          <p className="care-senior-detail-safe">오늘은 위험 감지가 없어요.</p>
        )}
      </div>

      <div className="care-stats">
        <p className="care-stat">
          <span className="care-stat-label">위험 감지</span>
          <span className="care-stat-value">{senior.dangerCount}건</span>
        </p>
        <p className="care-stat">
          <span className="care-stat-label">영상 시청</span>
          <span className="care-stat-value">{formatWatchDuration(senior.watchSec)}</span>
        </p>
        <p className="care-stat">
          <span className="care-stat-label">기사 열람</span>
          <span className="care-stat-value">{senior.newsCount}건</span>
        </p>
      </div>

      <h3 className="group-title">오늘 활동</h3>
      {items.length ? (
        <ul className="list activity-list">
          {items.map((item) => (
            <li
              key={item.id}
              className={`activity-item ${item.kind.startsWith("danger") ? "activity-item-danger" : ""}`}
            >
              <span className="activity-label">{item.label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <Status>{senior.displayName} 님의 오늘 기록은 아직 없어요.</Status>
      )}
    </div>
  );
}
