"use client";

import { useCallback, useEffect, useState } from "react";
import { loadNewsView, loadVideoView, loadWelfareView } from "@/lib/client/feeds";
import type { NewsView, VideoView, WelfareView } from "@/lib/domain/feed-view";
import { FEED_MESSAGES } from "@/lib/domain/messages";

type FeedState<T> = T & { refreshing: boolean; refresh: () => Promise<void> };

function useFeedLoader<T extends { message: string }>(
  initial: T,
  load: (options?: { force?: boolean }) => Promise<T>,
): FeedState<T> {
  const [view, setView] = useState<T>(initial);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(
    async (force = false) => {
      if (force) setRefreshing(true);
      try {
        const next = await load(force ? { force: true } : undefined);
        setView(next);
      } finally {
        if (force) setRefreshing(false);
      }
    },
    [load],
  );

  useEffect(() => {
    let alive = true;
    void load().then((next) => {
      if (alive) setView(next);
    });
    return () => {
      alive = false;
    };
  }, [load]);

  const refresh = useCallback(async () => {
    await reload(true);
  }, [reload]);

  return { ...view, refreshing, refresh };
}

export function useVideos(): FeedState<VideoView> {
  return useFeedLoader<VideoView>(
    { videos: [], message: FEED_MESSAGES.videos.loading, updatedAt: null },
    loadVideoView,
  );
}

export function useNews(): FeedState<NewsView> {
  return useFeedLoader<NewsView>(
    { articles: [], message: FEED_MESSAGES.news.loading, updatedAt: null },
    loadNewsView,
  );
}

export function useWelfare(): FeedState<WelfareView> {
  return useFeedLoader<WelfareView>(
    { cards: [], placeLabel: "", message: FEED_MESSAGES.welfare.loading, updatedAt: null },
    loadWelfareView,
  );
}
