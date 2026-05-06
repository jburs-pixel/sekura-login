import esMessages from "@/messages/es.json";
import ptMessages from "@/messages/pt.json";
import type { Locale } from "@/lib/i18n/config";

// Tipamos a partir del JSON ES (la "spec" de keys). pt.json tiene que tener
// las mismas keys — TypeScript valida vía la firma de Messages.
export type Messages = typeof esMessages;

const DICTS: Record<Locale, Messages> = {
  es: esMessages,
  pt: ptMessages,
};

/**
 * Busca una key tipo "home.hero_title" en el dict del locale.
 * Falla en typecheck si la key no existe en es.json.
 *
 * Uso:
 *   t("home.hero_title", "es")
 */
export function t<K extends DotPath<Messages>>(
  key: K,
  locale: Locale,
): DotValue<Messages, K> {
  const parts = key.split(".") as string[];
  let cursor: unknown = DICTS[locale];
  for (const part of parts) {
    if (cursor && typeof cursor === "object" && part in cursor) {
      cursor = (cursor as Record<string, unknown>)[part];
    } else {
      throw new Error(`Missing translation: ${key} (${locale})`);
    }
  }
  return cursor as DotValue<Messages, K>;
}

// =============================================================================
// Type helpers — generan paths "a.b.c" y los resuelven al tipo final.
// =============================================================================

type DotPath<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown>
    ? DotPath<T[K], `${Prefix}${K}.`>
    : `${Prefix}${K}`;
}[keyof T & string];

type DotValue<T, P extends string> = P extends `${infer Head}.${infer Tail}`
  ? Head extends keyof T
    ? T[Head] extends Record<string, unknown>
      ? DotValue<T[Head], Tail>
      : never
    : never
  : P extends keyof T
    ? T[P]
    : never;
