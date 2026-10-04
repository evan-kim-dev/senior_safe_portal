import type { Note } from "./types";

const KEY = "senior-safe-notes";

export function loadNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is Note =>
      Boolean(item) && typeof item.id === "string" && typeof item.text === "string" && item.text.trim().length > 0,
    );
  } catch {
    return [];
  }
}

export function addNote(text: string): Note[] {
  const note = { id: `${Date.now()}`, text: text.trim() };
  const next = [note, ...loadNotes()];
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function updateNote(id: string, text: string): Note[] {
  const next = loadNotes().map((note) => (note.id === id ? { ...note, text: text.trim() } : note));
  window.localStorage.setItem(KEY, JSON.stringify(next.filter((note) => note.text)));
  return next.filter((note) => note.text);
}

export function deleteNote(id: string): Note[] {
  const next = loadNotes().filter((note) => note.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
