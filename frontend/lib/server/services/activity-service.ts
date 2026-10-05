import { seoulDayRange } from "@/lib/domain/date";
import { formatWatchDuration } from "@/lib/domain/duration";
import type { ActivityKind, FamilyActivityItem } from "@/lib/domain/family";
import type { SeniorActivityRow } from "@/lib/domain/senior-roster";
import { isFamilyCode } from "@/lib/domain/validation";
import type { ActivityRepository } from "../repositories/activity-repository";

export type ActivitySummaryOptions = {
  /** 지정하면 해당 사용자 활동만 집계(보호자 본인 활동 제외용). */
  userIds?: string[];
  /** userId → 표시 이름. 라벨에 붙인다. */
  nameByUserId?: Map<string, string>;
};

export type ActivityService = {
  record(
    familyCode: string,
    kind: ActivityKind,
    options?: { userId?: string; summary?: string; durationSec?: number },
  ): Promise<void>;
  /** @deprecated use record(..., "danger_video") */
  recordDangerVideo(familyCode: string, userId?: string, summary?: string): Promise<void>;
  todaySummary(familyCode: string, now?: Date, options?: ActivitySummaryOptions): Promise<{
    dangerCount: number;
    newsCount: number;
    watchSec: number;
    items: FamilyActivityItem[];
    rosterRows: SeniorActivityRow[];
  }>;
  countDangerVideosToday(familyCode: string, now?: Date, options?: ActivitySummaryOptions): Promise<number>;
  listDangerVideosToday(familyCode: string, now?: Date, options?: ActivitySummaryOptions): Promise<FamilyActivityItem[]>;
};

const DANGER_KINDS: ActivityKind[] = ["danger_video", "danger_link", "danger_chat"];
const ROSTER_LIST_LIMIT = 120;

const KIND_LABEL: Record<ActivityKind, string> = {
  danger_video: "위험한 영상",
  danger_link: "위험한 링크",
  danger_chat: "챗봇 상담(위험)",
  video_watch: "영상 시청",
  news_view: "기사 열람",
};

function formatSeoulTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso.slice(11, 16);
  }
}

function shortActivityLabel(row: {
  created_at: string;
  kind: ActivityKind;
  summary: string;
  duration_sec: number;
}): string {
  const time = formatSeoulTime(row.created_at);
  const kindLabel = KIND_LABEL[row.kind] ?? "활동";
  const detail =
    row.kind === "video_watch" && row.duration_sec > 0
      ? formatWatchDuration(row.duration_sec)
      : row.summary.trim();
  return detail ? `${time} ${kindLabel} · ${detail}` : `${time} ${kindLabel}`;
}

function toItem(
  row: {
    id: string;
    created_at: string;
    kind: ActivityKind;
    summary: string;
    duration_sec: number;
    user_id?: string | null;
  },
  nameByUserId?: Map<string, string>,
): FamilyActivityItem {
  const time = formatSeoulTime(row.created_at);
  const kindLabel = KIND_LABEL[row.kind] ?? "활동";
  const detail =
    row.kind === "video_watch" && row.duration_sec > 0
      ? formatWatchDuration(row.duration_sec)
      : row.summary.trim();
  const memberLabel =
    row.user_id && nameByUserId?.get(row.user_id)
      ? nameByUserId.get(row.user_id)
      : undefined;
  const who = memberLabel ? `${memberLabel} · ` : "";
  return {
    id: row.id,
    createdAt: row.created_at,
    kind: row.kind,
    userId: row.user_id ?? undefined,
    memberLabel,
    label: detail ? `${time} ${who}${kindLabel} · ${detail}` : `${time} ${who}${kindLabel}`,
  };
}

export function createActivityService(repo: ActivityRepository): ActivityService {
  return {
    async record(familyCode, kind, options = {}) {
      if (!isFamilyCode(familyCode)) return;
      await repo.insert({
        familyCode,
        userId: options.userId,
        kind,
        summary: options.summary,
        durationSec: options.durationSec,
      });
    },

    async recordDangerVideo(familyCode, userId, summary) {
      await this.record(familyCode, "danger_video", { userId, summary });
    },

    async todaySummary(familyCode, now = new Date(), options = {}) {
      if (!isFamilyCode(familyCode)) {
        return { dangerCount: 0, newsCount: 0, watchSec: 0, items: [], rosterRows: [] };
      }
      const { start, end } = seoulDayRange(now);
      const userIds = options.userIds;
      const [dangerCount, newsCount, watchSec, rows] = await Promise.all([
        repo.countBetween(familyCode, start, end, DANGER_KINDS, userIds),
        repo.countBetween(familyCode, start, end, ["news_view"], userIds),
        repo.sumDurationBetween(familyCode, start, end, "video_watch", userIds),
        repo.listBetween(familyCode, start, end, ROSTER_LIST_LIMIT, userIds),
      ]);
      return {
        dangerCount,
        newsCount,
        watchSec,
        items: rows.slice(0, 30).map((row) => toItem(row, options.nameByUserId)),
        rosterRows: rows.map((row) => ({
          userId: row.user_id,
          kind: row.kind,
          createdAt: row.created_at,
          durationSec: row.duration_sec,
          label: shortActivityLabel(row),
        })),
      };
    },

    async countDangerVideosToday(familyCode, now = new Date(), options) {
      const summary = await this.todaySummary(familyCode, now, options);
      return summary.dangerCount;
    },

    async listDangerVideosToday(familyCode, now = new Date(), options) {
      const summary = await this.todaySummary(familyCode, now, options);
      return summary.items.filter((item) => DANGER_KINDS.includes(item.kind));
    },
  };
}
