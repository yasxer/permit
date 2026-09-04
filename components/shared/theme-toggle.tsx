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

const OPTIONS = [
  { value: "light", icon: Sun, labelKey: "lightMode" },
  { value: "dark", icon: Moon, labelKey: "darkMode" },
  { value: "system", icon: Monitor, labelKey: "systemMode" },
] as const;

export function ThemeToggle() {
  const t = useTranslations("nav");
  const { theme, setTheme, resolvedTheme } = useTheme();
  // The server has no idea which theme the browser resolved, so render a
  // stable placeholder until hydration rather than flashing the wrong icon.
  const mounted = useMounted();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("toggleTheme")}
          className="text-muted-foreground hover:text-foreground"
        >
          {mounted && resolvedTheme === "dark" ? (
            <Moon className="size-[1.15rem]" />
          ) : (
            <Sun className="size-[1.15rem]" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {OPTIONS.map(({ value, icon: Icon, labelKey }) => (
          <DropdownMenuItem
            key={value}
            onSelect={() => setTheme(value)}
            data-active={mounted && theme === value}
            className="gap-2 data-[active=true]:font-medium data-[active=true]:text-primary"
          >
            <Icon className="size-4" />
            {t(labelKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
