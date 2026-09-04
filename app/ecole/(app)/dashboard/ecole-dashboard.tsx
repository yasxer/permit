"use client";

import { CalendarClock, GraduationCap, Inbox, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { CategoryBarChart } from "@/components/charts/category-bar-chart";
import { MonthlyLineChart } from "@/components/charts/monthly-line-chart";
import { EmptyState } from "@/components/shared/empty-state";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSchoolStats } from "@/hooks/use-stats";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

export function EcoleDashboard({ schoolId }: { schoolId: string }) {
  const t = useTranslations("ecole.dashboard");
  const tStudents = useTranslations("ecole.students");
  const tc = useTranslations("common");
  const locale = useLocale();

  const { data, isPending, isError } = useSchoolStats(schoolId);

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return <EmptyState title={tc("error")} description={tc("noResultsHint")} />;
  }

  // Ordered stages, so the bars take a one-hue ramp rather than four
  // unrelated colours — the reader should see the sequence in the colour.
  const stages = [
    {
      key: "code",
      label: tStudents("stageCode"),
      value: data.stage_breakdown.code,
      color: "var(--chart-ordinal-1)",
    },
    {
      key: "creneau",
      label: tStudents("stageCreneau"),
      value: data.stage_breakdown.creneau,
      color: "var(--chart-ordinal-2)",
    },
    {
      key: "conduite",
      label: tStudents("stageConduite"),
      value: data.stage_breakdown.conduite,
      color: "var(--chart-ordinal-3)",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          icon={GraduationCap}
          label={t("activeStudents")}
          value={formatNumber(data.students_active, locale)}
        />
        <StatsCard
          icon={Inbox}
          label={t("pendingRequests")}
          value={formatNumber(data.requests_pending, locale)}
        />
        <StatsCard
          icon={Wallet}
          label={t("revenue")}
          value={formatCurrency(data.revenue_total, locale)}
        />
        <StatsCard
          icon={CalendarClock}
          label={t("nextExam")}
          value={
            data.next_exam ? formatDate(data.next_exam.date, locale) : t("noExam")
          }
          hint={data.next_exam ? tStudents(
            data.next_exam.type === "code" ? "stageCode" : "stageConduite",
          ) : undefined}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("paymentsPerMonth")}</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyLineChart
              data={data.payments_by_month}
              label={t("paymentsPerMonth")}
              formatValue={(value) => formatCurrency(value, locale)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("progressOverview")}</CardTitle>
          </CardHeader>
          <CardContent>
            {stages.every((stage) => stage.value === 0) ? (
              <EmptyState
                icon={GraduationCap}
                title={tStudents("empty")}
                className="py-10"
              />
            ) : (
              /* showValues: the light end of the ordinal ramp sits at 2.9:1,
                 so every bar carries its number. */
              <CategoryBarChart
                data={stages}
                label={t("activeStudents")}
                showValues
                height="h-56"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
