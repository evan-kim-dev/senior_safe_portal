"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { Rail } from "@/components/Rail";
import { Section } from "@/components/ui";
import { openChat } from "@/lib/client/chat-bridge";
import { HOTLINES, QUICK_LINKS, SCAM_TYPES, telHref } from "@/lib/domain/content";

export function QuickMenu() {
  return (
    <nav className="quick" aria-labelledby="quick-title">
      <div className="wrap">
        <div className="section-head">
          <div>
            <h2 id="quick-title">바로가기</h2>
          </div>
        </div>
        <div className="quick-inner">
          {QUICK_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="quick-item">
              <span className={`quick-icon tone-${item.tone}`}><Icon name={item.icon} /></span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

export function ScamRail() {
  return (
    <Section id="scams" title="요즘 사기 수법" desc="카드를 누르면 단디에게 바로 물어볼 수 있어요.">
      <Rail label="사기 수법" kind="poster">
        {SCAM_TYPES.map((scam, index) => (
          <button key={scam.id} type="button" className={`poster poster-${index % 6}`} onClick={() => openChat(scam.question)}>
            <span className="poster-tag">주의</span>
            <span className="poster-icon"><Icon name={scam.icon} /></span>
            <strong>{scam.title}</strong>
            <span className="poster-tip">{scam.tip}</span>
            <span className="poster-more">단디에게 묻기 <Icon name="arrow" /></span>
          </button>
        ))}
      </Rail>
    </Section>
  );
}

export function Hotlines() {
  return (
    <Section id="hotline" title="혼자 고민하지 마세요" desc="의심되면 바로 전화하세요. 누르면 전화가 걸려요." className="section-soft">
      <ul className="hotlines">
        {HOTLINES.map((line) => (
          <li key={line.number}>
            <a className="hotline" href={telHref(line.number)}>
              <span className="hotline-icon"><Icon name="phone" /></span>
              <span className="hotline-num">{line.number}</span>
              <strong>{line.org}</strong>
              <span>{line.text}</span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
