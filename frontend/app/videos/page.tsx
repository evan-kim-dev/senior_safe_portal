"use client";

import { useEffect, useState } from "react";
import { BigButton, Grid, LineButton, Media, Player, Screen, Status } from "@/components/ui";
import { useVideos } from "@/hooks/use-feeds";
import { sendToCheck } from "@/lib/client/check-bridge";
import { findVideo } from "@/lib/domain/feed-view";
import type { VideoItem } from "@/lib/domain/types";

function embedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`;
}

export default function VideosPage() {
  const { videos, message } = useVideos();
  const [playing, setPlaying] = useState<VideoItem | null>(null);

  useEffect(() => {
    const found = findVideo(videos, new URLSearchParams(window.location.search).get("v"));
    if (found) setPlaying(found);
  }, [videos]);

  function backToList() {
    if (window.location.search) window.history.replaceState(null, "", "/videos");
    setPlaying(null);
  }

  if (playing) {
    return (
      <Screen
        title={playing.title}
        lead={playing.channel || undefined}
        secondary={playing.suspiciousUrl ? <LineButton icon="link" onClick={() => sendToCheck(playing.suspiciousUrl)}>의심 주소 확인하기</LineButton> : null}
        primary={<BigButton onClick={backToList}>목록</BigButton>}
      >
        <Player title={playing.title} src={embedUrl(playing.id)} />
      </Screen>
    );
  }

  return (
    <Screen title="영상" lead="보고 싶은 영상을 고르세요. 설명에 의심 주소가 있으면 바로 검사할 수 있어요.">
      {message ? <Status>{message}</Status> : null}
      {videos.length ? (
        <Grid kind="media">
          {videos.map((video) => (
            <Media key={video.id} title={video.title} image={video.thumbnail} meta={video.channel} onClick={() => setPlaying(video)} />
          ))}
        </Grid>
      ) : null}
    </Screen>
  );
}
