"use client";

import { useEffect, useMemo, useState } from "react";
import { Grid, LineButton, Media, Player, Screen, Status } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { useVideos } from "@/hooks/use-feeds";
import { reportActivity } from "@/lib/client/activity";
import { sendToCheck } from "@/lib/client/check-bridge";
import {
  parseAccountProfileFromMeta,
  personalizedFeedLead,
  videoInterestLabels,
} from "@/lib/domain/account-profile";
import { findVideo } from "@/lib/domain/feed-view";
import type { VideoItem } from "@/lib/domain/types";

const RECOMMEND_COUNT = 5;
const WATCH_HEARTBEAT_MS = 30_000;
const WATCH_CHUNK_SEC = 30;

function embedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`;
}

function openVideo(video: VideoItem, setPlaying: (video: VideoItem) => void) {
  setPlaying(video);
  window.history.replaceState(null, "", `/videos?v=${encodeURIComponent(video.id)}`);
}

export default function VideosPage() {
  const { user } = useAuth();
  const { videos, message } = useVideos();
  const [playing, setPlaying] = useState<VideoItem | null>(null);

  const profile = useMemo(
    () => parseAccountProfileFromMeta(user?.user_metadata ?? undefined),
    [user],
  );
  const interestLead =
    personalizedFeedLead("videos", profile) ??
    "보고 싶은 영상을 고르세요. 설명에 의심 주소가 있으면 바로 검사할 수 있어요.";

  useEffect(() => {
    const found = findVideo(videos, new URLSearchParams(window.location.search).get("v"));
    if (found) setPlaying(found);
  }, [videos]);

  useEffect(() => {
    if (!playing) return;
    const summary = playing.title.slice(0, 80);
    void reportActivity({ kind: "video_watch", summary, durationSec: WATCH_CHUNK_SEC });
    const timer = window.setInterval(() => {
      void reportActivity({ kind: "video_watch", summary, durationSec: WATCH_CHUNK_SEC });
    }, WATCH_HEARTBEAT_MS);
    return () => window.clearInterval(timer);
  }, [playing]);

  const recommended = useMemo(() => {
    if (!playing) return [];
    const rest = videos.filter((video) => video.id !== playing.id);
    if (!playing.categoryId) return rest.slice(0, RECOMMEND_COUNT);
    const same = rest.filter((video) => video.categoryId === playing.categoryId);
    const other = rest.filter((video) => video.categoryId !== playing.categoryId);
    return [...same, ...other].slice(0, RECOMMEND_COUNT);
  }, [playing, videos]);

  function backToList() {
    if (window.location.search) window.history.replaceState(null, "", "/videos");
    setPlaying(null);
  }

  if (playing) {
    return (
      <Screen
        secondary={<LineButton onClick={backToList}>목록으로</LineButton>}
      >
        <div className="watch-layout">
          <div className="watch-stage">
            <div className="watch-player-box">
              <div className="watch-player">
                <Player title={playing.title} src={embedUrl(playing.id)} />
              </div>
              <h2 className="watch-now-title">{playing.title}</h2>
              {playing.channel ? <p className="watch-now-meta">{playing.channel}</p> : null}
              {playing.suspiciousUrl ? (
                <div className="watch-now-actions">
                  <LineButton icon="link" onClick={() => sendToCheck(playing.suspiciousUrl)}>의심 주소 확인하기</LineButton>
                </div>
              ) : null}
            </div>
            {recommended.length > 0 ? (
              <aside className="watch-side" aria-label="추천 영상">
                <div className="watch-side-head">
                  <h2 className="watch-side-title">추천 영상</h2>
                  <button type="button" className="watch-side-more" onClick={backToList}>
                    더보기&gt;
                  </button>
                </div>
                <div className="watch-side-list">
                  {recommended.map((video) => (
                    <Media
                      key={video.id}
                      title={video.title}
                      image={video.thumbnail}
                      meta={video.channel}
                      onClick={() => openVideo(video, setPlaying)}
                    />
                  ))}
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen title="영상" lead={interestLead}>
      {message ? <Status>{message}</Status> : null}
      {profile.interests.length ? (
        <Status>관심 주제: {videoInterestLabels(profile.interests)}</Status>
      ) : null}
      {videos.length ? (
        <Grid kind="media">
          {videos.map((video) => (
            <Media key={video.id} title={video.title} image={video.thumbnail} meta={video.channel} onClick={() => openVideo(video, setPlaying)} />
          ))}
        </Grid>
      ) : null}
    </Screen>
  );
}
