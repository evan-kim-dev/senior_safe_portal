"use client";

import { BigButton, Field, Group, LineButton, Result, Row, Screen, Status } from "@/components/ui";
import { useHome } from "@/hooks/use-home";
import { kindLabel, MAX_URL_LENGTH } from "@/lib/domain/url";
import { headlineFor } from "@/lib/domain/verdict";

export default function HomePage() {
  const home = useHome();

  if (home.screen.name === "checking") {
    return (
      <Screen
        center
        live="polite"
        busy
        secondary={<LineButton disabled>붙여넣기</LineButton>}
        primary={<BigButton disabled>검사하기</BigButton>}
      >
        확인하고 있어요
      </Screen>
    );
  }

  if (home.screen.name === "result") {
    const { result } = home.screen;
    return (
      <Result
        tone={result.verdict === "safe" ? "safe" : "danger"}
        word={result.headline}
        reason={`${kindLabel(result.kind)}. ${result.reason}`}
        secondary={result.verdict === "danger" && home.familyPhone ? (
          <LineButton onClick={() => home.tellFamily(result.url)}>가족에게 말하기</LineButton>
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
        secondary={<LineButton onClick={() => home.removeNote(noteId)}>지우기</LineButton>}
        primary={<BigButton onClick={() => home.saveNote(noteId)}>저장</BigButton>}
      >
        <Field id="note-edit" label="내용" multiline maxLength={2000} value={home.noteDraft} onChange={(event) => home.setNoteDraft(event.target.value)} />
      </Screen>
    );
  }

  return (
    <Screen
      title="이 링크, 괜찮나요?"
      secondary={<LineButton onClick={() => void home.pasteAndCheck()}>붙여넣기</LineButton>}
      primary={<BigButton onClick={() => void home.submitCheck()}>검사하기</BigButton>}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void home.submitCheck();
        }}
      >
        <Field
          id="url"
          label="주소"
          value={home.url}
          placeholder="주소를 붙여 넣으세요"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="url"
          enterKeyHint="go"
          maxLength={MAX_URL_LENGTH}
          onChange={(event) => home.setUrl(event.target.value)}
        />
      </form>
      {home.homeMessage ? <Status>{home.homeMessage}</Status> : null}
      <Group label="최근 검사" title="최근 검사">
        {home.recent.length === 0 ? <Status>아직 검사한 주소가 없습니다.</Status> : home.recent.map((item) => (
          <Row key={item.url} tone={item.verdict}>{`${headlineFor(item.verdict)} ${item.title}`}</Row>
        ))}
      </Group>
      <Group label="적어 둔 것" title="적어 둔 것">
        {home.notes.length === 0 ? <Status>주소가 아닌 말은 여기에 남습니다.</Status> : home.notes.map((note) => (
          <Row key={note.id} onClick={() => home.openNote(note)}>{note.text}</Row>
        ))}
      </Group>
    </Screen>
  );
}
