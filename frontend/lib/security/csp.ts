/** CSP·이미지 호스트 허용 목록. proxy.ts 와 클라이언트 썸네일 검증이 공유한다. */

export const IMAGE_HOST_SUFFIXES = [
  "i.ytimg.com",
  "img.youtube.com",
  "imgnews.pstatic.net",
  "ssl.pstatic.net",
] as const;

export function isAllowedImageHost(hostname: string, supabaseHostname?: string): boolean {
  const host = hostname.toLowerCase();
  if (supabaseHostname && (host === supabaseHostname || host.endsWith(`.${supabaseHostname}`))) {
    return true;
  }
  // 프로젝트 스토리지: xxx.supabase.co 만 (와일드카드 CSP 대신 호스트 접미사 검사)
  if (host.endsWith(".supabase.co") || host === "supabase.co") return true;
  return IMAGE_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

/** CSP img-src: 와일드카드 CDN 없이 구체 호스트만. */
export function buildImgSrcDirective(supabaseOrigin?: string): string {
  const parts = [
    "'self'",
    "data:",
    "blob:",
    "https://i.ytimg.com",
    "https://img.youtube.com",
    "https://imgnews.pstatic.net",
    "https://ssl.pstatic.net",
  ];
  if (supabaseOrigin) parts.push(supabaseOrigin);
  return parts.join(" ");
}

export function buildContentSecurityPolicy(options: {
  nonce?: string;
  isDev: boolean;
  supabaseOrigin?: string;
}): string {
  const { nonce, isDev, supabaseOrigin = "" } = options;
  const scriptSrc = nonce
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`
    : `script-src 'self'${isDev ? " 'unsafe-eval' 'unsafe-inline'" : ""}`;

  // Next 가 넣는 <style> 은 nonce 로 허용. style 속성(unsafe-inline)은 쓰지 않는다.
  const styleSrc = nonce
    ? `style-src 'self' 'nonce-${nonce}'`
    : "style-src 'self'";

  return [
    "default-src 'self'",
    scriptSrc,
    styleSrc,
    `img-src ${buildImgSrcDirective(supabaseOrigin || undefined)}`,
    "font-src 'self'",
    `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""}${isDev ? " ws: wss:" : ""}`,
    "frame-src https://www.youtube-nocookie.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}
