import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import { getSiteUrl, SITE_NAME } from "@/lib/seo/site";
import { getLocale } from "@/lib/i18n/server";
import { dirOf } from "@/lib/i18n/config";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      dir={dirOf(locale)}
      className={`${archivo.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
