import { cn } from "@/lib/utils";

/**
 * « La route de l'élève » de la charte : le dégradé bleu nuit → ambre, qui
 * s'éclaircit à mesure que le candidat avance, et bascule au vert une fois
 * l'étape acquise.
 *
 * Le pourcentage est écrit à côté, alors la couleur n'a pas à porter le chiffre
 * une seconde fois — d'où un seul dégradé plutôt qu'une échelle rouge-orange-
 * vert qui traiterait de « mauvais » un dossier simplement récent.
 */
function toneFor(value: number): string {
  return value >= 100 ? "bg-success" : "road-gradient";
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
        className="h-2.5 min-w-16 flex-1 overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-foreground/5"
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
