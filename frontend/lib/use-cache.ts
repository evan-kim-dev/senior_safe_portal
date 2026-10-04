"use client";

import { useEffect, useState } from "react";
import { ensureFamilyCode, loadGuardian } from "./guardian";
import { postJson } from "./post-json";
import type { NewsItem, VideoItem, WelfareCard } from "./types";

export function useVideos() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [message, setMessage] = useState("저장된 영상을 불러오고 있어요.");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const data = await postJson<{ ok: boolean; videos?: VideoItem[]; message?: string }>("/api/videos", {});
      if (!data.ok || !data.videos) {
        setMessage(data.message || "영상을 불러오지 못했습니다. 잠시 후 다시 눌러 주세요.");
        return;
      }
      const allowed = loadGuardian().channels;
      const visible = allowed.length
        ? data.videos.filter((video) => allowed.includes(video.channel))
        : data.videos;
      setVideos(visible);
      setMessage(visible.length ? "" : "아직 저장된 영상이 없습니다.");
    } catch {
      setMessage("영상을 불러오지 못했습니다. 잠시 후 다시 눌러 주세요.");
    }
  }

  return { videos, message };
}

export function useNews() {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [message, setMessage] = useState("저장된 뉴스를 불러오고 있어요.");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const data = await postJson<{ ok: boolean; articles?: NewsItem[]; message?: string }>("/api/news", {});
      if (!data.ok || !data.articles) {
        setMessage(data.message || "뉴스를 불러오지 못했습니다. 잠시 후 다시 눌러 주세요.");
        return;
      }
      setArticles(data.articles);
      setMessage(data.articles.length ? "" : (data.message || "아직 저장된 뉴스가 없습니다."));
    } catch {
      setMessage("뉴스를 불러오지 못했습니다. 잠시 후 다시 눌러 주세요.");
    }
  }

  return { articles, message };
}

export function useWelfare() {
  const [cards, setCards] = useState<WelfareCard[]>([]);
  const [placeLabel, setPlaceLabel] = useState("");
  const [message, setMessage] = useState("저장된 복지를 불러오고 있어요.");

  useEffect(() => {
    const region = loadGuardian().region || "서울";
    void load(region);
  }, []);

  async function load(region: string) {
    try {
      const data = await postJson<{ ok: boolean; place?: string; cards?: WelfareCard[]; message?: string }>("/api/welfare", {
        region,
        category: "all",
      });
      if (!data.ok || !data.cards) {
        setMessage(data.message || "복지 정보를 불러오지 못했습니다. 잠시 후 다시 눌러 주세요.");
        return;
      }
      setPlaceLabel(data.place || region);
      setCards(data.cards);
      setMessage(data.cards.length ? "" : (data.message || "아직 저장된 복지가 없습니다."));
    } catch {
      setMessage("복지 정보를 불러오지 못했습니다. 잠시 후 다시 눌러 주세요.");
    }
  }

  return { cards, placeLabel, message };
}

export function useCareReads() {
  const [choices, setChoices] = useState<string[]>([]);
  const [dangerCount, setDangerCount] = useState<number | null>(null);

  useEffect(() => {
    const familyCode = ensureFamilyCode();

    void fetch(`/api/activity?familyCode=${encodeURIComponent(familyCode)}`)
      .then((response) => response.json())
      .then((data: { count?: number }) => setDangerCount(typeof data.count === "number" ? data.count : 0))
      .catch(() => setDangerCount(0));

    void postJson<{ videos?: VideoItem[] }>("/api/videos", {})
      .then((data) => {
        const names = [...new Set((data.videos ?? []).map((video) => video.channel).filter(Boolean))].sort();
        setChoices(names);
      })
      .catch(() => setChoices([]));
  }, []);

  return { choices, dangerCount };
}
