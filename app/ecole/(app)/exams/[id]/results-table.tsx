"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSetResult } from "@/hooks/use-exams";
import { STAGES } from "@/lib/stages";
import { cn } from "@/lib/utils";
import type { ExamResult, ExamRosterRow } from "@/types";

const RESULTS: ExamResult[] = ["passed", "failed", "absent"];

/** The verdict a button carries, once it is the one that was pressed. */
const RESULT_TONE: Record<ExamResult, string> = {
  passed: "bg-success text-success-foreground hover:bg-success/90",
  failed: "bg-destructive text-white hover:bg-destructive/90",
  absent: "bg-warning text-warning-foreground hover:bg-warning/90",
};

export function ResultsTable({
  examId,
  roster,
}: {
  examId: string;
  roster: ExamRosterRow[];
}) {
  const t = useTranslations("ecole.exams");
  const tPlanning = useTranslations("ecole.planning");
  const tStudents = useTranslations("ecole.students");
  const tStatus = useTranslations("status");
  const tErrors = useTranslations("errors");

  const setResult = useSetResult();

  // Read in the order the roster was filled: category by category, and inside
  // one category code before créneau before conduite.
  const rows = [...roster].sort(
    (a, b) =>
      a.category_code.localeCompare(b.category_code) ||
      STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage) ||
      (a.candidate_name ?? "").localeCompare(b.candidate_name ?? ""),
  );

  async function onPick(row: ExamRosterRow, result: ExamResult) {
    if (row.result === result) return;
    try {
      await setResult.mutateAsync({
        examId,
        enrollmentId: row.enrollment_id,
        result,
      });
    } catch {
      toast.error(tErrors("generic"));
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="ps-6">{t("candidate")}</TableHead>
          <TableHead>{tStudents("category")}</TableHead>
          <TableHead>{tStudents("stage")}</TableHead>
          <TableHead className="pe-6 text-end">{t("results")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const pending =
            setResult.isPending &&
            setResult.variables?.enrollmentId === row.enrollment_id;

          return (
            <TableRow key={row.enrollment_id}>
              <TableCell className="ps-6 font-medium">
                {row.candidate_name ?? "—"}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="font-mono font-semibold">
                  {row.category_code}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {tPlanning(row.stage)}
              </TableCell>
              <TableCell className="pe-6">
                <div className="flex flex-wrap justify-end gap-1.5">
                  {RESULTS.map((result) => (
                    <Button
                      key={result}
                      size="sm"
                      variant="outline"
                      aria-pressed={row.result === result}
                      disabled={pending}
                      className={cn(
                        "min-w-20",
                        row.result === result &&
                          cn("border-transparent", RESULT_TONE[result]),
                      )}
                      onClick={() => onPick(row, result)}
                    >
                      {tStatus(result)}
                    </Button>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
