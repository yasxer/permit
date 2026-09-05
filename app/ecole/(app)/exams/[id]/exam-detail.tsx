"use client";

import { ArrowLeft, CalendarDays, ClipboardCheck, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmModal } from "@/components/shared/confirm-modal";
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
import { useDeleteExam, useExam, useExamRoster } from "@/hooks/use-exams";
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
  const router = useRouter();

  const { data: exam, isPending, isError } = useExam(examId);
  const { data: roster = [], isPending: rosterPending } = useExamRoster(examId);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteExam = useDeleteExam();

  async function confirmDelete() {
    try {
      await deleteExam.mutateAsync({ id: examId });
      toast.success(t("examDeleted"));
      router.push("/ecole/exams");
    } catch (error) {
      // The toast can only say so much; the Postgres message behind it is what
      // tells you *why*, and losing it turns a five-minute fix into a hunt.
      console.error("delete exam failed", error);
      // A refusal and a crash are not the same news: say which one it was
      // rather than "something went wrong" on an action that changes nothing.
      const code = (error as { code?: string }).code;
      toast.error(
        code === "42501"
          ? tErrors("forbidden")
          : code === "P0002"
            ? tErrors("notFound")
            : tErrors("generic"),
      );
    }
  }

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
    // The session we just deleted is gone from under its own page — that is the
    // redirect arriving, not a session that was never there.
    return deleteExam.isSuccess ? (
      <Skeleton className="h-96" />
    ) : (
      <EmptyState icon={ClipboardCheck} title={tErrors("notFound")} />
    );
  }

  const filling = editing || (!rosterPending && roster.length === 0);

  return (
    <>
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="-ms-2">
            <Link href="/ecole/exams">
              <ArrowLeft className="size-4 rtl-flip" />
              {tc("back")}
            </Link>
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            {t("deleteExam")}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight">
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

      <ConfirmModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("deleteExamTitle")}
        message={t("deleteExamMessage", {
          date: formatDate(exam.exam_date, locale, { dateStyle: "long" }),
        })}
        confirmLabel={tc("delete")}
        destructive
        pending={deleteExam.isPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
