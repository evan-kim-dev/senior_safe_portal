"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { Section } from "@/components/ui";
import { openChat } from "@/lib/client/chat-bridge";
import { HOTLINES, QUICK_LINKS, SAFETY_TIPS, SCAM_TYPES, telHref } from "@/lib/domain/content";

const HOME_SCAM_TIPS = 3;

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

/** 홈용: 사기 팁 3개를 세로로 보여 가로 스크롤을 없앤다. */
export function ScamTips() {
  const tips = SCAM_TYPES.slice(0, HOME_SCAM_TIPS);
  return (
    <Section id="scams" title="요즘 사기 수법" desc="카드를 누르면 마카에게 바로 물어볼 수 있어요.">
      <ul className="scam-stack">
        {tips.map((scam, index) => (
          <li key={scam.id}>
            <button
              type="button"
              className={`scam-card poster-${index % 6}`}
              onClick={() => openChat(scam.question)}
            >
              <span className="scam-card-icon"><Icon name={scam.icon} /></span>
              <span className="scam-card-body">
                <strong>{scam.title}</strong>
                <span className="scam-card-tip">{scam.tip}</span>
                <span className="scam-card-more">마카에게 묻기 <Icon name="arrow" /></span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="scam-stack-more">
        <button type="button" className="text-link" onClick={() => openChat(SAFETY_TIPS[0].question)}>
          더 궁금하면 마카에게 물어보세요
        </button>
      </p>
    </Section>
  );
}

/** @deprecated 홈은 ScamTips(세로)를 쓴다. 다른 화면 호환용으로 남김. */
export function ScamRail() {
  return <ScamTips />;
}

export function Hotlines() {
  const primary = HOTLINES.find((line) => line.number === "112") ?? HOTLINES[0];
  const rest = HOTLINES.filter((line) => line.number !== primary.number);

  return (
    <Section id="hotline" title="혼자 고민하지 마세요" desc="의심되면 바로 전화하세요. 누르면 전화가 걸려요." className="section-soft">
      <ul className="hotlines">
        <li>
          <a className="hotline hotline-primary" href={telHref(primary.number)}>
            <span className="hotline-icon"><Icon name="phone" /></span>
            <span className="hotline-num">{primary.number}</span>
            <strong>{primary.org}</strong>
            <span>{primary.text}</span>
          </a>
        </li>
        {rest.map((line) => (
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
