import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { ProfileRow, SchoolRow, UserRole } from "@/types/database";

export type SessionUser = {
  user: User;
  profile: ProfileRow;
};

/**
 * Cached per request: a layout, its page and any nested server component all
 * hit this, and React `cache` collapses them into one round trip.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  return { user, profile };
});

export async function requireUser(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  return session;
}

/** Where a signed-in user belongs, by role. */
export function homePathFor(role: UserRole): string {
  switch (role) {
    case "super_admin":
      return "/admin/dashboard";
    case "auto_ecole":
      return "/ecole/dashboard";
    default:
      return "/account";
  }
}

export async function requireRole(role: UserRole): Promise<SessionUser> {
  const session = await requireUser();
  if (session.profile.role !== role) {
    redirect(homePathFor(session.profile.role));
  }
  return session;
}

/** The school owned by the current user, loaded once per request. */
export const getOwnedSchool = cache(async (): Promise<SchoolRow | null> => {
  const session = await getSessionUser();
  if (!session || session.profile.role !== "auto_ecole") return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("schools")
    .select("*")
    .eq("owner_id", session.user.id)
    .single();

  return data ?? null;
});

/**
 * Gate for every /ecole page: signed in, role auto_ecole, approved by an admin
 * and profile filled in. `allowIncompleteProfile` is for the
 * complete-profile page itself, which would otherwise redirect to itself.
 */
export async function requireApprovedSchool(
  { allowIncompleteProfile = false } = {},
): Promise<{ session: SessionUser; school: SchoolRow }> {
  const session = await requireRole("auto_ecole");
  const school = await getOwnedSchool();

  if (!school) redirect("/ecole/pending");
  if (school.status !== "approved") redirect("/ecole/pending");
  if (!school.profile_completed && !allowIncompleteProfile) {
    redirect("/ecole/complete-profile");
  }

  return { session, school };
}
