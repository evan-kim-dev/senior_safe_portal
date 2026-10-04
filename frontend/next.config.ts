import type { NextConfig } from "next";
import path from "node:path";

const isDev = process.env.NODE_ENV === "development";

function originOf(value: string | undefined): string {
  if (!value) return "";
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

const supabaseOrigin = originOf(process.env.NEXT_PUBLIC_SUPABASE_URL);

/**
 * 정적 페이지를 유지하려고 nonce 대신 'unsafe-inline' 을 쓴다.
 * 스크립트·연결은 좁히고, 이미지는 뉴스·복지 썸네일(여러 언론 CDN) 때문에 https 를 연다.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""}${isDev ? " ws: wss:" : ""}`,
  "frame-src https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  agentRules: false,
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    root: path.join(process.cwd()),
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
