"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/keys";
import { createClient } from "@/lib/supabase/client";
import { unwrap } from "@/lib/supabase/query";
import type {
  ExamResult,
  ExamRosterRow,
  ExamRow,
  LessonType,
  StudentFileRow,
} from "@/types";

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

/**
 * Who may sit this exam.
 *  - code exam: active students who have not unlocked conduite yet
 *  - conduite exam: active students whose theory is at 100%
 */
export function useEligibleCandidates(
  schoolId: string | undefined,
  examType: LessonType,
) {
  return useQuery({
    queryKey: ["exams", "eligible", schoolId ?? "", examType],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("student_files")
        .select("*")
        .eq("school_id", schoolId!)
        .eq("status", "active")
        .order("candidate_name");

      query =
        examType === "code"
          ? query.eq("conduite_unlocked", false)
          : query.eq("code_progress", 100);

      return unwrap(await query) as StudentFileRow[];
    },
    enabled: Boolean(schoolId),
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
  return useExamMutation(
    async ({ date, type }: { date: string; type: LessonType }) => {
      if (!schoolId) throw new Error("No school");
      const supabase = createClient();
      const { error } = await supabase
        .from("exams")
        .insert({ school_id: schoolId, exam_date: date, exam_type: type });
      if (error) {
        // 23505: the (school, date, type) unique index.
        throw Object.assign(new Error(error.message), { code: error.code });
      }
    },
  );
}

/** Replaces the whole roster: assignment is a set, not an append. */
export function useAssignCandidates() {
  return useExamMutation(
    async ({
      examId,
      enrollmentIds,
    }: {
      examId: string;
      enrollmentIds: string[];
    }) => {
      const supabase = createClient();

      const { error: clearError } = await supabase
        .from("exam_candidates")
        .delete()
        .eq("exam_id", examId)
        // Never drop a candidate whose result is already recorded.
        .is("result", null);
      if (clearError) throw new Error(clearError.message);

      if (enrollmentIds.length > 0) {
        const { error } = await supabase.from("exam_candidates").upsert(
          enrollmentIds.map((enrollment_id) => ({
            exam_id: examId,
            enrollment_id,
          })),
          { onConflict: "exam_id,enrollment_id", ignoreDuplicates: true },
        );
        if (error) throw new Error(error.message);
      }
    },
  );
}

export function useSaveResults() {
  return useExamMutation(
    async ({
      examId,
      results,
    }: {
      examId: string;
      results: Record<string, ExamResult | null>;
    }) => {
      const supabase = createClient();
      // One statement per candidate: a passed conduite result fires the
      // trigger that closes the file, so these are not interchangeable rows.
      for (const [enrollmentId, result] of Object.entries(results)) {
        const { error } = await supabase
          .from("exam_candidates")
          .update({ result })
          .eq("exam_id", examId)
          .eq("enrollment_id", enrollmentId);
        if (error) throw new Error(error.message);
      }

      const { error } = await supabase
        .from("exams")
        .update({ status: "completed" })
        .eq("id", examId);
      if (error) throw new Error(error.message);
    },
  );
}
