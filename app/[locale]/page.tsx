import Link from "next/link";
import { isLocale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/dict";
import { notFound } from "next/navigation";

/**
 * Home placeholder. El contenido real (hero, secciones, etc.) viene en el
 * paso 4. Por ahora solo confirma que el routing y el i18n funcionan.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const otherLocale = locale === "es" ? "pt" : "es";
  const otherLabel = locale === "es" ? "Português" : "Español";

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-widest text-zinc-400">
          Sekura
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          {t("home.hero_title", locale)}
        </h1>
        <p className="mt-3 text-sm text-zinc-600">
          {t("home.hero_subtitle", locale)}
        </p>

        <div className="mt-8 flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-white"
            disabled
          >
            {t("common.request_demo", locale)}
          </button>
          <a
            href="https://sekuramonitoreo.netlify.app/"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-zinc-700 hover:bg-zinc-50"
          >
            {t("common.login", locale)}
          </a>
        </div>

        <p className="mt-10 text-xs text-zinc-400">
          {t("common.language", locale)}:{" "}
          <Link href={`/${otherLocale}`} className="underline">
            {otherLabel}
          </Link>
        </p>
      </div>
    </main>
  );
}
