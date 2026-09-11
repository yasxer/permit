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
        className="h-1.5 min-w-14 flex-1 overflow-hidden rounded-full bg-border"
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
        <span className="w-10 shrink-0 text-end text-[0.8125rem] font-semibold tabular-nums text-secondary-foreground">
          {clamped}%
        </span>
      )}
    </div>
  );
}
