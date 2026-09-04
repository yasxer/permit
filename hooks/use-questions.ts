"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/keys";
import { createClient } from "@/lib/supabase/client";
import { unwrap } from "@/lib/supabase/query";
import type {
  ContentLang,
  QuestionOptionInput,
  QuestionOptionRow,
  QuestionRow,
  QuestionType,
} from "@/types";

export type QuestionWithOptions = QuestionRow & {
  options: QuestionOptionRow[];
};

export function useQuestions(type: QuestionType, lang?: ContentLang | "all") {
  return useQuery({
    queryKey: queryKeys.questions.list(type, lang),
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("questions")
        .select("*, options:question_options(*)")
        .eq("type", type)
        .order("created_at", { ascending: false });

      if (lang && lang !== "all") query = query.eq("lang", lang);

      const rows = unwrap(await query) as unknown as QuestionWithOptions[];
      // Postgrest returns embedded rows unordered; the answer order is content.
      return rows.map((row) => ({
        ...row,
        options: [...row.options].sort((a, b) => a.sort_order - b.sort_order),
      }));
    },
  });
}

export type QuestionInput = {
  id?: string;
  type: QuestionType;
  lang: ContentLang;
  body: string;
  image_url: string | null;
  options: QuestionOptionInput[];
};

function useQuestionMutation<TArgs>(run: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.questions.all });
    },
  });
}

export function useSaveQuestion() {
  return useQuestionMutation(async (input: QuestionInput) => {
    const supabase = createClient();
    const { error } = await supabase.rpc("upsert_question", {
      p_id: input.id ?? null,
      p_type: input.type,
      p_lang: input.lang,
      p_body: input.body,
      p_image_url: input.image_url,
      p_options: input.options,
    });
    if (error) throw new Error(error.message);
  });
}

export function useDeleteQuestion() {
  return useQuestionMutation(async ({ id }: { id: string }) => {
    const supabase = createClient();
    // question_options cascades on delete.
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) throw new Error(error.message);
  });
}
