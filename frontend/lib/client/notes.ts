import type { Note } from "@/lib/domain/types";
import { readJson, writeJson } from "./storage";

const KEY = "senior-safe-notes";
const MAX_NOTES = 100;
const MAX_NOTE_LENGTH = 2000;

function isNote(item: unknown): item is Note {
  if (!item || typeof item !== "object") return false;
  const note = item as Partial<Note>;
  return typeof note.id === "string" && typeof note.text === "string" && note.text.trim().length > 0;
}

export function loadNotes(): Note[] {
  const parsed = readJson(KEY);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isNote);
}

function save(notes: Note[]): Note[] {
  const next = notes.filter((note) => note.text).slice(0, MAX_NOTES);
  writeJson(KEY, next);
  return next;
}

export function addNote(text: string): Note[] {
  return save([{ id: `${Date.now()}`, text: text.trim().slice(0, MAX_NOTE_LENGTH) }, ...loadNotes()]);
}

export function updateNote(id: string, text: string): Note[] {
  const clean = text.trim().slice(0, MAX_NOTE_LENGTH);
  return save(loadNotes().map((note) => (note.id === id ? { ...note, text: clean } : note)));
}

export function deleteNote(id: string): Note[] {
  return save(loadNotes().filter((note) => note.id !== id));
}
