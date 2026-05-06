import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { DEFAULT_LOCALE, HTML_LANG, isLocale } from "@/lib/i18n/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sekura",
  description: "Monitoreo de producción de granos para tu cartera de crédito.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // El middleware setea x-locale en cada request.
  const h = await headers();
  const headerLocale = h.get("x-locale");
  const locale =
    headerLocale && isLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE;

  return (
    <html
      lang={HTML_LANG[locale]}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
