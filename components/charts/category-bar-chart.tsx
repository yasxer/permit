"use client";

import { useLocale } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

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
 * Horizontal bars for magnitude comparison. Nominal data keeps one hue for
 * every bar — colouring by value would spend the identity channel restating
 * what bar length already shows. Ordered stages pass an explicit ramp colour.
 */
export function CategoryBarChart({
  data,
  label,
  showValues = false,
  height = "h-64",
}: {
  data: BarDatum[];
  label: string;
  /** Required when the bars use the light end of the ordinal ramp. */
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
        margin={{ top: 4, right: showValues ? 40 : 12, bottom: 0, left: 4 }}
        barCategoryGap={8}
      >
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tickFormatter={(value: number) => formatNumber(value, locale)}
        />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          width={110}
          tickMargin={8}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent
              formatter={(value) => [formatNumber(Number(value), locale), label]}
            />
          }
        />
        <Bar
          dataKey="value"
          // Rounded data-end, square at the baseline.
          radius={[0, 4, 4, 0]}
          maxBarSize={24}
        >
          {showValues && (
            <LabelList
              dataKey="value"
              position="right"
              className="fill-muted-foreground text-xs tabular-nums"
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
