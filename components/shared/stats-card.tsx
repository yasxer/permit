import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
    <Card className={cn("shadow-none", className)}>
      <CardContent className="flex items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-[1.15rem]" aria-hidden />
        </span>

        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          {(hint || typeof trend === "number") && (
            <p className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-muted-foreground">
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
        </div>
      </CardContent>
    </Card>
  );
}
