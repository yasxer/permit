import { NextResponse } from "next/server";
import { z } from "zod";

import { getOwnedSchool, getSessionUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Registers a candidate on behalf of the school.
 *
 * The candidate app is not out yet, so nobody signs up for themselves: the
 * school types the file in and the candidate never touches a screen. It still
 * gets a real account — the same one it will sign into once the app ships — so
 * this path and the self-service one converge on the same row rather than on
 * two kinds of candidate.
 *
 * A route handler rather than a client call because creating an auth user needs
 * the service-role key. The enrollment itself goes through `enroll_candidate`
 * as the *school's* session, so the database re-checks the caller instead of
 * trusting this handler.
 */

const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

const bodySchema = z.object({
  full_name: z.string().trim().min(3).max(120),
  phone: z.string().trim().min(6).max(20),
  category_id: z.uuid(),
  birthdate: z.iso.date(),
  birth_place: z.string().trim().min(2).max(120),
  nationality: z.string().trim().min(2).max(80),
  blood_group: z.enum(BLOOD_GROUPS),
  address: z.string().trim().min(2).max(200),
  // The Latin spelling, the photo and the account details are the four things
  // the counter can do without.
  full_name_fr: z.union([z.string().trim().max(120), z.literal("")]).optional(),
  email: z.union([z.email(), z.literal("")]).optional(),
  password: z.union([z.string().min(6).max(72), z.literal("")]).optional(),
  photo_url: z.union([z.url(), z.literal("")]).optional(),
});

/**
 * Most candidates walk in without an e-mail address, but Supabase Auth needs
 * one to hang an account on. The phone number is the identifier they already
 * have and the one the school will read back to them, so derive the login from
 * it — and keep it stable, so re-registering the same person finds the same
 * account instead of making a second one.
 */
function loginFor(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `${digits}@candidat.permix.dz`;
}

/** Readable enough to dictate over a counter, random enough to not be guessed. */
function generatePassword(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const body = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return `Pmx${body}!`;
}

const RPC_ERROR_STATUS: Record<string, number> = {
  "23505": 409, // already has an open file for this category
  "22023": 422, // category not priced, or not a candidate account
  "42501": 403,
};

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (session.profile.role !== "auto_ecole") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const school = await getOwnedSchool();
  if (!school || school.status !== "approved" || !school.profile_completed) {
    return NextResponse.json({ error: "school_not_ready" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const input = parsed.data;

  const login = input.email?.trim() || loginFor(input.phone);
  const admin = createAdminClient();

  // Re-enrolling someone the platform already knows (a second category, or a
  // candidate moving from another school) must reuse their account: a duplicate
  // would split their file in two and lock them out of the app later.
  const { data: existing, error: lookupError } = await admin
    .from("profiles")
    .select("id, role")
    .eq("email", login)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }
  if (existing && existing.role !== "candidat") {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  const password = input.password?.trim() || generatePassword();
  let candidateId = existing?.id ?? null;
  const createdNow = candidateId === null;

  if (candidateId === null) {
    const { data, error } = await admin.auth.admin.createUser({
      email: login,
      password,
      // No mailbox to confirm from — and the school is the one vouching for
      // the candidate, standing in for the confirmation link.
      email_confirm: true,
      user_metadata: {
        role: "candidat",
        full_name: input.full_name,
        phone: input.phone,
      },
    });

    if (error || !data.user) {
      const status = error?.code === "email_exists" ? 409 : 500;
      return NextResponse.json(
        { error: error?.code === "email_exists" ? "email_taken" : "create_failed" },
        { status },
      );
    }
    candidateId = data.user.id;
  }

  // As the school, not as the service role: `enroll_candidate` snapshots the
  // catalogue price and checks the school is really allowed to enrol.
  const supabase = await createClient();
  const { data: enrollment, error: enrollError } = await supabase.rpc(
    "enroll_candidate",
    { p_candidate_id: candidateId, p_category_id: input.category_id },
  );

  if (enrollError) {
    // Don't leave a stranded account behind when the enrollment is the part
    // that failed; an account we merely found stays untouched.
    if (createdNow) await admin.auth.admin.deleteUser(candidateId);
    return NextResponse.json(
      { error: "enroll_failed", code: enrollError.code },
      { status: RPC_ERROR_STATUS[enrollError.code ?? ""] ?? 400 },
    );
  }

  // The signup trigger only carries the name and phone across; the rest of the
  // form lands here. Done after the enrollment so a failed one changes nothing.
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: input.full_name,
      full_name_fr: input.full_name_fr?.trim() || null,
      phone: input.phone,
      address: input.address,
      birthdate: input.birthdate,
      birth_place: input.birth_place,
      nationality: input.nationality,
      blood_group: input.blood_group,
      photo_url: input.photo_url || null,
    })
    .eq("id", candidateId);

  if (profileError) {
    return NextResponse.json({ error: "profile_failed" }, { status: 500 });
  }

  return NextResponse.json(
    {
      enrollment_id: (enrollment as { id: string }).id,
      candidate_id: candidateId,
      login,
      // Shown once, so the school can hand the credentials over for the app.
      // An account that already existed keeps the password it had.
      password: createdNow ? password : null,
      created: createdNow,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
