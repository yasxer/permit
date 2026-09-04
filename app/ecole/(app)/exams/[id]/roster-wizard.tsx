"use client";

import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useStudentFiles } from "@/hooks/use-enrollments";
import { useAssignStage } from "@/hooks/use-exams";
import { STAGES, stageOf } from "@/lib/stages";
import type { ExamType, StudentFileRow } from "@/types";

/** What each step is for — the candidates standing on that stage. */
const STAGE_HINT: Record<ExamType, string> = {
  code: "eligibleCodeHint",
  creneau: "eligibleCreneauHint",
  conduite: "eligibleConduiteHint",
};

type Step = {
  categoryCode: string;
  stage: ExamType;
  files: StudentFileRow[];
};

/**
 * One step per category and stage, in that order: the whole of category A —
 * code, then créneau, then conduite — and only then category B. A step nobody
 * stands on is not shown; walking past an empty list decides nothing.
 */
function buildSteps(files: StudentFileRow[]): Step[] {
  const groups = new Map<string, Step>();

  for (const file of files) {
    const stage = stageOf(file);
    const key = `${file.category_code} ${stage}`;
    const group = groups.get(key) ?? {
      categoryCode: file.category_code,
      stage,
      files: [],
    };
    group.files.push(file);
    groups.set(key, group);
  }

  return [...groups.values()].sort(
    (a, b) =>
      a.categoryCode.localeCompare(b.categoryCode) ||
      STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage),
  );
}

export function RosterWizard({
  examId,
  schoolId,
  /** Who is on the roster already, so a second pass starts where it left off. */
  assigned,
  onDone,
}: {
  examId: string;
  schoolId: string;
  assigned: Set<string>;
  onDone: () => void;
}) {
  const t = useTranslations("ecole.exams");
  const tPlanning = useTranslations("ecole.planning");
  const tStudents = useTranslations("ecole.students");
  const tc = useTranslations("common");
  const tErrors = useTranslations("errors");

  const { data: files = [], isPending } = useStudentFiles(schoolId, "active");
  const assign = useAssignStage();

  const steps = useMemo(() => buildSteps(files), [files]);
  const [index, setIndex] = useState(0);
  // Reads through to the roster until the school ticks something, so a step
  // already filled in comes back as it was left.
  const [draft, setDraft] = useState<Set<string> | null>(null);
  const selected = draft ?? assigned;

  if (isPending) {
    return (
      <Card>
        <CardContent className="space-y-2">
          {Array.from({ length: 5 }, (_, row) => (
            <Skeleton key={row} className="h-11" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (steps.length === 0) {
    return (
      <Card>
        <EmptyState icon={Users} title={t("noEligible")} />
      </Card>
    );
  }

  const step = steps[Math.min(index, steps.length - 1)];
  const stepIds = step.files.map((file) => file.id);
  const chosen = stepIds.filter((id) => selected.has(id));
  const isLast = index === steps.length - 1;

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setDraft(next);
  }

  async function onSubmit() {
    try {
      await assign.mutateAsync({
        examId,
        stage: step.stage,
        stepIds,
        selectedIds: chosen,
      });
      if (isLast) {
        toast.success(t("assigned"));
        onDone();
      } else {
        setIndex((value) => value + 1);
      }
    } catch {
      toast.error(tErrors("generic"));
    }
  }

  return (
    <Card>
      <CardHeader>
        <p className="text-xs font-medium text-muted-foreground">
          {t("stepOf", { current: index + 1, total: steps.length })}
        </p>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <Badge variant="secondary" className="font-mono font-semibold">
            {step.categoryCode}
          </Badge>
          {tPlanning(step.stage)}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t(STAGE_HINT[step.stage])}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3 border-b pb-3">
          <Label className="flex items-center gap-2.5 font-normal">
            <Checkbox
              checked={chosen.length > 0 && chosen.length === stepIds.length}
              onCheckedChange={(checked) => {
                const next = new Set(selected);
                for (const id of stepIds) {
                  if (checked) next.add(id);
                  else next.delete(id);
                }
                setDraft(next);
              }}
            />
            {t("selectAll")}
          </Label>
          <span className="text-sm text-muted-foreground">
            {t("selectedCount", { count: chosen.length })}
          </span>
        </div>

        <ul className="space-y-1">
          {step.files.map((file) => (
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
                <span dir="ltr" className="shrink-0 text-xs text-muted-foreground">
                  {file.candidate_phone ?? ""}
                </span>
              </Label>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <Button
            variant="outline"
            disabled={index === 0 || assign.isPending}
            onClick={() => setIndex((value) => value - 1)}
          >
            {tc("previous")}
          </Button>
          <Button onClick={onSubmit} disabled={assign.isPending}>
            {assign.isPending && <Spinner />}
            {isLast ? t("finishRoster") : t("submitStep")}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">{tStudents("stageFromExams")}</p>
      </CardContent>
    </Card>
  );
}
