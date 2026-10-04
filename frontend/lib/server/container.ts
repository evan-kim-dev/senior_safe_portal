import "server-only";
import { after } from "next/server";
import { getServerEnv } from "./env";
import { createEdgeFunctionGateway } from "./gateways/edge-functions";
import { logger } from "./logger";
import { createActivityRepository } from "./repositories/activity-repository";
import { createFamilyRepository } from "./repositories/family-repository";
import { createFeedRepository } from "./repositories/feed-repository";
import { createLinkCheckRepository } from "./repositories/link-check-repository";
import { createActivityService, type ActivityService } from "./services/activity-service";
import { ANALYZE_TIMEOUT_MS, createCheckService, type CheckService } from "./services/check-service";
import { CHAT_TIMEOUT_MS, createChatService, type ChatService } from "./services/chat-service";
import { createFamilyService, type FamilyService } from "./services/family-service";
import { createFeedService, type FeedService } from "./services/feed-service";
import { createRestClient } from "./supabase/rest-client";

export type Services = {
  check: CheckService;
  chat: ChatService;
  feeds: FeedService;
  activity: ActivityService;
  family: FamilyService;
};

let services: Services | null = null;

/** 서버 인스턴스마다 한 번만 조립한다. 테스트는 각 create* 함수에 가짜를 넣어 쓴다. */
export function getServices(): Services {
  if (services) return services;

  const env = getServerEnv();
  const log = logger.child({ layer: "service" });
  const rest = createRestClient(env, log.child({ component: "supabase-rest" }));
  const edge = createEdgeFunctionGateway(env, log.child({ component: "edge-functions" }));
  const linkChecks = createLinkCheckRepository(rest);
  const activity = createActivityService(createActivityRepository(rest));
  const family = createFamilyService(createFamilyRepository(rest), activity);

  if (!env.serviceRoleKey) {
    log.warn("service_role_missing", { effect: "link check cache and danger video count are disabled" });
  }

  services = {
    check: createCheckService({
      findFresh: (urlKey) => linkChecks.findFresh(urlKey),
      analyze: (url) => edge.invoke("analyze-link", { url }, ANALYZE_TIMEOUT_MS),
      save: (urlKey, result) => linkChecks.save(urlKey, result),
      recordDangerVideo: (familyCode, userId) => activity.recordDangerVideo(familyCode, userId),
      defer: (task) =>
        after(async () => {
          try {
            await task();
          } catch (error) {
            log.error("deferred_task_failed", { error });
          }
        }),
      log: log.child({ service: "check" }),
    }),
    chat: createChatService({
      ask: (payload) => edge.invoke("chat-agent", payload, CHAT_TIMEOUT_MS),
    }),
    feeds: createFeedService(createFeedRepository(rest)),
    activity,
    family,
  };
  return services;
}
