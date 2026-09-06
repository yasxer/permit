"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { LangSwitcher } from "@/components/shared/lang-switcher";
import { Logo } from "@/components/shared/logo";
import type { NavUser } from "@/components/shared/navbar";
import { isActive, mobileNavFor, navFor } from "@/components/shared/nav-config";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/shared/user-menu";
import { cn } from "@/lib/utils";

export type ShellIdentity = { title: string; subtitle?: string };

/**
 * La ligne d'identité de l'en-tête nuit, sous `lg`. Elle ne porte pas de
 * navigation : celle-ci vit dans la barre d'onglets du bas, à portée de pouce.
 */
export function MobileTopBar({
  user,
  home,
  identity,
}: {
  user: NavUser;
  home: string;
  identity?: ShellIdentity;
}) {
  const overflow = navFor(user.role).filter((item) => !item.mobile);

  return (
    <div className="dark flex items-center justify-between gap-3 bg-sidebar px-4 pt-3 text-sidebar-foreground sm:px-6 lg:hidden">
      <Link href={home} className="flex min-w-0 items-center gap-2.5 rounded-md outline-offset-4">
        {identity ? (
          <>
            <Logo showName={false} />
            <span className="flex min-w-0 flex-col leading-[1.25]">
              <span className="truncate font-heading text-sm font-semibold text-sidebar-foreground">
                {identity.title}
              </span>
              {identity.subtitle && (
                <span className="truncate text-[0.6875rem] text-sidebar-muted">
                  {identity.subtitle}
                </span>
              )}
            </span>
          </>
        ) : (
          <Logo />
        )}
      </Link>

      <div className="flex shrink-0 items-center gap-2">
        <LangSwitcher variant="nav" />
        <ThemeToggle variant="nav" />
        <UserMenu {...user} variant="compact" overflowItems={overflow} />
      </div>
    </div>
  );
}

/**
 * Cinq onglets, bleu nuit, collés en bas — la navigation mobile de la charte.
 * Pas de rail latéral : sur 390 px, une cible de 48 px sous le pouce vaut
 * mieux qu'un tiroir à ouvrir avant de pouvoir choisir.
 */
export function MobileTabBar({
  user,
  badges,
}: {
  user: NavUser;
  badges?: Record<string, number>;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const items = mobileNavFor(user.role);

  return (
    <nav
      aria-label={t("dashboard")}
      className="dark fixed inset-x-0 bottom-0 z-40 rounded-t-[20px] bg-sidebar px-2 pt-2.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] text-sidebar-foreground lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ href, labelKey, shortKey, icon: Icon }) => {
          const active = isActive(pathname, href);
          const count = badges?.[href] ?? 0;

          return (
            <li key={href} className="relative">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1.5 rounded-xl py-2 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/35",
                  active ? "bg-brand/15 text-brand" : "text-sidebar-muted",
                )}
              >
                <Icon className="size-5 shrink-0" strokeWidth={2} aria-hidden />
                <span
                  className={cn(
                    "text-[0.625rem] leading-none",
                    active ? "font-semibold" : "font-medium",
                  )}
                >
                  {t(shortKey ?? labelKey)}
                </span>
              </Link>

              {count > 0 && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-[0.3125rem] end-2 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[0.625rem] font-bold tabular-nums text-brand-foreground"
                >
                  {count}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
