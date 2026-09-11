"use client";

import { Check, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { locales, localeLabels, type Locale } from "@/i18n/config";
import { setUserLocale } from "@/i18n/locale";
import { cn } from "@/lib/utils";

/** Changer de langue, d'où qu'on le demande — le bouton ou le menu de l'avatar. */
export function useLocaleSwitch() {
  const current = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(locale: Locale) {
    if (locale === current) return;
    startTransition(async () => {
      await setUserLocale(locale);
      // The locale lives in a cookie, so the whole tree — including `dir` on
      // <html> — has to be re-rendered on the server.
      router.refresh();
    });
  }

  return { current, pending, choose };
}

/**
 * `variant="nav"` est le contrôle de la barre nuit : bordure #33405C, la langue
 * écrite en clair (« FR ») plutôt qu'une icône seule — sur trois langues,
 * l'état courant vaut mieux que le geste. `size="sm"` est sa version d'en-tête
 * mobile, sans le globe : 390 px ne le laissent pas respirer.
 */
export function LangSwitcher({
  variant = "plain",
  size = "default",
}: {
  variant?: "plain" | "nav";
  size?: "default" | "sm";
}) {
  const t = useTranslations("nav");
  const { current, pending, choose } = useLocaleSwitch();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "nav" ? (
          <button
            type="button"
            aria-label={t("changeLanguage")}
            disabled={pending}
            className={cn(
              "flex items-center gap-1.5 border border-sidebar-border font-semibold text-sidebar-muted transition-colors",
              "hover:bg-white/5 hover:text-sidebar-foreground",
              "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/35",
              "disabled:opacity-50",
              size === "sm"
                ? "rounded-[9px] px-[0.5625rem] py-1.5 text-xs"
                : "rounded-[10px] px-2.5 py-[0.4375rem] text-[0.8125rem]",
            )}
          >
            {size === "default" && <Globe className="size-[0.9375rem]" aria-hidden />}
            <span className="uppercase">{current}</span>
          </button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("changeLanguage")}
            disabled={pending}
            className="text-muted-foreground hover:text-foreground"
          >
            <Globe className="size-[1.15rem]" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onSelect={() => choose(locale)}
            className="justify-between gap-3"
          >
            <span lang={locale}>{localeLabels[locale]}</span>
            {locale === current && <Check className="size-4 text-brand-ink" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
