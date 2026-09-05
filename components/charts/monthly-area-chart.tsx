"use client";

import { useId } from "react";
import { useLocale } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
}: {
  data: MonthlyPoint[];
  /** Series name, shown in the tooltip. */
  label: string;
  formatValue?: (value: number) => string;
}) {
  const locale = useLocale();
  // Deux graphes sur une page partagent le DOM : l'identifiant du dégradé doit
  // être unique, sinon le second reprend le remplissage du premier.
  const fillId = useId();

  const config = {
    value: { label, color: "var(--chart-1)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-64 w-full">
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          vertical={false}
          strokeDasharray="4 4"
          stroke="var(--border)"
        />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={12}
          minTickGap={24}
          tickFormatter={(month: string) => formatMonthLabel(month, locale)}
        />
        <YAxis
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
        <Area
          dataKey="value"
          type="monotone"
          stroke="var(--color-value)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={`url(#${fillId})`}
          dot={false}
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
