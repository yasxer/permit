"use client";

import {
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  Plus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
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
                  className="group block rounded-xl outline-offset-4"
                >
                  <Card className="h-full transition-shadow group-hover:ring-primary/30">
                    <CardContent className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        {/* Le jour d'abord, en gros : sur une grille de
                            séances, c'est la date qu'on cherche. */}
                        <div className="min-w-0">
                          <p className="tag-caps flex items-center gap-1.5 text-[0.6rem] font-bold text-muted-foreground">
                            <CalendarDays className="size-3" aria-hidden />
                            {formatDate(exam.exam_date, locale, {
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                          <p className="mt-1.5 font-heading text-lg font-bold tracking-tight">
                            {formatDate(exam.exam_date, locale, {
                              weekday: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <StatusBadge status={exam.status} />
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t pt-3">
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Users className="size-4" aria-hidden />
                          {t("candidatesAssigned", { count })}
                        </span>
                        <ChevronRight
                          className="size-4 rtl-flip text-muted-foreground transition-transform group-hover:translate-x-0.5"
                          aria-hidden
                        />
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
