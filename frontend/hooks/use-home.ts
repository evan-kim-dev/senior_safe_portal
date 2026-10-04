"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { postJson } from "@/lib/client/api";
import { authHeaders } from "@/lib/client/auth-headers";
import { readPendingCheck } from "@/lib/client/check-bridge";
import { clearClipboardAllowed, hasClipboardPermission, markClipboardAllowed, readClipboardHttpUrl } from "@/lib/client/clipboard";
import { tellFamily } from "@/lib/client/family-notify";
import { loadGuardian } from "@/lib/client/guardian";
import { loadRecent, rememberCheck } from "@/lib/client/history";
import { addNote, deleteNote, loadNotes, updateNote } from "@/lib/client/notes";
import { MESSAGES } from "@/lib/domain/messages";
import type { CheckResponse, CheckSuccess, Note, RecentCheck } from "@/lib/domain/types";
import { isCheckableAddress, normalizeSubmittedUrl } from "@/lib/domain/url";
import { useAliveRef } from "./use-alive";

/** 서버 maxDuration(60초)보다 조금 길게 기다린다. */
const CHECK_TIMEOUT_MS = 65_000;

export type HomeView =
  | { name: "home" }
  | { name: "checking" }
  | { name: "result"; result: CheckSuccess }
  | { name: "error"; message: string }
  | { name: "note"; id: string };

function isCheckResponse(value: unknown): value is CheckResponse {
  return Boolean(value) && typeof value === "object" && typeof (value as { ok?: unknown }).ok === "boolean";
}

export function useHome() {
  const [screen, setScreen] = useState<HomeView>({ name: "home" });
  const [url, setUrl] = useState("");
  const [homeMessage, setHomeMessage] = useState("");
  const [recent, setRecent] = useState<RecentCheck[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [familyPhone, setFamilyPhone] = useState("");
  const checkingRef = useRef(false);
  const aliveRef = useAliveRef();

  const runCheck = useCallback(
    async (target: string) => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      setScreen({ name: "checking" });

      try {
        const data = await postJson<unknown>(
          "/api/check",
          { url: target, familyCode: loadGuardian().familyCode },
          { timeoutMs: CHECK_TIMEOUT_MS, headers: await authHeaders() },
        );
        if (!aliveRef.current) return;
        if (!isCheckResponse(data)) {
          setScreen({ name: "error", message: MESSAGES.checkFailed });
          return;
        }
        if (!data.ok) {
          setScreen({ name: "error", message: data.message || MESSAGES.checkFailed });
          return;
        }
        setRecent(rememberCheck({ url: data.url, title: data.title, verdict: data.verdict }));
        setScreen({ name: "result", result: data });
      } catch {
        if (aliveRef.current) setScreen({ name: "error", message: MESSAGES.checkFailed });
      } finally {
        checkingRef.current = false;
      }
    },
    [aliveRef],
  );

  useEffect(() => {
    setRecent(loadRecent());
    setNotes(loadNotes());
    setFamilyPhone(loadGuardian().phone);
  }, []);

  useEffect(() => {
    const pending = readPendingCheck();
    if (!pending) return;
    setUrl(pending.url);
    if (pending.run) void runCheck(pending.url);
  }, [runCheck]);

  useEffect(() => {
    async function fillClipboardUrl() {
      if (!(await hasClipboardPermission())) return;
      try {
        const found = await readClipboardHttpUrl();
        if (found && aliveRef.current) setUrl(found);
      } catch {
        clearClipboardAllowed();
      }
    }

    const onVisible = () => {
      if (document.visibilityState !== "visible" || checkingRef.current) return;
      void fillClipboardUrl();
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [aliveRef]);

  async function pasteAndCheck() {
    setHomeMessage("");

    let found: string | null = null;
    try {
      found = await readClipboardHttpUrl();
    } catch {
      clearClipboardAllowed();
      setHomeMessage("주소를 읽지 못했습니다. 주소를 직접 적어 주세요.");
      return;
    }

    if (!found) {
      setHomeMessage("복사한 내용에 인터넷 주소가 없습니다.");
      return;
    }

    markClipboardAllowed();
    setUrl(found);
    await runCheck(found);
  }

  async function submitCheck() {
    setHomeMessage("");
    const raw = url.trim();
    if (!raw) {
      setHomeMessage("주소를 붙여 넣으세요.");
      return;
    }
    if (!isCheckableAddress(raw)) {
      setNotes(addNote(raw));
      setUrl("");
      setHomeMessage("주소가 아니라서 적어 두었습니다.");
      return;
    }
    const next = normalizeSubmittedUrl(raw);
    if (!next) {
      setHomeMessage("주소를 붙여 넣으세요.");
      return;
    }
    await runCheck(next);
  }

  function backHome() {
    setUrl("");
    setHomeMessage("");
    setScreen({ name: "home" });
  }

  function removeNote(id: string) {
    setNotes(deleteNote(id));
    setScreen({ name: "home" });
  }

  function saveNote(id: string) {
    setNotes(updateNote(id, noteDraft));
    setScreen({ name: "home" });
  }

  function openNote(note: Note) {
    setNoteDraft(note.text);
    setScreen({ name: "note", id: note.id });
  }

  return {
    screen,
    url,
    setUrl,
    homeMessage,
    recent,
    notes,
    noteDraft,
    setNoteDraft,
    familyPhone,
    pasteAndCheck,
    submitCheck,
    backHome,
    removeNote,
    saveNote,
    openNote,
    tellFamily,
  };
}
