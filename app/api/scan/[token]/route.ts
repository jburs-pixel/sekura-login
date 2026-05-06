import { NextResponse, type NextRequest } from "next/server";
import { getClientIp } from "@/lib/scan/ipHash";
import { parseToken } from "@/lib/scan/parseToken";
import { SCAN_RATE_LIMIT, checkRateLimit } from "@/lib/scan/rateLimit";
import { recordScan } from "@/lib/scan/recordScan";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/scan/[token]
 * Valida el token, chequea rate limit, llama al RPC verify_token, y
 * registra el scan. Devuelve el estado del ítem.
 *
 * Rate limit: 30 req/min por IP (criterio aceptación #3 del spec).
 *
 * Respuestas:
 *   200: { result: 'authentic' | 'suspicious' | 'unknown' | 'already_claimed', ... }
 *   400: { error: 'invalid_token', details: { kind: ... } }
 *   429: { error: 'rate_limited', retryAt: <ms epoch> }
 *   500: { error: 'internal', details: { kind: ... } }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token: rawToken } = await context.params;

  // 1. Validar formato del token
  const parsed = parseToken(rawToken);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "invalid_token", details: parsed.error },
      { status: 400 },
    );
  }

  // 2. Rate limit por IP
  const ip = getClientIp(request);
  const rl = checkRateLimit(ip, SCAN_RATE_LIMIT);
  if (!rl.allowed) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((rl.resetAt - Date.now()) / 1000),
    );
    return NextResponse.json(
      { error: "rate_limited", retryAt: rl.resetAt },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSec) },
      },
    );
  }

  // 3. User autenticado (opcional — los scans anónimos están permitidos)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. Llamar al RPC + insertar scan
  const result = await recordScan({
    token: parsed.value.raw,
    ip,
    userAgent: request.headers.get("user-agent"),
    userId: user?.id ?? null,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "internal", details: result.error },
      { status: 500 },
    );
  }

  return NextResponse.json(result.value, {
    headers: {
      "X-RateLimit-Limit": String(SCAN_RATE_LIMIT.max),
      "X-RateLimit-Remaining": String(rl.remaining),
      "X-RateLimit-Reset": String(rl.resetAt),
    },
  });
}
