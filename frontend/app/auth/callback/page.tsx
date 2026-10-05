"use client";

import { useEffect, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { BigButton, Screen, Status } from "@/components/ui";
import { getSupabase, safeNextPath } from "@/lib/client/supabase-browser";
import { homePathForAccount } from "@/lib/domain/account-profile";

const OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function readHashParams(): URLSearchParams {
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  return new URLSearchParams(hash);
}

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("확인하고 있어요…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const supabase = getSupabase();
      const query = new URLSearchParams(window.location.search);
      const hash = readHashParams();
      const nextParam = query.get("next") ?? hash.get("next");

      if (!supabase) {
        if (!cancelled) {
          setFailed(true);
          setMessage("지금 로그인할 수 없어요.");
        }
        return;
      }

      const authError = query.get("error_description") || query.get("error") || hash.get("error_description") || hash.get("error");
      if (authError) {
        if (!cancelled) {
          setFailed(true);
          setMessage("링크가 만료됐거나 이미 사용됐어요. 다시 로그인해 주세요.");
        }
        return;
      }

      async function goHome() {
        const { data } = await supabase!.auth.getUser();
        const fallback = homePathForAccount(data.user);
        if (!cancelled) window.location.replace(safeNextPath(nextParam, fallback));
      }

      try {
        const code = query.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          await goHome();
          return;
        }

        const tokenHash = query.get("token_hash") || hash.get("token_hash");
        const typeRaw = query.get("type") || hash.get("type") || "signup";
        if (tokenHash && OTP_TYPES.has(typeRaw)) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: typeRaw as EmailOtpType,
          });
          if (error) throw error;
          await goHome();
          return;
        }

        // 해시 토큰·이미 열린 세션도 허용한다.
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (data.session) {
            await goHome();
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
        throw new Error("no session");
      } catch {
        if (!cancelled) {
          setFailed(true);
          setMessage("링크가 만료됐어요. 메일을 다시 받거나 로그인해 주세요.");
        }
      }
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Screen title="로그인" lead="잠시만 기다려 주세요." narrow busy={!failed}>
      <Status>{message}</Status>
      {failed ? (
        <>
          <BigButton href="/login">로그인으로</BigButton>
          <p className="auth-links">
            <a className="auth-link" href="/login?mode=signup">다시 가입하기</a>
          </p>
        </>
      ) : null}
    </Screen>
  );
}
