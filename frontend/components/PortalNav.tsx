"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/use-auth";
import {
  avatarUrlFromMeta,
  initialsFromDisplayName,
  menuDisplayName,
} from "@/lib/domain/user-profile";
import { isGuardianAccount } from "@/lib/domain/account-profile";
import {
  ACCOUNT_LINKS,
  FAMILY_LINKS,
  HELP_LINKS,
  NOTICE,
  telHref,
} from "@/lib/domain/content";
import { isCurrentRoute, isStandaloneRoute, navItemsForAccount } from "@/lib/domain/routes";
import { Icon, type IconName } from "./icons";
import { TextSizeSwitch } from "./TextSizeSwitch";

const NAV_ICONS: Record<string, IconName> = {
  "/": "shield",
  "/care": "users",
  "/link": "users",
  "/account": "users",
  "/videos": "play",
  "/news": "news",
  "/welfare": "heart",
  "/board": "board",
};

function MenuLink({
  href,
  label,
  pathname,
  onNavigate,
}: {
  href: string;
  label: string;
  pathname: string;
  onNavigate: () => void;
}) {
  const current = href.includes("#")
    ? undefined
    : isCurrentRoute(pathname, href)
      ? "page"
      : undefined;
  return (
    <Link href={href} role="menuitem" aria-current={current} onClick={onNavigate}>
      {label}
    </Link>
  );
}

function MenuPanel({
  user,
  logout,
}: {
  user: User | null;
  logout: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const close = () => setOpen(false);

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
        aria-label="메뉴"
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="menu" />
        <span className="family-menu-label">메뉴</span>
      </button>
      {open ? (
        <div id={menuId} className="family-menu-panel" role="menu">
          {user ? (
            <>
              <p className="family-menu-user">{menuDisplayName(user)}</p>
              <div className="family-menu-divider" role="separator" />
            </>
          ) : null}

          <div className="family-menu-section" role="none">
            <p className="family-menu-heading">화면 설정</p>
            <TextSizeSwitch />
          </div>

          <div className="family-menu-divider" role="separator" />
          <p className="family-menu-heading">가족</p>
          {FAMILY_LINKS.map((item) => (
            <MenuLink key={item.href} href={item.href} label={item.label} pathname={pathname} onNavigate={close} />
          ))}

          <div className="family-menu-divider" role="separator" />
          <p className="family-menu-heading">계정</p>
          {user ? (
            <>
              {ACCOUNT_LINKS.map((item) => (
                <MenuLink key={item.href} href={item.href} label={item.label} pathname={pathname} onNavigate={close} />
              ))}
              <button
                type="button"
                className="family-menu-action"
                role="menuitem"
                onClick={() => {
                  close();
                  void logout();
                }}
              >
                로그아웃
              </button>
            </>
          ) : (
            <MenuLink href="/login" label="로그인 · 회원가입" pathname={pathname} onNavigate={close} />
          )}

          <div className="family-menu-divider" role="separator" />
          <p className="family-menu-heading">도움말</p>
          {HELP_LINKS.map((item) => (
            <MenuLink key={item.href} href={item.href} label={item.label} pathname={pathname} onNavigate={close} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function UserMenu({ user, logout }: { user: User; logout: () => Promise<void> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const photo = avatarUrlFromMeta(user);
  const name = menuDisplayName(user);

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
    <div className="user-menu" ref={rootRef}>
      <button
        type="button"
        className="user-menu-btn"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`${name} 메뉴`}
        onClick={() => setOpen((value) => !value)}
      >
        {photo ? <img src={photo} alt="" referrerPolicy="no-referrer" /> : initialsFromDisplayName(name)}
      </button>
      {open ? (
        <div id={menuId} className="user-menu-panel" role="menu">
          <p className="user-menu-name">{name}</p>
          <Link
            href="/account"
            className="header-link"
            role="menuitem"
            aria-current={pathname === "/account" ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            계정 관리
          </Link>
          <button
            type="button"
            className="header-link"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
          >
            로그아웃
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function PortalNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const guardian = isGuardianAccount(user);
  const items = navItemsForAccount(guardian);
  const homeHref = guardian ? "/care" : "/";

  if (isStandaloneRoute(pathname)) return null;

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
          <Link href={homeHref} className="brand" aria-label="시니어 디지털 보안관 홈">
            <img src="/logo.png" alt="" width={36} height={36} decoding="async" />
            <span className="brand-name">
              <span className="brand-name-short">시니어 보안관</span>
              <span className="brand-name-full">시니어 디지털 보안관</span>
            </span>
          </Link>
          <nav className="main-nav" aria-label="주 메뉴">
            {items.map((item) => (
              <Link key={item.href} href={item.href} aria-current={current(item.href)}>{item.label}</Link>
            ))}
          </nav>
          <div className="header-tools">
            {user ? (
              <UserMenu user={user} logout={logout} />
            ) : (
              <Link href="/login" className="header-link" aria-current={pathname === "/login" ? "page" : undefined}>로그인</Link>
            )}
            <MenuPanel user={user} logout={logout} />
          </div>
        </div>
      </header>
      <nav className="tab-bar" aria-label="아래 메뉴">
        {items.map((item) => (
          <Link key={item.href} href={item.href} aria-current={current(item.href)}>
            <Icon name={NAV_ICONS[item.href] ?? "shield"} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
