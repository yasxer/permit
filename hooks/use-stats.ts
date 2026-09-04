"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/keys";
import { createClient } from "@/lib/supabase/client";
import type { AdminDashboardStats, SchoolDashboardStats } from "@/types";

/** One round trip: every count, sum and series is aggregated in Postgres. */
export function useAdminStats(months = 12) {
  return useQuery({
    queryKey: [...queryKeys.stats.admin, months],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("admin_dashboard_stats", {
        p_months: months,
      });
      if (error) throw new Error(error.message);
      return data as AdminDashboardStats;
    },
  });
}

export function useSchoolStats(schoolId: string, months = 12) {
  return useQuery({
    queryKey: [...queryKeys.stats.school(schoolId), months],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("school_dashboard_stats", {
        p_months: months,
      });
      if (error) throw new Error(error.message);
      return data as SchoolDashboardStats;
    },
    enabled: Boolean(schoolId),
  });
}
