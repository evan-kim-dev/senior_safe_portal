import { seoulDayRange } from "@/lib/domain/date";
import type { FamilyActivityItem } from "@/lib/domain/family";
import { isFamilyCode } from "@/lib/domain/validation";
import type { ActivityRepository } from "../repositories/activity-repository";

export type ActivityService = {
  recordDangerVideo(familyCode: string, userId?: string): Promise<void>;
  countDangerVideosToday(familyCode: string, now?: Date): Promise<number>;
  listDangerVideosToday(familyCode: string, now?: Date): Promise<FamilyActivityItem[]>;
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

export function createActivityService(repo: ActivityRepository): ActivityService {
  return {
    async recordDangerVideo(familyCode, userId) {
      if (!isFamilyCode(familyCode)) return;
      await repo.insert(familyCode, userId);
    },

    async countDangerVideosToday(familyCode, now = new Date()) {
      if (!isFamilyCode(familyCode)) return 0;
      const { start, end } = seoulDayRange(now);
      return repo.countBetween(familyCode, start, end);
    },

    async listDangerVideosToday(familyCode, now = new Date()) {
      if (!isFamilyCode(familyCode)) return [];
      const { start, end } = seoulDayRange(now);
      const rows = await repo.listBetween(familyCode, start, end);
      return rows.map((row) => ({
        id: row.id,
        createdAt: row.created_at,
        label: `${formatSeoulTime(row.created_at)} 위험한 영상`,
      }));
    },
  };
}
