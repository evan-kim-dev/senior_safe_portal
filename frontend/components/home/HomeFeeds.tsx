"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FeedRefreshBar } from "@/components/FeedRefreshBar";
import { Icon } from "@/components/icons";
import { Rail } from "@/components/Rail";
import { TipCard } from "@/components/SafetyTips";
import { Info, Media, Section, Status } from "@/components/ui";
import { useNews, useVideos, useWelfare } from "@/hooks/use-feeds";
import { reportActivity } from "@/lib/client/activity";
import { openChat } from "@/lib/client/chat-bridge";
import { SAFETY_TIPS } from "@/lib/domain/content";
import { videoHref } from "@/lib/domain/feed-view";
import type { NewsItem } from "@/lib/domain/types";
import { isHttpUrl } from "@/lib/domain/url";

const RAIL_VIDEOS = 12;
const HOME_WELFARE = 12;
const LEAD_ROTATE_MS = 10_000;
const LEAD_POOL = 6;
const SIDE_NEWS = 4;

function hideBrokenPhoto(event: { currentTarget: HTMLImageElement }) {
  const box = event.currentTarget.closest(".mosaic-photo");
  if (box instanceof HTMLElement) box.hidden = true;
}

function newsMeta(article: NewsItem): string {
  return [article.source, article.date].filter(Boolean).join(" · ");
}

function newsHref(article: NewsItem): string | undefined {
  return isHttpUrl(article.url) ? article.url : undefined;
}

function trackNewsView(article: NewsItem) {
  void reportActivity({
    kind: "news_view",
    summary: `${article.title.slice(0, 60)}${article.source ? ` · ${article.source}` : ""}`,
  });
}

function pickSideNews(articles: readonly NewsItem[], leadIndex: number, count: number): NewsItem[] {
  if (articles.length <= 1) return [];
  const side: NewsItem[] = [];
  for (let offset = 1; offset < articles.length && side.length < count; offset += 1) {
    side.push(articles[(leadIndex + offset) % articles.length]);
  }
  return side;
}

export function VideoRail() {
  const { videos, message, updatedAt, refreshing, refresh } = useVideos();

  return (
    <Section
      id="videos"
      title="오늘의 추천 영상"
      more={{ href: "/videos", label: "전체 보기" }}
      className="section-tint"
      meta={
        <FeedRefreshBar
          updatedAt={updatedAt}
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          label="영상 저장 시각"
        />
      }
    >
      {videos.length === 0 ? (
        <Status>{message}</Status>
      ) : (
        <Rail label="추천 영상" kind="media">
          {videos.slice(0, RAIL_VIDEOS).map((video) => (
            <Media key={video.id} title={video.title} image={video.thumbnail} meta={video.channel} href={videoHref(video.id)} />
          ))}
        </Rail>
      )}
    </Section>
  );
}

function LeadCard({
  article,
  onPaused,
}: {
  article: NewsItem | undefined;
  onPaused: (value: boolean) => void;
}) {
  if (!article) {
    const tip = SAFETY_TIPS[0];
    return (
      <button type="button" className="mosaic-lead" onClick={() => openChat(tip.question)}>
        <span className="tag tag-light">오늘의 보안 수칙</span>
        <strong>{tip.title}</strong>
        <span className="mosaic-meta">{tip.text}</span>
        <span className="info-more">마카에게 묻기 <Icon name="arrow" /></span>
      </button>
    );
  }
  const href = newsHref(article);
  const body = (
    <>
      <span className="tag tag-light">외부 기사</span>
      <span key={article.url} className="mosaic-lead-swap">
        {article.image ? (
          <span className="mosaic-photo">
            <img src={article.image} alt="" loading="lazy" decoding="async" onError={hideBrokenPhoto} />
          </span>
        ) : null}
        <strong>{article.title}</strong>
        <span className="mosaic-meta">{newsMeta(article)}</span>
      </span>
      <span className="info-more">기사 보기 <Icon name="arrow" /></span>
    </>
  );
  const className = "mosaic-lead mosaic-lead-rotate";
  const pauseProps = {
    onMouseEnter: () => onPaused(true),
    onMouseLeave: () => onPaused(false),
    onFocus: () => onPaused(true),
    onBlur: () => onPaused(false),
    "aria-label": article.title,
  };
  return href
    ? <a className={className} href={href} rel="noopener noreferrer" onClick={() => trackNewsView(article)} {...pauseProps}>{body}</a>
    : <Link className={className} href="/news" {...pauseProps}>{body}</Link>;
}

export function NewsSection() {
  const news = useNews();
  const { updatedAt, refreshing, refresh } = news;
  const pool = news.articles.slice(0, LEAD_POOL);
  const [leadIndex, setLeadIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setLeadIndex(0);
  }, [news.articles]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    function sync() {
      if (media.matches) setPaused(true);
    }
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (pool.length <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setLeadIndex((current) => (current + 1) % pool.length);
    }, LEAD_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [pool.length, paused]);

  const safeIndex = pool.length ? leadIndex % pool.length : 0;
  const lead = pool[safeIndex];
  const sideNews = pickSideNews(pool, safeIndex, SIDE_NEWS);

  return (
    <Section
      id="news"
      title="오늘의 뉴스"
      more={{ href: "/news", label: "전체 보기" }}
      meta={
        <FeedRefreshBar
          updatedAt={updatedAt}
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          label="뉴스 저장 시각"
        />
      }
    >
      {pool.length === 0 && news.message ? <Status>{news.message}</Status> : null}
      <div className="mosaic mosaic-news">
        <LeadCard
          article={lead}
          onPaused={setPaused}
        />
        {sideNews.length
          ? sideNews.map((article) => (
            <Info
              key={`${article.url}-${article.date}`}
              tag="외부 기사"
              tone="purple"
              title={article.title}
              lines={[newsMeta(article)]}
              href={newsHref(article)}
              image={article.image || undefined}
              more="기사 보기"
              onOpen={() => trackNewsView(article)}
            />
          ))
          : SAFETY_TIPS.slice(1, 5).map((tip) => <TipCard key={tip.title} tip={tip} />)}
      </div>
    </Section>
  );
}

export function WelfareSection() {
  const welfare = useWelfare();
  const cards = welfare.cards.slice(0, HOME_WELFARE);

  return (
    <Section
      id="welfare"
      title="복지 혜택"
      desc="우리 동네에서 받을 수 있는 혜택을 모았어요."
      more={{ href: "/welfare", label: "전체 보기" }}
      className="section-soft"
      meta={
        <FeedRefreshBar
          updatedAt={welfare.updatedAt}
          refreshing={welfare.refreshing}
          onRefresh={() => void welfare.refresh()}
          label="복지 저장 시각"
        />
      }
    >
      {cards.length === 0 ? (
        <Status>{welfare.message}</Status>
      ) : (
        <Rail label="복지 혜택" kind="info">
          {cards.map((card, index) => (
            <Info
              key={`${card.title}-${index}`}
              tag={card.kind || "복지"}
              tone="green"
              title={card.title}
              lines={[`누가: ${card.target}`, `어떻게: ${card.apply}`]}
              href={card.href || "/welfare"}
              more={card.href ? "신청하러 가기" : "복지 화면에서 보기"}
            />
          ))}
        </Rail>
      )}
    </Section>
  );
}
