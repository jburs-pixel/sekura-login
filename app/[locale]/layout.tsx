import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";

/**
 * Layout localizado. Validamos el segmento [locale] antes de renderizar.
 * No agrega <html>/<body> (eso vive en app/layout.tsx).
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <>{children}</>;
}

// SSG: pre-genera /es y /pt en build.
export function generateStaticParams() {
  return [{ locale: "es" }, { locale: "pt" }];
}
