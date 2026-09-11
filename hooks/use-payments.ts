"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/keys";
import { createClient } from "@/lib/supabase/client";
import { unwrap } from "@/lib/supabase/query";
import type { PaymentRow } from "@/types";

export function usePayments(enrollmentId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.payments.byEnrollment(enrollmentId),
    queryFn: async () => {
      const supabase = createClient();
      const result = await supabase
        .from("payments")
        .select("*")
        .eq("enrollment_id", enrollmentId)
        .order("paid_at", { ascending: false });
      return unwrap(result) as PaymentRow[];
    },
    enabled: enabled && Boolean(enrollmentId),
  });
}

export function useAddPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      amount,
      note,
    }: {
      enrollmentId: string;
      amount: number;
      note?: string;
    }) => {
      const supabase = createClient();
      // The local session is enough: RLS checks created_by against the
      // verified token, so a stale id is refused rather than trusted.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      // The RLS policy requires created_by to be the caller.
      const { error } = await supabase.from("payments").insert({
        enrollment_id: enrollmentId,
        amount,
        note: note?.trim() || null,
        created_by: session.user.id,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, { enrollmentId }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.payments.byEnrollment(enrollmentId),
      });
      // The balance lives in the view, so the student list moves too.
      void queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
