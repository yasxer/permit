import { cn } from "@/lib/utils";

export type StageDatum = {
  key: string;
  label: string;
  value: number;
};

/** La rampe du parcours : code → créneau → conduite, du clair vers le foncé. */
const RAMP = [
  "var(--chart-ordinal-1)",
  "var(--chart-ordinal-2)",
  "var(--chart-ordinal-3)",
];

/**
 * La répartition des dossiers par étape.
 *
 * Trois barres : ni axe des valeurs, ni grille, ni légende — le chiffre est
 * écrit sur chacune, et la rampe d'ambre dit l'ordre du parcours mieux qu'une
 * échelle. Une ligne de base porte les colonnes en verticale ; sous `sm` elles
 * basculent à l'horizontale, où 390 px donnent de la longueur plutôt que de la
 * hauteur.
 */
export function StageBars({
  data,
  className,
}: {
  data: StageDatum[];
  className?: string;
}) {
  const max = Math.max(1, ...data.map((datum) => datum.value));

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Sous sm : barres horizontales, sans piste — la plus longue prend
          toute la largeur, les autres en proportion. Le chiffre est écrit au
          bout, en encre sur les deux teintes claires et en blanc sur la plus
          foncée, où l'encre ne tiendrait pas. */}
      <ul className="flex flex-col gap-[11px] sm:hidden">
        {data.map((datum, index) => (
          <li key={datum.key} className="flex items-center gap-2.5">
            <span className="w-16 shrink-0 text-[0.8125rem] text-secondary-foreground">
              {datum.label}
            </span>
            <span className="flex-1">
              <span
                className={cn(
                  "flex h-6 items-center justify-end rounded-[7px] pe-2 text-xs font-bold tabular-nums",
                  index === RAMP.length - 1 ? "text-white" : "text-[#1C2333]",
                )}
                style={{
                  inlineSize: `${Math.max(14, (datum.value / max) * 100)}%`,
                  background: RAMP[index % RAMP.length],
                }}
              >
                {datum.value}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {/* sm et au-delà : colonnes sur une ligne de base, valeur au-dessus. */}
      <div className="hidden flex-1 flex-col gap-2.5 sm:flex">
        <div
          className="grid flex-1 items-end gap-[18px] border-b border-input pb-0"
          style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}
        >
          {data.map((datum, index) => (
            <div key={datum.key} className="flex flex-col items-center gap-2.5">
              <span className="font-heading text-base font-bold tabular-nums">
                {datum.value}
              </span>
              <div
                className="w-full rounded-t-xl"
                style={{
                  // 158 px pour le maximum, comme la maquette ; le minimum reste
                  // visible même à une poignée de dossiers.
                  blockSize: `${Math.max(8, (datum.value / max) * 158)}px`,
                  background: RAMP[index % RAMP.length],
                }}
              />
            </div>
          ))}
        </div>

        <div
          className="grid gap-[18px]"
          style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}
        >
          {data.map((datum) => (
            <span
              key={datum.key}
              className="text-center text-[0.8125rem] font-semibold text-secondary-foreground"
            >
              {datum.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
