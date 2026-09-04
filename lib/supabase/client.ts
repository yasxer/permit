"use client";

import { createBrowserClient } from "@supabase/ssr";

import { supabaseAnonKey, supabaseUrl } from "@/lib/env";
import type { Database } from "@/types/database";

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

/** Singleton so every hook shares one auth state and one realtime socket. */
export function createClient() {
  client ??= createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey());
  return client;
}
