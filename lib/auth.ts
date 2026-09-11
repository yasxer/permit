import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { ProfileRow, SchoolRow, UserRole, WilayaRow } from "@/types/database";

/** The identity carried by the verified access token. */
export type AuthUser = {
  id: string;
  email: string | null;
};

export type SessionUser = {
  user: AuthUser;
  profile: ProfileRow;
};

/** The school row plus its wilaya, fetched in the same round trip. */
export type OwnedSchool = SchoolRow & {
  wilaya: Pick<WilayaRow, "name_ar" | "name_fr" | "name_en"> | null;
};

/**
 * Who is signed in, from the access token alone.
 *
 * `getClaims()` rather than `getUser()`: with asymmetric signing keys the JWT
 * is verified locally against the project's cached JWKS, where `getUser()`
 * sends every call to the auth server. The proxy has already refreshed an
 * expiring session before any server component runs.
 */
const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: claims.email ?? null };
});

/**
 * Cached per request: a layout, its page and any nested server component all
 * hit this, and React `cache` collapses them into one round trip.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
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

/** Two FKs point at `profiles`, so the wilaya join names its constraint. */
const OWNED_SCHOOL_SELECT = `
  *,
  wilaya:wilayas!schools_wilaya_code_fkey(name_ar, name_fr, name_en)
`;

/**
 * The school owned by the current user, loaded once per request.
 *
 * Keyed on the token, not on the profile, so it runs alongside the profile
 * read instead of after it. Only an auto-école owns a school — the row is
 * created by the signup trigger for that role alone — so a user of any other
 * role simply gets `null`.
 */
export const getOwnedSchool = cache(async (): Promise<OwnedSchool | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("schools")
    .select(OWNED_SCHOOL_SELECT)
    .eq("owner_id", user.id)
    .maybeSingle();

  return (data as unknown as OwnedSchool | null) ?? null;
});

/**
 * Gate for every /ecole page: signed in, role auto_ecole, approved by an admin
 * and profile filled in. `allowIncompleteProfile` is for the
 * complete-profile page itself, which would otherwise redirect to itself.
 */
export async function requireApprovedSchool(
  { allowIncompleteProfile = false } = {},
): Promise<{ session: SessionUser; school: OwnedSchool }> {
  const [session, school] = await Promise.all([
    requireRole("auto_ecole"),
    getOwnedSchool(),
  ]);

  if (!school) redirect("/ecole/pending");
  if (school.status !== "approved") redirect("/ecole/pending");
  if (!school.profile_completed && !allowIncompleteProfile) {
    redirect("/ecole/complete-profile");
  }

  return { session, school };
}
