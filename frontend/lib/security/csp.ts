/** CSP·이미지 호스트 허용 목록. next.config / middleware 와 클라이언트 썸네일 검증이 공유한다. */

export const IMAGE_HOST_SUFFIXES = [
  "i.ytimg.com",
  "img.youtube.com",
  "supabase.co",
  "imgnews.pstatic.net",
  "ssl.pstatic.net",
  "pstatic.net",
] as const;

export function isAllowedImageHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return IMAGE_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

export function buildImgSrcDirective(): string {
  return [
    "'self'",
    "data:",
    "blob:",
    "https://i.ytimg.com",
    "https://img.youtube.com",
    "https://*.supabase.co",
    "https://imgnews.pstatic.net",
    "https://ssl.pstatic.net",
    "https://*.pstatic.net",
  ].join(" ");
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

  return [
    "default-src 'self'",
    scriptSrc,
    // Next/인라인 스타일은 당분간 유지. 스크립트부터 nonce 로 좁힌다.
    "style-src 'self' 'unsafe-inline'",
    `img-src ${buildImgSrcDirective()}`,
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
