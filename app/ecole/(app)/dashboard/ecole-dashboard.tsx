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
import { useIsMobile } from "@/hooks/use-mobile";
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
  // Le graphe mobile est un autre objet — ni axes ni repère — et recharts ne
  // se laisse pas masquer par une classe sans se plaindre de sa largeur nulle.
  const isMobile = useIsMobile();

  const { data, isPending, isError, refetch, isFetching } = useSchoolStats(schoolId);

  if (isPending) {
    return (
      <>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl sm:h-32" />
          ))}
        </div>
        <Skeleton className="h-44 rounded-xl sm:h-28" />
        <div className="grid gap-3.5 sm:gap-5 lg:grid-cols-[1.55fr_1fr]">
          <Skeleton className="h-44 rounded-xl sm:h-80" />
          <Skeleton className="h-44 rounded-xl sm:h-80" />
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

  const exam = data.next_exam;
  const examStages = exam?.stages
    ? [
        { key: "code", label: tStudents("stageCode"), value: exam.stages.code },
        { key: "creneau", label: tStudents("stageCreneau"), value: exam.stages.creneau },
        { key: "conduite", label: tStudents("stageConduite"), value: exam.stages.conduite },
      ]
    : null;

  const examCta = (className?: string) => (
    <Button asChild className={className}>
      <Link href="/ecole/exams">
        {exam ? (
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
  );

  return (
    <>
      {/* Quatre chiffres, un par carte : sur desktop la rangée chevauche le
          bandeau nuit, sur mobile elle ouvre la feuille claire en 2 × 2. */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        <StatsCard
          icon={GraduationCap}
          label={t("activeStudents")}
          shortLabel={t("activeShort")}
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
          shortLabel={t("pendingShort")}
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
          shortLabel={t("revenueShort")}
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
          shortLabel={t("graduatesShort")}
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

      {/* Le prochain examen, version mobile (1c) : l'échéance en tête, la
          date, les trois compteurs sous un filet, et le CTA pleine largeur —
          c'est le seul geste de l'écran, il prend toute la place du pouce. */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            {t("nextExam")}
          </span>
          {exam && (
            <span className="rounded-full bg-brand/16 px-[0.5625rem] py-1 text-[0.6875rem] font-semibold text-warning">
              {t("nextExamIn", { count: daysUntil(exam.date) })}
            </span>
          )}
        </div>

        <span className="font-heading text-lg font-semibold leading-[1.35] tracking-[-0.01em]">
          {exam ? formatDate(exam.date, locale, { dateStyle: "full" }) : t("noExam")}
        </span>

        {exam && examStages ? (
          <div className="flex gap-3.5 border-t border-separator pt-[11px] text-xs tabular-nums text-muted-foreground">
            {examStages.map((stage) => (
              <span key={stage.key}>
                <span className="font-bold text-foreground">{stage.value}</span>{" "}
                {stage.label.toLocaleLowerCase(locale)}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">
            {exam
              ? tExams("candidatesAssigned", { count: exam.candidates })
              : t("noExamHint")}
          </span>
        )}

        {examCta("h-12 w-full text-[0.9375rem]")}
      </div>

      {/* Et sa version desktop (1b) : la pastille de date, la phrase, le CTA
          en bout de ligne. */}
      <div className="hidden items-center justify-between gap-6 rounded-xl border border-border bg-card px-6 py-5 sm:flex">
        <div className="flex items-center gap-[18px]">
          <div className="flex size-[3.875rem] shrink-0 flex-col items-center justify-center gap-px rounded-[14px] bg-sidebar text-white">
            {exam ? (
              <>
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-brand">
                  {formatDate(exam.date, locale, { month: "short" })}
                </span>
                <span className="font-heading text-2xl font-bold leading-none tabular-nums">
                  {formatDate(exam.date, locale, { day: "numeric" })}
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
            <span className="font-heading text-[1.375rem] font-semibold tracking-[-0.02em]">
              {exam ? formatDate(exam.date, locale, { dateStyle: "full" }) : t("noExam")}
            </span>
            <span className="text-[0.8125rem] tabular-nums text-muted-foreground">
              {exam ? (
                <>
                  {tExams("candidatesAssigned", { count: exam.candidates })}
                  {/* La coupe par stade dit combien de salles et de véhicules
                      il faut ouvrir ce matin-là. */}
                  {exam.stages && (
                    <>
                      {" · "}
                      {t("examBreakdown", exam.stages)}
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
          {exam && (
            <span className="rounded-full bg-brand/16 px-3 py-1.5 text-xs font-semibold text-warning">
              {t("nextExamIn", { count: daysUntil(exam.date) })}
            </span>
          )}
          {examCta()}
        </div>
      </div>

      {/* La série temporelle est la lecture principale ; la répartition tient
          le reste de la largeur. */}
      <div className="grid gap-3.5 sm:gap-5 lg:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("paymentsPerMonth")}</CardTitle>
            <CardDescription className="hidden sm:block">{t("monthlyHint")}</CardDescription>
            <CardAction className="text-end">
              <span className="text-[0.6875rem] text-muted-foreground/80 sm:hidden">
                {t("lastMonths")}
              </span>
              {lastMonth && (
                <span className="hidden sm:block">
                  <span className="block font-heading text-[1.1875rem] font-bold tabular-nums">
                    {formatCurrency(lastMonth.value, locale)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {formatDate(`${lastMonth.month}-01`, locale, {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </span>
              )}
            </CardAction>
          </CardHeader>
          <CardContent>
            <MonthlyAreaChart
              data={data.payments_by_month}
              label={t("paymentsPerMonth")}
              formatValue={(value) => formatCurrency(value, locale)}
              compact={isMobile}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("progressOverview")}</CardTitle>
            <CardDescription className="hidden sm:block">
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
                <p className="hidden text-xs leading-relaxed text-muted-foreground/80 sm:block">
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
