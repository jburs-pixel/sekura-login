/**
 * Rate limit in-memory por key (típicamente: IP del request).
 *
 * Limitaciones a tener en cuenta:
 * - Es por-instancia: en Vercel con múltiples regiones / containers,
 *   cada instancia tiene su propio Map. El límite efectivo se multiplica
 *   por la cantidad de instancias activas. Para V1 con tráfico bajo es OK.
 *   Cuando crezca, swappear por Upstash Redis (la API es la misma).
 * - No persiste entre reloads. Reinicio del proceso = contador a cero.
 *
 * Algoritmo: ventana fija. Cada key tiene un contador y un timestamp de
 * inicio de ventana. Cuando expira la ventana, se resetea.
 */

type Bucket = { count: number; windowStart: number };

const store = new Map<string, Bucket>();

export type RateLimitConfig = {
  /** Máximo de requests permitidos en la ventana. */
  max: number;
  /** Tamaño de la ventana en milisegundos. */
  windowMs: number;
};

export type RateLimitResult = {
  /** true si la request está permitida; false si superó el límite. */
  allowed: boolean;
  /** Cuántos requests quedan en la ventana actual. */
  remaining: number;
  /** Timestamp ms cuando se resetea la ventana. */
  resetAt: number;
};

export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key);

  // Sin bucket previo o ventana expirada: arrancar nueva.
  if (!bucket || now - bucket.windowStart >= config.windowMs) {
    const fresh: Bucket = { count: 1, windowStart: now };
    store.set(key, fresh);
    return {
      allowed: true,
      remaining: config.max - 1,
      resetAt: now + config.windowMs,
    };
  }

  // Ventana vigente: incrementar y chequear.
  bucket.count += 1;
  const remaining = Math.max(0, config.max - bucket.count);
  const resetAt = bucket.windowStart + config.windowMs;

  return {
    allowed: bucket.count <= config.max,
    remaining,
    resetAt,
  };
}

/**
 * Garbage collection oportunista. Llamar cada tanto si el Map crece mucho.
 * En la práctica con tráfico moderado no hace falta — el OOM es lejano.
 */
export function pruneExpired(now: number = Date.now()): number {
  let removed = 0;
  for (const [key, bucket] of store.entries()) {
    // Eliminar buckets cuya ventana expiró hace más de 1h.
    if (now - bucket.windowStart > 60 * 60 * 1000) {
      store.delete(key);
      removed++;
    }
  }
  return removed;
}

// =============================================================================
// Config por defecto para la API de scan: 30 req/min por IP (criterio
// de aceptación #3 del spec).
// =============================================================================

export const SCAN_RATE_LIMIT: RateLimitConfig = {
  max: 30,
  windowMs: 60_000,
};
