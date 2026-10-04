import type { ReactNode } from "react";
import Link from "next/link";

export function LegalDoc({
  title,
  lead,
  effective,
  children,
}: {
  title: string;
  lead: string;
  effective: string;
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
        <article className="legal-doc">{children}</article>
        <p className="legal-back">
          <Link href="/">홈으로 돌아가기</Link>
        </p>
      </div>
    </main>
  );
}
