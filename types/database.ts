/**
 * Hand-written mirror of `supabase/migrations`. Regenerate with
 *   npx supabase gen types typescript --project-id <id> > types/database.ts
 * once the project is linked; until then keep this file in step with the SQL.
 */

export type UserRole = "super_admin" | "auto_ecole" | "candidat";
export type SchoolStatus = "pending" | "approved" | "rejected";
export type EnrollmentStatus =
  | "pending"
  | "rejected"
  | "active"
  | "completed"
  | "cancelled";
export type LessonType = "code" | "conduite";
export type SlotStatus = "available" | "booked" | "cancelled";
export type ExamStatus = "scheduled" | "completed" | "cancelled";
export type ExamResult = "passed" | "failed" | "absent";
export type QuestionType = "question" | "plaque" | "carrefour";
export type QuestionSource = "api" | "manual";
export type ContentLang = "ar" | "fr" | "en";

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export type WilayaRow = {
  code: number;
  name_ar: string;
  name_fr: string;
  name_en: string;
};

export type ProfileRow = Timestamps & {
  id: string;
  role: UserRole;
  /** Mirrored from auth.users by trigger; never written from the client. */
  email: string | null;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  birthdate: string | null;
  photo_url: string | null;
  has_license: boolean;
};

export type CategoryRow = Timestamps & {
  id: string;
  code: string;
  label_ar: string;
  label_fr: string;
  label_en: string;
  sort_order: number;
};

export type SchoolRow = Timestamps & {
  id: string;
  owner_id: string;
  status: SchoolStatus;
  name: string | null;
  director_name: string | null;
  phone: string | null;
  address: string | null;
  wilaya_code: number | null;
  teaching_car: string | null;
  exam_day: number | null;
  photo_url: string | null;
  perf_price_per_hour: number | null;
  success_passed: number;
  success_failed: number;
  profile_completed: boolean;
  approved_at: string | null;
  approved_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
};

export type SchoolCategoryRow = Timestamps & {
  school_id: string;
  category_id: string;
  price: number;
};

export type EnrollmentRow = Timestamps & {
  id: string;
  school_id: string;
  candidate_id: string;
  category_id: string;
  status: EnrollmentStatus;
  total_price: number;
  code_progress: number;
  creneau_unlocked: boolean;
  conduite_unlocked: boolean;
  requested_at: string;
  decided_at: string | null;
  completed_at: string | null;
  license_obtained_at: string | null;
};

export type PaymentRow = {
  id: string;
  enrollment_id: string;
  amount: number;
  note: string | null;
  paid_at: string;
  created_by: string | null;
  created_at: string;
};

export type PlanningTemplateRow = {
  school_id: string;
  day_of_week: number;
  start_time: string;
  lesson_type: LessonType;
  is_available: boolean;
  updated_at: string;
};

export type SlotRow = Timestamps & {
  id: string;
  school_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  lesson_type: LessonType;
  status: SlotStatus;
  enrollment_id: string | null;
};

export type ExamRow = Timestamps & {
  id: string;
  school_id: string;
  exam_date: string;
  exam_type: LessonType;
  status: ExamStatus;
};

export type ExamCandidateRow = Timestamps & {
  exam_id: string;
  enrollment_id: string;
  result: ExamResult | null;
  notified_at: string | null;
};

export type QuestionRow = Timestamps & {
  id: string;
  type: QuestionType;
  source: QuestionSource;
  lang: ContentLang;
  body: string;
  image_url: string | null;
  external_id: string | null;
  created_by: string | null;
};

/** Shape accepted by the `upsert_question` RPC. */
export type QuestionOptionInput = {
  label: string;
  image_url?: string | null;
  is_correct: boolean;
};

export type QuestionOptionRow = {
  id: string;
  question_id: string;
  label: string;
  image_url: string | null;
  is_correct: boolean;
  sort_order: number;
};

