import { err, ok, type Result } from "@/lib/result";
import { hashIp } from "@/lib/scan/ipHash";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VerifyTokenResponse } from "@/lib/types/database";

export type RecordScanInput = {
  /** Token ya parseado y normalizado (uppercase). */
  token: string;
  /** IP cruda del cliente. Se hashea antes de persistir. */
  ip: string;
  /** User-Agent del browser, si existe. */
  userAgent: string | null;
  /** ID del usuario autenticado, o null si es scan anónimo. */
  userId: string | null;
};

export type RecordScanError =
  | { kind: "rpc_failed"; message: string }
  | { kind: "insert_failed"; message: string };

/**
 * Llama al RPC verify_token y registra el scan en la tabla scans.
 * Reusable por el API route y por Server Components.
 *
 * Si el token es desconocido, igual se inserta el scan con token=null
 * (la FK lo permite) para tener registro de intentos contra tokens
 * inexistentes — útil para detectar ataques.
 */
export async function recordScan(
  input: RecordScanInput,
): Promise<Result<VerifyTokenResponse, RecordScanError>> {
  const admin = createAdminClient();

  const { data, error: rpcError } = await admin.rpc("verify_token", {
    p_token: input.token,
  });

  if (rpcError || !data) {
    return err({
      kind: "rpc_failed",
      message: rpcError?.message ?? "RPC verify_token devolvió sin datos",
    });
  }

  const response = data as VerifyTokenResponse;
  const tokenForInsert = response.result === "unknown" ? null : input.token;

  const { error: insertError } = await admin.from("scans").insert({
    token: tokenForInsert,
    ip_hash: hashIp(input.ip),
    user_agent: input.userAgent,
    user_id: input.userId,
    result: response.result,
  });

  if (insertError) {
    return err({ kind: "insert_failed", message: insertError.message });
  }

  return ok(response);
}
