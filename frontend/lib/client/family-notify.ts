import { buildFamilyLinks } from "@/lib/domain/family";
import { loadGuardian } from "./guardian";

const FALLBACK_TO_SMS_MS = 700;

/** 카카오톡을 먼저 열고, 앱이 없어 화면이 그대로면 문자를 연다. */
export function tellFamily(url: string) {
  const links = buildFamilyLinks(loadGuardian().phone, url, /iPad|iPhone|iPod/.test(navigator.userAgent));
  if (!links) return;

  window.location.href = links.kakao;
  window.setTimeout(() => {
    if (document.visibilityState === "visible") window.location.href = links.sms;
  }, FALLBACK_TO_SMS_MS);
}
