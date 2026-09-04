"use client";

import { CalendarDays, ClipboardCheck, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useExams } from "@/hooks/use-exams";
import { formatDate } from "@/lib/format";

import { CreateExamDialog } from "./create-exam-dialog";

export function ExamsList({
  schoolId,
  examDay,
}: {
  schoolId: string;
  examDay: number | null;
}) {
  const t = useTranslations("ecole.exams");
  const tPlanning = useTranslations("ecole.planning");
  const locale = useLocale();

  const { data = [], isPending } = useExams(schoolId);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          {t("createExam")}
        </Button>
      </div>

      {isPending ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-36" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <Card>
          <EmptyState icon={ClipboardCheck} title={t("empty")} />
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((exam) => {
            const count = exam.exam_candidates?.[0]?.count ?? 0;
            return (
              <li key={exam.id}>
                <Link
                  href={`/ecole/exams/${exam.id}`}
                  className="block rounded-xl outline-offset-4"
                >
                  <Card className="h-full transition-colors hover:border-primary/40">
                    <CardContent className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 text-base font-semibold">
                            <CalendarDays
                              className="size-4 shrink-0 text-muted-foreground"
                              aria-hidden
                            />
                            {formatDate(exam.exam_date, locale, {
                              dateStyle: "full",
                            })}
                          </p>
                        </div>
                        <StatusBadge status={exam.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="font-medium">
                          {tPlanning(exam.exam_type === "code" ? "code" : "conduite")}
                        </Badge>
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Users className="size-4" aria-hidden />
                          {t("candidatesAssigned", { count })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <CreateExamDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        schoolId={schoolId}
        examDay={examDay}
      />
    </>
  );
}
