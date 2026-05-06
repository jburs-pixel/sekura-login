export const LOCALES = ["es", "pt"] as const;
export const DEFAULT_LOCALE: Locale = "es";

export type Locale = (typeof LOCALES)[number];

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Mapeo de Locale a `lang` HTML estándar (BCP 47).
 * Para SEO + accesibilidad: lectores de pantalla y buscadores lo usan.
 */
export const HTML_LANG: Record<Locale, string> = {
  es: "es-AR",
  pt: "pt-BR",
};
