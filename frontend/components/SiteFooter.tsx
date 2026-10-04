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
          <strong className="footer-name">시니어 디지털 보안관</strong>
          <p className="footer-desc">
            받은 링크와 영상이 괜찮은지 AI가 먼저 살펴 드려요. 부모님과 가족이 함께 쓰는 안심 서비스입니다.
            검사·상담 결과는 참고용이며, 돈이나 개인정보를 요구받으면 가족이나 112에 먼저 확인하세요.
          </p>
        </div>
        <div className="footer-bar">
          <nav className="footer-legal" aria-label="약관 및 정책">
            {LEGAL_LINKS.map((item, index) => (
              <span key={item.href} className="footer-legal-item">
                {index > 0 ? <span className="footer-sep" aria-hidden="true" /> : null}
                <Link href={item.href}>{item.label}</Link>
              </span>
            ))}
          </nav>
          <p className="footer-copy">© {YEAR} 시니어 디지털 보안관</p>
        </div>
      </div>
    </footer>
  );
}
