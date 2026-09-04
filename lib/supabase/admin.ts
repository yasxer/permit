import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { supabaseServiceRoleKey, supabaseUrl } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Service-role client. Bypasses RLS entirely — use it only where a policy
 * genuinely cannot express the rule (listing auth emails for /admin/users,
 * scheduled jobs). Never import this from a Client Component.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    supabaseUrl(),
    supabaseServiceRoleKey(),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
