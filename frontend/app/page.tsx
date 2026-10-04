"use client";

import { NewsSection, VideoRail, WelfareSection } from "@/components/home/HomeFeeds";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeRecords } from "@/components/home/HomeRecords";
import { Hotlines, QuickMenu, ScamRail } from "@/components/home/HomeSections";
import { BigButton, Checking, Field, LineButton, Result, Screen } from "@/components/ui";
import { useHome } from "@/hooks/use-home";
import { kindLabel } from "@/lib/domain/url";

export default function HomePage() {
  const home = useHome();

  if (home.screen.name === "checking") {
    return <Checking word="확인하고 있어요" hint="잠시만 기다려 주세요." />;
  }

  if (home.screen.name === "result") {
    const { result } = home.screen;
    return (
      <Result
        tone={result.verdict === "safe" ? "safe" : "danger"}
        word={result.headline}
        reason={`${kindLabel(result.kind)}. ${result.reason}`}
        secondary={result.verdict === "danger" && home.familyPhone ? (
          <LineButton icon="phone" onClick={() => home.tellFamily(result.url)}>가족에게 말하기</LineButton>
        ) : null}
        primary={<BigButton onClick={home.backHome}>다시 검사</BigButton>}
      />
    );
  }

  if (home.screen.name === "error") {
    return (
      <Result
        tone="plain"
        word="확인하지 못했어요"
        reason={home.screen.message}
        primary={<BigButton onClick={home.backHome}>다시 검사</BigButton>}
      />
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

  return (
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
  );
}
