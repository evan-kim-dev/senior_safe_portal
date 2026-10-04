/** 화면이 부르는 API. Gemini 키는 여기 없다. */

export type CheckKind = "link" | "video";
export type CheckVerdict = "safe" | "danger";

export type CheckRequest = { url: string; familyCode?: string };

export type CheckSuccess = {
  ok: true;
  url: string;
  kind: CheckKind;
  verdict: CheckVerdict;
  headline: "괜찮아요" | "누르지 마세요";
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
};

export type NewsItem = {
  title: string;
  source: string;
  date: string;
};

export type WelfareCard = {
  title: string;
  target: string;
  apply: string;
  kind: string;
};

export type ChatRequest = {
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
};

export type ChatResponse =
  | { ok: true; reply: string; linkUrl: string }
  | { ok: false; message: string };
