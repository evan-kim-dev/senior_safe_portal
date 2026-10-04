/** 서버와 화면이 함께 쓰는 안내 문구. 같은 문장을 여러 곳에 적지 않는다. */
export const MESSAGES = {
  checkFailed: "확인하지 못했어요. 잠시 후 다시 눌러 주세요.",
  urlRequired: "주소를 넣어 주세요.",
  urlTooLong: "주소가 너무 깁니다.",
  loadFailed: "지금 불러오지 못했습니다. 잠시 후 다시 눌러 주세요.",
  emptyFeed: "아직 저장된 내용이 없습니다. 나중에 다시 열어 주세요.",
  categoryInvalid: "분류를 확인해 주세요.",
  welfareBadRequest: "지역을 확인해 주세요.",
  welfareRegionRequired: "지역을 눌러 주세요.",
  chatSendFailed: "질문을 보내지 못했습니다.",
  chatEmpty: "궁금한 점을 적어 주세요.",
  chatTooLong: "질문은 2000자 이내로 적어 주세요.",
  chatNoReply: "답을 받지 못했습니다. 잠시 후 다시 물어봐 주세요.",
  bodyTooLarge: "보낸 내용이 너무 깁니다.",
  tooManyRequests: "너무 자주 눌렀어요. 잠시 후 다시 눌러 주세요.",
  unexpected: "문제가 생겼어요. 잠시 후 다시 눌러 주세요.",
  boardDraftRequired: "이름, 제목, 내용을 모두 적어 주세요.",
  loginRequired: "로그인해 주세요.",
  familyCreateFailed: "가족을 만들지 못했어요. 잠시 후 다시 눌러 주세요.",
  familyJoinFailed: "연결하지 못했어요. 코드를 다시 확인해 주세요.",
  familyInviteInvalid: "초대 코드가 올바르지 않아요.",
  familyInviteExpired: "초대 코드가 만료됐어요. 자녀에게 새 코드를 받아 주세요.",
  familyInviteUsed: "이미 사용된 초대 코드예요.",
  familyAlreadyMember: "이미 가족에 연결되어 있어요.",
  familyNotFound: "연결된 가족이 없어요.",
  familyLoadFailed: "가족 정보를 불러오지 못했어요.",
} as const;

export const FEED_MESSAGES = {
  videos: {
    loading: "저장된 영상을 불러오고 있어요.",
    failed: "영상을 불러오지 못했습니다. 잠시 후 다시 눌러 주세요.",
    empty: "아직 저장된 영상이 없습니다.",
  },
  news: {
    loading: "저장된 뉴스를 불러오고 있어요.",
    failed: "뉴스를 불러오지 못했습니다. 잠시 후 다시 눌러 주세요.",
    empty: "아직 저장된 뉴스가 없습니다.",
  },
  welfare: {
    loading: "저장된 복지를 불러오고 있어요.",
    failed: "복지 정보를 불러오지 못했습니다. 잠시 후 다시 눌러 주세요.",
    empty: "아직 저장된 복지가 없습니다.",
  },
} as const;
