"use client";

import { useEffect } from "react";
import { NewsSection, VideoRail, WelfareSection } from "@/components/home/HomeFeeds";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeRecords } from "@/components/home/HomeRecords";
import { Hotlines, QuickMenu, ScamRail } from "@/components/home/HomeSections";
import { BigButton, Checking, Field, LineButton, Result, Screen } from "@/components/ui";
import { useHome } from "@/hooks/use-home";
import { MESSAGES } from "@/lib/domain/messages";
import { formatCheckReason } from "@/lib/domain/url";

export default function HomePage() {
  const home = useHome();
  const overlayOpen =
    home.screen.name === "checking" || home.screen.name === "result" || home.screen.name === "error";

  useEffect(() => {
    if (!overlayOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [overlayOpen]);

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
        <QuickMenu />
        <ScamRail />
        <VideoRail />
        <NewsSection />
        <WelfareSection />
        <HomeRecords recent={home.recent} notes={home.notes} onOpenNote={home.openNote} />
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
