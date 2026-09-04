"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/keys";
import { createClient } from "@/lib/supabase/client";
import { unwrap } from "@/lib/supabase/query";
import type { EnrollmentStatus, StudentFileRow } from "@/types";

/**
 * Reads the `student_files` view, which already carries the candidate, the
 * category and the running balance. RLS still applies — the view is
 * `security_invoker`.
 */
export function useStudentFiles(
  schoolId: string | undefined,
  status?: EnrollmentStatus | "all",
) {
  return useQuery({
    queryKey: queryKeys.enrollments.list(schoolId ?? "", status),
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("student_files")
        .select("*")
        .eq("school_id", schoolId!)
        .order("requested_at", { ascending: false });

      if (status && status !== "all") query = query.eq("status", status);

      return unwrap(await query) as StudentFileRow[];
    },
    enabled: Boolean(schoolId),
  });
}

export function useStudentFile(id: string) {
  return useQuery({
    queryKey: queryKeys.enrollments.detail(id),
    queryFn: async () => {
      const supabase = createClient();
      const result = await supabase
        .from("student_files")
        .select("*")
        .eq("id", id)
        .single();
      return unwrap(result) as StudentFileRow;
    },
    enabled: Boolean(id),
  });
}

function useEnrollmentMutation<TArgs>(run: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useAcceptEnrollment() {
  return useEnrollmentMutation(async ({ id }: { id: string }) => {
    const supabase = createClient();
    // The RPC snapshots the catalogue price onto the file.
    const { error } = await supabase.rpc("accept_enrollment", {
      p_enrollment_id: id,
    });
    if (error) throw new Error(error.message);
  });
}

export function useRejectEnrollment() {
  return useEnrollmentMutation(async ({ id }: { id: string }) => {
    const supabase = createClient();
    const { error } = await supabase.rpc("reject_enrollment", {
      p_enrollment_id: id,
    });
    if (error) throw new Error(error.message);
  });
}

export type ProgressInput = {
  id: string;
  code_progress?: number;
  creneau_unlocked?: boolean;
  conduite_unlocked?: boolean;
};

export function useUpdateProgress() {
  return useEnrollmentMutation(async ({ id, ...changes }: ProgressInput) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("enrollments")
      .update(changes)
      .eq("id", id);
    if (error) throw new Error(error.message);
  });
}
