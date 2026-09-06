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

const OPTIONS = [
  { value: "light", icon: Sun, labelKey: "lightMode" },
  { value: "dark", icon: Moon, labelKey: "darkMode" },
  { value: "system", icon: Monitor, labelKey: "systemMode" },
] as const;

/** `variant="nav"` : le carré bordé de 33 px de la barre nuit. */
export function ThemeToggle({ variant = "plain" }: { variant?: "plain" | "nav" }) {
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
              "grid size-[2.0625rem] shrink-0 place-items-center rounded-[10px]",
              "border border-sidebar-border text-sidebar-muted transition-colors",
              "hover:bg-white/5 hover:text-sidebar-foreground",
              "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/35",
            )}
          >
            <Icon className="size-4" aria-hidden />
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
        {OPTIONS.map(({ value, icon: OptionIcon, labelKey }) => (
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
