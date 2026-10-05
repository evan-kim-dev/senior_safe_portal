export const NAV_ITEMS = [
  { href: "/", label: "홈" },
  { href: "/videos", label: "영상" },
  { href: "/news", label: "뉴스" },
  { href: "/welfare", label: "복지" },
  { href: "/board", label: "게시판" },
] as const;

export const GUARDIAN_NAV_ITEMS = [
  { href: "/care", label: "대시보드" },
  { href: "/link", label: "연결" },
  { href: "/account", label: "계정" },
] as const;

export type NavItem = { href: string; label: string };

export function navItemsForAccount(isGuardian: boolean): readonly NavItem[] {
  return isGuardian ? GUARDIAN_NAV_ITEMS : NAV_ITEMS;
}

export { isStandaloneRoute } from "./shell";

export function isCurrentRoute(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
