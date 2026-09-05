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

/**
 * Removes a file the school opened by mistake, along with its payments and its
 * exam history. Rejecting keeps the trace of a request that was turned down;
 * this is for the row that should never have existed at all.
 *
 * Through a route handler rather than straight to Postgres: the delete itself
 * is RLS-scoped, but the candidate's account may be left with nothing pointing
 * at it, and only the service role can clear that up.
 */
export function useDeleteEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const response = await fetch(`/api/ecole/enrollments/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "generic");
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all });
      // The file was on exam rosters and on planning slots; both just changed
      // underneath the caches that hold them.
      void queryClient.invalidateQueries({ queryKey: queryKeys.exams.all });
      void queryClient.invalidateQueries({ queryKey: ["planning"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
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
