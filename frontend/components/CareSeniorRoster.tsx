"use client";

import { useState } from "react";
import type { FamilyActivityItem, FamilySenior, FamilySeniorStatus } from "@/lib/domain/family";
import { FAMILY_SENIOR_REMOVE_CONFIRM } from "@/lib/domain/family";
import { MAX_NAME_LENGTH, validateSeniorProfileEdit } from "@/lib/domain/auth-form";
import { formatWatchDuration } from "@/lib/domain/duration";
import { MESSAGES } from "@/lib/domain/messages";
import { seniorStatusLabel } from "@/lib/domain/senior-roster";
import { Field, LineButton, Status } from "@/components/ui";

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
  busy?: boolean;
  onFilterChange: (filter: FilterId) => void;
  onQueryChange: (query: string) => void;
  onOpen: (userId: string) => void;
  onUpdate: (input: {
    seniorUserId: string;
    displayName: string;
    birthYear: number | null;
  }) => Promise<boolean>;
  onRemove: (seniorUserId: string, confirm: string) => Promise<boolean>;
};

export function CareSeniorRoster({
  seniors,
  filter,
  query,
  busy = false,
  onFilterChange,
  onQueryChange,
  onOpen,
  onUpdate,
  onRemove,
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
      <p className="care-roster-hint">박스를 누르면 상세로, 편집·삭제는 카드 안에서 바로 할 수 있어요.</p>

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
              <CareSeniorCard
                senior={senior}
                busy={busy}
                onOpen={onOpen}
                onUpdate={onUpdate}
                onRemove={onRemove}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type CardProps = {
  senior: FamilySenior;
  busy: boolean;
  onOpen: (userId: string) => void;
  onUpdate: RosterProps["onUpdate"];
  onRemove: RosterProps["onRemove"];
};

function CareSeniorCard({ senior, busy, onOpen, onUpdate, onRemove }: CardProps) {
  const [mode, setMode] = useState<"idle" | "edit" | "remove">("idle");
  const [editName, setEditName] = useState(senior.displayName);
  const [removeConfirm, setRemoveConfirm] = useState("");
  const [localHint, setLocalHint] = useState("");

  function startEdit() {
    setMode("edit");
    setEditName(senior.displayName);
    setLocalHint("");
  }

  function startRemove() {
    setMode("remove");
    setRemoveConfirm("");
    setLocalHint("");
  }

  function cancelMode() {
    setMode("idle");
    setLocalHint("");
    setRemoveConfirm("");
  }

  async function saveEdit() {
    const checked = validateSeniorProfileEdit({ name: editName, birthYear: "" });
    if (!checked.ok) {
      setLocalHint(checked.message);
      return;
    }
    const ok = await onUpdate({
      seniorUserId: senior.userId,
      displayName: checked.value.name,
      birthYear: null,
    });
    if (ok) cancelMode();
  }

  async function confirmRemove() {
    if (removeConfirm.trim() !== FAMILY_SENIOR_REMOVE_CONFIRM) {
      setLocalHint(MESSAGES.familySeniorRemoveConfirm);
      return;
    }
    const ok = await onRemove(senior.userId, FAMILY_SENIOR_REMOVE_CONFIRM);
    if (ok) cancelMode();
  }

  return (
    <article className={`care-senior-card care-senior-card-${senior.status}`}>
      <button type="button" className="care-senior-card-main" onClick={() => onOpen(senior.userId)}>
        <span className="care-senior-card-top">
          <span className="care-senior-card-name">{senior.displayName}</span>
          <span className={`care-roster-badge care-roster-badge-${senior.status}`}>
            {seniorStatusLabel(senior.status)}
          </span>
        </span>

        <span className="care-senior-card-meta">{senior.ageLabel || "나이 미등록"}</span>

        <span
          className={`care-senior-card-status ${senior.dangerCount > 0 ? "is-alert" : "is-ok"}`}
          role="status"
        >
          {senior.dangerCount > 0 ? `경고 · 오늘 위험 ${senior.dangerCount}건` : "오늘 위험 없음"}
        </span>

        <span className="care-senior-card-stats">
          <span>시청 {formatWatchDuration(senior.watchSec)}</span>
          <span>기사 {senior.newsCount}건</span>
        </span>

        <span className="care-senior-card-last">
          {senior.lastActivityLabel ? `최근 ${senior.lastActivityLabel}` : "오늘 활동 없음"}
        </span>
        <span className="care-senior-card-cta">상세 보기</span>
      </button>

      {mode === "idle" ? (
        <div className="care-senior-card-actions">
          <button type="button" className="care-senior-card-action" disabled={busy} onClick={startEdit}>
            편집
          </button>
          <button
            type="button"
            className="care-senior-card-action is-danger"
            disabled={busy}
            onClick={startRemove}
          >
            삭제
          </button>
        </div>
      ) : null}

      {mode === "edit" ? (
        <div className="care-senior-card-panel">
          <Field
            id={`senior-edit-name-${senior.userId}`}
            label="이름"
            maxLength={MAX_NAME_LENGTH}
            value={editName}
            disabled={busy}
            onChange={(event) => setEditName(event.target.value)}
          />
          <p className="care-senior-card-hint">태어난 해·관심사는 어르신 계정에서만 바꿀 수 있어요.</p>
          <div className="care-senior-card-actions">
            <button type="button" className="care-senior-card-action is-primary" disabled={busy} onClick={() => void saveEdit()}>
              {busy ? "저장 중…" : "저장"}
            </button>
            <button type="button" className="care-senior-card-action" disabled={busy} onClick={cancelMode}>
              취소
            </button>
          </div>
          {localHint ? <p className="care-senior-card-hint">{localHint}</p> : null}
        </div>
      ) : null}

      {mode === "remove" ? (
        <div className="care-senior-card-panel">
          <p className="care-senior-card-hint">
            목록에서만 빼요. 계정은 남아요. 확인하려면 <strong>{FAMILY_SENIOR_REMOVE_CONFIRM}</strong>라고 적어 주세요.
          </p>
          <Field
            id={`senior-remove-${senior.userId}`}
            label="확인 문구"
            value={removeConfirm}
            placeholder={FAMILY_SENIOR_REMOVE_CONFIRM}
            disabled={busy}
            onChange={(event) => setRemoveConfirm(event.target.value)}
          />
          <div className="care-senior-card-actions">
            <button
              type="button"
              className="care-senior-card-action is-danger"
              disabled={busy || removeConfirm.trim() !== FAMILY_SENIOR_REMOVE_CONFIRM}
              onClick={() => void confirmRemove()}
            >
              {busy ? "처리 중…" : "삭제하기"}
            </button>
            <button type="button" className="care-senior-card-action" disabled={busy} onClick={cancelMode}>
              취소
            </button>
          </div>
          {localHint ? <p className="care-senior-card-hint">{localHint}</p> : null}
        </div>
      ) : null}
    </article>
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
        <p className="care-senior-detail-meta">{senior.ageLabel || "나이 미등록"}</p>
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
