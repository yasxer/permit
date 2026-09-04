"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/keys";
import { createClient } from "@/lib/supabase/client";
import { unwrap } from "@/lib/supabase/query";
import type { LessonType, SlotStatus } from "@/types";

/** 08:00 → 18:00 in 30-minute steps, as Postgres `time` literals. */
export const SLOT_TIMES = Array.from({ length: 20 }, (_, index) => {
  const minutes = 8 * 60 + index * 30;
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${hh}:${mm}:00`;
});

/**
 * The two resources a school books, and what each one can be booked for. They
 * do not compete: a code lesson and a driving lesson at nine o'clock is an
 * ordinary morning, two driving lessons is not.
 */
export const SESSION_TYPES = {
  code: ["code"],
  driving: ["creneau", "conduite", "perfectionnement"],
} as const satisfies Record<string, readonly LessonType[]>;

export type Resource = keyof typeof SESSION_TYPES;

export function resourceOf(type: LessonType): Resource {
  return type === "code" ? "code" : "driving";
}

/** Perfectionnement is sold by the hour; everything else is a half hour. */
export function sessionMinutes(type: LessonType): number {
  return type === "perfectionnement" ? 60 : 30;
}

/** How many grid rows a session covers, at one row per half hour. */
export function slotRowSpan(type: LessonType): number {
  return sessionMinutes(type) / 30;
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
  /** Set on perfectionnement sessions only: the hourly rate at booking time. */
  price: number | null;
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

function usePlanningMutation<TArgs>(run: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["planning"] });
      // A perfectionnement hour changes what its candidate owes.
      void queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all });
    },
  });
}

/**
 * Creates a session and books it in one call — nothing is declared available
 * beforehand. Duration and price come from the type, decided in the database
 * rather than sent by the browser.
 */
export function useCreateSession() {
  return usePlanningMutation(
    async ({
      date,
      time,
      type,
      enrollmentId,
    }: {
      date: string;
      time: string;
      type: LessonType;
      enrollmentId: string;
    }) => {
      const supabase = createClient();
      const { error } = await supabase.rpc("create_and_book_slot", {
        p_slot_date: date,
        p_start_time: time,
        p_lesson_type: type,
        p_enrollment_id: enrollmentId,
      });
      if (error) throw Object.assign(new Error(error.message), { code: error.code });
    },
  );
}

/** Closes a half hour so nothing can be booked in it. */
export function useBlockSlot() {
  return usePlanningMutation(
    async ({
      date,
      time,
      type,
    }: {
      date: string;
      time: string;
      type: LessonType;
    }) => {
      const supabase = createClient();
      const { error } = await supabase.rpc("block_slot", {
        p_slot_date: date,
        p_start_time: time,
        p_lesson_type: type,
      });
      if (error) throw Object.assign(new Error(error.message), { code: error.code });
    },
  );
}

/**
 * Removes a row outright — a session that is not happening, or a closed half
 * hour that reopens. There is no third state to fall back to: a slot exists
 * because the school put something there.
 */
export function useDeleteSlot() {
  return usePlanningMutation(async ({ id }: { id: string }) => {
    const supabase = createClient();
    const { error } = await supabase.from("slots").delete().eq("id", id);
    if (error) throw new Error(error.message);
  });
}
