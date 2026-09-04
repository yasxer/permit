-- =============================================================================
-- Permix — row level security
--
-- The browser talks to Postgres directly, so these policies ARE the
-- authorization layer. Three actors:
--   super_admin  — sees and moderates everything
--   auto_ecole   — sees only the school it owns and that school's candidates
--   candidat     — sees only its own file
--
-- Helper functions are SECURITY DEFINER so that a policy on `profiles` can read
-- `profiles` without recursing into its own policy.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'super_admin' from public.profiles where id = (select auth.uid())),
    false
  )
$$;

-- The school owned by the caller, or null. Used by every /ecole policy.
create or replace function public.current_school_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.schools where owner_id = (select auth.uid())
$$;

-- True when the caller is a candidate with a file at the given school.
create or replace function public.is_candidate_of(target_school uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.enrollments
    where school_id = target_school
      and candidate_id = (select auth.uid())
  )
$$;

revoke execute on function public.auth_role() from public;
revoke execute on function public.is_super_admin() from public;
revoke execute on function public.current_school_id() from public;
revoke execute on function public.is_candidate_of(uuid) from public;
grant execute on function public.auth_role() to authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.current_school_id() to authenticated;
grant execute on function public.is_candidate_of(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Privilege guards: fields the owner may never set on themselves
-- -----------------------------------------------------------------------------

-- A user may edit their own profile but not promote themselves, and not hand
-- themselves a licence.
--
-- The `permix.system_update` escape hatch is what makes the guard workable.
-- Triggers fire for every database role — superuser included — so without it
-- there would be no way to appoint the first super admin at all, and the
-- derived-column triggers would be blocked by their own guard. The flag is
-- transaction-local and `set_config` is not reachable through PostgREST, so a
-- browser client cannot raise it.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
as $$
declare
  system_update boolean :=
    coalesce(current_setting('permix.system_update', true), 'off') = 'on';
begin
  if public.is_super_admin() or system_update then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'role cannot be changed' using errcode = '42501';
  end if;
  -- `email` mirrors auth.users; only `sync_profile_email` may move it.
  if new.email is distinct from old.email then
    raise exception 'email is mirrored from auth.users' using errcode = '42501';
  end if;
  if new.has_license is distinct from old.has_license then
    raise exception 'has_license is derived from exam results' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- A school owner fills in its profile; only an admin moves it out of `pending`.
create or replace function public.guard_school_update()
returns trigger
language plpgsql
as $$
begin
  if public.is_super_admin() then
    return new;
  end if;
  if new.status is distinct from old.status
     or new.approved_at is distinct from old.approved_at
     or new.approved_by is distinct from old.approved_by
     or new.rejected_at is distinct from old.rejected_at
     or new.owner_id is distinct from old.owner_id then
    raise exception 'approval fields are admin-only' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger schools_guard_update
  before update on public.schools
  for each row execute function public.guard_school_update();

-- A candidate opens a request; only the school decides its outcome.
create or replace function public.guard_enrollment_update()
returns trigger
language plpgsql
as $$
begin
  if public.is_super_admin() then
    return new;
  end if;
  if new.school_id is distinct from old.school_id
     or new.candidate_id is distinct from old.candidate_id then
    raise exception 'enrollment cannot be reassigned' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger enrollments_guard_update
  before update on public.enrollments
  for each row execute function public.guard_enrollment_update();

-- -----------------------------------------------------------------------------
-- Enable RLS everywhere
-- -----------------------------------------------------------------------------
alter table public.wilayas            enable row level security;
alter table public.profiles           enable row level security;
alter table public.categories         enable row level security;
alter table public.schools            enable row level security;
alter table public.school_categories  enable row level security;
alter table public.enrollments        enable row level security;
alter table public.payments           enable row level security;
alter table public.planning_templates enable row level security;
alter table public.slots              enable row level security;
alter table public.exams              enable row level security;
alter table public.exam_candidates    enable row level security;
alter table public.questions          enable row level security;
alter table public.question_options   enable row level security;

-- -----------------------------------------------------------------------------
-- wilayas — public reference data
-- -----------------------------------------------------------------------------
create policy "wilayas readable by everyone"
  on public.wilayas for select
  to anon, authenticated
  using (true);

create policy "wilayas writable by admin"
  on public.wilayas for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create policy "profiles select own"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles select all as admin"
  on public.profiles for select
  to authenticated
  using (public.is_super_admin());

-- A school reads the profiles of the candidates who applied to it.
create policy "profiles select own candidates"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.enrollments e
      where e.candidate_id = profiles.id
        and e.school_id = public.current_school_id()
    )
  );

create policy "profiles update own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "profiles update as admin"
  on public.profiles for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- categories — read by all signed-in users, written by the admin
-- -----------------------------------------------------------------------------
create policy "categories readable"
  on public.categories for select
  to authenticated
  using (true);

create policy "categories writable by admin"
  on public.categories for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- schools
-- -----------------------------------------------------------------------------
create policy "schools select own"
  on public.schools for select
  to authenticated
  using (owner_id = (select auth.uid()));

create policy "schools select as admin"
  on public.schools for select
  to authenticated
  using (public.is_super_admin());

