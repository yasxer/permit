"use client";

import {
  ArrowRight,
  CalendarClock,
  CalendarPlus,
  GraduationCap,
  Inbox,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { CategoryBarChart } from "@/components/charts/category-bar-chart";
import { MonthlyAreaChart } from "@/components/charts/monthly-area-chart";
import { EmptyState } from "@/components/shared/empty-state";
import { StatsCard } from "@/components/shared/stats-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSchoolStats } from "@/hooks/use-stats";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

export function EcoleDashboard({ schoolId }: { schoolId: string }) {
  const t = useTranslations("ecole.dashboard");
  const tStudents = useTranslations("ecole.students");
  const tExams = useTranslations("ecole.exams");
  const tc = useTranslations("common");
  const locale = useLocale();

  const { data, isPending, isError } = useSchoolStats(schoolId);

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-5">
          <Skeleton className="h-80 lg:col-span-3" />
          <Skeleton className="h-80 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return <EmptyState title={tc("error")} description={tc("noResultsHint")} />;
  }

  // Ordered stages, so the bars take a one-hue ramp rather than three
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
      {/* La séance qui arrive : la seule chose sur ce tableau de bord sur
          laquelle on agit aujourd'hui, donc la seule qui prend le bandeau
          sombre et l'unique accent ambre de l'écran. Le `dark` rebascule les
          jetons pour ses descendants — voir `Navbar`. */}
      <section className="dark relative overflow-hidden rounded-2xl bg-sidebar px-6 py-6 text-white">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_140%_at_100%_0%,rgba(245,166,35,0.16),transparent_70%)]"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
          <div className="min-w-0">
            <p className="tag-caps flex items-center gap-2 text-[0.65rem] font-bold text-brand">
              <CalendarClock className="size-3.5" aria-hidden />
              {t("nextExam")}
            </p>

            {data.next_exam ? (
              <>
                <p className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                  {formatDate(data.next_exam.date, locale, { dateStyle: "full" })}
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-sidebar-muted">
                  <Users className="size-4" aria-hidden />
                  {tExams("candidatesAssigned", {
                    count: data.next_exam.candidates,
                  })}
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                  {t("noExam")}
                </p>
                <p className="mt-1.5 text-sm text-sidebar-muted">
                  {t("noExamHint")}
                </p>
              </>
            )}
          </div>

          <Button asChild size="lg" className="h-11 rounded-xl px-4">
            <Link href="/ecole/exams">
              {data.next_exam ? (
                <>
                  {t("openExams")}
                  <ArrowRight className="rtl-flip" />
                </>
              ) : (
                <>
                  <CalendarPlus />
                  {tExams("createExam")}
                </>
              )}
            </Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          icon={GraduationCap}
          label={t("activeStudents")}
          value={formatNumber(data.students_active, locale)}
          hint={t("completedHint", { count: data.students_completed })}
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
          hint={
            data.next_exam
              ? tExams("candidatesAssigned", { count: data.next_exam.candidates })
              : undefined
          }
        />
      </div>

      {/* La série temporelle est la lecture principale : elle prend trois
          cinquièmes de la largeur, la répartition les deux autres. */}
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="border-b">
            <CardTitle>{t("paymentsPerMonth")}</CardTitle>
            <CardDescription>{t("lastMonths")}</CardDescription>
            <CardAction>
              <span className="font-heading text-xl font-bold tabular-nums">
                {formatCurrency(data.revenue_total, locale)}
              </span>
            </CardAction>
          </CardHeader>
          <CardContent>
            <MonthlyAreaChart
              data={data.payments_by_month}
              label={t("paymentsPerMonth")}
              formatValue={(value) => formatCurrency(value, locale)}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>{t("progressOverview")}</CardTitle>
            <CardDescription>{t("progressHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            {stages.every((stage) => stage.value === 0) ? (
              <EmptyState
                icon={GraduationCap}
                title={tStudents("empty")}
                className="py-10"
              />
            ) : (
              <CategoryBarChart
                data={stages}
                label={t("activeStudents")}
                height="h-56"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
