"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/keys";
import { createClient } from "@/lib/supabase/client";
import { unwrap } from "@/lib/supabase/query";
import type { CategoryRow } from "@/types";

export type CategoryInput = {
  code: string;
  label_ar: string;
  label_fr: string;
  label_en: string;
  sort_order?: number;
};

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list,
    queryFn: async () => {
      const supabase = createClient();
      const result = await supabase
        .from("categories")
        .select("*")
        .order("sort_order")
        .order("code");
      return unwrap(result) as CategoryRow[];
    },
    // The catalogue changes rarely; don't refetch it on every navigation.
    staleTime: 5 * 60 * 1000,
  });
}

function useCategoryMutation<TArgs>(run: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useCreateCategory() {
  return useCategoryMutation(async (input: CategoryInput) => {
    const supabase = createClient();
    const { error } = await supabase.from("categories").insert(input);
    if (error) throw new Error(error.message);
  });
}

export function useUpdateCategory() {
  return useCategoryMutation(
    async ({ id, ...input }: CategoryInput & { id: string }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("categories")
        .update(input)
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
  );
}

export function useDeleteCategory() {
  return useCategoryMutation(async ({ id }: { id: string }) => {
    const supabase = createClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw new Error(error.message);
  });
}
