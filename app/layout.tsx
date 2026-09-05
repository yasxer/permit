import type { Metadata, Viewport } from "next";
import {
  Inter,
  JetBrains_Mono,
  Noto_Sans_Arabic,
  Poppins,
} from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

import { Providers } from "@/components/providers";
import { localeDirection } from "@/i18n/config";

import "./globals.css";

const inter = Inter({
  variable: "--font-app-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

/** Titres et logo. La charte n'autorise que deux familles par écran. */
const poppins = Poppins({
  variable: "--font-app-heading",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-app-arabic",
  subsets: ["arabic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-app-mono",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return {
    title: {
      default: `${t("name")} — ${t("tagline")}`,
      template: `%s · ${t("name")}`,
    },
    description: t("tagline"),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1C2333" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1420" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const dir = localeDirection[locale as keyof typeof localeDirection] ?? "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={`${inter.variable} ${poppins.variable} ${notoSansArabic.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