/** One row of the `student_files` view: enrollment + candidate + balance. */
export type StudentFileRow = {
  id: string;
  school_id: string;
  candidate_id: string;
  category_id: string;
  status: EnrollmentStatus;
  total_price: number;
  code_progress: number;
  creneau_unlocked: boolean;
  conduite_unlocked: boolean;
  requested_at: string;
  decided_at: string | null;
  completed_at: string | null;
  license_obtained_at: string | null;
  created_at: string;
  updated_at: string;
  candidate_name: string | null;
  candidate_phone: string | null;
  candidate_address: string | null;
  candidate_birthdate: string | null;
  candidate_photo_url: string | null;
  candidate_email: string | null;
  candidate_has_license: boolean;
  category_code: string;
  category_label_ar: string;
  category_label_fr: string;
  category_label_en: string;
  amount_paid: number;
  amount_remaining: number;
  payment_count: number;
};

/** One row of the `exam_roster` view. */
export type ExamRosterRow = {
  exam_id: string;
  enrollment_id: string;
  result: ExamResult | null;
  notified_at: string | null;
  created_at: string;
  school_id: string;
  exam_date: string;
  exam_type: LessonType;
  candidate_name: string | null;
  candidate_phone: string | null;
  category_code: string;
  code_progress: number;
  creneau_unlocked: boolean;
  conduite_unlocked: boolean;
};

/** Returned by the `admin_dashboard_stats` RPC. */
export type AdminDashboardStats = {
  schools_total: number;
  schools_approved: number;
  schools_pending: number;
  schools_rejected: number;
  candidates_total: number;
  drivers_total: number;
  revenue_total: number;
  enrollments_by_month: { month: string; value: number }[];
  schools_by_wilaya: {
    code: number;
    name_ar: string;
    name_fr: string;
    name_en: string;
    value: number;
  }[];
};

/** Returned by the `school_dashboard_stats` RPC. */
export type SchoolDashboardStats = {
  students_active: number;
  requests_pending: number;
  students_completed: number;
  revenue_total: number;
  next_exam: { date: string; type: LessonType } | null;
  payments_by_month: { month: string; value: number }[];
  stage_breakdown: { code: number; creneau: number; conduite: number };
};

/**
 * Shape expected by `createClient<Database>()`. Insert/Update types mark the
 * columns Postgres fills in as optional.
 */
type TableDef<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type Generated = "created_at" | "updated_at";

type InsertOf<Row, Optional extends keyof Row = never> = Omit<
  Row,
  Generated | Optional
> &
  Partial<Pick<Row, Extract<Generated | Optional, keyof Row>>>;

