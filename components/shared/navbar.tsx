"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { LangSwitcher } from "@/components/shared/lang-switcher";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/shared/user-menu";
import { isActive, navFor } from "@/components/shared/nav-config";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

export type NavUser = {
  name: string | null;
  email: string;
  photoUrl: string | null;
  role: UserRole;
};

/**
 * La barre du haut, à partir de `lg`. En dessous, `MobileNav` prend le relais.
 *
 * Les items ne flottent pas sur le nuit : ils sont posés sur une piste creusée
 * (blanc à 5 %), ce qui donne à l'onglet actif — le seul ambre de la barre —
 * un fond où se détacher au lieu d'une tache isolée.
 *
 * Le `dark` posé sur le `<header>` n'est pas un thème : il fait basculer les
 * jetons pour ses seuls descendants, si bien que les contrôles qu'il contient
 * se colorent tout seuls pour un fond sombre. Les menus, portés en fin de
 * `<body>`, restent eux dans le thème de la page.
 */
export function Navbar({
  user,
  home,
  badges,
}: {
  user: NavUser;
  home: string;
  /** Compteur par href — la pastille ambre de « Demandes ». */
  badges?: Record<string, number>;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const items = navFor(user.role);

  return (
    <header className="dark hidden bg-sidebar text-sidebar-foreground lg:block">
      <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-6 px-8">
        <Link href={home} className="shrink-0 rounded-md outline-offset-4">
          <Logo />
        </Link>

        <nav aria-label={t("dashboard")} className="min-w-0">
          <ul className="flex items-center gap-0.5 rounded-[14px] bg-white/5 p-1">
            {items.map(({ href, labelKey, icon: Icon }) => {
              const active = isActive(pathname, href);
              const count = badges?.[href] ?? 0;

              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded-[10px] px-3.5 py-2 text-sm transition-colors",
                      "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/35",
                      active
                        ? "bg-brand font-semibold text-brand-foreground"
                        : "font-medium text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" strokeWidth={1.9} aria-hidden />
                    {t(labelKey)}
                    {count > 0 && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-px text-[0.6875rem] font-bold tabular-nums",
                          // Inversé sur l'onglet actif : l'ambre est déjà pris.
                          active
                            ? "bg-sidebar text-brand"
                            : "bg-brand text-brand-foreground",
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-3.5">
          <LangSwitcher variant="nav" />
          <ThemeToggle variant="nav" />
          <div className="border-s border-sidebar-border ps-1.5">
            <UserMenu {...user} variant="nav" />
          </div>
        </div>
      </div>
    </header>
  );
}
