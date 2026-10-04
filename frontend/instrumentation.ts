import type { Instrumentation } from "next";

/** 라우트·렌더링에서 놓친 서버 예외를 한 형식으로 남긴다. 쿼리(가족 코드 등)는 빼고 경로만 적는다. */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const { logger } = await import("./lib/server/logger");
  logger.error("unhandled_request_error", {
    error,
    digest: typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : undefined,
    method: request.method,
    path: request.path.split("?")[0],
    routePath: context.routePath,
    routeType: context.routeType,
  });
};
