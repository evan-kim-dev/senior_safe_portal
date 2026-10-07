"use client";

import { useMemo } from "react";
import { FeedRefreshBar } from "@/components/FeedRefreshBar";
import { SafetyTipGrid } from "@/components/SafetyTips";
import { Grid, Info, Screen, Status } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { useNews } from "@/hooks/use-feeds";
import { reportActivity } from "@/lib/client/activity";
import {
  parseAccountProfileFromMeta,
  personalizedFeedLead,
} from "@/lib/domain/account-profile";
import type { NewsItem } from "@/lib/domain/types";
import { isHttpUrl } from "@/lib/domain/url";

function trackNewsView(article: NewsItem) {
  void reportActivity({
    kind: "news_view",
    summary: `${article.title.slice(0, 60)}${article.source ? ` · ${article.source}` : ""}`,
  });
}

export default function NewsPage() {
  const { user } = useAuth();
  const { articles, message, updatedAt, refreshing, refresh } = useNews();
  const profile = useMemo(
    () => parseAccountProfileFromMeta(user?.user_metadata ?? undefined),
    [user],
  );
  const lead =
    personalizedFeedLead("news", profile) ?? "보이스피싱·피싱 등 사기·보안 소식만 모았어요.";

  return (
    <Screen title="사기·보안 뉴스" lead={lead}>
      <FeedRefreshBar
        updatedAt={updatedAt}
        refreshing={refreshing}
        onRefresh={() => void refresh()}
        label="뉴스 저장 시각"
      />
      {message ? <Status>{message}</Status> : null}
      {articles.length ? (
        <Grid kind="info">
          {articles.map((article) => (
            <Info
              key={`${article.url}-${article.date}`}
              verified="확인됨"
              title={article.title}
              lines={[`출처 ${article.source}`, article.date ? `날짜 ${article.date}` : null]}
              href={isHttpUrl(article.url) ? article.url : undefined}
              image={article.image || undefined}
              more="기사 보기"
              onOpen={() => trackNewsView(article)}
            />
          ))}
        </Grid>
      ) : (
        <>
          <h2 className="group-title">그동안 이것만은 꼭 기억하세요</h2>
          <SafetyTipGrid />
        </>
      )}
    </Screen>
  );
}
