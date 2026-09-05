"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { LangSwitcher } from "@/components/shared/lang-switcher";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/shared/user-menu";
import { isActive, navFor } from "@/components/shared/nav-config";
import type { NavUser } from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

/**
 * Mobile navigation: a permanent icon rail on the inline-start edge that
 * expands over the content when the hamburger is pressed. Hidden from lg up,
 * where `Navbar` takes over.
 *
 * Bleu nuit dans les deux thèmes, comme la barre du haut — voir `Navbar` pour
 * ce que le `dark` posé sur l'élément fait exactement.
 */
export function SidebarRail({ user }: { user: NavUser }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const expanded = useUiStore((s) => s.sidebarExpanded);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const setExpanded = useUiStore((s) => s.setSidebarExpanded);
  const items = navFor(user.role);

  // Navigating is the end of the interaction — never leave the panel covering
  // the page the user just asked for.
  useEffect(() => setExpanded(false), [pathname, setExpanded]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, setExpanded]);

  return (
    <>
      {expanded && (
        <button
          type="button"
          aria-label={t("closeMenu")}
          onClick={() => setExpanded(false)}
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        data-expanded={expanded}
        className={cn(
          "dark fixed inset-y-0 start-0 z-40 flex flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:hidden",
          expanded ? "w-60" : "w-14",
        )}
      >
        <div className="flex h-16 items-center gap-2 px-2.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={expanded ? t("closeMenu") : t("openMenu")}
            aria-expanded={expanded}
            className="shrink-0 text-sidebar-muted hover:text-sidebar-foreground"
          >
            {expanded ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
          {expanded && (
            <Link href="/" className="min-w-0 rounded-md outline-offset-4">
              <Logo />
            </Link>
          )}
        </div>

        <nav aria-label={t("dashboard")} className="flex-1 overflow-y-auto px-2 py-2">
          <ul className="space-y-1">
            {items.map(({ href, labelKey, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    title={expanded ? undefined : t(labelKey)}
                    className={cn(
                      "flex h-10 items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                      expanded ? "px-3" : "justify-center px-0",
                      active
                        ? "bg-brand/15 text-brand"
                        : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="size-[1.15rem] shrink-0" aria-hidden />
                    <span className={cn("truncate", !expanded && "sr-only")}>
                      {t(labelKey)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div
          className={cn(
            "flex items-center gap-0.5 border-t border-sidebar-border p-2",
            expanded ? "justify-between" : "flex-col gap-1",
          )}
        >
          <div className={cn("flex items-center gap-0.5", !expanded && "flex-col")}>
            <LangSwitcher />
            <ThemeToggle />
          </div>
          <UserMenu {...user} />
        </div>
      </aside>
    </>
  );
}
