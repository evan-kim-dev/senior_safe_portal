/** 화면과 API가 주고받는 형태. Gemini·Supabase 키는 여기 없다. */

export type CheckKind = "link" | "video";
export type CheckVerdict = "safe" | "danger";
export type CheckHeadline = "괜찮아요" | "누르지 마세요";

export type CheckRequest = { url: string };

export type CheckSuccess = {
  ok: true;
  url: string;
  kind: CheckKind;
  verdict: CheckVerdict;
  headline: CheckHeadline;
  title: string;
  reason: string;
};

export type CheckFailure = { ok: false; message: string };
export type CheckResponse = CheckSuccess | CheckFailure;

export type RecentCheck = {
  url: string;
  title: string;
  verdict: CheckVerdict;
};

export type Note = { id: string; text: string };

export type TextSize = "normal" | "large" | "xlarge";

export type GuardianSettings = {
  name: string;
  phone: string;
  textSize: TextSize;
  channels: string[];
  familyCode: string;
  region: string;
};

export type VideoItem = {
  id: string;
  title: string;
  thumbnail: string;
  description: string;
  suspiciousUrl: string;
  channel: string;
  /** youtube_feeds.category_id — 관심사 추천에 쓴다. */
  categoryId?: string;
};

export type NewsItem = {
  title: string;
  source: string;
  date: string;
  url: string;
  image: string;
  /** news_feeds.category_id — 관심사 맞춤에 쓴다. */
  categoryId?: string;
};

export type WelfareCard = {
  title: string;
  target: string;
  apply: string;
  kind: string;
  href?: string;
};

export type VideosResponse = { ok: boolean; videos?: VideoItem[]; message?: string };
export type NewsResponse = { ok: boolean; articles?: NewsItem[]; message?: string };
export type WelfareResponse = { ok: boolean; place?: string; cards?: WelfareCard[]; message?: string };
export type ActivityResponse = { ok?: boolean; count?: number; message?: string };

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type ChatRequest = {
  message: string;
  history: ChatTurn[];
};

export type ChatResponse =
  | { ok: true; reply: string; linkUrl: string }
  | { ok: false; message: string };

export type BoardPost = {
  id: string;
  user_id: string;
  author_name: string;
  title: string;
  content: string;
  created_at: string;
};
