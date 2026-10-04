"use client";

import { Info, Screen, Status } from "@/components/ui";
import { useWelfare } from "@/lib/use-cache";

export default function WelfarePage() {
  const { cards, placeLabel, message } = useWelfare();

  return (
    <Screen title="복지">
      <Status>{placeLabel ? `${placeLabel} 복지` : "복지"}</Status>
      {message ? <Status>{message}</Status> : null}
      {cards.map((card) => (
        <Info
          key={`${card.kind}-${card.title}`}
          title={card.title}
          lines={[`대상 ${card.target}`, `신청 ${card.apply}`, card.kind]}
        />
      ))}
    </Screen>
  );
}
