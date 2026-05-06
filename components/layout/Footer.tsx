import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/dict";
import { PLATFORM_URL } from "@/lib/platform";

export function Footer({ locale }: { locale: Locale }) {
  const otherLocale: Locale = locale === "es" ? "pt" : "es";
  const otherLabel = locale === "es" ? "Português" : "Español";
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Sekura</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
              {t("footer.tagline", locale)}
            </p>
          </div>

          <div className="text-sm">
            <p className="font-semibold text-foreground">
              {t("footer.platform", locale)}
            </p>
            <ul className="mt-3 space-y-2 text-muted">
              <li>
                <a
                  href={PLATFORM_URL}
                  className="hover:text-foreground"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("common.login", locale)}
                </a>
              </li>
              <li>
                <Link
                  href={`/${locale}#demo`}
                  className="hover:text-foreground"
                >
                  {t("common.request_demo", locale)}
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-sm">
            <p className="font-semibold text-foreground">
              {t("footer.language", locale)}
            </p>
            <ul className="mt-3 space-y-2 text-muted">
              <li>
                <Link href={`/${locale}`} className="hover:text-foreground">
                  {locale === "es" ? "Español" : "Português"} (actual)
                </Link>
              </li>
              <li>
                <Link
                  href={`/${otherLocale}`}
                  className="hover:text-foreground"
                >
                  {otherLabel}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-2 border-t border-border pt-6 text-xs text-muted sm:flex-row sm:items-center">
          <p>
            © {year} Sekura. {t("footer.rights", locale)}
          </p>
        </div>
      </div>
    </footer>
  );
}
