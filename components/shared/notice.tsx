import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const TONES = {
  error:
    "border-destructive/30 bg-destructive/9 text-[color-mix(in_oklch,var(--destructive),black_22%)] dark:text-destructive",
  warning: "border-brand/40 bg-brand/12 text-warning",
} as const;

/**
 * Un bandeau, pas un écran.
 *
 * Quand une lecture échoue ou qu'il manque quelque chose au profil, la page
 * reste là : le bandeau dit ce qui ne va pas et tend le geste qui répare. Le
 * remplacer par une page d'erreur pleine coûterait tout ce qui s'affichait
 * déjà correctement autour.
 */
export function Notice({
  tone = "error",
  children,
  action,
  className,
}: {
  tone?: keyof typeof TONES;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex flex-wrap items-center gap-2.5 rounded-xl border px-3.5 py-3 text-[0.8125rem]",
        TONES[tone],
        className,
      )}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {action}
    </div>
  );
}
