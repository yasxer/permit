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
 * Desktop top bar. Hidden below the lg breakpoint, where the rail takes over.
 *
 * La charte veut la barre en bleu nuit, thème clair compris. Le `dark` posé
 * sur le `<header>` n'est pas un thème : il fait basculer les jetons pour ses
 * seuls descendants, si bien que les boutons fantômes et les avatars qu'il
 * contient se colorent tout seuls pour un fond sombre. Les menus, portés en
 * fin de `<body>`, restent eux dans le thème de la page.
 */
export function Navbar({ user }: { user: NavUser }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const items = navFor(user.role);

  return (
    <header className="dark sticky top-0 z-30 hidden border-b border-sidebar-border bg-sidebar/95 text-sidebar-foreground backdrop-blur-md lg:block">
      <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-6 px-6">
        <Link href="/" className="shrink-0 rounded-md outline-offset-4">
          <Logo />
        </Link>

        <nav aria-label={t("dashboard")} className="flex flex-1 justify-center">
          <ul className="flex items-center gap-1">
            {items.map(({ href, labelKey, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      // L'onglet sélectionné est le seul ambre de la barre.
                      active
                        ? "bg-brand/15 text-brand"
                        : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {t(labelKey)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-0.5">
          <LangSwitcher />
          <ThemeToggle />
          <span className="mx-1 h-6 w-px bg-sidebar-border" aria-hidden />
          <UserMenu {...user} />
        </div>
      </div>
    </header>
  );
}
