"use client";

import { Grid, Info, Screen, Status } from "@/components/ui";
import { useWelfare } from "@/hooks/use-feeds";

export default function WelfarePage() {
  const { cards, placeLabel, message } = useWelfare();

  return (
    <Screen title="복지" lead="사는 곳에 맞는 복지 혜택을 알려 드려요.">
      <Status>{placeLabel ? `${placeLabel} 복지` : "복지"}</Status>
      {message ? <Status>{message}</Status> : null}
      {cards.length ? (
        <Grid kind="info">
          {cards.map((card, index) => (
            <Info
              key={`${card.kind}-${card.title}-${index}`}
              tag={card.kind || "복지"}
              tone="green"
              title={card.title}
              lines={[`대상 ${card.target}`, `신청 ${card.apply}`]}
            />
          ))}
        </Grid>
      ) : null}
    </Screen>
  );
}
