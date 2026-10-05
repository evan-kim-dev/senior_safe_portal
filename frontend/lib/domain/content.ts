/** 홈 포털에 고정으로 나오는 안내 문구. 아이콘 이름은 components/icons.tsx 의 IconName 과 맞춘다. */

export const NOTICE = "모르는 링크는 누르기 전에 먼저 검사하세요.";

export type ContentIcon =
  | "link" | "play" | "news" | "heart" | "board" | "users" | "phone"
  | "box" | "mobile" | "bank" | "trend" | "mail" | "gift" | "bell" | "text";

export type QuickLink = { href: string; label: string; icon: ContentIcon; tone: "blue" | "purple" | "green" | "orange" | "red" };

export const QUICK_LINKS: readonly QuickLink[] = [
  { href: "/videos", label: "추천 영상", icon: "play", tone: "red" },
  { href: "/news", label: "뉴스", icon: "news", tone: "purple" },
  { href: "/welfare", label: "복지 혜택", icon: "heart", tone: "green" },
  { href: "/board", label: "게시판", icon: "board", tone: "orange" },
  { href: "/#hotline", label: "신고 전화", icon: "phone", tone: "red" },
];

/** 헤더 메뉴 · 보호자/어르신 연동 링크. */
export const FAMILY_LINKS: readonly { href: string; label: string }[] = [
  { href: "/care", label: "대시보드" },
  { href: "/link", label: "계정연결" },
];

/** 로그인한 사용자 계정 메뉴. */
export const ACCOUNT_LINKS: readonly { href: string; label: string }[] = [
  { href: "/account", label: "계정 관리" },
];

/** 메뉴 하단 도움말·약관. */
export const HELP_LINKS: readonly { href: string; label: string }[] = [
  { href: "/#hotline", label: "신고 전화" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/terms", label: "이용약관" },
];

export type ScamType = {
  id: string;
  icon: ContentIcon;
  title: string;
  tip: string;
  question: string;
};

export const SCAM_TYPES: readonly ScamType[] = [
  {
    id: "parcel",
    icon: "box",
    title: "택배 문자 사칭",
    tip: "주소 확인 링크는 누르지 말고 택배 앱에서 직접 확인하세요.",
    question: "택배 주소 확인하라는 문자가 왔어요. 어떻게 해야 하나요?",
  },
  {
    id: "family",
    icon: "mobile",
    title: "가족 사칭 메신저",
    tip: "'폰이 고장났어' 문자는 꼭 원래 번호로 전화해 확인하세요.",
    question: "자녀라면서 폰이 고장났다고 돈을 보내 달래요. 사기인가요?",
  },
  {
    id: "agency",
    icon: "bank",
    title: "검찰·금융기관 사칭",
    tip: "수사기관과 금융기관은 전화로 돈을 옮기라고 하지 않아요.",
    question: "검찰이라며 계좌가 범죄에 쓰였다고 전화가 왔어요. 어떻게 하죠?",
  },
  {
    id: "invest",
    icon: "trend",
    title: "고수익 투자 권유",
    tip: "원금 보장, 고수익 약속은 사기일 가능성이 커요.",
    question: "원금 보장에 고수익이라는 투자 권유를 받았어요. 믿어도 되나요?",
  },
  {
    id: "invite",
    icon: "mail",
    title: "부고·청첩장 문자",
    tip: "모르는 번호의 부고·청첩장 링크는 열지 마세요.",
    question: "모르는 번호로 부고 문자가 링크와 함께 왔어요. 열어도 되나요?",
  },
  {
    id: "grant",
    icon: "gift",
    title: "지원금 신청 안내",
    tip: "공공기관은 문자 링크로 개인정보나 계좌를 묻지 않아요.",
    question: "지원금을 받으라며 링크를 눌러 신청하라는 문자가 왔어요. 진짜인가요?",
  },
];

export type SafetyTip = { title: string; text: string; question: string };

/** 뉴스가 비어 있을 때 소식 칸을 채우는 기본 수칙. */
export const SAFETY_TIPS: readonly SafetyTip[] = [
  {
    title: "돈 이야기가 나오면 일단 멈추세요",
    text: "전화나 문자로 돈이나 개인정보를 요구하면 끊고, 가족이나 112에 먼저 확인하세요.",
    question: "전화로 돈을 보내 달라는 요구를 받으면 어떻게 해야 하나요?",
  },
  {
    title: "모르는 앱은 설치하지 마세요",
    text: "원격 조종 앱이나 출처를 모르는 앱 설치를 요구하면 사기일 가능성이 커요.",
    question: "모르는 사람이 앱을 설치하라고 해요. 괜찮을까요?",
  },
  {
    title: "인증번호는 누구에게도 알려 주지 마세요",
    text: "은행이나 기관 직원이라며 문자 인증번호를 물으면 바로 끊으세요.",
    question: "인증번호를 알려 달라는 전화가 왔어요. 어떻게 하죠?",
  },
  {
    title: "보낸 돈은 바로 지급정지를 요청하세요",
    text: "속아서 돈을 보냈다면 은행이나 112에 바로 전화해 지급정지를 요청하세요.",
    question: "사기 같은 계좌로 돈을 보냈어요. 지금 무엇부터 해야 하나요?",
  },
];

export type FamilyFeature = { icon: ContentIcon; title: string; text: string };

export const FAMILY_FEATURES: readonly FamilyFeature[] = [
  { icon: "users", title: "계정으로 연결", text: "자녀가 초대 코드를 만들고, 부모님이 계정연결에서 코드를 넣으면 가족이 이어져요." },
  { icon: "bell", title: "위험 활동을 함께 확인", text: "연결 후 부모님이 위험한 링크·영상을 검사하면 대시보드에 오늘 기록이 보여요." },
  { icon: "text", title: "글자·채널 맞춤", text: "연결이 되면 QR로 부모님 폰 글자 크기와 영상 채널도 맞춰 둘 수 있어요." },
];

export type Hotline = { number: string; org: string; text: string };

export const HOTLINES: readonly Hotline[] = [
  { number: "112", org: "경찰청", text: "보이스피싱·사기 피해 신고" },
  { number: "1332", org: "금융감독원", text: "금융 사기 상담, 피해 구제 안내" },
  { number: "118", org: "한국인터넷진흥원", text: "스팸·해킹·개인정보 침해 상담" },
];

/** 개인정보 보호법상 공개·접근이 필요한 문서. 개인정보처리방침은 강조 표시. */
export const LEGAL_LINKS: readonly { href: string; label: string; emphasize?: boolean }[] = [
  { href: "/privacy", label: "개인정보처리방침", emphasize: true },
  { href: "/terms", label: "이용약관" },
];

export function telHref(number: string): string {
  return `tel:${number.replace(/[^\d]/g, "")}`;
}
