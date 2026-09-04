"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/keys";
import { createClient } from "@/lib/supabase/client";
import { unwrap } from "@/lib/supabase/query";
import type { SchoolStatus, SchoolWithOwner } from "@/types";

/** Two FKs point at `profiles`, so the join has to name the constraint. */
const SCHOOL_SELECT = `
  *,
  owner:profiles!schools_owner_id_fkey(id, full_name, phone, email),
  wilaya:wilayas!schools_wilaya_code_fkey(code, name_ar, name_fr, name_en)
`;

export function useSchools(status?: SchoolStatus | "all") {
  return useQuery({
    queryKey: queryKeys.schools.list(status),
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("schools")
        .select(SCHOOL_SELECT)
        .order("created_at", { ascending: false });

      if (status && status !== "all") query = query.eq("status", status);

      return unwrap(await query) as unknown as SchoolWithOwner[];
    },
  });
}

export function useSchool(id: string) {
  return useQuery({
    queryKey: queryKeys.schools.detail(id),
    queryFn: async () => {
      const supabase = createClient();
      const result = await supabase
        .from("schools")
        .select(SCHOOL_SELECT)
        .eq("id", id)
        .single();
      return unwrap(result) as unknown as SchoolWithOwner;
    },
    enabled: Boolean(id),
  });
}

/** Prices the school charges per category, used on the detail page. */
export function useSchoolPrices(schoolId: string) {
  return useQuery({
    queryKey: [...queryKeys.schools.detail(schoolId), "prices"],
    queryFn: async () => {
      const supabase = createClient();
      const result = await supabase
        .from("school_categories")
        .select("price, category:categories(id, code, label_fr, label_ar, label_en)")
        .eq("school_id", schoolId);
      return unwrap(result);
    },
    enabled: Boolean(schoolId),
  });
}

function useSchoolMutation<TArgs>(
  run: (args: TArgs) => Promise<unknown>,
  idOf: (args: TArgs) => string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: (_data, args) => {
      // The list, the detail page and the dashboard counts all move together.
      void queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.schools.detail(idOf(args)),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats.admin });
    },
  });
}

export function useApproveSchool() {
  return useSchoolMutation(
    async ({ id }: { id: string }) => {
      const supabase = createClient();
      const { error } = await supabase.rpc("approve_school", { p_school_id: id });
      if (error) throw new Error(error.message);
    },
    ({ id }) => id,
  );
}

export function useRejectSchool() {
  return useSchoolMutation(
    async ({ id, reason }: { id: string; reason?: string }) => {
      const supabase = createClient();
      const { error } = await supabase.rpc("reject_school", {
        p_school_id: id,
        p_reason: reason ?? null,
      });
      if (error) throw new Error(error.message);
    },
    ({ id }) => id,
  );
}
