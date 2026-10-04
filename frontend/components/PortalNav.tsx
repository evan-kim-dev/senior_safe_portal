"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { isCurrentRoute, isStandaloneRoute, NAV_ITEMS } from "@/lib/domain/routes";

export function PortalNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const standalone = isStandaloneRoute(pathname);

  useEffect(() => {
    document.body.dataset.care = standalone ? "1" : "";
  }, [standalone]);

  if (standalone) return null;

  const links = NAV_ITEMS.map((item) => (
    <Link key={item.href} href={item.href} aria-current={isCurrentRoute(pathname, item.href) ? "page" : undefined}>
      {item.label}
    </Link>
  ));

  return (
    <>
      <header className="topbar">
        <div className="topbar-row">
          <Link href="/" className="brand" aria-label="시니어 디지털 보안관 홈">
            <img src="/logo.png" alt="" width={40} height={40} />
            <span>시니어 <br />디지털 보안관</span>
          </Link>
          <nav className="top-nav" aria-label="메뉴">{links}</nav>
          {user ? (
            <button type="button" className="login-link" onClick={() => void logout()}>로그아웃</button>
          ) : (
            <Link href="/login" className="login-link" aria-current={pathname === "/login" ? "page" : undefined}>로그인</Link>
          )}
        </div>
      </header>
      <nav className="bottom-nav" aria-label="메뉴">{links}</nav>
    </>
  );
}
