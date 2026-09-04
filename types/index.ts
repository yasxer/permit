/**
 * Domain shapes assembled from the raw table rows in `types/database.ts`.
 * These mirror the joins the UI actually asks Supabase for.
 */
export * from "./database";

import type {
  CategoryRow,
  EnrollmentRow,
  ExamCandidateRow,
  ExamRow,
  PaymentRow,
  ProfileRow,
  SchoolRow,
  SlotRow,
  WilayaRow,
} from "./database";

export type SchoolWithOwner = SchoolRow & {
  owner: Pick<ProfileRow, "id" | "full_name" | "phone" | "email"> | null;
  wilaya: WilayaRow | null;
};

export type EnrollmentWithCandidate = EnrollmentRow & {
  candidate: Pick<
    ProfileRow,
    "id" | "full_name" | "phone" | "address" | "birthdate" | "photo_url"
  > | null;
  category: Pick<CategoryRow, "id" | "code"> | null;
};

/** An enrollment plus the money already collected against it. */
export type StudentSummary = EnrollmentWithCandidate & {
  amount_paid: number;
  amount_remaining: number;
};

export type PaymentWithAuthor = PaymentRow & {
  author: Pick<ProfileRow, "id" | "full_name"> | null;
};

export type SlotWithBooking = SlotRow & {
  enrollment: EnrollmentWithCandidate | null;
};

export type ExamWithCount = ExamRow & {
  candidate_count: number;
};

export type ExamCandidateWithStudent = ExamCandidateRow & {
  enrollment: EnrollmentWithCandidate | null;
};

/** One point on a monthly chart, keyed by ISO "YYYY-MM". */
export type MonthlyPoint = {
  month: string;
  value: number;
};
