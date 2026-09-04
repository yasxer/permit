import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { supabaseAnonKey, supabaseUrl } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Builds a Supabase client bound to the incoming request and a response that
 * carries any refreshed auth cookies back to the browser.
 *
 * The response must be the one that is returned (or have its cookies copied
 * onto a redirect), otherwise a refreshed session is silently dropped and the
 * user is logged out at random.
 */
export function createProxyClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    supabaseUrl(),
    supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  return {
    supabase,
    /** Read lazily: `setAll` replaces the response object. */
    getResponse: () => response,
    /** Move refreshed auth cookies onto a redirect/rewrite response. */
    withAuthCookies: (target: NextResponse) => {
      for (const cookie of response.cookies.getAll()) {
        target.cookies.set(cookie);
      }
      return target;
    },
  };
}
