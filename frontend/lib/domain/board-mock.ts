/** 게시판 데모용 목업. DB 시드(author_id = board-demo)와 같은 내용. */
export const BOARD_DEMO_AUTHOR_ID = "board-demo";

export const BOARD_MOCK_POSTS: ReadonlyArray<{
  author_name: string;
  title: string;
  content: string;
  /** 최근순 정렬용 오프셋(시간). */
  hoursAgo: number;
}> = [
  {
    author_name: "김순자",
    title: "택배 문자에 온 링크, 누르지 마세요",
    content:
      "어제 저녁에 「택배가 도착하지 못했습니다」라는 문자가 왔어요. 링크를 누르라고 해서 불안했는데, 시니어 안심에서 주소를 검사하니 위험하다고 나왔습니다. 비슷한 문자가 오면 먼저 검사해 보세요.",
    hoursAgo: 5,
  },
  {
    author_name: "이영수",
    title: "경찰 사칭 전화 받았습니다",
    content:
      "검찰이라며 계좌가 범죄에 쓰였다고 했어요. 돈을 다른 계좌로 옮기라고 해서 끊었습니다. 진짜 경찰은 전화로 이체를 시키지 않는다고 들었어요. 이런 전화는 112에 바로 알리세요.",
    hoursAgo: 18,
  },
  {
    author_name: "박말숙",
    title: "아들 카톡인데 급하게 돈 달래요",
    content:
      "카톡 프로필은 아들인데 「폰이 고장 나서 다른 번호로 보낸다」며 계좌를 알려 달라고 했습니다. 아들에게 전화해 보니 본인이 아니었어요. 가족 사칭이면 먼저 전화로 확인해 주세요.",
    hoursAgo: 30,
  },
  {
    author_name: "최만호",
    title: "유튜브 투자 광고 조심하세요",
    content:
      "영상 중간에 「원금을 보장한다」는 광고가 나왔습니다. 공식 은행·증권 앱이 아닌데 개인정보를 넣으라고 해서 닫았어요. 보장·고수익 말은 사기일 때가 많아요.",
    hoursAgo: 52,
  },
  {
    author_name: "정옥분",
    title: "복지 신청은 복지로에서만",
    content:
      "문자로 「기초연금 추가 신청」 링크가 왔습니다. 시니어 안심 복지 메뉴와 복지로(bokjiro.go.kr)에서만 확인하세요. 개인정보·공인인증을 문자 링크로 요구하면 의심하세요.",
    hoursAgo: 70,
  },
  {
    author_name: "한기철",
    title: "원격 조종 앱 설치 요청이 왔어요",
    content:
      "카드사 직원이라며 「확인을 위해 앱을 설치하라」고 했습니다. 설치하지 않았고, 카드사 공식 번호로 다시 물어보니 그런 안내가 없다고 했습니다. 화면 공유·원격 앱은 거절하세요.",
    hoursAgo: 96,
  },
];
