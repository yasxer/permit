"use client";

import {
  ArrowRight,
  Award,
  CalendarPlus,
  CreditCard,
  GraduationCap,
  Inbox,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { MonthlyAreaChart } from "@/components/charts/monthly-area-chart";
import { StageBars } from "@/components/charts/stage-bars";
import { EmptyState } from "@/components/shared/empty-state";
import { Notice } from "@/components/shared/notice";
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

/** Combien de jours nous séparent d'une date, arrondi au jour civil. */
function daysUntil(iso: string): number {
  const day = 24 * 60 * 60 * 1000;
  const target = new Date(iso);
  const today = new Date();
  return Math.max(
    0,
    Math.round(
      (Date.UTC(target.getFullYear(), target.getMonth(), target.getDate()) -
        Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) /
        day,
    ),
  );
}

export function EcoleDashboard({ schoolId }: { schoolId: string }) {
  const t = useTranslations("ecole.dashboard");
  const tStudents = useTranslations("ecole.students");
  const tExams = useTranslations("ecole.exams");
  const tc = useTranslations("common");
  const locale = useLocale();

  const { data, isPending, isError, refetch, isFetching } = useSchoolStats(schoolId);

  if (isPending) {
    return (
      <>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-28 rounded-xl" />
        <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </>
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

  const stages = [
    { key: "code", label: tStudents("stageCode"), value: data.stage_breakdown.code },
    { key: "creneau", label: tStudents("stageCreneau"), value: data.stage_breakdown.creneau },
    { key: "conduite", label: tStudents("stageConduite"), value: data.stage_breakdown.conduite },
  ];

  const lastMonth = data.payments_by_month.at(-1);
  // Deux chemins vers le même chiffre : l'agrégat le calcule, mais une base
  // restée en arrière ne l'envoie pas — la dernière colonne du graphe dit
  // alors la même chose.
  const revenueThisMonth = data.revenue_this_month ?? lastMonth?.value ?? null;

  return (
    <>
      {/* Quatre chiffres, un par carte : la rangée chevauche le bandeau nuit,
          et c'est ce chevauchement qui rattache la page à son en-tête. */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        <StatsCard
          icon={GraduationCap}
          label={t("activeStudents")}
          value={formatNumber(data.students_active, locale)}
          hint={
            data.students_active_this_month === undefined
              ? undefined
              : t("newFilesThisMonth", { count: data.students_active_this_month })
          }
        />
        <StatsCard
          icon={Inbox}
          label={t("pendingRequests")}
          value={formatNumber(data.requests_pending, locale)}
          hint={
            data.requests_today
              ? t("arrivedToday", { count: data.requests_today })
              : undefined
          }
          hintTone="warning"
        />
        <StatsCard
          icon={CreditCard}
          label={t("revenue")}
          value={formatCurrency(data.revenue_total, locale)}
          compact
          hint={
            revenueThisMonth === null
              ? undefined
              : t("revenueThisMonth", {
                  amount: formatCurrency(revenueThisMonth, locale),
                })
          }
          hintTone="success"
        />
        <StatsCard
          icon={Award}
          label={t("graduates")}
          value={formatNumber(data.students_completed, locale)}
          hint={
            data.students_completed_this_quarter === undefined
              ? undefined
              : t("quarterGraduates", {
                  count: data.students_completed_this_quarter,
                })
          }
        />
      </div>

      {/* La séance qui arrive : la seule chose du tableau de bord sur laquelle
          on agit aujourd'hui, donc la seule qui porte un CTA. */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-[18px]">
          <div className="flex size-[3.875rem] shrink-0 flex-col items-center justify-center gap-px rounded-[14px] bg-primary text-primary-foreground">
            {data.next_exam ? (
              <>
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-brand">
                  {formatDate(data.next_exam.date, locale, { month: "short" })}
                </span>
                <span className="font-heading text-2xl font-bold leading-none tabular-nums">
                  {formatDate(data.next_exam.date, locale, { day: "numeric" })}
                </span>
              </>
            ) : (
              <CalendarPlus className="size-6 text-brand" aria-hidden />
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
              {t("nextExam")}
            </span>
            <span className="font-heading text-lg font-semibold tracking-[-0.02em] sm:text-[1.375rem]">
              {data.next_exam
                ? formatDate(data.next_exam.date, locale, { dateStyle: "full" })
                : t("noExam")}
            </span>
            <span className="text-[0.8125rem] tabular-nums text-muted-foreground">
              {data.next_exam ? (
                <>
                  {tExams("candidatesAssigned", {
                    count: data.next_exam.candidates,
                  })}
                  {/* La coupe par stade dit combien de salles et de véhicules
                      il faut ouvrir ce matin-là. */}
                  {data.next_exam.stages && (
                    <>
                      {" · "}
                      {t("examBreakdown", data.next_exam.stages)}
                    </>
                  )}
                </>
              ) : (
                t("noExamHint")
              )}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {data.next_exam && (
            <span className="rounded-full bg-brand/16 px-3 py-1.5 text-xs font-semibold text-warning">
              {t("nextExamIn", { count: daysUntil(data.next_exam.date) })}
            </span>
          )}
          <Button asChild className="flex-1 sm:flex-none">
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
      </div>

      {/* La série temporelle est la lecture principale ; la répartition tient
          le reste de la largeur. */}
      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("paymentsPerMonth")}</CardTitle>
            <CardDescription>{t("monthlyHint")}</CardDescription>
            {lastMonth && (
              <CardAction className="text-end">
                <span className="block font-heading text-[1.1875rem] font-bold tabular-nums">
                  {formatCurrency(lastMonth.value, locale)}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {formatDate(`${lastMonth.month}-01`, locale, {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            <MonthlyAreaChart
              data={data.payments_by_month}
              label={t("paymentsPerMonth")}
              formatValue={(value) => formatCurrency(value, locale)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("progressOverview")}</CardTitle>
            <CardDescription>
              {t("activeFilesHint", { count: data.students_active })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            {stages.every((stage) => stage.value === 0) ? (
              <EmptyState
                icon={GraduationCap}
                title={tStudents("empty")}
                className="py-10"
              />
            ) : (
              <>
                <StageBars data={stages} className="flex-1" />
                <p className="text-xs leading-relaxed text-muted-foreground/80">
                  {t("rampHint")}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
