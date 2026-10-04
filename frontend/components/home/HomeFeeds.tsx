"use client";

import Link from "next/link";
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
const HOME_WELFARE = 4;

function newsMeta(article: NewsItem): string {
  return [article.source, article.date].filter(Boolean).join(" · ");
}

function newsHref(article: NewsItem): string | undefined {
  return isHttpUrl(article.url) ? article.url : undefined;
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

function LeadCard({ article }: { article: NewsItem | undefined }) {
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
      {article.image ? (
        <span className="mosaic-photo">
          <img src={article.image} alt="" loading="lazy" decoding="async" />
        </span>
      ) : null}
      <strong>{article.title}</strong>
      <span className="mosaic-meta">{newsMeta(article)}</span>
      <span className="info-more">기사 보기 <Icon name="arrow" /></span>
    </>
  );
  return href
    ? <a className="mosaic-lead" href={href} rel="noopener noreferrer">{body}</a>
    : <Link className="mosaic-lead" href="/news">{body}</Link>;
}

export function NewsSection() {
  const news = useNews();
  const [lead, ...rest] = news.articles;
  const sideNews = rest.slice(0, 4);

  return (
    <Section
      id="news"
      title="오늘의 뉴스"
      desc="사기·보안 관련 소식을 모았어요."
      more={{ href: "/news", label: "전체 보기" }}
    >
      {news.articles.length === 0 && news.message ? <Status>{news.message}</Status> : null}
      <div className="mosaic mosaic-news">
        <LeadCard article={lead} />
        {sideNews.length
          ? sideNews.map((article) => (
            <Info
              key={`${article.url}-${article.date}`}
              tag="뉴스"
              tone="purple"
              title={article.title}
              lines={[newsMeta(article)]}
              href={newsHref(article)}
              image={article.image || undefined}
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
        <div className="welfare-grid">
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
        </div>
      )}
    </Section>
  );
}
