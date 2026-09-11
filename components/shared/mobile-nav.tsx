"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { LangSwitcher } from "@/components/shared/lang-switcher";
import { Logo } from "@/components/shared/logo";
import type { NavUser } from "@/components/shared/navbar";
import { isActive, mobileNavFor, navFor } from "@/components/shared/nav-config";
import { useShell } from "@/components/shared/shell-context";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/shared/user-menu";
import { cn } from "@/lib/utils";

export type MobileHeaderVariant = "hero" | "compact";

const HEADER =
  "dark bg-sidebar px-[18px] pt-[max(0.75rem,env(safe-area-inset-top))] pb-[18px] text-sidebar-foreground lg:hidden";

/**
 * L'en-tête nuit sous `lg`, dessiné par la page elle-même.
 *
 * Deux formes, comme les maquettes mobiles :
 *  - `hero` (tableau de bord, 1c) : la ligne d'identité — l'auto-école, la
 *    langue, le thème, l'avatar — puis le titre en grand dessous ;
 *  - `compact` (tout le reste, 2g / 2h) : une seule ligne — logo ou retour,
 *    le titre de la page et son contexte, l'avatar. La langue et le thème
 *    passent dans le menu de l'avatar : sur 390 px, le titre a besoin de la
 *    place.
 */
export function MobileHeader({
  variant,
  title,
  subtitle,
  back,
}: {
  variant: MobileHeaderVariant;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Remplace le logo par un bouton retour — les fiches de détail. */
  back?: string;
}) {
  const shell = useShell();
  const tc = useTranslations("common");
  const tRoles = useTranslations("roles");

  if (!shell) {
    return (
      <div className={HEADER}>
        <h1 className="font-heading text-[1.1875rem] font-bold tracking-[-0.02em]">{title}</h1>
      </div>
    );
  }

  const { user, home, identity } = shell;
  const overflow = navFor(user.role).filter((item) => !item.mobile);

  if (variant === "hero") {
    const place = [identity?.subtitle, tRoles(user.role)].filter(Boolean).join(" · ");

    return (
      <div className={cn(HEADER, "flex flex-col gap-4")}>
        <div className="flex items-center justify-between gap-3">
          <Link
            href={home}
            className="flex min-w-0 items-center gap-2.5 rounded-md outline-offset-4"
          >
            <Logo size="md" showName={!identity} />
            {identity && (
              <span className="flex min-w-0 flex-col leading-[1.25]">
                <span className="truncate font-heading text-sm font-semibold">
                  {identity.title}
                </span>
                <span className="truncate text-[0.6875rem] text-sidebar-muted">{place}</span>
              </span>
            )}
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <LangSwitcher variant="nav" size="sm" />
            <ThemeToggle variant="nav" size="sm" />
            <UserMenu {...user} variant="compact" overflowItems={overflow} />
          </div>
        </div>

        <div className="flex flex-col gap-[3px]">
          <h1 className="font-heading text-2xl font-bold leading-tight tracking-[-0.02em]">
            {title}
          </h1>
          {subtitle && <div className="text-xs text-sidebar-muted">{subtitle}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(HEADER, "flex items-center gap-3")}>
      {back ? (
        <Link
          href={back}
          aria-label={tc("back")}
          className="grid size-[1.875rem] shrink-0 place-items-center rounded-[9px] border border-sidebar-border text-sidebar-muted transition-colors hover:bg-white/5 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/35"
        >
          <ChevronLeft className="size-4 rtl-flip" aria-hidden />
        </Link>
      ) : (
        <Link href={home} className="shrink-0 rounded-md outline-offset-4">
          <Logo size="md" showName={false} />
        </Link>
      )}

      <div className="flex min-w-0 flex-1 flex-col leading-[1.3]">
        <h1 className="truncate font-heading text-[1.1875rem] font-bold tracking-[-0.02em]">
          {title}
        </h1>
        {subtitle && <div className="text-xs text-sidebar-muted">{subtitle}</div>}
      </div>

      <UserMenu {...user} variant="compact" overflowItems={overflow} withPreferences />
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
      <ul className="grid grid-cols-5 gap-0.5">
        {items.map(({ href, labelKey, shortKey, icon: Icon }) => {
          const active = isActive(pathname, href);
          const count = badges?.[href] ?? 0;

          return (
            <li key={href} className="relative">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-[5px] rounded-xl py-2 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/35",
                  active ? "bg-brand/14 text-brand" : "text-sidebar-muted",
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
                  className="pointer-events-none absolute top-[0.3125rem] end-4 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[0.625rem] font-bold tabular-nums text-brand-foreground"
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
