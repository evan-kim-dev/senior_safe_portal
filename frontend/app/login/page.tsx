"use client";

import { useState } from "react";
import type { Provider } from "@supabase/supabase-js";
import { BigButton, Screen, Status } from "@/components/ui";
import { signInWith } from "@/lib/client/supabase-browser";

export default function LoginPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function login(provider: Provider) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    const failure = await signInWith(provider);
    setMessage(failure);
    if (failure) setBusy(false);
  }

  return (
    <Screen title="로그인">
      <Status>글을 쓰려면 로그인해 주세요.</Status>
      <BigButton disabled={busy} onClick={() => void login("kakao")}>카카오로 로그인</BigButton>
      <BigButton disabled={busy} onClick={() => void login("naver" as Provider)}>네이버로 로그인</BigButton>
      <BigButton disabled={busy} onClick={() => void login("google")}>구글로 로그인</BigButton>
      {message ? <Status>{message}</Status> : null}
    </Screen>
  );
}
