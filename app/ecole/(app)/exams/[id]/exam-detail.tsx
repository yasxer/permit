"use client";

import { ArrowLeft, CalendarDays, ClipboardCheck, Users } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { ProgressBar } from "@/components/shared/progress-bar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  useAssignCandidates,
  useEligibleCandidates,
  useExam,
  useExamRoster,
  useSaveResults,
} from "@/hooks/use-exams";
import { formatDate } from "@/lib/format";
import type { ExamResult } from "@/types";

const RESULTS: ExamResult[] = ["passed", "failed", "absent"];

export function ExamDetail({
  examId,
  schoolId,
}: {
  examId: string;
  schoolId: string;
}) {
  const t = useTranslations("ecole.exams");
  const tPlanning = useTranslations("ecole.planning");
  const tStudents = useTranslations("ecole.students");
  const tc = useTranslations("common");
  const tStatus = useTranslations("status");
  const tErrors = useTranslations("errors");
  const locale = useLocale();

  const { data: exam, isPending, isError } = useExam(examId);
  const { data: roster = [] } = useExamRoster(examId);
  const { data: eligible = [], isPending: eligiblePending } = useEligibleCandidates(
    schoolId,
    exam?.exam_type ?? "code",
  );

  const assign = useAssignCandidates();
  const saveResults = useSaveResults();

  // Both editors read through to the server data and hold only what the user
  // has actually changed. Copying the roster into state on arrival would need
  // an effect, and would show a stale selection for one frame after a refetch.
  const [selectedDraft, setSelectedDraft] = useState<Set<string> | null>(null);
  const [resultEdits, setResultEdits] = useState<Record<string, ExamResult | null>>(
    {},
  );

  const assigned = useMemo(
    () => new Set(roster.map((row) => row.enrollment_id)),
    [roster],
  );
  const selected = selectedDraft ?? assigned;

  const resultFor = (enrollmentId: string, saved: ExamResult | null) =>
    enrollmentId in resultEdits ? resultEdits[enrollmentId] : saved;

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

  const isPast = new Date(`${exam.exam_date}T23:59:59`) < new Date();

  function toggle(enrollmentId: string) {
    const next = new Set(selected);
    if (next.has(enrollmentId)) next.delete(enrollmentId);
    else next.add(enrollmentId);
    setSelectedDraft(next);
  }

  async function onAssign() {
    try {
      await assign.mutateAsync({ examId, enrollmentIds: [...selected] });
      toast.success(t("assigned"));
      // Hand control back to the server copy now that they agree.
      setSelectedDraft(null);
    } catch {
      toast.error(tErrors("generic"));
    }
  }

  async function onSaveResults() {
    const results = Object.fromEntries(
      roster.map((row) => [
        row.enrollment_id,
        resultFor(row.enrollment_id, row.result),
      ]),
    );
    try {
      await saveResults.mutateAsync({ examId, results });
      toast.success(t("resultsSaved"));
      setResultEdits({});
    } catch {
      toast.error(tErrors("generic"));
    }
  }

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
          <Badge variant="secondary" className="font-medium">
            {tPlanning(exam.exam_type === "code" ? "code" : "conduite")}
          </Badge>
          <StatusBadge status={exam.status} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("eligibleCandidates")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {exam.exam_type === "code"
                ? t("eligibleCodeHint")
                : t("eligibleConduiteHint")}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {eligiblePending ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-11" />
                ))}
              </div>
            ) : eligible.length === 0 ? (
              <EmptyState icon={Users} title={t("noEligible")} className="py-8" />
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 border-b pb-3">
                  <Label className="flex items-center gap-2.5 font-normal">
                    <Checkbox
                      checked={
                        selected.size > 0 && selected.size === eligible.length
                      }
                      onCheckedChange={(checked) =>
                        setSelectedDraft(
                          checked
                            ? new Set(eligible.map((file) => file.id))
                            : new Set(),
                        )
                      }
                    />
                    {t("selectAll")}
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {t("selectedCount", { count: selected.size })}
                  </span>
                </div>

                <ul className="space-y-1">
                  {eligible.map((file) => (
                    <li key={file.id}>
                      <Label
                        htmlFor={`candidate-${file.id}`}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 font-normal hover:bg-muted/60"
                      >
                        <Checkbox
                          id={`candidate-${file.id}`}
                          checked={selected.has(file.id)}
                          onCheckedChange={() => toggle(file.id)}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {file.candidate_name ?? "—"}
                        </span>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {file.category_code}
                        </Badge>
                        <span className="w-28 shrink-0">
                          <ProgressBar
                            value={file.code_progress}
                            label={tStudents("codeProgress")}
                          />
                        </span>
                      </Label>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={onAssign}
                  disabled={assign.isPending}
                  className="w-full"
                >
                  {assign.isPending && <Spinner />}
                  {t("assign")}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("results")}</CardTitle>
            {!isPast && (
              <p className="text-sm text-muted-foreground">
                {t("createHint", { date: formatDate(exam.exam_date, locale) })}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {roster.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title={t("candidatesAssigned", { count: 0 })}
                className="py-8"
              />
            ) : (
              <>
                <ul className="space-y-2">
                  {roster.map((row) => (
                    <li
                      key={row.enrollment_id}
                      className="flex items-center gap-3 rounded-lg border px-3 py-2"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {row.candidate_name ?? "—"}
                      </span>
                      <Select
                        value={resultFor(row.enrollment_id, row.result) ?? "none"}
                        onValueChange={(value) =>
                          setResultEdits((previous) => ({
                            ...previous,
                            [row.enrollment_id]:
                              value === "none" ? null : (value as ExamResult),
                          }))
                        }
                      >
                        <SelectTrigger
                          className="w-36"
                          aria-label={`${t("results")} — ${row.candidate_name ?? ""}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("noResultYet")}</SelectItem>
                          {RESULTS.map((result) => (
                            <SelectItem key={result} value={result}>
                              {tStatus(result)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={onSaveResults}
                  disabled={saveResults.isPending}
                  className="w-full"
                >
                  {saveResults.isPending && <Spinner />}
                  {t("saveResults")}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
