"use client";

import { useId } from "react";
import { useLocale } from "next-intl";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMonthLabel, formatNumber } from "@/lib/format";
import type { MonthlyPoint } from "@/types";

/**
 * Une série dans le temps.
 *
 * L'aire sous la courbe, plutôt que la courbe seule : sur une grandeur qui
 * s'accumule — de l'argent encaissé, des inscriptions — la surface *est* la
 * quantité, et elle donne au graphe le poids visuel que deux pixels de trait
 * ne portent pas. Le dégradé s'éteint vers le bas pour que le remplissage ne
 * concurrence pas la ligne, qui reste la valeur exacte.
 *
 * Pas de légende, volontairement : avec une seule série, le titre de la carte
 * nomme déjà ce qui est tracé. Pas de points non plus tant qu'on ne survole
 * pas — huit pastilles sur douze mois font du bruit, pas de l'information.
 */
export function MonthlyAreaChart({
  data,
  label,
  formatValue,
  compact = false,
}: {
  data: MonthlyPoint[];
  /** Series name, shown in the tooltip. */
  label: string;
  formatValue?: (value: number) => string;
  /**
   * La version de la carte mobile : 110 px, ni axes ni repère — la forme de
   * l'année et le point du mois courant, rien d'autre. Sur 320 px, douze
   * libellés de mois se marcheraient dessus.
   */
  compact?: boolean;
}) {
  const locale = useLocale();
  // Deux graphes sur une page partagent le DOM : l'identifiant du dégradé doit
  // être unique, sinon le second reprend le remplissage du premier.
  const fillId = useId();

  const config = {
    value: { label, color: "var(--chart-1)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className={compact ? "h-[110px] w-full" : "h-64 w-full"}>
      <AreaChart
        data={data}
        margin={
          compact
            ? { top: 8, right: 8, bottom: 2, left: 8 }
            : { top: 8, right: 12, bottom: 0, left: 4 }
        }
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Grille horizontale seule, en trait plein : la lecture se fait par
            niveaux, jamais par colonnes. */}
        <CartesianGrid vertical={false} stroke="var(--separator)" />
        <XAxis
          dataKey="month"
          hide={compact}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          tickMargin={12}
          minTickGap={24}
          tick={(props) => {
            const { x, y, textAnchor, payload } = props as unknown as {
              x: number;
              y: number;
              textAnchor: "start" | "middle" | "end";
              payload: { value: string; index: number };
            };
            const current = payload.index === data.length - 1;
            return (
              <text
                x={x}
                y={y + 12}
                textAnchor={textAnchor}
                className={
                  current
                    ? "fill-foreground text-[11px] font-semibold"
                    : "fill-muted-foreground/80 text-[11px]"
                }
              >
                {formatMonthLabel(payload.value, locale)}
              </text>
            );
          }}
        />
        <YAxis
          hide={compact}
          tickLine={false}
          axisLine={false}
          width={48}
          tickCount={4}
          allowDecimals={false}
          tickFormatter={(value: number) => formatNumber(value, locale)}
        />
        <ChartTooltip
          cursor={{
            stroke: "var(--color-value)",
            strokeWidth: 1,
            strokeDasharray: "4 4",
          }}
          content={
            <ChartTooltipContent
              labelFormatter={(month) => formatMonthLabel(String(month), locale)}
              formatter={(value) => [
                formatValue
                  ? formatValue(Number(value))
                  : formatNumber(Number(value), locale),
                label,
              ]}
            />
          }
        />
        {/* Le repère du mois courant : c'est la valeur qu'on vient lire. */}
        {!compact && data.length > 0 && (
          <ReferenceLine
            x={data[data.length - 1].month}
            stroke="var(--color-value)"
            strokeDasharray="3 4"
            strokeOpacity={0.45}
          />
        )}
        <Area
          dataKey="value"
          type="monotone"
          stroke="var(--color-value)"
          strokeWidth={compact ? 2 : 2.2}
          // Sur 110 px, l'entrée animée n'apporte rien et retarde la seule
          // lecture que la carte propose.
          isAnimationActive={!compact}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={`url(#${fillId})`}
          // Une seule pastille : celle du mois courant, blanche cerclée
          // d'ambre. Douze points sur douze mois feraient du bruit.
          dot={(props) => {
            const { cx, cy, index, key } = props as unknown as {
              cx?: number;
              cy?: number;
              index?: number;
              key?: string;
            };
            if (index !== data.length - 1 || cx === undefined || cy === undefined) {
              return <g key={key} />;
            }
            // En compact, une pastille pleine : le point cerclé de blanc se
            // perd à cette taille.
            return compact ? (
              <circle key={key} cx={cx} cy={cy} r={3.5} fill="var(--color-value)" />
            ) : (
              <circle
                key={key}
                cx={cx}
                cy={cy}
                r={5}
                fill="var(--card)"
                stroke="var(--color-value)"
                strokeWidth={2.4}
              />
            );
          }}
          // Une pastille cerclée de la couleur de la carte reste lisible là où
          // la courbe passe dessous, et élargit la cible de survol.
          activeDot={{
            r: 5,
            fill: "var(--color-value)",
            stroke: "var(--card)",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
