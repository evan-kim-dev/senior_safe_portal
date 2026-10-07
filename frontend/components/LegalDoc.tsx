import type { ReactNode } from "react";
import Link from "next/link";

export function LegalDoc({
  title,
  lead,
  effective,
  easy,
  children,
}: {
  title: string;
  lead: string;
  effective: string;
  /** 상단 쉬운 요약 3줄 */
  easy?: readonly [string, string, string];
  children: ReactNode;
}) {
  return (
    <main className="page">
      <div className="wrap page-main narrow">
        <header className="page-head">
          <p className="eyebrow">안내</p>
          <h1>{title}</h1>
          <p className="lead">{lead}</p>
          <p className="legal-meta">시행일자: {effective}</p>
        </header>
        {easy ? (
          <aside className="legal-easy" aria-label="쉽게 읽기">
            <p className="legal-easy-title">쉽게 보면</p>
            <ol className="legal-easy-list">
              {easy.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </aside>
        ) : null}
        <article className="legal-doc">{children}</article>
        <p className="legal-back">
          <Link href="/">홈으로 돌아가기</Link>
        </p>
      </div>
    </main>
  );
}
