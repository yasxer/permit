import { cn } from "@/lib/utils";

/**
 * Colour tracks how far along the candidate is: red early, amber in the
 * middle, green once the stage is effectively cleared.
 */
function toneFor(value: number): string {
  if (value >= 100) return "bg-success";
  if (value >= 60) return "bg-primary";
  if (value >= 30) return "bg-warning";
  return "bg-destructive";
}

export function ProgressBar({
  value,
  label,
  showValue = true,
  className,
}: {
  value: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2 min-w-16 flex-1 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full transition-[width]", toneFor(clamped))}
          style={{ inlineSize: `${clamped}%` }}
        />
      </div>
      {showValue && (
        <span className="w-9 shrink-0 text-end text-xs font-medium tabular-nums text-muted-foreground">
          {clamped}%
        </span>
      )}
    </div>
  );
}
