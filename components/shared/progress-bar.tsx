import { cn } from "@/lib/utils";

/**
 * La progression d'un dossier : un filet de 6 px, encre pleine sur une piste
 * sourde, et le pourcentage écrit à côté.
 *
 * Une seule couleur, pas une échelle rouge-orange-vert : le chiffre est déjà
 * là, et traiter de « mauvais » un dossier simplement récent serait faux. Le
 * vert n'arrive qu'une fois l'étape acquise.
 */
export function ProgressBar({
  value,
  label,
  showValue = true,
  size = "default",
  className,
}: {
  value: number;
  label?: string;
  showValue?: boolean;
  size?: "default" | "sm";
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div className={cn("flex items-center", size === "sm" ? "gap-2" : "gap-2.5", className)}>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={cn(
          "min-w-14 flex-1 overflow-hidden rounded-full bg-border",
          size === "sm" ? "h-[5px]" : "h-1.5",
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width]",
            clamped >= 100 ? "bg-success" : "bg-primary",
          )}
          style={{ inlineSize: `${clamped}%` }}
        />
      </div>
      {showValue && (
        <span
          className={cn(
            "shrink-0 text-end tabular-nums",
            size === "sm"
              ? "text-[0.6875rem] text-muted-foreground"
              : "w-10 text-[0.8125rem] font-semibold text-secondary-foreground",
          )}
        >
          {clamped}%
        </span>
      )}
    </div>
  );
}
