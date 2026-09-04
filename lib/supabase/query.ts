import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Supabase returns `{ data, error }` rather than throwing. React Query needs a
 * rejected promise to mark a query failed, so unwrap every call through here.
 */
export function unwrap<T>({
  data,
  error,
}: {
  data: T | null;
  error: PostgrestError | null;
}): T {
  if (error) {
    // Carry the HTTP-ish status so the global retry rule can skip 401/403/404.
    throw Object.assign(new Error(error.message), {
      code: error.code,
      details: error.details,
      status: Number(error.code) || undefined,
    });
  }
  if (data === null) {
    throw new Error("No data returned");
  }
  return data;
}
