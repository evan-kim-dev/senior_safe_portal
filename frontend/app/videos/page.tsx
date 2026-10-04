"use client";

import { useState } from "react";
import { sendToCheck } from "@/lib/check-bridge";
import type { VideoItem } from "@/lib/types";
import { useVideos } from "@/lib/use-cache";
import { BigButton, LineButton, Media, Player, Screen, Status } from "@/components/ui";

export default function VideosPage() {
  const { videos, message } = useVideos();
  const [playing, setPlaying] = useState<VideoItem | null>(null);

  if (playing) {
    return (
      <Screen
        title={playing.title}
        secondary={playing.suspiciousUrl ? <LineButton onClick={() => sendToCheck(playing.suspiciousUrl)}>의심 주소 확인하기</LineButton> : null}
        primary={<BigButton onClick={() => setPlaying(null)}>목록</BigButton>}
      >
        <Player title={playing.title} src={`https://www.youtube-nocookie.com/embed/${playing.id}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`} />
      </Screen>
    );
  }

  return (
    <Screen title="영상">
      {message ? <Status>{message}</Status> : null}
      {videos.map((video) => (
        <Media key={video.id} title={video.title} image={video.thumbnail} onClick={() => setPlaying(video)} />
      ))}
    </Screen>
  );
}
