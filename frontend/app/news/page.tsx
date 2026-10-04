"use client";

import { SafetyTipGrid } from "@/components/SafetyTips";
import { Grid, Info, Screen, Status } from "@/components/ui";
import { useNews } from "@/hooks/use-feeds";
import { isHttpUrl } from "@/lib/domain/url";

export default function NewsPage() {
  const { articles, message } = useNews();

  return (
    <Screen title="뉴스" lead="사기·보안 관련 최신 소식을 모았어요.">
      {message ? <Status>{message}</Status> : null}
      {articles.length ? (
        <Grid kind="info">
          {articles.map((article) => (
            <Info
              key={`${article.url}-${article.date}`}
              tag="뉴스"
              title={article.title}
              lines={[`출처 ${article.source}`, article.date ? `날짜 ${article.date}` : null]}
              href={isHttpUrl(article.url) ? article.url : undefined}
              image={article.image || undefined}
              more="기사 보기"
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
