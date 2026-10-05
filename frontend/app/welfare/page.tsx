"use client";

import { useEffect, useState } from "react";
import { Grid, Info, Screen, Status } from "@/components/ui";
import { loadWelfareView } from "@/lib/client/feeds";
import { loadGuardian, saveRegion } from "@/lib/client/guardian";
import type { WelfareView } from "@/lib/domain/feed-view";
import { FEED_MESSAGES } from "@/lib/domain/messages";

const REGIONS = [
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
] as const;

export default function WelfarePage() {
  const [region, setRegion] = useState("서울");
  const [view, setView] = useState<WelfareView>({
    cards: [],
    placeLabel: "",
    message: FEED_MESSAGES.welfare.loading,
  });

  useEffect(() => {
    const stored = loadGuardian().region || "서울";
    setRegion(stored);
  }, []);

  useEffect(() => {
    let alive = true;
    saveRegion(region);
    setView({ cards: [], placeLabel: "", message: FEED_MESSAGES.welfare.loading });
    void loadWelfareView().then((next) => {
      if (alive) setView(next);
    });
    return () => {
      alive = false;
    };
  }, [region]);

  return (
    <Screen title="복지" lead="사는 곳에 맞는 복지 혜택을 알려 드려요.">
      <label className="field" htmlFor="welfare-region">
        <span>사는 곳</span>
        <select
          id="welfare-region"
          value={region}
          onChange={(event) => setRegion(event.target.value)}
        >
          {REGIONS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>
      <Status>{view.placeLabel ? `${view.placeLabel} 복지` : `${region} 복지`}</Status>
      {view.message ? <Status>{view.message}</Status> : null}
      {view.cards.length ? (
        <Grid kind="info">
          {view.cards.map((card, index) => (
            <Info
              key={`${card.kind}-${card.title}-${index}`}
              tag={card.kind || "복지"}
              tone="green"
              title={card.title}
              lines={[`대상 ${card.target}`, `신청 ${card.apply}`]}
              href={card.href}
              more="복지로에서 보기"
            />
          ))}
        </Grid>
      ) : null}
    </Screen>
  );
}
