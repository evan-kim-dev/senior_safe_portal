import { NextResponse } from "next/server";
import { readCategoryId } from "@/lib/body";
import { EMPTY_FEED_MESSAGE, readFeedRows } from "@/lib/feeds";
import { decodeText } from "@/lib/text";

type YoutubeVideo = {
  video_id?: string;
  title?: string;
  thumbnail?: string;
  description?: string;
  channel?: string;
};

type FeedRow = { videos?: YoutubeVideo[] };

function suspiciousUrl(description: string): string {
  const found = description.match(/https?:\/\/[^\s<>"']+/gi) ?? [];
  const outside = found.find((item) => !/youtube\.com|youtu\.be/i.test(item));
  return outside ? outside.replace(/[),.;]+$/g, "") : "";
}

export async function POST(request: Request) {
  const categoryId = await readCategoryId(request);

  const path = categoryId
    ? `youtube_feeds?category_id=eq.${encodeURIComponent(categoryId)}&select=videos`
    : "youtube_feeds?select=videos";
  const rows = await readFeedRows<FeedRow>(path);
  const videos = rows?.flatMap((row) => row.videos ?? []) ?? null;
  if (!videos) {
    return NextResponse.json({ ok: true, videos: [], message: EMPTY_FEED_MESSAGE });
  }

  const seen = new Set<string>();
  return NextResponse.json({
    ok: true,
    videos: videos
      .filter((video) => typeof video.video_id === "string" && video.video_id.length === 11 && !seen.has(video.video_id) && seen.add(video.video_id))
      .slice(0, 20)
      .map((video) => {
        const description = decodeText(video.description || "");
        return {
          id: video.video_id,
          title: decodeText(video.title || "영상"),
          thumbnail: video.thumbnail || `https://img.youtube.com/vi/${video.video_id}/hqdefault.jpg`,
          description,
          suspiciousUrl: suspiciousUrl(description),
          channel: decodeText(video.channel || ""),
        };
      }),
  });
}
