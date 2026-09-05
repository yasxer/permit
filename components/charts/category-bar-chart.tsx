"use client";

import { useLocale } from "next-intl";
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatNumber } from "@/lib/format";

export type BarDatum = {
  key: string;
  label: string;
  value: number;
  /** Set for ordered scales; omit for a nominal series. */
  color?: string;
};

/**
 * Des barres horizontales pour comparer des grandeurs.
 *
 * Chaque barre court sur un rail sourd de la largeur du graphe : on lit alors
 * une part autant qu'une longueur, sans avoir à suivre une grille jusqu'à un
 * axe. La grille et l'axe des valeurs sautent d'ailleurs — le rail donne
 * l'échelle et l'étiquette donne le chiffre exact, un axe de plus ne dirait
 * rien de neuf.
 *
 * Les données nominales gardent une seule teinte : colorer par valeur
 * dépenserait le canal identité à répéter ce que la longueur montre déjà. Les
 * étapes ordonnées, elles, passent une couleur de rampe explicite.
 */
export function CategoryBarChart({
  data,
  label,
  showValues = true,
  height = "h-64",
}: {
  data: BarDatum[];
  label: string;
  /** Off only when the number beside each bar would be noise. */
  showValues?: boolean;
  height?: string;
}) {
  const locale = useLocale();

  const config = {
    value: { label, color: "var(--chart-1)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className={`${height} w-full`}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: showValues ? 44 : 12, bottom: 0, left: 4 }}
        barCategoryGap={14}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          width={110}
          tickMargin={10}
          className="text-xs"
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value) => [formatNumber(Number(value), locale), label]}
            />
          }
        />
        <Bar
          dataKey="value"
          radius={6}
          maxBarSize={28}
          background={{ fill: "var(--muted)", radius: 6 }}
        >
          {showValues && (
            <LabelList
              dataKey="value"
              position="right"
              offset={10}
              className="fill-foreground text-xs font-semibold tabular-nums"
              formatter={(value) => formatNumber(Number(value ?? 0), locale)}
            />
          )}
          {data.map((datum) => (
            <Cell key={datum.key} fill={datum.color ?? "var(--color-value)"} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
