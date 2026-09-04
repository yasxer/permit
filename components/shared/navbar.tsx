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

/** Desktop top bar. Hidden below the lg breakpoint, where the rail takes over. */
export function Navbar({ user }: { user: NavUser }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const items = navFor(user.role);

  return (
    <header className="sticky top-0 z-30 hidden border-b bg-background/80 backdrop-blur-md lg:block">
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
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
          <span className="mx-1 h-6 w-px bg-border" aria-hidden />
          <UserMenu {...user} />
        </div>
      </div>
    </header>
  );
}
