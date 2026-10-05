import { formatWatchDuration } from "./duration";
import type { ActivityKind, FamilyActivityItem, FamilySenior, FamilySeniorStatus } from "./family";

const DANGER_KINDS: ReadonlySet<ActivityKind> = new Set(["danger_video", "danger_link", "danger_chat"]);

export type SeniorActivitySeed = {
  userId: string;
  displayName: string;
};

export type SeniorActivityRow = {
  userId?: string | null;
  kind: ActivityKind;
  createdAt: string;
  durationSec?: number;
  label?: string;
};

function statusOf(dangerCount: number, hasActivity: boolean): FamilySeniorStatus {
  if (dangerCount > 0) return "attention";
  if (hasActivity) return "active";
  return "quiet";
}

export function seniorStatusLabel(status: FamilySeniorStatus): string {
  if (status === "attention") return "주의";
  if (status === "active") return "활동";
  return "없음";
}

/** 오늘 활동 행을 어르신별로 묶어 목록용 요약으로 만든다. */
export function buildSeniorRoster(
  seniors: SeniorActivitySeed[],
  rows: SeniorActivityRow[],
): FamilySenior[] {
  const byUser = new Map<
    string,
    {
      dangerCount: number;
      newsCount: number;
      watchSec: number;
      lastActivityAt?: string;
      lastActivityLabel?: string;
    }
  >();

  for (const senior of seniors) {
    byUser.set(senior.userId, { dangerCount: 0, newsCount: 0, watchSec: 0 });
  }

  for (const row of rows) {
    const userId = row.userId ?? "";
    if (!userId || !byUser.has(userId)) continue;
    const bucket = byUser.get(userId)!;
    if (DANGER_KINDS.has(row.kind)) bucket.dangerCount += 1;
    if (row.kind === "news_view") bucket.newsCount += 1;
    if (row.kind === "video_watch") bucket.watchSec += Math.max(0, row.durationSec ?? 0);
    if (!bucket.lastActivityAt || row.createdAt > bucket.lastActivityAt) {
      bucket.lastActivityAt = row.createdAt;
      bucket.lastActivityLabel = row.label;
    }
  }

  const roster = seniors.map((senior) => {
    const stats = byUser.get(senior.userId) ?? { dangerCount: 0, newsCount: 0, watchSec: 0 };
    const hasActivity = Boolean(stats.lastActivityAt) || stats.dangerCount + stats.newsCount + stats.watchSec > 0;
    return {
      userId: senior.userId,
      displayName: senior.displayName,
      dangerCount: stats.dangerCount,
      newsCount: stats.newsCount,
      watchSec: stats.watchSec,
      lastActivityAt: stats.lastActivityAt,
      lastActivityLabel: stats.lastActivityLabel,
      status: statusOf(stats.dangerCount, hasActivity),
    } satisfies FamilySenior;
  });

  return sortSeniorRoster(roster);
}

/** 주의 → 최근 활동 → 이름 순. */
export function sortSeniorRoster(seniors: FamilySenior[]): FamilySenior[] {
  const rank = (status: FamilySeniorStatus) => (status === "attention" ? 0 : status === "active" ? 1 : 2);
  return [...seniors].sort((a, b) => {
    const byStatus = rank(a.status) - rank(b.status);
    if (byStatus) return byStatus;
    const aTime = a.lastActivityAt ?? "";
    const bTime = b.lastActivityAt ?? "";
    if (aTime !== bTime) return bTime.localeCompare(aTime);
    return a.displayName.localeCompare(b.displayName, "ko");
  });
}

export function seniorRosterSummaryLine(senior: FamilySenior): string {
  const parts = [
    `위험 ${senior.dangerCount}`,
    `시청 ${formatWatchDuration(senior.watchSec)}`,
    `기사 ${senior.newsCount}건`,
  ];
  return parts.join(" · ");
}

export function filterActivityBySenior(
  items: FamilyActivityItem[],
  seniorId: string | null,
): FamilyActivityItem[] {
  if (!seniorId) return items;
  return items.filter((item) => item.userId === seniorId);
}
