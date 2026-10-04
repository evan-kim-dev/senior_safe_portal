"use client";

import { Info, Screen, Status } from "@/components/ui";
import { useNews } from "@/hooks/use-feeds";

export default function NewsPage() {
  const { articles, message } = useNews();

  return (
    <Screen title="뉴스">
      {message ? <Status>{message}</Status> : null}
      {articles.map((article) => (
        <Info
          key={`${article.url}-${article.date}`}
          title={article.title}
          lines={[`출처 ${article.source}`, article.date ? `날짜 ${article.date}` : null]}
        />
      ))}
    </Screen>
  );
}
