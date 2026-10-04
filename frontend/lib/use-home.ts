"use client";

import { useEffect, useRef, useState } from "react";
import { readPendingCheck } from "./check-bridge";
import {
  clearClipboardAllowed,
  hasClipboardPermission,
  markClipboardAllowed,
  readClipboardHttpUrl,
} from "./clipboard";
import { loadGuardian, tellFamily } from "./guardian";
import { loadRecent, rememberCheck } from "./history";
import { addNote, deleteNote, loadNotes, updateNote } from "./notes";
import { postJson } from "./post-json";
import type { CheckResponse, CheckSuccess, Note, RecentCheck } from "./types";
import { isCheckableAddress, normalizeSubmittedUrl } from "./url";

type HomeView =
  | { name: "home" }
  | { name: "checking" }
  | { name: "result"; result: CheckSuccess }
  | { name: "error"; message: string }
  | { name: "note"; id: string };

export function useHome() {
  const [screen, setScreen] = useState<HomeView>({ name: "home" });
  const [url, setUrl] = useState("");
  const [homeMessage, setHomeMessage] = useState("");
  const [recent, setRecent] = useState<RecentCheck[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [familyPhone, setFamilyPhone] = useState("");
  const screenRef = useRef(screen);
  screenRef.current = screen;

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
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (screenRef.current.name === "checking") return;
      void fillClipboardUrl();
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  async function fillClipboardUrl() {
    if (!(await hasClipboardPermission())) return;

    try {
      const found = await readClipboardHttpUrl();
      if (found) setUrl(found);
    } catch {
      clearClipboardAllowed();
    }
  }

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

  async function runCheck(target: string) {
    setScreen({ name: "checking" });

    try {
      const data = await postJson<CheckResponse>("/api/check", {
        url: target,
        familyCode: loadGuardian().familyCode,
      });

      if (!data.ok) {
        setScreen({ name: "error", message: data.message });
        return;
      }

      setRecent(rememberCheck({ url: data.url, title: data.title, verdict: data.verdict }));
      setScreen({ name: "result", result: data });
    } catch {
      setScreen({ name: "error", message: "확인하지 못했어요. 잠시 후 다시 눌러 주세요." });
    }
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
