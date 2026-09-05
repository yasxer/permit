"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/keys";
import { createClient } from "@/lib/supabase/client";
import { unwrap } from "@/lib/supabase/query";
import type { ExamResult, ExamRosterRow, ExamRow, ExamType } from "@/types";

export type ExamWithCount = ExamRow & {
  exam_candidates: { count: number }[];
};

export function useExams(schoolId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.exams.list(schoolId ?? ""),
    queryFn: async () => {
      const supabase = createClient();
      const result = await supabase
        .from("exams")
        .select("*, exam_candidates(count)")
        .eq("school_id", schoolId!)
        .order("exam_date", { ascending: false });
      return unwrap(result) as unknown as ExamWithCount[];
    },
    enabled: Boolean(schoolId),
  });
}

export function useExam(id: string) {
  return useQuery({
    queryKey: queryKeys.exams.detail(id),
    queryFn: async () => {
      const supabase = createClient();
      const result = await supabase.from("exams").select("*").eq("id", id).single();
      return unwrap(result) as ExamRow;
    },
    enabled: Boolean(id),
  });
}

export function useExamRoster(examId: string) {
  return useQuery({
    queryKey: queryKeys.exams.candidates(examId),
    queryFn: async () => {
      const supabase = createClient();
      const result = await supabase
        .from("exam_roster")
        .select("*")
        .eq("exam_id", examId)
        .order("candidate_name");
      return unwrap(result) as ExamRosterRow[];
    },
    enabled: Boolean(examId),
  });
}

function useExamMutation<TArgs>(run: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.exams.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useCreateExam(schoolId: string | undefined) {
  return useExamMutation(async ({ date }: { date: string }) => {
    if (!schoolId) throw new Error("No school");
    const supabase = createClient();
    const { error } = await supabase
      .from("exams")
      .insert({ school_id: schoolId, exam_date: date });
    if (error) {
      // 23505: `exams_one_session_per_day` — the school already holds one.
      throw Object.assign(new Error(error.message), { code: error.code });
    }
  });
}

/**
 * Drops a session the school should never have opened — the wrong date, or one
 * nobody turned up for. The roster lines go with it (`on delete cascade`).
 *
 * What it does *not* undo is a result already entered: a candidate the trigger
 * moved on to the next stage stays there. Deleting the session is a correction
 * to the calendar, not a way to take a licence back, and the confirmation says
 * so before the school commits to it.
 */
export function useDeleteExam() {
  return useExamMutation(async ({ id }: { id: string }) => {
    const supabase = createClient();
    // Through the RPC, not a bare `delete`: a policy that refuses a delete
    // matches nothing rather than failing, so the browser cannot tell "you may
    // not" apart from "already gone". The function raises, with a code.
    const { error } = await supabase.rpc("school_delete_exam", {
      p_exam_id: id,
    });
    if (error) {
      throw Object.assign(new Error(error.message), { code: error.code });
    }
  });
}

/**
 * Fills one step of the roster: the candidates of one category standing on one
 * stage. The write is scoped to that step — everyone outside it is left alone,
 * so the school can walk back through the steps and change its mind.
 */
export function useAssignStage() {
  return useExamMutation(
    async ({
      examId,
      stage,
      stepIds,
      selectedIds,
    }: {
      examId: string;
      stage: ExamType;
      /** Every candidate this step offers. */
      stepIds: string[];
      selectedIds: string[];
    }) => {
      const supabase = createClient();
      const dropped = stepIds.filter((id) => !selectedIds.includes(id));

      if (dropped.length > 0) {
        const { error } = await supabase
          .from("exam_candidates")
          .delete()
          .eq("exam_id", examId)
          .in("enrollment_id", dropped)
          // Never drop a candidate whose result is already recorded.
          .is("result", null);
        if (error) throw new Error(error.message);
      }

      if (selectedIds.length > 0) {
        const { error } = await supabase.from("exam_candidates").upsert(
          selectedIds.map((enrollment_id) => ({
            exam_id: examId,
            enrollment_id,
            stage,
          })),
          { onConflict: "exam_id,enrollment_id" },
        );
        if (error) throw new Error(error.message);
      }
    },
  );
}

/**
 * One candidate, one verdict. The session's own status follows from the roster
 * in the database, and a passed result fires the trigger that moves the
 * candidate on — so there is nothing to save afterwards.
 */
export function useSetResult() {
  return useExamMutation(
    async ({
      examId,
      enrollmentId,
      result,
    }: {
      examId: string;
      enrollmentId: string;
      result: ExamResult;
    }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("exam_candidates")
        .update({ result })
        .eq("exam_id", examId)
        .eq("enrollment_id", enrollmentId);
      if (error) throw new Error(error.message);
    },
  );
}
