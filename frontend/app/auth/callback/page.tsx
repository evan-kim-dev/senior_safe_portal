"use client";

import { useEffect, useState } from "react";
import { BigButton, Screen, Status } from "@/components/ui";
import { getSupabase, safeNextPath } from "@/lib/client/supabase-browser";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("확인하고 있어요…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const supabase = getSupabase();
      const params = new URLSearchParams(window.location.search);
      const next = safeNextPath(params.get("next"), "/board");
      if (!supabase) {
        if (!cancelled) {
          setFailed(true);
          setMessage("지금 로그인할 수 없어요.");
        }
        return;
      }

      try {
        const code = params.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // 해시 토큰·이미 열린 세션도 허용한다.
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (!data.session) {
            await new Promise((resolve) => setTimeout(resolve, 400));
            const again = await supabase.auth.getSession();
            if (!again.data.session) throw new Error("no session");
          }
        }
        if (!cancelled) window.location.replace(next);
      } catch {
        if (!cancelled) {
          setFailed(true);
          setMessage("링크가 만료됐어요. 다시 로그인해 주세요.");
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
      {failed ? <BigButton href="/login">다시 로그인</BigButton> : null}
    </Screen>
  );
}
