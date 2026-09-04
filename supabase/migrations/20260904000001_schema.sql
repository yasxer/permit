  -- =============================================================================
  -- Permix — core schema
  -- Driving-school management for Algeria.
  --
  -- Conventions
  --   * every table lives in `public` and has RLS enabled (policies: 0002)
  --   * timestamps are `timestamptz`, defaulted to now()
  --   * money is `numeric(12, 2)` in DZD
  --   * day-of-week is Postgres `dow`: 0 = Sunday … 6 = Saturday
  -- =============================================================================

  create extension if not exists "pgcrypto";

  -- -----------------------------------------------------------------------------
  -- Enums
  -- -----------------------------------------------------------------------------
  create type public.user_role as enum ('super_admin', 'auto_ecole', 'candidat');

  create type public.school_status as enum ('pending', 'approved', 'rejected');

  -- `pending`/`rejected` cover the enrollment request; the rest is the study cycle.
  create type public.enrollment_status as enum (
    'pending', 'rejected', 'active', 'completed', 'cancelled'
  );

  create type public.lesson_type as enum ('code', 'conduite');

  create type public.slot_status as enum ('available', 'booked', 'cancelled');

  create type public.exam_status as enum ('scheduled', 'completed', 'cancelled');

  create type public.exam_result as enum ('passed', 'failed', 'absent');

  create type public.question_type as enum ('question', 'plaque', 'carrefour');

  create type public.question_source as enum ('api', 'manual');

  create type public.content_lang as enum ('ar', 'fr', 'en');

  -- -----------------------------------------------------------------------------
  -- updated_at trigger
  -- -----------------------------------------------------------------------------
  create or replace function public.set_updated_at()
  returns trigger
  language plpgsql
  as $$
  begin
    new.updated_at = now();
    return new;
  end;
  $$;

  -- -----------------------------------------------------------------------------
  -- wilayas — reference data for the "schools by wilaya" chart
  -- -----------------------------------------------------------------------------
  create table public.wilayas (
    code       smallint primary key,
    name_ar    text not null,
    name_fr    text not null,
    name_en    text not null
  );

  -- -----------------------------------------------------------------------------
  -- profiles — one row per auth.users, created by trigger on signup
  -- -----------------------------------------------------------------------------
  create table public.profiles (
    id           uuid primary key references auth.users (id) on delete cascade,
    role         public.user_role not null default 'candidat',
    -- Mirrored from auth.users: RLS cannot expose the auth schema to the
    -- browser, and /admin/users has to list accounts by e-mail.
    email        text,
    full_name    text,
    phone        text,
    address      text,
    birthdate    date,
    photo_url    text,
    -- set once a candidate passes the conduite exam; drives the admin stat.
    has_license  boolean not null default false,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
  );

  create index profiles_role_idx on public.profiles (role);
  create index profiles_email_idx on public.profiles (email);

  create trigger profiles_set_updated_at
    before update on public.profiles
    for each row execute function public.set_updated_at();

  -- Mirror every new auth user into `profiles`, taking the role from the signup
  -- metadata. Anything other than 'auto_ecole' falls back to 'candidat' so a
  -- client can never self-assign 'super_admin'.
  create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
  as $$
  declare
    requested_role text := new.raw_user_meta_data ->> 'role';
  begin
    insert into public.profiles (id, role, email, full_name, phone)
    values (
      new.id,
      case when requested_role = 'auto_ecole' then 'auto_ecole'::public.user_role
          else 'candidat'::public.user_role end,
      new.email,
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'phone', '')
    );

    -- An auto_ecole signup immediately gets a pending school shell so the admin
    -- has something to approve and the owner has somewhere to save their profile.
    if requested_role = 'auto_ecole' then
      insert into public.schools (owner_id, name)
      values (new.id, nullif(new.raw_user_meta_data ->> 'school_name', ''));
    end if;

    return new;
  end;
  $$;

  -- -----------------------------------------------------------------------------
  -- categories — licence categories (A, B, C, …), managed by the super admin
  -- -----------------------------------------------------------------------------
  create table public.categories (
    id         uuid primary key default gen_random_uuid(),
    code       text not null unique,
    label_ar   text not null,
    label_fr   text not null,
    label_en   text not null,
    sort_order smallint not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create trigger categories_set_updated_at
    before update on public.categories
    for each row execute function public.set_updated_at();

  -- -----------------------------------------------------------------------------
  -- schools — one per auto_ecole account
  -- -----------------------------------------------------------------------------
  create table public.schools (
    id                   uuid primary key default gen_random_uuid(),
    owner_id             uuid not null unique references public.profiles (id) on delete cascade,
    status               public.school_status not null default 'pending',
    name                 text,
    director_name        text,
    phone                text,
    address              text,
    wilaya_code          smallint references public.wilayas (code),
    teaching_car         text,
    -- Weekly exam day, Postgres dow (0 = Sunday … 6 = Saturday).
    exam_day             smallint check (exam_day between 0 and 6),
    photo_url            text,
    perf_price_per_hour  numeric(12, 2) check (perf_price_per_hour >= 0),
    success_passed       integer not null default 0 check (success_passed >= 0),
    success_failed       integer not null default 0 check (success_failed >= 0),
    -- Gate for /ecole/complete-profile; maintained by a trigger, never by clients.
    profile_completed    boolean not null default false,
    approved_at          timestamptz,
    approved_by          uuid references public.profiles (id) on delete set null,
    rejected_at          timestamptz,
    rejection_reason     text,
    created_at           timestamptz not null default now(),
    updated_at           timestamptz not null default now()
  );

  create index schools_status_idx on public.schools (status);
  create index schools_wilaya_idx on public.schools (wilaya_code);

  create trigger schools_set_updated_at
    before update on public.schools
    for each row execute function public.set_updated_at();

  -- `profile_completed` is derived, so the client cannot lie about it.
  create or replace function public.sync_school_profile_completed()
  returns trigger
  language plpgsql
  as $$
  begin
    new.profile_completed :=
      new.name is not null and length(trim(new.name)) > 0
      and new.director_name is not null and length(trim(new.director_name)) > 0
      and new.phone is not null and length(trim(new.phone)) > 0
      and new.address is not null and length(trim(new.address)) > 0
      and new.teaching_car is not null and length(trim(new.teaching_car)) > 0
      and new.exam_day is not null
      and new.perf_price_per_hour is not null;
    return new;
  end;
  $$;

  create trigger schools_sync_profile_completed
    before insert or update on public.schools
    for each row execute function public.sync_school_profile_completed();

  -- The trigger on auth.users is created after `schools` exists.
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

  -- A user can change their address from the account screen; without this the
  -- mirrored copy would silently go stale.
  create or replace function public.sync_profile_email()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
  as $$
  begin
    perform set_config('permix.system_update', 'on', true);
    update public.profiles set email = new.email where id = new.id;
    perform set_config('permix.system_update', 'off', true);
    return new;
  end;
  $$;

  create trigger on_auth_user_email_changed
    after update of email on auth.users
    for each row
    when (new.email is distinct from old.email)
    execute function public.sync_profile_email();

  -- -----------------------------------------------------------------------------
  -- school_categories — price per category, per school
  -- -----------------------------------------------------------------------------
  create table public.school_categories (
    school_id   uuid not null references public.schools (id) on delete cascade,
    category_id uuid not null references public.categories (id) on delete cascade,
    price       numeric(12, 2) not null check (price >= 0),
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    primary key (school_id, category_id)
  );

  create trigger school_categories_set_updated_at
    before update on public.school_categories
    for each row execute function public.set_updated_at();

  -- -----------------------------------------------------------------------------
  -- enrollments — a candidate's file at one school; the app's central table
  -- -----------------------------------------------------------------------------
  create table public.enrollments (
    id                  uuid primary key default gen_random_uuid(),
    school_id           uuid not null references public.schools (id) on delete cascade,
    candidate_id        uuid not null references public.profiles (id) on delete cascade,
    category_id         uuid not null references public.categories (id) on delete restrict,
    status              public.enrollment_status not null default 'pending',
    -- Snapshot of school_categories.price at acceptance: later price changes
    -- must not rewrite an existing candidate's balance.
    total_price         numeric(12, 2) not null default 0 check (total_price >= 0),
    code_progress       smallint not null default 0 check (code_progress between 0 and 100),
    creneau_unlocked    boolean not null default false,
    conduite_unlocked   boolean not null default false,
    requested_at        timestamptz not null default now(),
    decided_at          timestamptz,
    completed_at        timestamptz,
    license_obtained_at timestamptz,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
  );

  -- A candidate may re-apply after a rejection, but never hold two open files at
  -- the same school for the same category. A plain unique constraint would also
  -- forbid a second rejection, so scope it to the open statuses.
  create unique index enrollments_one_open_file
    on public.enrollments (school_id, candidate_id, category_id)
    where status in ('pending', 'active');

  create index enrollments_school_status_idx on public.enrollments (school_id, status);
  create index enrollments_candidate_idx on public.enrollments (candidate_id);

  create trigger enrollments_set_updated_at
    before update on public.enrollments
    for each row execute function public.set_updated_at();

  -- -----------------------------------------------------------------------------
  -- payments — instalments recorded by the school
  -- -----------------------------------------------------------------------------
  create table public.payments (
    id            uuid primary key default gen_random_uuid(),
    enrollment_id uuid not null references public.enrollments (id) on delete cascade,
    amount        numeric(12, 2) not null check (amount > 0),
    note          text,
    paid_at       timestamptz not null default now(),
    created_by    uuid references public.profiles (id) on delete set null,
    created_at    timestamptz not null default now()
  );

  create index payments_enrollment_idx on public.payments (enrollment_id, paid_at desc);

  -- -----------------------------------------------------------------------------
  -- planning_templates — the school's recurring weekly availability
  -- -----------------------------------------------------------------------------
  create table public.planning_templates (
    school_id    uuid not null references public.schools (id) on delete cascade,
    day_of_week  smallint not null check (day_of_week between 0 and 6),
    start_time   time not null,
    lesson_type  public.lesson_type not null,
    is_available boolean not null default false,
    updated_at   timestamptz not null default now(),
    primary key (school_id, day_of_week, start_time, lesson_type)
  );

  create trigger planning_templates_set_updated_at
    before update on public.planning_templates
    for each row execute function public.set_updated_at();

  -- -----------------------------------------------------------------------------
  -- slots — concrete, dated slots generated from the template
  -- -----------------------------------------------------------------------------
  create table public.slots (
    id            uuid primary key default gen_random_uuid(),
    school_id     uuid not null references public.schools (id) on delete cascade,
    slot_date     date not null,
    start_time    time not null,
    end_time      time not null,
    lesson_type   public.lesson_type not null,
    status        public.slot_status not null default 'available',
    enrollment_id uuid references public.enrollments (id) on delete set null,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now(),
    unique (school_id, slot_date, start_time, lesson_type),
    -- A booked slot must name its candidate; a free one must not.
    constraint slots_booking_consistent check (
      (status = 'booked' and enrollment_id is not null)
      or (status <> 'booked' and enrollment_id is null)
    )
  );

  create index slots_school_date_idx on public.slots (school_id, slot_date);

  create trigger slots_set_updated_at
    before update on public.slots
    for each row execute function public.set_updated_at();

  -- -----------------------------------------------------------------------------
  -- exams — a dated session; candidates are assigned via exam_candidates
  -- -----------------------------------------------------------------------------
  create table public.exams (
    id         uuid primary key default gen_random_uuid(),
    school_id  uuid not null references public.schools (id) on delete cascade,
    exam_date  date not null,
    exam_type  public.lesson_type not null,
    status     public.exam_status not null default 'scheduled',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (school_id, exam_date, exam_type)
  );

  create index exams_school_date_idx on public.exams (school_id, exam_date desc);

  create trigger exams_set_updated_at
    before update on public.exams
    for each row execute function public.set_updated_at();

  create table public.exam_candidates (
    exam_id       uuid not null references public.exams (id) on delete cascade,
    enrollment_id uuid not null references public.enrollments (id) on delete cascade,
    result        public.exam_result,
    notified_at   timestamptz,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now(),
    primary key (exam_id, enrollment_id)
  );

  create trigger exam_candidates_set_updated_at
    before update on public.exam_candidates
    for each row execute function public.set_updated_at();

  -- Passing the conduite exam closes the file and flags the licence. Keeping this
  -- in a trigger means the admin "total drivers" stat can never disagree with the
  -- exam results the school entered.
  create or replace function public.apply_conduite_result()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
  as $$
  declare
    is_conduite boolean;
    candidate uuid;
  begin
    if new.result is distinct from 'passed' then
      return new;
    end if;

    select e.exam_type = 'conduite' into is_conduite
    from public.exams e where e.id = new.exam_id;

    if not coalesce(is_conduite, false) then
      return new;
    end if;

    update public.enrollments
      set status = 'completed',
          completed_at = coalesce(completed_at, now()),
          license_obtained_at = coalesce(license_obtained_at, now())
    where id = new.enrollment_id
    returning candidate_id into candidate;

    if candidate is not null then
      perform set_config('permix.system_update', 'on', true);
      update public.profiles set has_license = true where id = candidate;
      perform set_config('permix.system_update', 'off', true);
    end if;

    return new;
  end;
  $$;

  create trigger exam_candidates_apply_conduite_result
    after insert or update of result on public.exam_candidates
    for each row execute function public.apply_conduite_result();

  -- -----------------------------------------------------------------------------
  -- questions — theory bank (questions, road signs, intersections)
  -- -----------------------------------------------------------------------------
  create table public.questions (
    id          uuid primary key default gen_random_uuid(),
    type        public.question_type not null default 'question',
    source      public.question_source not null default 'manual',
    lang        public.content_lang not null default 'fr',
    body        text not null,
    image_url   text,
    external_id text,
    created_by  uuid references public.profiles (id) on delete set null,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
  );

  create index questions_type_lang_idx on public.questions (type, lang);
  create unique index questions_external_id_key
    on public.questions (source, external_id)
    where external_id is not null;

  create trigger questions_set_updated_at
    before update on public.questions
    for each row execute function public.set_updated_at();

  create table public.question_options (
    id          uuid primary key default gen_random_uuid(),
    question_id uuid not null references public.questions (id) on delete cascade,
    label       text not null,
    image_url   text,
    is_correct  boolean not null default false,
    sort_order  smallint not null default 0
  );

  create index question_options_question_idx on public.question_options (question_id, sort_order);
