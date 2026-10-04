"use client";

import { useEffect, useState } from "react";
import { loadNewsView, loadVideoView, loadWelfareView } from "@/lib/client/feeds";
import type { NewsView, VideoView, WelfareView } from "@/lib/domain/feed-view";
import { FEED_MESSAGES } from "@/lib/domain/messages";

function useView<T>(initial: T, load: () => Promise<T>): T {
  const [view, setView] = useState<T>(initial);
  useEffect(() => {
    let alive = true;
    void load().then((next) => {
      if (alive) setView(next);
    });
    return () => {
      alive = false;
    };
  }, [load]);
  return view;
}

export function useVideos(): VideoView {
  return useView<VideoView>({ videos: [], message: FEED_MESSAGES.videos.loading }, loadVideoView);
}

export function useNews(): NewsView {
  return useView<NewsView>({ articles: [], message: FEED_MESSAGES.news.loading }, loadNewsView);
}

export function useWelfare(): WelfareView {
  return useView<WelfareView>({ cards: [], placeLabel: "", message: FEED_MESSAGES.welfare.loading }, loadWelfareView);
}
