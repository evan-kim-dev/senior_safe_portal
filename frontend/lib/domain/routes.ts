export const NAV_ITEMS = [
  { href: "/", label: "홈" },
  { href: "/videos", label: "영상" },
  { href: "/news", label: "뉴스" },
  { href: "/welfare", label: "복지" },
  { href: "/board", label: "게시판" },
] as const;

const STANDALONE_ROUTES = new Set(["/setup"]);

/** 부모님이 QR로 여는 설정 화면은 메뉴·단디 없이 혼자 뜬다. */
export function isStandaloneRoute(pathname: string): boolean {
  return STANDALONE_ROUTES.has(pathname);
}

export function isCurrentRoute(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
