"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HomeHero } from "@/components/home/HomeHero";
import { Hotlines, ScamTips } from "@/components/home/HomeSections";
import { BigButton, Checking, Field, LineButton, Result, Screen, Status } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { useHome } from "@/hooks/use-home";
import { loadFamilyMe } from "@/lib/client/family-api";
import { homePathForAccount, isGuardianAccount } from "@/lib/domain/account-profile";
import { MESSAGES } from "@/lib/domain/messages";
import { formatCheckReason } from "@/lib/domain/url";

export default function HomePage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [guardianGate, setGuardianGate] = useState<"checking" | "pass" | "redirect">("checking");
  const home = useHome();
  const overlayOpen =
    home.screen.name === "checking" || home.screen.name === "result" || home.screen.name === "error";

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setGuardianGate("pass");
      return;
    }
    if (isGuardianAccount(user) || homePathForAccount(user) === "/care") {
      setGuardianGate("redirect");
      router.replace("/care");
      return;
    }
    let alive = true;
    void loadFamilyMe()
      .then((data) => {
        if (!alive) return;
        if (data.ok && data.role === "guardian") {
          setGuardianGate("redirect");
          router.replace("/care");
          return;
        }
        setGuardianGate("pass");
      })
      .catch(() => {
        if (alive) setGuardianGate("pass");
      });
    return () => {
      alive = false;
    };
  }, [ready, user, router]);

  useEffect(() => {
    if (!overlayOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [overlayOpen]);

  if (!ready || guardianGate === "checking" || guardianGate === "redirect") {
    return (
      <Screen title="대시보드" lead="관리 화면으로 옮기고 있어요." narrow busy>
        <Status>잠시만 기다려 주세요.</Status>
      </Screen>
    );
  }

  if (home.screen.name === "note") {
    const noteId = home.screen.id;
    return (
      <Screen
        title="적어 둔 것"
        narrow
        secondary={<LineButton onClick={() => home.removeNote(noteId)}>지우기</LineButton>}
        primary={<BigButton onClick={() => home.saveNote(noteId)}>저장</BigButton>}
      >
        <Field id="note-edit" label="내용" multiline maxLength={2000} value={home.noteDraft} onChange={(event) => home.setNoteDraft(event.target.value)} />
      </Screen>
    );
  }

  const checkResult = home.screen.name === "result" ? home.screen.result : null;

  return (
    <>
      <main className="home">
        <HomeHero
          url={home.url}
          message={home.homeMessage}
          onUrl={home.setUrl}
          onSubmit={() => void home.submitCheck()}
          onPaste={() => void home.pasteAndCheck()}
        />
        <ScamTips />
        <Hotlines />
      </main>

      {home.screen.name === "checking" ? (
        <Checking word="확인하고 있어요" hint="잠시만 기다려 주세요." />
      ) : null}

      {checkResult ? (
        <Result
          tone={checkResult.verdict === "safe" ? "safe" : "danger"}
          word={checkResult.headline}
          reason={formatCheckReason(checkResult.url, checkResult.kind, checkResult.reason)}
          onDismiss={home.backHome}
          secondary={
            checkResult.verdict === "safe" ? (
              <LineButton onClick={home.backHome}>다시 검사</LineButton>
            ) : home.familyPhone ? (
              <LineButton icon="phone" onClick={() => home.tellFamily(checkResult.url)}>가족에게 말하기</LineButton>
            ) : undefined
          }
          primary={
            checkResult.verdict === "safe" ? (
              <BigButton href={checkResult.url} icon="arrow">바로가기</BigButton>
            ) : (
              <BigButton onClick={home.backHome}>다시 검사</BigButton>
            )
          }
        />
      ) : null}

      {home.screen.name === "error" ? (
        <Result
          tone="plain"
          word={home.screen.message === MESSAGES.guestLimitReached ? "하루 이용 횟수" : "확인하지 못했어요"}
          reason={home.screen.message}
          onDismiss={home.backHome}
          secondary={
            home.screen.message === MESSAGES.guestLimitReached
              ? <LineButton onClick={home.backHome}>홈으로</LineButton>
              : undefined
          }
          primary={
            home.screen.message === MESSAGES.guestLimitReached
              ? <BigButton href="/login?next=/">로그인하고 더 쓰기</BigButton>
              : <BigButton onClick={home.backHome}>다시 검사</BigButton>
          }
        />
      ) : null}
    </>
  );
}
