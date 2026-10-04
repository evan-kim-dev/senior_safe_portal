"use client";

import { Icon } from "@/components/icons";
import { Grid } from "@/components/ui";
import { openChat } from "@/lib/client/chat-bridge";
import { SAFETY_TIPS, type SafetyTip } from "@/lib/domain/content";

export function TipCard({ tip }: { tip: SafetyTip }) {
  return (
    <button type="button" className="info info-purple info-link" onClick={() => openChat(tip.question)}>
      <span className="tag">보안 수칙</span>
      <strong className="info-title">{tip.title}</strong>
      <p>{tip.text}</p>
      <span className="info-more">단디에게 묻기 <Icon name="arrow" /></span>
    </button>
  );
}

export function SafetyTipGrid() {
  return (
    <Grid kind="info">
      {SAFETY_TIPS.map((tip) => <TipCard key={tip.title} tip={tip} />)}
    </Grid>
  );
}
