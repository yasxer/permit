import { NextResponse } from "next/server";

import { getOwnedSchool, getSessionUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Removes one candidate file from the school.
 *
 * The file itself goes through the school's own session, so the `enrollments`
 * delete policy is what decides whose file this is — the handler never writes
 * as the service role. What it does need the service role for is the account
 * left standing afterwards: the school created it at the counter, and once no
 * file anywhere points at it, that account is an orphan nobody can sign into
 * for a purpose. A candidate enrolled elsewhere keeps both account and file.
 */
export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/ecole/enrollments/[id]">,
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (session.profile.role !== "auto_ecole") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const school = await getOwnedSchool();
  if (!school || school.status !== "approved") {
    return NextResponse.json({ error: "school_not_ready" }, { status: 403 });
  }

  const { id } = await ctx.params;

  // As the school, through the RPC: it re-checks ownership in the database and
  // *raises* when the answer is no, where a bare delete under RLS would just
  // match nothing and let this handler report a success it never performed.
  const supabase = await createClient();
  const { data: candidateId, error } = await supabase.rpc(
    "school_delete_enrollment",
    { p_enrollment_id: id },
  );

  if (error) {
    const denied = error.code === "42501";
    const missing = error.code === "P0002";
    return NextResponse.json(
      { error: denied || missing ? "not_your_candidate" : "delete_failed" },
      { status: denied || missing ? 403 : 500 },
    );
  }

  // From here the file is gone whatever happens next, so an account we fail to
  // tidy up is a loose end rather than a failure the school should retry.
  const admin = createAdminClient();
  const { count } = await admin
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("candidate_id", candidateId);

  let accountDeleted = false;
  if (count === 0) {
    // Unreachable for a school owner's own account — a school cannot enrol
    // itself — but the role is cheap to re-check before deleting a user.
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", candidateId)
      .maybeSingle();

    if (profile?.role === "candidat") {
      const { error: authError } = await admin.auth.admin.deleteUser(candidateId);
      accountDeleted = !authError;
    }
  }

  return NextResponse.json(
    { account_deleted: accountDeleted },
    { headers: { "Cache-Control": "no-store" } },
  );
}
