import { describe, expect, it } from "vitest";
import {
  MAX_VIDEOS,
  mapNews,
  mapVideos,
  mapWelfare,
  rankWelfareCards,
  suspiciousUrlIn,
} from "@/lib/domain/feeds";
import { channelChoices, toNewsView, toVideoView, toWelfareView } from "@/lib/domain/feed-view";
import { FEED_MESSAGES } from "@/lib/domain/messages";
import type { VideoItem } from "@/lib/domain/types";

function video(id: string, extra: Record<string, unknown> = {}) {
  return { video_id: id, title: "제목 &amp; 부제", channel: "채널", description: "", ...extra };
}

describe("mapVideos", () => {
  it("형식이 틀린 id 와 중복을 버리고 20개까지만 둔다", () => {
    const ids = Array.from({ length: 30 }, (_, index) => `abcdefghi${String(index).padStart(2, "0")}`);
    const rows = [{ videos: [video("bad"), video('"><script>'), ...ids.map((id) => video(id))] }, { videos: [video(ids[0])] }];
    const result = mapVideos(rows);
    expect(result).toHaveLength(MAX_VIDEOS);
    expect(new Set(result.map((item) => item.id)).size).toBe(MAX_VIDEOS);
    expect(result[0].title).toBe("제목 & 부제");
  });

  it("https 가 아닌 썸네일은 유튜브 기본 썸네일로 바꾼다", () => {
    const [item] = mapVideos([{ videos: [video("abcdefghijk", { thumbnail: "javascript:alert(1)" })] }]);
    expect(item.thumbnail).toBe("https://img.youtube.com/vi/abcdefghijk/hqdefault.jpg");
  });

  it("videos 가 배열이 아니어도 깨지지 않는다", () => {
    expect(mapVideos([{ videos: "oops" }, {}])).toEqual([]);
  });

  it("카테고리별로 번갈아 넣어 한쪽만 앞줄을 채우지 않는다", () => {
    const music = ["aaaaaaaaaaa", "bbbbbbbbbbb", "ccccccccccc"].map((id) => video(id));
    const news = ["ddddddddddd", "eeeeeeeeeee", "fffffffffff"].map((id) => video(id));
    const result = mapVideos([{ videos: music }, { videos: news }]);
    expect(result.map((item) => item.id)).toEqual([
      "aaaaaaaaaaa",
      "ddddddddddd",
      "bbbbbbbbbbb",
      "eeeeeeeeeee",
      "ccccccccccc",
      "fffffffffff",
    ]);
  });

  it("선호 카테고리를 앞에 더 많이 둔다", () => {
    const music = ["aaaaaaaaaaa", "bbbbbbbbbbb", "ccccccccccc"].map((id) => video(id));
    const news = ["ddddddddddd", "eeeeeeeeeee", "fffffffffff"].map((id) => video(id));
    const result = mapVideos(
      [
        { category_id: "scam", videos: music },
        { category_id: "digital", videos: news },
      ],
      { preferredCategories: ["digital", "scam"] },
    );
    expect(result.map((item) => item.id).slice(0, 5)).toEqual([
      "ddddddddddd",
      "eeeeeeeeeee",
      "fffffffffff",
      "aaaaaaaaaaa",
      "bbbbbbbbbbb",
    ]);
    expect(result[0].categoryId).toBe("digital");
  });
});

describe("suspiciousUrlIn", () => {
  it("유튜브 밖으로 나가는 첫 주소", () => {
    expect(suspiciousUrlIn("https://youtu.be/x 그리고 https://scam.kr/pay.")).toBe("https://scam.kr/pay");
    expect(suspiciousUrlIn("https://www.youtube.com/@ch")).toBe("");
  });
});

describe("mapNews", () => {
  it("http 주소가 없는 기사는 버리고 출처는 호스트, 뉴스 썸네일은 https CDN 허용", () => {
    const result = mapNews([
      {
        articles: [
          {
            title: "&quot;속보&quot;",
            originallink: "https://www.news.co.kr/1",
            pubDate: "Mon",
            thumbnail: "https://imgnews.pstatic.net/a.jpg",
          },
          {
            title: "매체 CDN",
            originallink: "https://www.news.co.kr/2",
            thumbnail: "https://cdn.news.co.kr/a.jpg",
          },
          {
            title: "위험 스킴",
            originallink: "https://www.news.co.kr/3",
            thumbnail: "javascript:alert(1)",
          },
          { title: "주소 없음", link: "" },
        ],
      },
    ]);
    expect(result).toEqual([
      {
        title: "\"속보\"",
        source: "news.co.kr",
        date: "Mon",
        url: "https://www.news.co.kr/1",
        image: "https://imgnews.pstatic.net/a.jpg",
      },
      {
        title: "매체 CDN",
        source: "news.co.kr",
        date: "",
        url: "https://www.news.co.kr/2",
        image: "https://cdn.news.co.kr/a.jpg",
      },
      {
        title: "위험 스킴",
        source: "news.co.kr",
        date: "",
        url: "https://www.news.co.kr/3",
        image: "",
      },
    ]);
  });

  it("선호 뉴스 카테고리를 앞에 더 많이 둔다", () => {
    const result = mapNews(
      [
        {
          category_id: "affairs",
          articles: [
            { title: "시사1", originallink: "https://a.com/1", pubDate: "A", publisher: "a.com" },
            { title: "시사2", originallink: "https://a.com/2", pubDate: "B", publisher: "a.com" },
          ],
        },
        {
          category_id: "health",
          articles: [
            { title: "건강1", originallink: "https://h.com/1", pubDate: "C", publisher: "h.com" },
            { title: "건강2", originallink: "https://h.com/2", pubDate: "D", publisher: "h.com" },
            { title: "건강3", originallink: "https://h.com/3", pubDate: "E", publisher: "h.com" },
          ],
        },
      ],
      { preferredCategories: ["health", "affairs"] },
    );
    expect(result.map((item) => item.title).slice(0, 5)).toEqual([
      "건강1",
      "건강2",
      "건강3",
      "시사1",
      "시사2",
    ]);
    expect(result[0].categoryId).toBe("health");
  });
});

