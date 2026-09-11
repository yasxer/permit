"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import { useMounted } from "@/hooks/use-mounted";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const THEME_OPTIONS = [
  { value: "light", icon: Sun, labelKey: "lightMode" },
  { value: "dark", icon: Moon, labelKey: "darkMode" },
  { value: "system", icon: Monitor, labelKey: "systemMode" },
] as const;

/**
 * `variant="nav"` : le carré bordé de la barre nuit — 33 px en haut de page,
 * 31 px (`size="sm"`) dans l'en-tête mobile.
 */
export function ThemeToggle({
  variant = "plain",
  size = "default",
}: {
  variant?: "plain" | "nav";
  size?: "default" | "sm";
}) {
  const t = useTranslations("nav");
  const { theme, setTheme, resolvedTheme } = useTheme();
  // The server has no idea which theme the browser resolved, so render a
  // stable placeholder until hydration rather than flashing the wrong icon.
  const mounted = useMounted();
  const Icon = mounted && resolvedTheme === "dark" ? Sun : Moon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "nav" ? (
          <button
            type="button"
            aria-label={t("toggleTheme")}
            className={cn(
              "grid shrink-0 place-items-center border border-sidebar-border text-sidebar-muted transition-colors",
              size === "sm"
                ? "size-[1.9375rem] rounded-[9px]"
                : "size-[2.0625rem] rounded-[10px]",
              "hover:bg-white/5 hover:text-sidebar-foreground",
              "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/35",
            )}
          >
            <Icon className={size === "sm" ? "size-[0.9375rem]" : "size-4"} aria-hidden />
          </button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("toggleTheme")}
            className="text-muted-foreground hover:text-foreground"
          >
            <Icon className="size-[1.15rem]" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {THEME_OPTIONS.map(({ value, icon: OptionIcon, labelKey }) => (
          <DropdownMenuItem
            key={value}
            onSelect={() => setTheme(value)}
            data-active={mounted && theme === value}
            className="gap-2 data-[active=true]:font-medium data-[active=true]:text-brand-ink"
          >
            <OptionIcon className="size-4" />
            {t(labelKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
