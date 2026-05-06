import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/dict";
import { PLATFORM_URL } from "@/lib/platform";

/**
 * Home placeholder con header + footer reales del layout. El contenido del
 * cuerpo (hero, secciones, etc.) se construye en el paso 4.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <main className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
      <div className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-widest text-brand-700">
          Sekura
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {t("home.hero_title", locale)}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          {t("home.hero_subtitle", locale)}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center rounded-md bg-brand-700 px-5 py-3 text-sm font-medium text-surface shadow-sm hover:bg-brand-800 disabled:opacity-60"
          >
            {t("common.request_demo", locale)}
          </button>
          <a
            href={PLATFORM_URL}
            className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-5 py-3 text-sm font-medium text-foreground hover:border-brand-700 hover:text-brand-700"
          >
            {t("common.login", locale)}
          </a>
        </div>
      </div>
    </main>
  );
}
