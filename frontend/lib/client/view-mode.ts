import { readJson, writeJson } from "./storage";

export type ViewMode = "auto" | "web" | "app";

const KEY = "senior-safe-view";
const WEB_MQ = "(min-width: 1024px)";

export function isViewMode(value: unknown): value is ViewMode {
  return value === "auto" || value === "web" || value === "app";
}

export function loadViewMode(): ViewMode {
  const parsed = readJson(KEY);
  if (isViewMode(parsed)) return parsed;
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const mode = (parsed as { mode?: unknown }).mode;
    if (isViewMode(mode)) return mode;
  }
  return "auto";
}

export function saveViewMode(mode: ViewMode): ViewMode {
  writeJson(KEY, mode);
  applyViewMode(mode);
  return mode;
}

export type ShellKind = "web" | "app";

/** 창 너비 기준 기본 화면(자동일 때). */
export function naturalShell(): ShellKind {
  if (typeof window === "undefined") return "app";
  return window.matchMedia(WEB_MQ).matches ? "web" : "app";
}

export function resolveShell(mode: ViewMode = loadViewMode()): ShellKind {
  return mode === "auto" ? naturalShell() : mode;
}

/** html[data-view] · body[data-shell] 을 맞춘다. */
export function applyViewMode(mode: ViewMode = loadViewMode()) {
  if (typeof document === "undefined") return;
  const shell = resolveShell(mode);
  document.documentElement.dataset.view = mode;
  document.body.dataset.shell = shell;
}

export { WEB_MQ };
