"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LEGAL_LINKS } from "@/lib/domain/content";
import { isStandaloneRoute } from "@/lib/domain/routes";

const YEAR = new Date().getFullYear();

export function SiteFooter() {
  const pathname = usePathname();
  if (isStandaloneRoute(pathname)) return null;

  return (
    <footer className="site-footer">
      <div className="wrap footer-inner">
        <div className="footer-brand">
          <strong className="footer-name">시니어 안심</strong>
          <p className="footer-desc">
            어르신과 가족이 함께 쓰는 디지털 안심 도우미입니다.
            <br />
            모르는 링크는 누르기 전에 먼저 확인해 보세요.
          </p>
        </div>
        <div className="footer-bar">
          <nav className="footer-legal" aria-label="소개 및 약관">
            <span className="footer-legal-item">
              <Link href="/maka">마스코트 마카</Link>
            </span>
            <span className="footer-sep" aria-hidden="true" />
            {LEGAL_LINKS.map((item, index) => (
              <span key={item.href} className="footer-legal-item">
                {index > 0 ? <span className="footer-sep" aria-hidden="true" /> : null}
                <Link
                  href={item.href}
                  className={item.emphasize ? "footer-privacy-link" : undefined}
                >
                  {item.label}
                </Link>
              </span>
            ))}
          </nav>
          <p className="footer-copy">© {YEAR} 시니어 안심</p>
        </div>
      </div>
    </footer>
  );
}
