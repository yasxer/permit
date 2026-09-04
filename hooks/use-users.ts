"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/keys";
import { createClient } from "@/lib/supabase/client";
import { unwrap } from "@/lib/supabase/query";
import type { ProfileRow, UserRole } from "@/types";

export function useUsers(role?: UserRole | "all") {
  return useQuery({
    queryKey: queryKeys.users.list(role),
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (role && role !== "all") query = query.eq("role", role);

      return unwrap(await query) as ProfileRow[];
    },
  });
}
