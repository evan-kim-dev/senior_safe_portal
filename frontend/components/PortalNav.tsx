"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { NOTICE, telHref } from "@/lib/domain/content";
import { isCurrentRoute, isStandaloneRoute, NAV_ITEMS } from "@/lib/domain/routes";
import { Icon, type IconName } from "./icons";
import { TextSizeSwitch } from "./TextSizeSwitch";

const NAV_ICONS: Record<(typeof NAV_ITEMS)[number]["href"], IconName> = {
  "/": "shield",
  "/videos": "play",
  "/news": "news",
  "/welfare": "heart",
  "/board": "board",
};

export function PortalNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const standalone = isStandaloneRoute(pathname);

  useEffect(() => {
    document.body.dataset.care = standalone ? "1" : "";
  }, [standalone]);

  if (standalone) return null;

  const current = (href: string) => (isCurrentRoute(pathname, href) ? "page" : undefined);

  return (
    <>
      <div className="notice-bar">
        <div className="wrap">
          <Icon name="shield" />
          <span>{NOTICE}</span>
          <a href={telHref("112")}>의심되면 112</a>
        </div>
      </div>
      <header className="site-header">
        <div className="wrap header-row">
          <Link href="/" className="brand" aria-label="시니어 디지털 보안관 홈">
            <img src="/logo.png" alt="" width={36} height={36} />
            <span>시니어 <br />디지털 보안관</span>
          </Link>
          <nav className="main-nav" aria-label="주 메뉴">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} aria-current={current(item.href)}>{item.label}</Link>
            ))}
          </nav>
          <div className="header-tools">
            <TextSizeSwitch />
            {user ? (
              <button type="button" className="header-link" onClick={() => void logout()}>로그아웃</button>
            ) : (
              <Link href="/login" className="header-link" aria-current={pathname === "/login" ? "page" : undefined}>로그인</Link>
            )}
          </div>
        </div>
      </header>
      <nav className="tab-bar" aria-label="아래 메뉴">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} aria-current={current(item.href)}>
            <Icon name={NAV_ICONS[item.href]} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
