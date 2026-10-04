"use client";

import { useState } from "react";
import type { Provider } from "@supabase/supabase-js";
import { signInWith } from "@/lib/supabase-browser";
import { BigButton, Screen, Status } from "@/components/ui";

export default function LoginPage() {
  const [message, setMessage] = useState("");

  async function login(provider: Provider) {
    setMessage("");
    setMessage(await signInWith(provider));
  }

  return (
    <Screen title="로그인">
      <Status>글을 쓰려면 로그인해 주세요.</Status>
      <BigButton onClick={() => void login("kakao")}>카카오로 로그인</BigButton>
      <BigButton onClick={() => void login("naver" as Provider)}>네이버로 로그인</BigButton>
      <BigButton onClick={() => void login("google")}>구글로 로그인</BigButton>
      {message ? <Status>{message}</Status> : null}
    </Screen>
  );
}
