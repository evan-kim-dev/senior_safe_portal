"use client";

import { useEffect, useState } from "react";
import type { Provider } from "@supabase/supabase-js";
import { BigButton, Screen, Status } from "@/components/ui";
import { safeNextPath, signInWith } from "@/lib/client/supabase-browser";

function readNext(): string {
  if (typeof window === "undefined") return "/board";
  return safeNextPath(new URLSearchParams(window.location.search).get("next"), "/board");
}

export default function LoginPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState("/board");

  useEffect(() => {
    setNext(readNext());
  }, []);

  const lead = next === "/care" || next === "/link"
    ? "가족 연동을 하려면 로그인해 주세요."
    : "글을 쓰려면 로그인해 주세요.";

  async function login(provider: Provider) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    const failure = await signInWith(provider, readNext());
    setMessage(failure);
    if (failure) setBusy(false);
  }

  return (
    <Screen title="로그인" lead={lead} narrow>
      <BigButton tone="kakao" disabled={busy} onClick={() => void login("kakao")}>카카오로 로그인</BigButton>
      <BigButton tone="naver" disabled={busy} onClick={() => void login("naver" as Provider)}>네이버로 로그인</BigButton>
      <BigButton tone="google" disabled={busy} onClick={() => void login("google")}>구글로 로그인</BigButton>
      {message ? <Status>{message}</Status> : null}
    </Screen>
  );
}
