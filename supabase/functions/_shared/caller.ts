/** 내부 시크릿 검사 (레거시 Edge에서 공통 사용) */

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
 * INTERNAL_API_SECRET / EDGE_INTERNAL_SECRET 과 x-internal-secret 이 일치할 때만 허용.
 * 시크릿이 없으면 거부(fail-closed).
 */
export function isAllowedCaller(req: Request): boolean {
  const secret = Deno.env.get("INTERNAL_API_SECRET") ?? Deno.env.get("EDGE_INTERNAL_SECRET");
  if (!secret) return false;
  return constantTimeEqual(req.headers.get("x-internal-secret") ?? "", secret);
}
