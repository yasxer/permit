import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const HINT_TONE = {
  muted: "text-muted-foreground",
  // #8A5A06 : l'ambre lisible en texte, pour ce qui demande une action.
  warning: "font-medium text-warning",
  success: "font-medium text-success",
} as const;

/**
 * Un chiffre, et ce qu'il compte.
 *
 * L'étiquette passe au-dessus en micro-capitales et le chiffre en dessous, en
 * gros : sur une rangée de quatre, l'œil balaie les valeurs d'abord et ne lit
 * les étiquettes que là où il s'arrête. L'icône recule dans un aplat sourd au
 * coin de fin — elle repère la carte, elle n'est pas l'information. La ligne
 * de contexte est séparée par un filet : c'est une seconde lecture, pas la
 * suite de la première.
 */
export function StatsCard({
  icon: Icon,
  label,
  value,
  hint,
  hintTone = "muted",
  /** Les montants longs descendent d'un cran pour tenir sur une ligne. */
  compact = false,
  className,
}: {
  icon: LucideIcon;
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  hintTone?: keyof typeof HINT_TONE;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3.5 rounded-xl border border-border bg-card p-3.5 sm:gap-4 sm:p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2 sm:gap-2.5">
          <span className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
            {/* Sur 390 px, l'icône se met en tête de l'étiquette : le coin de
                fin est déjà pris par le chiffre. */}
            <Icon className="size-3.5 shrink-0 sm:hidden" strokeWidth={1.9} aria-hidden />
            <span className="truncate">{label}</span>
          </span>

          <span
            className={cn(
              "font-heading font-bold leading-none tracking-[-0.03em] tabular-nums",
              compact
                ? "text-[1.1875rem] leading-tight sm:text-[1.6875rem]"
                : "text-[1.75rem] sm:text-[2.25rem]",
            )}
          >
            {value}
          </span>
        </div>

        <span className="hidden size-9.5 shrink-0 place-items-center rounded-[11px] bg-primary/6 text-primary sm:grid">
          <Icon className="size-[1.1875rem]" strokeWidth={1.8} aria-hidden />
        </span>
      </div>

      {hint && (
        <p
          className={cn(
            "border-t border-separator pt-3 text-xs tabular-nums",
            HINT_TONE[hintTone],
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