export type Database = {
  public: {
    Tables: {
      wilayas: TableDef<WilayaRow, WilayaRow, Partial<WilayaRow>>;
      profiles: TableDef<
        ProfileRow,
        InsertOf<
          ProfileRow,
          | "role"
          | "email"
          | "full_name"
          | "phone"
          | "address"
          | "birthdate"
          | "photo_url"
          | "has_license"
        >,
        Partial<ProfileRow>
      >;
      categories: TableDef<
        CategoryRow,
        InsertOf<CategoryRow, "id" | "sort_order">,
        Partial<CategoryRow>
      >;
      schools: TableDef<
        SchoolRow,
        InsertOf<SchoolRow, Exclude<keyof SchoolRow, "owner_id">>,
        Partial<SchoolRow>
      >;
      school_categories: TableDef<
        SchoolCategoryRow,
        InsertOf<SchoolCategoryRow>,
        Partial<SchoolCategoryRow>
      >;
      enrollments: TableDef<
        EnrollmentRow,
        InsertOf<
          EnrollmentRow,
          | "id"
          | "status"
          | "total_price"
          | "code_progress"
          | "creneau_unlocked"
          | "conduite_unlocked"
          | "requested_at"
          | "decided_at"
          | "completed_at"
          | "license_obtained_at"
        >,
        Partial<EnrollmentRow>
      >;
      payments: TableDef<
        PaymentRow,
        Omit<PaymentRow, "id" | "created_at" | "paid_at"> &
          Partial<Pick<PaymentRow, "id" | "created_at" | "paid_at">>,
        Partial<PaymentRow>
      >;
      planning_templates: TableDef<
        PlanningTemplateRow,
        Omit<PlanningTemplateRow, "updated_at" | "is_available"> &
          Partial<Pick<PlanningTemplateRow, "updated_at" | "is_available">>,
        Partial<PlanningTemplateRow>
      >;
      slots: TableDef<
        SlotRow,
        InsertOf<SlotRow, "id" | "status" | "enrollment_id">,
        Partial<SlotRow>
      >;
      exams: TableDef<
        ExamRow,
        InsertOf<ExamRow, "id" | "status">,
        Partial<ExamRow>
      >;
      exam_candidates: TableDef<
        ExamCandidateRow,
        InsertOf<ExamCandidateRow, "result" | "notified_at">,
        Partial<ExamCandidateRow>
      >;
      questions: TableDef<
        QuestionRow,
        InsertOf<
          QuestionRow,
          | "id"
          | "type"
          | "source"
          | "lang"
          | "image_url"
          | "external_id"
          | "created_by"
        >,
        Partial<QuestionRow>
      >;
      question_options: TableDef<
        QuestionOptionRow,
        Omit<QuestionOptionRow, "id" | "is_correct" | "sort_order"> &
          Partial<Pick<QuestionOptionRow, "id" | "is_correct" | "sort_order">>,
        Partial<QuestionOptionRow>
      >;
    };
    Views: {
      student_files: {
        Row: StudentFileRow;
        Relationships: [];
      };
      exam_roster: {
        Row: ExamRosterRow;
        Relationships: [];
      };
    };
    Functions: {
      auth_role: { Args: Record<string, never>; Returns: UserRole };
      is_super_admin: { Args: Record<string, never>; Returns: boolean };
      current_school_id: { Args: Record<string, never>; Returns: string | null };
      is_candidate_of: { Args: { target_school: string }; Returns: boolean };
      approve_school: { Args: { p_school_id: string }; Returns: SchoolRow };
      reject_school: {
        Args: { p_school_id: string; p_reason?: string | null };
        Returns: SchoolRow;
      };
      accept_enrollment: {
        Args: { p_enrollment_id: string };
        Returns: EnrollmentRow;
      };
      reject_enrollment: {
        Args: { p_enrollment_id: string };
        Returns: EnrollmentRow;
      };
      generate_week_slots: {
        Args: { p_week_start: string; p_duration_minutes?: number };
        Returns: number;
      };
      admin_dashboard_stats: {
        Args: { p_months?: number };
        Returns: AdminDashboardStats;
      };
      school_dashboard_stats: {
        Args: { p_months?: number };
        Returns: SchoolDashboardStats;
      };
      enroll_candidate: {
        Args: { p_candidate_id: string; p_category_id: string };
        Returns: EnrollmentRow;
      };
      school_update_candidate: {
        Args: {
          p_candidate_id: string;
          p_full_name: string;
          p_phone?: string | null;
          p_address?: string | null;
          p_birthdate?: string | null;
          p_photo_url?: string | null;
        };
        Returns: ProfileRow;
      };
      book_slot: {
        Args: { p_slot_id: string; p_enrollment_id: string };
        Returns: SlotRow;
      };
      release_slot: { Args: { p_slot_id: string }; Returns: SlotRow };
      upsert_question: {
        Args: {
          p_type: QuestionType;
          p_lang: ContentLang;
          p_body: string;
          p_options: QuestionOptionInput[];
          p_id?: string | null;
          p_image_url?: string | null;
        };
        Returns: QuestionRow;
      };
    };
    Enums: {
      user_role: UserRole;
      school_status: SchoolStatus;
      enrollment_status: EnrollmentStatus;
      lesson_type: LessonType;
      slot_status: SlotStatus;
      exam_status: ExamStatus;
      exam_result: ExamResult;
      question_type: QuestionType;
      question_source: QuestionSource;
      content_lang: ContentLang;
    };
    CompositeTypes: Record<never, never>;
  };
};
