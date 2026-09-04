"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/keys";
import { createClient } from "@/lib/supabase/client";
import { unwrap } from "@/lib/supabase/query";
import type { SchoolRow, WilayaRow } from "@/types";

export function useMySchool() {
  return useQuery({
    queryKey: queryKeys.schools.mine,
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No session");

      const result = await supabase
        .from("schools")
        .select("*")
        .eq("owner_id", user.id)
        .single();
      return unwrap(result) as SchoolRow;
    },
  });
}

export function useWilayas() {
  return useQuery({
    queryKey: ["wilayas"],
    queryFn: async () => {
      const supabase = createClient();
      const result = await supabase.from("wilayas").select("*").order("code");
      return unwrap(result) as WilayaRow[];
    },
    // Reference data — it does not change while the app is open.
    staleTime: Infinity,
  });
}

/** The school's own price list, keyed by category id. */
export function useMySchoolPrices(schoolId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.schools.mine, "prices", schoolId],
    queryFn: async () => {
      const supabase = createClient();
      const result = await supabase
        .from("school_categories")
        .select("category_id, price")
        .eq("school_id", schoolId!);
      return unwrap(result);
    },
    enabled: Boolean(schoolId),
  });
}

export type SchoolProfileInput = {
  name: string;
  director_name: string;
  phone: string;
  address: string;
  wilaya_code: number | null;
  teaching_car: string;
  exam_day: number;
  photo_url: string | null;
  perf_price_per_hour: number;
  success_passed: number;
  success_failed: number;
  /** category_id → price. A missing or blank entry removes that category. */
  prices: Record<string, number | null>;
};

export function useSaveSchoolProfile(schoolId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SchoolProfileInput) => {
      if (!schoolId) throw new Error("No school");
      const supabase = createClient();
      const { prices, ...profile } = input;

      const { error: profileError } = await supabase
        .from("schools")
        .update(profile)
        .eq("id", schoolId);
      if (profileError) throw new Error(profileError.message);

      const offered = Object.entries(prices).filter(
        ([, price]) => price !== null && Number.isFinite(price),
      );

      // Categories the school no longer offers must go, or they keep showing
      // up in a candidate's list of choices at a stale price.
      const dropped = Object.keys(prices).filter(
        (id) => !offered.some(([offeredId]) => offeredId === id),
      );
      if (dropped.length > 0) {
        const { error } = await supabase
          .from("school_categories")
          .delete()
          .eq("school_id", schoolId)
          .in("category_id", dropped);
        if (error) throw new Error(error.message);
      }

      if (offered.length > 0) {
        const { error } = await supabase.from("school_categories").upsert(
          offered.map(([category_id, price]) => ({
            school_id: schoolId,
            category_id,
            price: price as number,
          })),
          { onConflict: "school_id,category_id" },
        );
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
    },
  });
}
