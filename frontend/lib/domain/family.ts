import { sanitizePhone } from "./setup";

export type FamilyLinks = { kakao: string; sms: string };

/** "가족에게 말하기" 가 여는 카카오톡·문자 주소. 번호가 없으면 null. */
export function buildFamilyLinks(rawPhone: string, url: string, isIOS: boolean): FamilyLinks | null {
  const phone = sanitizePhone(rawPhone);
  if (!phone) return null;

  const text = encodeURIComponent(`이 주소는 누르지 마세요\n${url}`);
  return {
    kakao: `kakaotalk://send?text=${text}`,
    sms: isIOS ? `sms:${phone}&body=${text}` : `sms:${phone}?body=${text}`,
  };
}
