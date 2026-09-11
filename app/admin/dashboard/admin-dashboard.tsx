"use client";

import { BadgeCheck, Building2, GraduationCap, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { CategoryBarChart } from "@/components/charts/category-bar-chart";
import { MonthlyAreaChart } from "@/components/charts/monthly-area-chart";
import { EmptyState } from "@/components/shared/empty-state";
import { Notice } from "@/components/shared/notice";
import { StatsCard } from "@/components/shared/stats-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStats } from "@/hooks/use-stats";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { Locale } from "@/i18n/config";

/** Wilaya name in the reader's language. */
function wilayaName(
  row: { name_ar: string; name_fr: string; name_en: string },
  locale: string,
): string {
  const byLocale: Record<Locale, string> = {
    ar: row.name_ar,
    fr: row.name_fr,
    en: row.name_en,
  };
  return byLocale[locale as Locale] ?? row.name_fr;
}

export function AdminDashboard() {
  const t = useTranslations("admin.dashboard");
  const tc = useTranslations("common");
  const locale = useLocale();

  const { data, isPending, isError, refetch, isFetching } = useAdminStats();

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
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

  // Un bandeau plutôt qu'une page d'erreur : le tableau de bord est une
  // lecture, et la relancer doit coûter un clic, pas une navigation.
  if (isError || !data) {
    return (
      <Notice
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            {tc("retry")}
          </Button>
        }
      >
        {tc("error")}
      </Notice>
    );
  }

  // Top wilayas only: past ~10 bars the chart stops being readable and the
  // long tail is all 1s.
  const wilayaBars = data.schools_by_wilaya.slice(0, 10).map((row) => ({
    key: String(row.code),
    label: wilayaName(row, locale),
    value: row.value,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        <StatsCard
          icon={Building2}
          label={t("totalSchools")}
          value={formatNumber(data.schools_total, locale)}
          hint={t("schoolsBreakdown", {
            approved: data.schools_approved,
            pending: data.schools_pending,
          })}
        />
        <StatsCard
          icon={GraduationCap}
          label={t("totalCandidates")}
          value={formatNumber(data.candidates_total, locale)}
        />
        <StatsCard
          icon={BadgeCheck}
          label={t("totalDrivers")}
          value={formatNumber(data.drivers_total, locale)}
        />
        <StatsCard
          icon={Wallet}
          label={t("revenue")}
          value={formatCurrency(data.revenue_total, locale)}
          compact
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("enrollmentsPerMonth")}</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyAreaChart
              data={data.enrollments_by_month}
              label={t("enrollmentsPerMonth")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("schoolsByWilaya")}</CardTitle>
          </CardHeader>
          <CardContent>
            {wilayaBars.length === 0 ? (
              <EmptyState icon={Building2} title={tc("empty")} className="py-10" />
            ) : (
              <CategoryBarChart data={wilayaBars} label={t("totalSchools")} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
