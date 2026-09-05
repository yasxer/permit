import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Un chiffre, et ce qu'il compte.
 *
 * L'étiquette passe au-dessus et le chiffre en dessous, en gros : sur une
 * rangée de quatre, l'œil balaie les valeurs d'abord et ne lit les étiquettes
 * que là où il s'arrête. L'icône recule en haut à droite — elle repère la
 * carte, elle n'est pas l'information.
 */
export function StatsCard({
  icon: Icon,
  label,
  value,
  hint,
  trend,
  className,
}: {
  icon: LucideIcon;
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  /** Percentage change against the previous period. */
  trend?: number;
  className?: string;
}) {
  const rising = typeof trend === "number" && trend >= 0;
  const TrendIcon = rising ? TrendingUp : TrendingDown;

  return (
    <Card
      className={cn(
        // La carte porte un `ring`, pas une bordure — c'est lui qui s'anime.
        "transition-shadow hover:ring-primary/25",
        className,
      )}
    >
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 truncate pt-1 text-sm text-muted-foreground">
            {label}
          </p>
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-[1.05rem]" aria-hidden />
          </span>
        </div>

        <p className="font-heading text-3xl font-bold tracking-tight tabular-nums">
          {value}
        </p>

        {(hint || typeof trend === "number") && (
          <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {typeof trend === "number" && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-medium",
                  rising ? "text-success" : "text-destructive",
                )}
              >
                <TrendIcon className="size-3.5" aria-hidden />
                {Math.abs(trend)}%
              </span>
            )}
            {hint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
