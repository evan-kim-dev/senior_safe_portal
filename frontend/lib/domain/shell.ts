/** 레이아웃 껍데기: 웹(데스크톱) vs 앱(모바일 탭) vs 단독(설정 QR). */

export const STANDALONE_ROUTES = ["/setup"] as const;

/** 가족·계정 등 집중형 흐름 화면. */
export const FLOW_ROUTES = ["/care", "/link", "/account"] as const;

export function isStandaloneRoute(pathname: string): boolean {
  return (STANDALONE_ROUTES as readonly string[]).includes(pathname);
}

export function isFlowRoute(pathname: string): boolean {
  return (FLOW_ROUTES as readonly string[]).some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
