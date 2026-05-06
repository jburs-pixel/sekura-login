import Link from "next/link";
import { headers } from "next/headers";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/dict";

export default async function LocaleNotFound() {
  // not-found.tsx no recibe params; leemos el locale del header del middleware.
  const h = await headers();
  const headerLocale = h.get("x-locale");
  const locale =
    headerLocale && isLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE;

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-widest text-zinc-400">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          {t("not_found.title", locale)}
        </h1>
        <p className="mt-3 text-sm text-zinc-600">
          {t("not_found.description", locale)}
        </p>
        <Link
          href={`/${locale}`}
          className="mt-6 inline-block text-sm text-zinc-900 underline"
        >
          {t("not_found.back_home", locale)}
        </Link>
      </div>
    </main>
  );
}
