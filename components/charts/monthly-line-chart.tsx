"use client";

import { useLocale } from "next-intl";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMonthLabel, formatNumber } from "@/lib/format";
import type { MonthlyPoint } from "@/types";

/**
 * One series over time. No legend by design — with a single series the card
 * title already names what is plotted, and a one-swatch box just restates it.
 */
export function MonthlyLineChart({
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

  const config = {
    value: { label, color: "var(--chart-1)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-64 w-full">
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tickFormatter={(month: string) => formatMonthLabel(month, locale)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          allowDecimals={false}
          tickFormatter={(value: number) => formatNumber(value, locale)}
        />
        <ChartTooltip
          cursor={{ stroke: "var(--border)" }}
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
        <Line
          dataKey="value"
          type="monotone"
          stroke="var(--color-value)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          // A 2px ring in the surface colour keeps dots legible where the line
          // crosses them, and widens the hover target.
          dot={{ r: 3, fill: "var(--color-value)", stroke: "var(--card)", strokeWidth: 2 }}
          activeDot={{ r: 5, fill: "var(--color-value)", stroke: "var(--card)", strokeWidth: 2 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