-- Approved schools are the public directory a candidate picks from.
create policy "schools select approved"
  on public.schools for select
  to authenticated
  using (status = 'approved');

create policy "schools update own"
  on public.schools for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "schools update as admin"
  on public.schools for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "schools delete as admin"
  on public.schools for delete
  to authenticated
  using (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- school_categories — the school's price list
-- -----------------------------------------------------------------------------
create policy "school categories readable"
  on public.school_categories for select
  to authenticated
  using (
    school_id = public.current_school_id()
    or public.is_super_admin()
    or exists (
      select 1 from public.schools s
      where s.id = school_categories.school_id and s.status = 'approved'
    )
  );

create policy "school categories writable by owner"
  on public.school_categories for all
  to authenticated
  using (school_id = public.current_school_id() or public.is_super_admin())
  with check (school_id = public.current_school_id() or public.is_super_admin());

-- -----------------------------------------------------------------------------
-- enrollments
-- -----------------------------------------------------------------------------
create policy "enrollments select own file"
  on public.enrollments for select
  to authenticated
  using (candidate_id = (select auth.uid()));

create policy "enrollments select as school"
  on public.enrollments for select
  to authenticated
  using (school_id = public.current_school_id());

create policy "enrollments select as admin"
  on public.enrollments for select
  to authenticated
  using (public.is_super_admin());

-- A candidate may only open a pending request, for themselves, at an approved
-- school. Everything else about the file is the school's to set.
create policy "enrollments insert own request"
  on public.enrollments for insert
  to authenticated
  with check (
    candidate_id = (select auth.uid())
    and status = 'pending'
    and total_price = 0
    and code_progress = 0
    and creneau_unlocked = false
    and conduite_unlocked = false
    and exists (
      select 1 from public.schools s
      where s.id = enrollments.school_id and s.status = 'approved'
    )
  );

create policy "enrollments update as school"
  on public.enrollments for update
  to authenticated
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

create policy "enrollments update as admin"
  on public.enrollments for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- payments — an append-only ledger for the school
-- -----------------------------------------------------------------------------
create policy "payments select by stakeholders"
  on public.payments for select
  to authenticated
  using (
    public.is_super_admin()
    or exists (
      select 1 from public.enrollments e
      where e.id = payments.enrollment_id
        and (
          e.school_id = public.current_school_id()
          or e.candidate_id = (select auth.uid())
        )
    )
  );

create policy "payments insert by school"
  on public.payments for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.enrollments e
      where e.id = payments.enrollment_id
        and e.school_id = public.current_school_id()
    )
  );

-- Corrections go through an admin so the ledger stays trustworthy.
create policy "payments amend as admin"
  on public.payments for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- planning_templates
-- -----------------------------------------------------------------------------
create policy "planning templates by owner"
  on public.planning_templates for all
  to authenticated
  using (school_id = public.current_school_id() or public.is_super_admin())
  with check (school_id = public.current_school_id() or public.is_super_admin());

-- -----------------------------------------------------------------------------
-- slots
-- -----------------------------------------------------------------------------
create policy "slots select by stakeholders"
  on public.slots for select
  to authenticated
  using (
    school_id = public.current_school_id()
    or public.is_super_admin()
    or public.is_candidate_of(school_id)
  );

create policy "slots write by owner"
  on public.slots for all
  to authenticated
  using (school_id = public.current_school_id() or public.is_super_admin())
  with check (school_id = public.current_school_id() or public.is_super_admin());

-- -----------------------------------------------------------------------------
-- exams
-- -----------------------------------------------------------------------------
create policy "exams select by stakeholders"
  on public.exams for select
  to authenticated
  using (
    school_id = public.current_school_id()
    or public.is_super_admin()
    or public.is_candidate_of(school_id)
  );

create policy "exams write by owner"
  on public.exams for all
  to authenticated
  using (school_id = public.current_school_id() or public.is_super_admin())
  with check (school_id = public.current_school_id() or public.is_super_admin());

create policy "exam candidates select by stakeholders"
  on public.exam_candidates for select
  to authenticated
  using (
    public.is_super_admin()
    or exists (
      select 1 from public.enrollments e
      where e.id = exam_candidates.enrollment_id
        and (
          e.school_id = public.current_school_id()
          or e.candidate_id = (select auth.uid())
        )
    )
  );

create policy "exam candidates write by owner"
  on public.exam_candidates for all
  to authenticated
  using (
    public.is_super_admin()
    or exists (
      select 1 from public.exams x
      where x.id = exam_candidates.exam_id
        and x.school_id = public.current_school_id()
    )
  )
  with check (
    public.is_super_admin()
    or exists (
      select 1 from public.exams x
      where x.id = exam_candidates.exam_id
        and x.school_id = public.current_school_id()
    )
  );

-- -----------------------------------------------------------------------------
-- questions — read by everyone signed in, curated by the admin
-- -----------------------------------------------------------------------------
create policy "questions readable"
  on public.questions for select
  to authenticated
  using (true);

create policy "questions writable by admin"
  on public.questions for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "question options readable"
  on public.question_options for select
  to authenticated
  using (true);

create policy "question options writable by admin"
  on public.question_options for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());
