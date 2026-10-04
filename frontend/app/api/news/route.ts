import { NextResponse } from "next/server";
import { readCategoryId } from "@/lib/body";
import { EMPTY_FEED_MESSAGE, readFeedRows } from "@/lib/feeds";
import { decodeText } from "@/lib/text";

type NewsRow = {
  title?: string;
  publisher?: string;
  pubDate?: string;
  originallink?: string;
  link?: string;
};

type FeedRow = { articles?: NewsRow[] };

function sourceName(url: string, publisher: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return publisher || "출처";
  }
}

export async function POST(request: Request) {
  const categoryId = await readCategoryId(request);

  const path = categoryId
    ? `news_feeds?category_id=eq.${encodeURIComponent(categoryId)}&select=articles`
    : "news_feeds?select=articles";
  const rows = await readFeedRows<FeedRow>(path);
  const articles = rows?.flatMap((row) => row.articles ?? []) ?? null;
  if (!articles) {
    return NextResponse.json({ ok: true, articles: [], message: EMPTY_FEED_MESSAGE });
  }

  return NextResponse.json({
    ok: true,
    articles: articles
      .map((article) => ({
        title: decodeText(article.title || "뉴스"),
        source: sourceName(article.originallink || article.link || "", article.publisher || ""),
        date: decodeText(article.pubDate || ""),
        url: article.originallink || article.link || "",
      }))
      .filter((article) => article.url.startsWith("http")),
  });
}
