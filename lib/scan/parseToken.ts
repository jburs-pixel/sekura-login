import { err, ok, type Result } from "@/lib/result";

// =============================================================================
// Constantes — V1: solo BR + scanner. Para agregar otro país/flujo, sumarlos
// acá y a la whitelist. El resto de la app lee desde estas constantes.
// =============================================================================

export const SUPPORTED_COUNTRIES = ["BR"] as const;
export const SUPPORTED_KINDS = ["scanner"] as const;

export type CountryCode = (typeof SUPPORTED_COUNTRIES)[number];
export type ScanKind = (typeof SUPPORTED_KINDS)[number];

// =============================================================================
// parseToken
// Valida formato del token: <prefijo 2 letras>-<id numérico>-<32 hex uppercase>
// Decisión: normaliza a uppercase antes de validar (D7 del plan), por si el
// QR se escanea en lowercase desde algún lector.
// =============================================================================

const TOKEN_REGEX = /^([A-Z]{2})-(\d+)-([A-F0-9]{32})$/;

export type ParsedToken = {
  raw: string; // valor normalizado a uppercase
  prefix: string; // ej. 'MT'
  numericId: number; // ej. 5108402
  hex32: string; // los 32 hex caracteres
};

export type ParseTokenError =
  | { kind: "empty" }
  | { kind: "invalid_format"; received: string };

export function parseToken(
  input: string | null | undefined,
): Result<ParsedToken, ParseTokenError> {
  if (!input || input.trim() === "") {
    return err({ kind: "empty" });
  }

  const normalized = input.trim().toUpperCase();
  const match = TOKEN_REGEX.exec(normalized);
  if (!match) {
    return err({ kind: "invalid_format", received: input });
  }

  // Match con tres grupos por la regex de arriba; el cast es seguro.
  const [, prefix, numericIdStr, hex32] = match as unknown as [
    string,
    string,
    string,
    string,
  ];
  const numericId = Number.parseInt(numericIdStr, 10);

  return ok({ raw: normalized, prefix, numericId, hex32 });
}

// =============================================================================
// parseCountry
// =============================================================================

export type ParseCountryError = {
  kind: "unsupported_country";
  received: string;
};

export function parseCountry(
  input: string | null | undefined,
): Result<CountryCode, ParseCountryError> {
  const normalized = (input ?? "").trim().toUpperCase();
  const found = SUPPORTED_COUNTRIES.find((c) => c === normalized);
  if (!found) {
    return err({ kind: "unsupported_country", received: input ?? "" });
  }
  return ok(found);
}

// =============================================================================
// parseKind
// =============================================================================

export type ParseKindError = { kind: "unsupported_kind"; received: string };

export function parseKind(
  input: string | null | undefined,
): Result<ScanKind, ParseKindError> {
  const normalized = (input ?? "").trim().toLowerCase();
  const found = SUPPORTED_KINDS.find((k) => k === normalized);
  if (!found) {
    return err({ kind: "unsupported_kind", received: input ?? "" });
  }
  return ok(found);
}
