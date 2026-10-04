"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/use-auth";

const ITEMS = [
  { href: "/", label: "검사" },
  { href: "/videos", label: "영상" },
  { href: "/news", label: "뉴스" },
  { href: "/welfare", label: "복지" },
  { href: "/board", label: "게시판" },
];

export function PortalNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  useEffect(() => {
    document.body.dataset.care = pathname === "/care" || pathname === "/setup" ? "1" : "";
  }, [pathname]);

  if (pathname === "/care" || pathname === "/setup") return null;

  const links = ITEMS.map((item) => {
    const current = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
    return (
      <Link key={item.href} href={item.href} aria-current={current ? "page" : undefined}>
        {item.label}
      </Link>
    );
  });

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
