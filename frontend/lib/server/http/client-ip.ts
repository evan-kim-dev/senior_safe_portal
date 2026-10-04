/** Vercel 이 덮어쓰는 x-real-ip / x-forwarded-for 첫 값을 쓴다. */
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}
