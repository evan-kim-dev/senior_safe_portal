"use client";

import type { FamilySenior } from "@/lib/domain/family";
import { formatWatchDuration } from "@/lib/domain/duration";

type Props = {
  seniors: FamilySenior[];
  onOpen: (userId: string) => void;
};

function barWidth(value: number, max: number): string {
  if (value <= 0) return "0%";
  return `${Math.max(8, Math.round((value / max) * 100))}%`;
}

/** 합계 카드 대신 어르신별 위험·시청·기사를 막대로 한눈에 비교한다. */
export function CareSeniorChart({ seniors, onOpen }: Props) {
  if (!seniors.length) return null;

  const maxDanger = Math.max(1, ...seniors.map((item) => item.dangerCount));
  const maxWatch = Math.max(1, ...seniors.map((item) => item.watchSec));
  const maxNews = Math.max(1, ...seniors.map((item) => item.newsCount));
  const attention = seniors.filter((item) => item.dangerCount > 0).length;

  return (
    <div className="group care-chart">
      <div className="care-section-head">
        <h2 className="group-title">어르신별 오늘 수치</h2>
        <p className="care-chart-legend" aria-hidden="true">
          <span className="care-chart-swatch care-chart-swatch-danger" /> 위험
          <span className="care-chart-swatch care-chart-swatch-watch" /> 시청
          <span className="care-chart-swatch care-chart-swatch-news" /> 기사
        </p>
      </div>
      <p className="care-chart-hint">
        {attention > 0
          ? `위험 ${attention}명 · 이름을 누르면 상세로 갑니다.`
          : "위험은 없어요. 시청·기사는 아래 막대로 비교해요."}
      </p>

      <ul className="care-chart-list" aria-label="어르신별 오늘 위험·시청·기사">
        {seniors.map((senior) => (
          <li key={senior.userId}>
            <button
              type="button"
              className={`care-chart-row ${senior.dangerCount > 0 ? "is-alert" : ""}`}
              onClick={() => onOpen(senior.userId)}
            >
              <span className="care-chart-name">{senior.displayName}</span>
              <span className="care-chart-bars">
                <span className="care-chart-bar-line">
                  <span className="care-chart-bar-label">위험</span>
                  <span className="care-chart-track">
                    <span
                      className="care-chart-fill care-chart-fill-danger"
                      style={{ width: barWidth(senior.dangerCount, maxDanger) }}
                    />
                  </span>
                  <span className="care-chart-value">{senior.dangerCount}건</span>
                </span>
                <span className="care-chart-bar-line">
                  <span className="care-chart-bar-label">시청</span>
                  <span className="care-chart-track">
                    <span
                      className="care-chart-fill care-chart-fill-watch"
                      style={{ width: barWidth(senior.watchSec, maxWatch) }}
                    />
                  </span>
                  <span className="care-chart-value">{formatWatchDuration(senior.watchSec)}</span>
                </span>
                <span className="care-chart-bar-line">
                  <span className="care-chart-bar-label">기사</span>
                  <span className="care-chart-track">
                    <span
                      className="care-chart-fill care-chart-fill-news"
                      style={{ width: barWidth(senior.newsCount, maxNews) }}
                    />
                  </span>
                  <span className="care-chart-value">{senior.newsCount}건</span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
