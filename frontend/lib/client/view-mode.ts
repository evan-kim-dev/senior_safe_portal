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

/** html[data-view] · body[data-shell] 을 맞춘다. */
export function applyViewMode(mode: ViewMode = loadViewMode()) {
  if (typeof document === "undefined") return;
  const mqWeb = window.matchMedia(WEB_MQ).matches;
  const shell: "web" | "app" = mode === "auto" ? (mqWeb ? "web" : "app") : mode;
  document.documentElement.dataset.view = mode;
  document.body.dataset.shell = shell;
}

export { WEB_MQ };
