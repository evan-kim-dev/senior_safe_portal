import type { NextConfig } from "next";
import path from "node:path";

const isDev = process.env.NODE_ENV === "development";

/**
 * CSP 는 proxy.ts 에서 nonce 와 함께 요청마다 설정한다.
 * 여기에는 CSP 외 고정 보안 헤더만 둔다.
 * Access-Control-Allow-Origin 은 의도적으로 넣지 않는다(정적 JS 포함 * 금지).
 */
const securityHeaders = [
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
    return [
      { source: "/:path*", headers: securityHeaders },
      // 정적 번들·공개 자산에도 CORS * 가 붙지 않게 동일 헤더만 유지
      { source: "/_next/static/:path*", headers: securityHeaders },
    ];
  },
};

export default nextConfig;
