"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FeedRefreshBar } from "@/components/FeedRefreshBar";
import { Grid, Info, Screen, Status } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { loadWelfareView } from "@/lib/client/feeds";
import { loadGuardian, saveRegion } from "@/lib/client/guardian";
import {
  parseAccountProfileFromMeta,
  personalizedFeedLead,
} from "@/lib/domain/account-profile";
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
  const { user } = useAuth();
  const [region, setRegion] = useState("서울");
  const [view, setView] = useState<WelfareView>({
    cards: [],
    placeLabel: "",
    message: FEED_MESSAGES.welfare.loading,
    updatedAt: null,
  });
  const [refreshing, setRefreshing] = useState(false);
  const profile = useMemo(
    () => parseAccountProfileFromMeta(user?.user_metadata ?? undefined),
    [user],
  );
  const lead =
    personalizedFeedLead("welfare", profile) ?? "65세 이상 어르신에게 맞는 복지 혜택을 알려 드려요.";

  const reload = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    try {
      const next = await loadWelfareView(force ? { force: true } : undefined);
      setView(next);
    } finally {
      if (force) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const stored = loadGuardian().region || "서울";
    setRegion(stored);
  }, []);

  useEffect(() => {
    let alive = true;
    saveRegion(region);
    setView({
      cards: [],
      placeLabel: "",
      message: FEED_MESSAGES.welfare.loading,
      updatedAt: null,
    });
    void loadWelfareView().then((next) => {
      if (alive) setView(next);
    });
    return () => {
      alive = false;
    };
  }, [region, user?.id]);

  return (
    <Screen
      title="복지 (65세+)"
      lead={lead}
      meta={
        <FeedRefreshBar
          updatedAt={view.updatedAt}
          refreshing={refreshing}
          onRefresh={() => void reload(true)}
          label="복지 저장 시각"
        />
      }
    >
      <fieldset className="region-picker">
        <legend className="region-picker-legend">사는 곳</legend>
        <div className="region-picker-grid" role="radiogroup" aria-label="사는 곳">
          {REGIONS.map((item) => {
            const selected = region === item;
            return (
              <button
                key={item}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`region-picker-card${selected ? " is-selected" : ""}`}
                onClick={() => setRegion(item)}
              >
                {item}
              </button>
            );
          })}
        </div>
      </fieldset>
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
              lines={[
                `누가: ${card.target}`,
                `어떻게: ${card.apply}`,
              ]}
              href={card.href}
              more="신청하러 가기"
            />
          ))}
        </Grid>
      ) : null}
    </Screen>
  );
}