describe("rankWelfareCards", () => {
  it("키워드가 맞는 카드를 앞으로 보낸다", () => {
    const ranked = rankWelfareCards(
      [
        { title: "청년 일자리", target: "청년", apply: "온라인", kind: "전국" },
        { title: "기초연금", target: "어르신", apply: "주민센터", kind: "우리 동네" },
      ],
      ["기초연금", "어르신"],
    );
    expect(ranked[0].title).toBe("기초연금");
  });
});

describe("mapWelfare", () => {
  it("지역+전국을 합치고 이름 없는 서비스는 버린다", () => {
    const result = mapWelfare(
      {
        region: "서울",
        city: "강남구",
        services: [{ servNm: " 돌봄  지원 ", target: "65세 이상", applicationMethod: "주민센터 방문" }, { servNm: "" }],
        nationalServices: [{ servNm: "기초연금", summary: "소득 하위", onlineAvailable: "Y", source: "national" }],
      },
      "서울",
    );
    expect(result.place).toBe("서울 강남구");
    expect(result.cards).toEqual([
      { title: "돌봄 지원", target: "65세 이상", apply: "주민센터 방문", kind: "우리 동네", href: "https://www.bokjiro.go.kr/" },
      { title: "기초연금", target: "소득 하위", apply: "온라인으로 신청할 수 있습니다.", kind: "전국", href: "https://www.bokjiro.go.kr/" },
    ]);
  });

  it("지역 정보가 없으면 요청한 지역을 쓴다", () => {
    expect(mapWelfare({}, "부산")).toEqual({ place: "부산", cards: [] });
  });

  it("65세·노인 관련 아닌 복지는 걸러 낸다", () => {
    const result = mapWelfare(
      {
        services: [
          { servNm: "청년 주거", target: "만 19~39세", applicationMethod: "온라인" },
          { servNm: "아이돌봄 지원", target: "영유아 가정", applicationMethod: "온라인" },
        ],
      },
      "서울",
    );
    expect(result.cards).toEqual([]);
  });

  it("신청 안내의 URL 글씨는 빼고 읽기 쉬운 문장만 둔다", () => {
    const result = mapWelfare(
      {
        services: [{
          servNm: "기초연금",
          target: "65세 이상",
          applicationMethod: "https://www.bokjiro.go.kr/ 에서 신청",
          link: "https://www.bokjiro.go.kr/",
        }],
      },
      "서울",
    );
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].apply).not.toMatch(/https?:\/\//i);
    expect(result.cards[0].apply).not.toMatch(/bokjiro/i);
  });
});

describe("feed views", () => {
  const items: VideoItem[] = [
    { id: "a", title: "", thumbnail: "", description: "", suspiciousUrl: "", channel: "KBS" },
    { id: "b", title: "", thumbnail: "", description: "", suspiciousUrl: "", channel: "EBS" },
  ];

  it("보호자가 고른 채널만 보여 준다", () => {
    expect(toVideoView({ ok: true, videos: items }, ["EBS"]).videos.map((item) => item.id)).toEqual(["b"]);
    expect(toVideoView({ ok: true, videos: items }, ["MBC"]).message).toBe(FEED_MESSAGES.videos.empty);
  });

  it("실패는 화면 문구로 바뀐다", () => {
    expect(toVideoView(null, []).message).toBe(FEED_MESSAGES.videos.failed);
    expect(toNewsView({ ok: false, message: "서버 문장" }).message).toBe("서버 문장");
    expect(toWelfareView({ ok: true, cards: [], message: "비었음" }, "서울")).toEqual({
      cards: [],
      placeLabel: "서울",
      message: "비었음",
      updatedAt: null,
    });
  });

  it("채널 목록은 중복 없이 정렬", () => {
    expect(channelChoices([...items, items[0]])).toEqual(["EBS", "KBS"]);
  });
});
