"use client";

import { ArrowLeft, CalendarDays, ClipboardCheck, Users } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useExam, useExamRoster } from "@/hooks/use-exams";
import { formatDate } from "@/lib/format";

import { ResultsTable } from "./results-table";
import { RosterWizard } from "./roster-wizard";

/**
 * One session, two moments. Before it is filled, the school walks the roster
 * category by category and stage by stage; once it is filled, the same page is
 * the list of everyone who sat it, with the verdict to enter.
 */
export function ExamDetail({
  examId,
  schoolId,
}: {
  examId: string;
  schoolId: string;
}) {
  const t = useTranslations("ecole.exams");
  const tc = useTranslations("common");
  const tErrors = useTranslations("errors");
  const locale = useLocale();

  const { data: exam, isPending, isError } = useExam(examId);
  const { data: roster = [], isPending: rosterPending } = useExamRoster(examId);
  const [editing, setEditing] = useState(false);

  const assigned = useMemo(
    () => new Set(roster.map((row) => row.enrollment_id)),
    [roster],
  );

  if (isPending) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError || !exam) {
    return <EmptyState icon={ClipboardCheck} title={tErrors("notFound")} />;
  }

  const filling = editing || (!rosterPending && roster.length === 0);

  return (
    <>
      <div className="mb-6 space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ms-2">
          <Link href="/ecole/exams">
            <ArrowLeft className="size-4 rtl-flip" />
            {tc("back")}
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <CalendarDays className="size-5 text-muted-foreground" aria-hidden />
            {formatDate(exam.exam_date, locale, { dateStyle: "full" })}
          </h1>
          <StatusBadge status={exam.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {t("candidatesAssigned", { count: roster.length })}
        </p>
      </div>

      {filling ? (
        <RosterWizard
          examId={examId}
          schoolId={schoolId}
          assigned={assigned}
          onDone={() => setEditing(false)}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("results")}</CardTitle>
            <CardAction>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Users className="size-4" />
                {t("editRoster")}
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            {rosterPending ? (
              <div className="space-y-2 px-6">
                {Array.from({ length: 4 }, (_, row) => (
                  <Skeleton key={row} className="h-11" />
                ))}
              </div>
            ) : (
              <ResultsTable examId={examId} roster={roster} />
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
