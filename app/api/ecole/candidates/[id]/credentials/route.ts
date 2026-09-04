import { NextResponse } from "next/server";
import { z } from "zod";

import { getOwnedSchool, getSessionUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Sets or changes a candidate's app credentials after the fact.
 *
 * At the counter the account is created without an e-mail — the login is
 * derived from the phone number and the password is generated. Later the
 * candidate turns up with an address they actually read, or has forgotten the
 * slip of paper. Either way the school fixes it here rather than the candidate
 * going through a password-reset mail it cannot receive.
 */

const bodySchema = z
  .object({
    email: z.union([z.email(), z.literal("")]).optional(),
    password: z.union([z.string().min(6).max(72), z.literal("")]).optional(),
  })
  .refine((body) => Boolean(body.email || body.password), {
    message: "nothing to change",
  });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
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

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { id } = await params;

  // Read as the school, not as the service role: the enrollment policy is what
  // decides whose credentials this school may touch.
  const supabase = await createClient();
  const { data: file } = await supabase
    .from("enrollments")
    .select("id")
    .eq("candidate_id", id)
    .eq("school_id", school.id)
    .limit(1)
    .maybeSingle();

  if (!file) {
    return NextResponse.json({ error: "not_your_candidate" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.updateUserById(id, {
    ...(parsed.data.email ? { email: parsed.data.email, email_confirm: true } : {}),
    ...(parsed.data.password ? { password: parsed.data.password } : {}),
  });

  if (error || !data.user) {
    const taken = error?.code === "email_exists";
    return NextResponse.json(
      { error: taken ? "email_taken" : "update_failed" },
      { status: taken ? 409 : 500 },
    );
  }

  return NextResponse.json(
    { login: data.user.email ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
