/**
 * Edge Function 공통 보안 유틸리티
 * import: from "@shared/security.ts"
 */

const DEFAULT_ALLOWED_ORIGINS = [
  "https://senior-safe-portal.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

export function resolveAllowedOrigins(): string[] {
  const raw = Deno.env.get("ALLOWED_ORIGINS");
  if (!raw?.trim()) return DEFAULT_ALLOWED_ORIGINS;
  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}

export function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = resolveAllowedOrigins();
  // 허용 목록에 있을 때만 ACAO 를 넣는다. * 와 임의 origin 폴백은 쓰지 않는다.
  const allowOrigin = origin && allowed.includes(origin) ? origin : "";

  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
  if (allowOrigin) headers["Access-Control-Allow-Origin"] = allowOrigin;
  return headers;
}

export function jsonResponse(
  req: Request,
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...buildCorsHeaders(req),
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

/** API 키·스택 등 민감 정보가 섞인 오류 메시지를 사용자용으로 정제 */
export function toClientSafeMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;

  const message = error.message.trim().slice(0, 240);
  const sensitivePattern = /api[_-]?key|AIza|Bearer\s|stack| at \w+\.|deno\.|supabase\.co\/functions\/v1/i;
  const geminiBusyPattern = /503|429|high demand|Service Unavailable|Resource exhausted/i;

  if (geminiBusyPattern.test(message)) {
    return "AI 서비스 이용량이 많아 잠시 응답이 지연되고 있습니다. 1~2분 후 다시 시도해 주세요.";
  }

  if (/GoogleGenerativeAI|generativelanguage\.googleapis\.com/i.test(message)) {
    return fallback;
  }

  if (!message || sensitivePattern.test(message)) {
    return fallback;
  }

  return message;
}

/** 검색어 입력 검증 (YouTube/Gemini용) */
export function sanitizeSearchQuery(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new Error("검색어 형식이 올바르지 않습니다.");
  }

  const query = raw.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();

  if (!query) {
    throw new Error("검색어(query)가 필요합니다.");
  }

  if (query.length > 120) {
    throw new Error("검색어는 120자 이내로 입력해 주세요.");
  }

  return query;
}

const INTERNAL_NETWORK_MESSAGE = "내부 네트워크 주소는 분석할 수 없습니다.";

const BLOCKED_HOST_SUFFIXES = [".local", ".localhost", ".internal", ".lan", ".home.arpa", ".intranet", ".corp"];
const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal", "metadata"]);
const ALLOWED_PORTS = new Set(["", "80", "443", "8080", "8443"]);

const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/;

