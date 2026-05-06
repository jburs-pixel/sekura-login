/**
 * Tipo Result<T, E> para devolver éxito o error sin throw.
 * Pattern: chequear `r.ok` para discriminar.
 *
 * Ejemplo:
 *   const r = parseToken(input);
 *   if (!r.ok) return r.error.kind;  // 'invalid_format' | 'empty'
 *   r.value.prefix;                   // 'MT'
 */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
