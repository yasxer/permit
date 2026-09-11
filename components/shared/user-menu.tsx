"use client";

import { Check, ChevronDown, Globe, LogOut, Moon, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocaleSwitch } from "@/components/shared/lang-switcher";
import type { NavItem } from "@/components/shared/nav-config";
import { THEME_OPTIONS } from "@/components/shared/theme-toggle";
import { useMounted } from "@/hooks/use-mounted";
import { locales, localeLabels } from "@/i18n/config";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

/** Two letters from the display name, falling back to the email. */
function initials(name: string | null, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase();
}

export function UserMenu({
  name,
  email,
  photoUrl,
  role,
  variant = "plain",
  /**
   * Les entrées de navigation qui ne tiennent pas dans la barre d'onglets du
   * bas — « Diplômés » — se retrouvent ici plutôt que nulle part.
   */
  overflowItems = [],
  /**
   * La langue et le thème, repliés dans le menu : l'en-tête mobile compact n'a
   * de place que pour le titre de la page et l'avatar.
   */
  withPreferences = false,
}: {
  name: string | null;
  email: string;
  photoUrl: string | null;
  role: UserRole;
  variant?: "plain" | "nav" | "compact";
  overflowItems?: NavItem[];
  withPreferences?: boolean;
}) {
  const t = useTranslations("nav");
  const tRoles = useTranslations("roles");
  const { current: locale, choose: chooseLocale } = useLocaleSwitch();
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  const fallback = (className?: string) => (
    <AvatarFallback
      className={cn(
        variant === "plain"
          ? "bg-primary/10 text-primary"
          : "bg-sidebar-accent text-sidebar-foreground",
        "font-semibold",
        className,
      )}
    >
      {initials(name, email)}
    </AvatarFallback>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "plain" ? (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label={name ?? email}
          >
            <Avatar className="size-8">
              {photoUrl && <AvatarImage src={photoUrl} alt="" />}
              {fallback("text-xs")}
            </Avatar>
          </Button>
        ) : (
          <button
            type="button"
            aria-label={name ?? email}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-full transition-colors",
              "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/35",
              variant === "nav" &&
                "rounded-xl py-1 ps-1.5 pe-2 hover:bg-white/5",
            )}
          >
            <Avatar className={variant === "nav" ? "size-[2.125rem]" : "size-[1.9375rem]"}>
              {photoUrl && <AvatarImage src={photoUrl} alt="" />}
              {fallback("text-[0.8125rem]")}
            </Avatar>

            {variant === "nav" && (
              <>
                <span className="flex min-w-0 flex-col text-start leading-[1.3]">
                  <span className="truncate text-[0.8125rem] font-semibold text-sidebar-foreground">
                    {name ?? tRoles(role)}
                  </span>
                  <span className="truncate text-[0.6875rem] text-sidebar-muted">
                    {tRoles(role)}
                  </span>
                </span>
                <ChevronDown className="size-[0.9375rem] shrink-0 text-sidebar-muted" aria-hidden />
              </>
            )}
          </button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-center gap-3 py-2.5">
          <Avatar className="size-9">
            {photoUrl && <AvatarImage src={photoUrl} alt="" />}
            <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
              {initials(name, email)}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {name ?? tRoles(role)}
            </span>
            <span className="block truncate text-xs font-normal text-muted-foreground" dir="ltr">
              {email}
            </span>
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {overflowItems.length > 0 && (
          <>
            {overflowItems.map(({ href, labelKey, icon: Icon }) => (
              <DropdownMenuItem key={href} asChild className="gap-2">
                <Link href={href}>
                  <Icon className="size-4" />
                  {t(labelKey)}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {withPreferences && (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                <Globe className="size-4" />
                {t("changeLanguage")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="min-w-40">
                {locales.map((value) => (
                  <DropdownMenuItem
                    key={value}
                    onSelect={() => chooseLocale(value)}
                    className="justify-between gap-3"
                  >
                    <span lang={value}>{localeLabels[value]}</span>
                    {value === locale && <Check className="size-4 text-brand-ink" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                <Moon className="size-4" />
                {t("toggleTheme")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="min-w-36">
                {THEME_OPTIONS.map(({ value, icon: Icon, labelKey }) => (
                  <DropdownMenuItem
                    key={value}
                    onSelect={() => setTheme(value)}
                    data-active={mounted && theme === value}
                    className="gap-2 data-[active=true]:font-medium data-[active=true]:text-brand-ink"
                  >
                    <Icon className="size-4" />
                    {t(labelKey)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem disabled className="gap-2">
          <UserIcon className="size-4" />
          {tRoles(role)}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* A form POST, so signing out cannot be triggered by a stray GET. */}
        <form action="/api/auth/signout" method="post">
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full gap-2">
              <LogOut className="size-4 rtl-flip" />
              {t("logout")}
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
