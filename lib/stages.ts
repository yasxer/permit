/**
 * The candidate's way through the school: code → créneau → conduite.
 *
 * The stage is not stored — it is read off the two flags, which the database
 * moves on a passed exam and nothing else touches. Planning, exams and the
 * student file all ask the same question here rather than each spelling the
 * flags out.
 */
import type { ExamType, StudentFileRow } from "@/types";

export const STAGES: ExamType[] = ["code", "creneau", "conduite"];

/** Message keys under `ecole.students` for each stage. */
export const STAGE_LABEL_KEYS: Record<ExamType, string> = {
  code: "stageCode",
  creneau: "stageCreneau",
  conduite: "stageConduite",
};

type StageFlags = Pick<StudentFileRow, "creneau_unlocked" | "conduite_unlocked">;

export function stageOf(file: StageFlags): ExamType {
  if (file.conduite_unlocked) return "conduite";
  if (file.creneau_unlocked) return "creneau";
  return "code";
}
