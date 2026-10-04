"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { Rail } from "@/components/Rail";
import { TipCard } from "@/components/SafetyTips";
import { Info, Media, Section, Status } from "@/components/ui";
import { useNews, useVideos, useWelfare } from "@/hooks/use-feeds";
import { openChat } from "@/lib/client/chat-bridge";
import { SAFETY_TIPS } from "@/lib/domain/content";
import { videoHref } from "@/lib/domain/feed-view";
import type { NewsItem } from "@/lib/domain/types";
import { isHttpUrl } from "@/lib/domain/url";

const RAIL_VIDEOS = 12;
const HOME_WELFARE = 12;
const LEAD_ROTATE_MS = 7000;
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

function pickSideNews(articles: readonly NewsItem[], leadIndex: number, count: number): NewsItem[] {
  if (articles.length <= 1) return [];
  const side: NewsItem[] = [];
  for (let offset = 1; offset < articles.length && side.length < count; offset += 1) {
    side.push(articles[(leadIndex + offset) % articles.length]);
  }
  return side;
}

export function VideoRail() {
  const { videos, message } = useVideos();

  return (
    <Section
      id="videos"
      title="오늘의 추천 영상"
      desc="영상 설명에 의심 주소가 있으면 바로 검사할 수 있어요."
      more={{ href: "/videos", label: "전체 보기" }}
      className="section-tint"
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
  index,
  total,
  paused,
  onPaused,
}: {
  article: NewsItem | undefined;
  index: number;
  total: number;
  paused: boolean;
  onPaused: (value: boolean) => void;
}) {
  if (!article) {
    const tip = SAFETY_TIPS[0];
    return (
      <button type="button" className="mosaic-lead" onClick={() => openChat(tip.question)}>
        <span className="tag tag-light">오늘의 보안 수칙</span>
        <strong>{tip.title}</strong>
        <span className="mosaic-meta">{tip.text}</span>
        <span className="info-more">단디에게 묻기 <Icon name="arrow" /></span>
      </button>
    );
  }
  const href = newsHref(article);
  const body = (
    <>
      <span className="tag tag-light">오늘의 보안 뉴스</span>
      <span key={article.url} className="mosaic-lead-swap">
        {article.image ? (
          <span className="mosaic-photo">
            <img src={article.image} alt="" loading="lazy" decoding="async" onError={hideBrokenPhoto} />
          </span>
        ) : null}
        <strong>{article.title}</strong>
        <span className="mosaic-meta">{newsMeta(article)}</span>
      </span>
      {total > 1 ? (
        <span className="mosaic-count" aria-hidden="true">{index + 1} / {total}</span>
      ) : null}
      <span className="info-more">기사 보기 <Icon name="arrow" /></span>
    </>
  );
  const className = "mosaic-lead mosaic-lead-rotate";
  const pauseProps = {
    onMouseEnter: () => onPaused(true),
    onMouseLeave: () => onPaused(false),
    onFocus: () => onPaused(true),
    onBlur: () => onPaused(false),
    "aria-label": paused || total <= 1
      ? article.title
      : `${article.title} (${index + 1}/${total})`,
  };
  return href
    ? <a className={className} href={href} rel="noopener noreferrer" {...pauseProps}>{body}</a>
    : <Link className={className} href="/news" {...pauseProps}>{body}</Link>;
}

export function NewsSection() {
  const news = useNews();
  const pool = news.articles.slice(0, LEAD_POOL);
  const [leadIndex, setLeadIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setLeadIndex(0);
  }, [news.articles]);

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
      desc="사기·보안 관련 소식을 모았어요."
      more={{ href: "/news", label: "전체 보기" }}
    >
      {pool.length === 0 && news.message ? <Status>{news.message}</Status> : null}
      <div className="mosaic mosaic-news">
        <LeadCard
          article={lead}
          index={safeIndex}
          total={pool.length}
          paused={paused}
          onPaused={setPaused}
        />
        {sideNews.length
          ? sideNews.map((article) => (
            <Info
              key={`${article.url}-${article.date}`}
              tag="뉴스"
              tone="purple"
              title={article.title}
              lines={[newsMeta(article)]}
              href={newsHref(article)}
              more="기사 보기"
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
              lines={[`대상 ${card.target}`]}
              href="/welfare"
              more="복지 화면에서 보기"
            />
          ))}
        </Rail>
      )}
    </Section>
  );
}
