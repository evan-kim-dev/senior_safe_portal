"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { FAMILY_LINKS, NOTICE, telHref } from "@/lib/domain/content";
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

function FamilyMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="family-menu" ref={rootRef}>
      <button
        type="button"
        className="family-menu-btn"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="가족 메뉴"
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="menu" />
      </button>
      {open ? (
        <div id={menuId} className="family-menu-panel" role="menu">
          {FAMILY_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              aria-current={pathname === item.href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

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
            <img src="/logo.png" alt="" width={36} height={36} decoding="async" />
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
            <FamilyMenu />
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