export function isPrivateIPv4(address: string): boolean {
  if (!IPV4.test(address)) return true;
  const parts = address.split(".").map(Number);
  if (parts.some((part) => part > 255)) return true;
  const [a, b, c] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function expandIPv6(address: string): number[] | null {
  let value = address.toLowerCase();
  const embedded = value.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (embedded) {
    const parts = embedded[1].split(".").map(Number);
    if (parts.some((part) => part > 255)) return null;
    value = `${value.slice(0, -embedded[1].length)}${((parts[0] << 8) | parts[1]).toString(16)}:${((parts[2] << 8) | parts[3]).toString(16)}`;
  }

  const halves = value.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = halves.length === 2 ? 8 - head.length - tail.length : 0;
  if (missing < 0) return null;

  const groups = [...head, ...Array<string>(missing).fill("0"), ...tail];
  if (groups.length !== 8 || groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) return null;
  return groups.map((group) => parseInt(group, 16));
}

function embeddedIPv4(high: number, low: number): string {
  return `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
}

export function isPrivateIPv6(address: string): boolean {
  const groups = expandIPv6(address.replace(/^\[|\]$/g, "").split("%")[0]);
  if (!groups) return true;
  const [g0, g1, g2, g3, g4, g5, g6, g7] = groups;
  const zeroPrefix = g0 === 0 && g1 === 0 && g2 === 0 && g3 === 0 && g4 === 0;

  if (zeroPrefix && (g5 === 0 || g5 === 0xffff)) return isPrivateIPv4(embeddedIPv4(g6, g7));
  if (g0 === 0x64 && g1 === 0xff9b) return isPrivateIPv4(embeddedIPv4(g6, g7));
  if (g0 === 0x2002) return isPrivateIPv4(embeddedIPv4(g1, g2));
  return (
    (g0 & 0xfe00) === 0xfc00 ||
    (g0 & 0xffc0) === 0xfe80 ||
    (g0 & 0xff00) === 0xff00 ||
    (g0 === 0x2001 && g1 === 0x0db8) ||
    (g0 === 0x2001 && g1 === 0)
  );
}

export function isIpLiteral(hostname: string): boolean {
  return IPV4.test(hostname) || hostname.startsWith("[") || hostname.includes(":");
}

export function isPrivateAddress(address: string): boolean {
  return IPV4.test(address) ? isPrivateIPv4(address) : isPrivateIPv6(address);
}

/** SSRF 방지: 공개 http(s) URL만 허용 */
export function sanitizePublicUrl(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("링크 주소가 비어 있습니다.");
  }

  if (raw.length > 2048) {
    throw new Error("링크 주소가 너무 깁니다.");
  }

  const withProtocol = /^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error("올바른 링크 주소 형식이 아닙니다.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("http 또는 https 링크만 분석할 수 있습니다.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("인증 정보가 포함된 링크는 분석할 수 없습니다.");
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (
    !hostname ||
    BLOCKED_HOSTS.has(hostname) ||
    BLOCKED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix)) ||
    (isIpLiteral(hostname) ? isPrivateAddress(hostname) : !hostname.includes("."))
  ) {
    throw new Error(INTERNAL_NETWORK_MESSAGE);
  }

  if (!ALLOWED_PORTS.has(parsed.port)) {
    throw new Error("이 포트를 쓰는 링크는 분석할 수 없습니다.");
  }

  return parsed.toString();
}

type DnsResolver = (query: string, recordType: "A" | "AAAA") => Promise<string[]>;

function dnsResolver(): DnsResolver | null {
  const runtime = (globalThis as unknown as { Deno?: { resolveDns?: DnsResolver } }).Deno;
  return typeof runtime?.resolveDns === "function" ? runtime.resolveDns.bind(runtime) : null;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("dns timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * 도메인이 내부 주소로 풀리면 막는다(예: 127.0.0.1.nip.io).
 * 런타임이 DNS 조회를 허용하지 않으면 조회를 건너뛰고 문자열 검사에만 기댄다.
 */
export async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (isIpLiteral(host)) {
    if (isPrivateAddress(host)) throw new Error(INTERNAL_NETWORK_MESSAGE);
    return;
  }

  const resolve = dnsResolver();
  if (!resolve) return;

  const results = await Promise.allSettled([
    withTimeout(resolve(host, "A"), 3_000),
    withTimeout(resolve(host, "AAAA"), 3_000),
  ]);
  const addresses = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  if (addresses.some(isPrivateAddress)) throw new Error(INTERNAL_NETWORK_MESSAGE);
}

export type PublicPage = { finalUrl: string; html: string; redirects: number };

export type FetchPublicPageOptions = {
  timeoutMs: number;
  maxBytes: number;
  maxRedirects: number;
  headers: Record<string, string>;
};

function charsetOf(contentType: string): string | null {
  return contentType.match(/charset\s*=\s*["']?([\w-]+)/i)?.[1]?.toLowerCase() ?? null;
}

function sniffCharset(bytes: Uint8Array): string | null {
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 2048));
  return head.match(/<meta[^>]+charset\s*=\s*["']?([\w-]+)/i)?.[1]?.toLowerCase() ?? null;
}

function decodeHtml(bytes: Uint8Array, contentType: string): string {
  const charset = charsetOf(contentType) ?? sniffCharset(bytes) ?? "utf-8";
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

async function readLimited(response: Response, maxBytes: number): Promise<Uint8Array> {
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = value.byteLength > maxBytes - total ? value.subarray(0, maxBytes - total) : value;
      chunks.push(chunk);
      total += chunk.byteLength;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

/**
 * 공개 웹페이지 HTML 을 maxBytes 까지만 받는다.
 * 리다이렉트는 직접 따라가며 매번 주소를 다시 검사해, 공개 주소에서 내부 주소로 튀는 우회를 막는다.
 */
export async function fetchPublicPage(startUrl: string, options: FetchPublicPageOptions): Promise<PublicPage> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    let current = sanitizePublicUrl(startUrl);
    for (let redirects = 0; redirects <= options.maxRedirects; redirects += 1) {
      await assertPublicHost(new URL(current).hostname);

      const response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: options.headers,
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        await response.body?.cancel().catch(() => undefined);
        if (!location) throw new Error("링크 페이지를 불러오지 못했습니다.");
        current = sanitizePublicUrl(new URL(location, current).toString());
        continue;
      }

      if (!response.ok) {
        await response.body?.cancel().catch(() => undefined);
        throw new Error("링크 페이지를 불러오지 못했습니다.");
      }

      const contentType = response.headers.get("content-type") || "";
      if (!/text\/html|application\/xhtml/i.test(contentType)) {
        await response.body?.cancel().catch(() => undefined);
        throw new Error("웹페이지(HTML) 형식이 아닌 링크입니다.");
      }

      const bytes = await readLimited(response, options.maxBytes);
      return { finalUrl: current, html: decodeHtml(bytes, contentType), redirects };
    }

    throw new Error("다른 주소로 너무 여러 번 이동하는 링크입니다.");
  } finally {
    clearTimeout(timer);
  }
}

function constantTimeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  let diff = left.length ^ right.length;
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    diff |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return diff === 0;
}

/**
 * INTERNAL_API_SECRET(또는 EDGE_INTERNAL_SECRET) 과 x-internal-secret 이 일치할 때만 허용.
 * 시크릿이 없으면 거부한다(fail-closed). Next API 가 EDGE_INTERNAL_SECRET 으로 호출한다.
 */
export function isAllowedCaller(req: Request): boolean {
  const secret = Deno.env.get("INTERNAL_API_SECRET") ?? Deno.env.get("EDGE_INTERNAL_SECRET");
  if (!secret) return false;
  return constantTimeEqual(req.headers.get("x-internal-secret") ?? "", secret);
}

export function clampLimit(raw: unknown, fallback: number, max: number): number {
  const limit = Number(raw);
  if (!Number.isFinite(limit)) return fallback;
  return Math.min(Math.max(Math.floor(limit), 1), max);
}
