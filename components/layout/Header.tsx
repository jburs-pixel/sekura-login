import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/dict";
import { PLATFORM_URL } from "@/lib/platform";

export function Header({ locale }: { locale: Locale }) {
  const otherLocale: Locale = locale === "es" ? "pt" : "es";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur-sm">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-40 focus:rounded-md focus:bg-foreground focus:px-3 focus:py-2 focus:text-sm focus:text-surface"
      >
        {t("header.skip_to_content", locale)}
      </a>

      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        {/* Logo (escudo + wordmark en una sola imagen) */}
        <Link
          href={`/${locale}`}
          className="flex items-center"
          aria-label="Sekura"
        >
          <Image
            src="/logo.png"
            alt="Sekura"
            width={142}
            height={80}
            priority
            className="h-8 w-auto sm:h-9"
          />
        </Link>

        {/* Right side: language switcher + login */}
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href={`/${otherLocale}`}
            className="hidden rounded-md px-3 py-1.5 text-muted hover:text-foreground sm:inline-block"
            aria-label={t("common.language", locale)}
          >
            {otherLocale.toUpperCase()}
          </Link>
          <a
            href={PLATFORM_URL}
            className="inline-flex items-center rounded-md border border-border bg-surface px-3.5 py-1.5 font-medium text-foreground hover:border-brand-700 hover:text-brand-700"
          >
            {t("common.login", locale)}
          </a>
        </nav>
      </div>
    </header>
  );
}

