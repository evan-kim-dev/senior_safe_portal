"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { FAMILY_FEATURES } from "@/lib/domain/content";

export function FamilyBand({ actions }: { actions?: ReactNode }) {
  return (
    <section className="band flow-band" aria-labelledby="family-title">
      <div className="wrap band-grid">
        <div className="band-lead">
          <span className="eyebrow eyebrow-soft">가족 안심 연결</span>
          <h2 id="family-title">가족이 함께 지키면 더 안전해요</h2>
          <p>연결 전에는 초대 코드로 가족을 잇고, 연결 후에는 대시보드에서 부모 활동을 확인할 수 있어요.</p>
          {actions ? <div className="band-actions">{actions}</div> : null}
        </div>
        <ol className="band-features">
          {FAMILY_FEATURES.map((feature) => (
            <li key={feature.title} className="feature">
              <span className="feature-icon"><Icon name={feature.icon} /></span>
              <strong>{feature.title}</strong>
              <p>{feature.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
