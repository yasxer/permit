"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/keys";
import { createClient } from "@/lib/supabase/client";
import { unwrap } from "@/lib/supabase/query";
import type { LessonType, PlanningTemplateRow, SlotStatus } from "@/types";

/** 08:00 → 18:00 in 30-minute steps, as Postgres `time` literals. */
export const SLOT_TIMES = Array.from({ length: 20 }, (_, index) => {
  const minutes = 8 * 60 + index * 30;
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${hh}:${mm}:00`;
});

export const SLOT_DURATION_MINUTES = 30;

export function usePlanningTemplate(schoolId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.planning.template(schoolId ?? ""),
    queryFn: async () => {
      const supabase = createClient();
      const result = await supabase
        .from("planning_templates")
        .select("*")
        .eq("school_id", schoolId!);
      return unwrap(result) as PlanningTemplateRow[];
    },
    enabled: Boolean(schoolId),
  });
}

export type TemplateCell = {
  day_of_week: number;
  start_time: string;
  lesson_type: LessonType;
  /** null removes the row: the cell goes back to "not set". */
  is_available: boolean | null;
};

export function useSaveTemplate(schoolId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cells: TemplateCell[]) => {
      if (!schoolId) throw new Error("No school");
      const supabase = createClient();

      const cleared = cells.filter((cell) => cell.is_available === null);
      const set = cells.filter((cell) => cell.is_available !== null);

      // Deleting one composite key at a time: PostgREST has no tuple-IN, and
      // a template edit touches a handful of cells, not hundreds.
      for (const cell of cleared) {
        const { error } = await supabase
          .from("planning_templates")
          .delete()
          .eq("school_id", schoolId)
          .eq("day_of_week", cell.day_of_week)
          .eq("start_time", cell.start_time)
          .eq("lesson_type", cell.lesson_type);
        if (error) throw new Error(error.message);
      }

      if (set.length > 0) {
        const { error } = await supabase.from("planning_templates").upsert(
          set.map((cell) => ({
            school_id: schoolId,
            day_of_week: cell.day_of_week,
            start_time: cell.start_time,
            lesson_type: cell.lesson_type,
            is_available: cell.is_available as boolean,
          })),
          { onConflict: "school_id,day_of_week,start_time,lesson_type" },
        );
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["planning"] });
    },
  });
}

export type SlotWithStudent = {
  id: string;
  school_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  lesson_type: LessonType;
  status: SlotStatus;
  enrollment_id: string | null;
  enrollment: { id: string; candidate: { full_name: string | null } | null } | null;
};

export function useSlots(schoolId: string | undefined, weekStart: string) {
  return useQuery({
    queryKey: queryKeys.planning.slots(schoolId ?? "", weekStart),
    queryFn: async () => {
      const supabase = createClient();
      const weekEnd = new Date(`${weekStart}T00:00:00`);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const result = await supabase
        .from("slots")
        .select(
          `*, enrollment:enrollments(id, candidate:profiles!enrollments_candidate_id_fkey(full_name))`,
        )
        .eq("school_id", schoolId!)
        .gte("slot_date", weekStart)
        .lte("slot_date", weekEnd.toISOString().slice(0, 10));

      return unwrap(result) as unknown as SlotWithStudent[];
    },
    enabled: Boolean(schoolId) && Boolean(weekStart),
  });
}

export function useGenerateSlots() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ weekStart }: { weekStart: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("generate_week_slots", {
        p_week_start: weekStart,
        p_duration_minutes: SLOT_DURATION_MINUTES,
      });
      if (error) throw new Error(error.message);
      return data as number;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["planning"] });
    },
  });
}

export function useCancelSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const supabase = createClient();
      // The CHECK constraint requires a cancelled slot to hold no booking.
      const { error } = await supabase
        .from("slots")
        .update({ status: "cancelled", enrollment_id: null })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["planning"] });
    },
  });
}
