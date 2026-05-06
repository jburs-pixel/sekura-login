import { createHmac } from "node:crypto";

/**
 * Hashea una IP con HMAC-SHA-256 + IP_HASH_SECRET.
 * El hash es determinístico (misma IP siempre da el mismo hash) pero no
 * permite recuperar la IP cruda. Truncado a 32 hex chars (16 bytes) para
 * ahorrar espacio en la DB sin perder unicidad práctica.
 *
 * Patrón: nunca persistir IPs crudas; siempre pasar por acá antes de la DB.
 */
export function hashIp(ip: string): string {
  const secret = process.env.IP_HASH_SECRET;
  if (!secret) {
    throw new Error(
      "IP_HASH_SECRET no configurada. Agregar a .env.local (ver .env.example)",
    );
  }
  return createHmac("sha256", secret).update(ip).digest("hex").slice(0, 32);
}

/**
 * Extrae la IP del cliente de un Request. Prioriza x-forwarded-for (Vercel,
 * proxies), después x-real-ip, después un fallback.
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
