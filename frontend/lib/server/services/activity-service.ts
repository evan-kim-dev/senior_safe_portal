import { seoulDayRange } from "@/lib/domain/date";
import { isFamilyCode } from "@/lib/domain/validation";
import type { ActivityRepository } from "../repositories/activity-repository";

export type ActivityService = {
  recordDangerVideo(familyCode: string): Promise<void>;
  countDangerVideosToday(familyCode: string, now?: Date): Promise<number>;
};

export function createActivityService(repo: ActivityRepository): ActivityService {
  return {
    async recordDangerVideo(familyCode) {
      if (!isFamilyCode(familyCode)) return;
      await repo.insert(familyCode);
    },

    async countDangerVideosToday(familyCode, now = new Date()) {
      if (!isFamilyCode(familyCode)) return 0;
      const { start, end } = seoulDayRange(now);
      return repo.countBetween(familyCode, start, end);
    },
  };
}
