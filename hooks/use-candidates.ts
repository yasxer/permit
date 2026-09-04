"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/keys";
import { createClient } from "@/lib/supabase/client";

/**
 * School-side candidate management: the school registers and maintains the
 * candidate itself, because the candidate has no app to do it from yet.
 */

export type NewCandidateInput = {
  full_name: string;
  phone: string;
  category_id: string;
  email?: string;
  password?: string;
  address?: string;
  birthdate?: string;
  photo_url?: string | null;
};

export type NewCandidateResult = {
  enrollment_id: string;
  candidate_id: string;
  /** What the candidate signs in with once the app ships. */
  login: string;
  /** Returned once, only for an account this call created. */
  password: string | null;
  created: boolean;
};

/** Error codes the API route can answer with, for the form to translate. */
export class CandidateError extends Error {
  constructor(public readonly reason: string) {
    super(reason);
  }
}

export function useCreateCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: NewCandidateInput): Promise<NewCandidateResult> => {
      // Creating the auth account needs the service-role key, so this one
      // write goes through a route handler instead of straight to Postgres.
      const response = await fetch("/api/ecole/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          photo_url: input.photo_url ?? "",
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      } & Partial<NewCandidateResult>;

      if (!response.ok) {
        throw new CandidateError(
          payload.code === "23505" ? "duplicate_file" : payload.error ?? "generic",
        );
      }
      return payload as NewCandidateResult;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export type UpdateCandidateInput = {
  candidate_id: string;
  full_name: string;
  phone: string;
  address?: string;
  birthdate?: string;
  photo_url?: string | null;
};

export function useUpdateCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateCandidateInput) => {
      const supabase = createClient();
      // RLS lets a school *read* its candidates' profiles but not write them —
      // the RPC is the narrow opening, scoped to its own candidates.
      const { error } = await supabase.rpc("school_update_candidate", {
        p_candidate_id: input.candidate_id,
        p_full_name: input.full_name,
        p_phone: input.phone,
        p_address: input.address ?? null,
        p_birthdate: input.birthdate || null,
        p_photo_url: input.photo_url ?? null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all });
    },
  });
}
