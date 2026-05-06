import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { isLocale } from "@/lib/i18n/config";

/**
 * Layout localizado. Wrapping con header/footer fijo + main central.
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

  return (
    <>
      <Header locale={locale} />
      <div id="main" className="flex-1">
        {children}
      </div>
      <Footer locale={locale} />
    </>
  );
}

export function generateStaticParams() {
  return [{ locale: "es" }, { locale: "pt" }];
}
