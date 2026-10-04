/**
 * 한 줄 JSON 로그. Vercel 로그에서 level·route·requestId 로 걸러 볼 수 있다.
 * instrumentation 에서도 불리므로 server-only 를 걸지 않는다(비밀값을 다루지 않는다).
 */

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFields = Record<string, unknown>;

export type Logger = {
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
  child(fields: LogFields): Logger;
};

type Sink = (level: LogLevel, line: string) => void;

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const SENSITIVE_KEY = /authorization|api[-_]?key|apikey|token|secret|password|cookie|service[-_]?role|family[-_]?code/i;
const SENSITIVE_VALUE = /eyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]{8,}|AIza[\w-]{20,}|sb_(?:secret|publishable)_[\w-]{10,}/g;
const MAX_DEPTH = 4;
const MAX_STRING = 2000;

export function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value.replace(SENSITIVE_VALUE, "[redacted]").slice(0, MAX_STRING);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redact(value.message, depth + 1),
      ...(process.env.NODE_ENV === "production" ? {} : { stack: redact(value.stack, depth + 1) }),
      ...(value.cause !== undefined && depth < MAX_DEPTH ? { cause: redact(value.cause, depth + 1) } : {}),
    };
  }
  if (depth >= MAX_DEPTH) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => redact(item, depth + 1));
  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      output[key] = SENSITIVE_KEY.test(key) ? "[redacted]" : redact(item, depth + 1);
    }
    return output;
  }
  return String(value);
}

const consoleSink: Sink = (level, line) => {
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
};

function minimumLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL;
  return raw === "debug" || raw === "info" || raw === "warn" || raw === "error" ? raw : "info";
}

export function createLogger(base: LogFields = {}, sink: Sink = consoleSink, minLevel: LogLevel = minimumLevel()): Logger {
  function write(level: LogLevel, message: string, fields?: LogFields) {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;
    const entry = redact({ ...base, ...fields }) as LogFields;
    try {
      sink(level, JSON.stringify({ level, time: new Date().toISOString(), msg: message, ...entry }));
    } catch {
      sink(level, JSON.stringify({ level, time: new Date().toISOString(), msg: message, logError: "unserializable fields" }));
    }
  }

  return {
    debug: (message, fields) => write("debug", message, fields),
    info: (message, fields) => write("info", message, fields),
    warn: (message, fields) => write("warn", message, fields),
    error: (message, fields) => write("error", message, fields),
    child: (fields) => createLogger({ ...base, ...fields }, sink, minLevel),
  };
}

export const logger = createLogger({ service: "senior-safe-portal" });
