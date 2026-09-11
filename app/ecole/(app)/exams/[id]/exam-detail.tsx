"use client";

import { ArrowLeft, ClipboardCheck, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmModal } from "@/components/shared/confirm-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { PageShell } from "@/components/shared/page-shell";
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
  const tNav = useTranslations("nav");
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

  // Le bandeau nuit tient sa place pendant l'attente : la page ne doit pas
  // sauter d'un en-tête à l'autre entre le squelette et la séance.
  if (isPending) {
    return (
      <PageShell kicker={tNav("exams")} back="/ecole/exams" title={<span className="block h-8 w-72 max-w-full animate-pulse rounded-md bg-white/12" />}>
        <Skeleton className="h-96" />
      </PageShell>
    );
  }

  if (isError || !exam) {
    // The session we just deleted is gone from under its own page — that is the
    // redirect arriving, not a session that was never there.
    return (
      <PageShell kicker={tNav("exams")} back="/ecole/exams" title={tNav("exams")}>
        {deleteExam.isSuccess ? (
          <Skeleton className="h-96" />
        ) : (
          <EmptyState icon={ClipboardCheck} title={tErrors("notFound")} />
        )}
      </PageShell>
    );
  }

  const filling = editing || (!rosterPending && roster.length === 0);

  return (
    <PageShell
      kicker={tNav("exams")} back="/ecole/exams"
      title={formatDate(exam.exam_date, locale, { dateStyle: "full" })}
      description={
        <span className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-4" aria-hidden />
            {t("candidatesAssigned", { count: roster.length })}
          </span>
          <StatusBadge status={exam.status} />
        </span>
      }
      mobileFooter={
        <Button variant="destructive" className="w-full" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="size-4" />
          {t("deleteExam")}
        </Button>
      }
      actions={
        <>
          <Button asChild variant="outline" className="border-sidebar-border text-sidebar-foreground hover:bg-white/8">
            <Link href="/ecole/exams">
              <ArrowLeft className="size-4 rtl-flip" />
              {tc("back")}
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
            {t("deleteExam")}
          </Button>
        </>
      }
    >
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
            <CardTitle>{t("results")}</CardTitle>
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
    </PageShell>
  );
}
