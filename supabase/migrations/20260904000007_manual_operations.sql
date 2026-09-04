-- =============================================================================
-- Permix — school-side manual operations
--
-- Until the candidate app ships, the school does everything from the web: it
-- registers the candidate itself and books the slots itself. These functions
-- are the school-side twins of the candidate-side flows (`enrollments insert
-- own request` + `accept_enrollment`, and a candidate booking its own slot).
-- Both paths stay open: when the app arrives nothing here has to change.
--
-- Every function is SECURITY DEFINER — it bypasses RLS, so it re-checks the
-- caller itself.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Booking integrity
-- -----------------------------------------------------------------------------

-- `slots_booking_consistent` already forces a booked slot to name an
-- enrollment, but says nothing about *whose*. Without this a school could
-- attach another school's candidate to its own slot with one direct update —
-- the slots policy only checks the slot's school_id.
create or replace function public.guard_slot_booking()
returns trigger
language plpgsql
as $$
begin
  if new.enrollment_id is not null
     and not exists (
       select 1 from public.enrollments e
       where e.id = new.enrollment_id
         and e.school_id = new.school_id
     ) then
    raise exception 'slot and enrollment belong to different schools'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger slots_guard_booking
  before insert or update on public.slots
  for each row execute function public.guard_slot_booking();

-- One candidate cannot sit in two rooms at once: code and conduite are
-- separate slot rows at the same clock time, and nothing stopped booking both.
create unique index slots_one_booking_per_candidate_time
  on public.slots (enrollment_id, slot_date, start_time)
  where status = 'booked';

-- -----------------------------------------------------------------------------
-- Manual enrollment
-- -----------------------------------------------------------------------------

-- Registers an existing candidate account onto the caller's school, already
-- accepted. The candidate-driven path opens a `pending` request that the school
-- then accepts; here the school *is* the one asking, so there is nothing to
-- decide. The price snapshot rule is the same one `accept_enrollment` applies:
-- a later price change must not rewrite an open file.
create or replace function public.enroll_candidate(
  p_candidate_id uuid,
  p_category_id  uuid
)
returns public.enrollments
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_school uuid := public.current_school_id();
  school_ok     boolean;
  snapshot      numeric(12, 2);
  result        public.enrollments;
begin
  if caller_school is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select status = 'approved' and profile_completed
    into school_ok
  from public.schools where id = caller_school;

  if not coalesce(school_ok, false) then
    raise exception 'school is not approved yet' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = p_candidate_id and role = 'candidat'
  ) then
    raise exception 'not a candidate account' using errcode = '22023';
  end if;

  -- A school may only enrol into a category it actually prices: the snapshot
  -- would otherwise silently be zero and the file would show nothing owed.
  select price into snapshot
  from public.school_categories
  where school_id = caller_school and category_id = p_category_id;

  if snapshot is null then
    raise exception 'category is not priced by this school' using errcode = '22023';
  end if;

  insert into public.enrollments (
    school_id, candidate_id, category_id, status, total_price, decided_at
  )
  values (
    caller_school, p_candidate_id, p_category_id, 'active', snapshot, now()
  )
  returning * into result;

  return result;
exception
  -- `enrollments_one_open_file`: the candidate already has an open file here.
  when unique_violation then
    raise exception 'candidate already has an open file for this category'
      using errcode = '23505';
end;
$$;

-- The candidate cannot correct their own details without the app, so the school
-- keeps them. Scoped to the caller's own candidates, and to the columns that
-- are theirs to hold: `role`, `email` and `has_license` stay out of reach.
create or replace function public.school_update_candidate(
  p_candidate_id uuid,
  p_full_name    text,
  p_phone        text default null,
  p_address      text default null,
  p_birthdate    date default null,
  p_photo_url    text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_school uuid := public.current_school_id();
  result        public.profiles;
begin
  if caller_school is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.enrollments e
    where e.candidate_id = p_candidate_id
      and e.school_id = caller_school
  ) then
    raise exception 'not your candidate' using errcode = '42501';
  end if;

  update public.profiles
     set full_name = nullif(trim(coalesce(p_full_name, '')), ''),
         phone     = nullif(trim(coalesce(p_phone, '')), ''),
         address   = nullif(trim(coalesce(p_address, '')), ''),
         birthdate = p_birthdate,
         photo_url = nullif(trim(coalesce(p_photo_url, '')), '')
   where id = p_candidate_id
  returning * into result;

  return result;
end;
$$;

-- -----------------------------------------------------------------------------
-- Slot booking
-- -----------------------------------------------------------------------------

-- Puts an active candidate on a free slot.
--
-- Written for both callers from the start: the school books on the candidate's
-- behalf today, and the candidate books for itself once the app ships. Only the
-- authorization branch differs — the rules about what a bookable slot is stay
-- in one place instead of being restated in a second function later.
--
-- The stage flags (`creneau_unlocked`, `conduite_unlocked`) are deliberately
-- not enforced: the school decides who is ready, the database checks ownership.
create or replace function public.book_slot(
  p_slot_id       uuid,
  p_enrollment_id uuid
)
returns public.slots
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_school uuid := public.current_school_id();
  target        public.slots;
  target_file   public.enrollments;
  result        public.slots;
begin
  select * into target from public.slots where id = p_slot_id;
  if target is null then
    raise exception 'slot not found' using errcode = 'P0002';
  end if;
  if target.status <> 'available' then
    raise exception 'slot is not available' using errcode = '22023';
  end if;

  select * into target_file from public.enrollments where id = p_enrollment_id;
  if target_file is null or target_file.status <> 'active' then
    raise exception 'enrollment is not an active file' using errcode = '22023';
  end if;

  -- The file and the slot must belong to the same school whoever is asking:
  -- a candidate cannot take a seat at a school it has no file at.
  if target_file.school_id is distinct from target.school_id then
    raise exception 'slot and enrollment belong to different schools'
      using errcode = '42501';
  end if;

  if target.school_id is distinct from caller_school
     and target_file.candidate_id is distinct from (select auth.uid()) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.slots
     set status = 'booked', enrollment_id = p_enrollment_id
   where id = p_slot_id
  returning * into result;

  return result;
exception
  -- `slots_one_booking_per_candidate_time`.
  when unique_violation then
    raise exception 'candidate is already booked at this time'
      using errcode = '23505';
end;
$$;

-- Frees a slot: undoes a booking, or reopens one that was cancelled. School
-- side only — reopening a cancelled slot is the school's call, and a candidate
-- giving up a lesson is a decision the school should record itself.
create or replace function public.release_slot(p_slot_id uuid)
returns public.slots
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_school uuid := public.current_school_id();
  result        public.slots;
begin
  if caller_school is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.slots
     set status = 'available', enrollment_id = null
   where id = p_slot_id
     and school_id = caller_school
  returning * into result;

  if result is null then
    raise exception 'slot not found' using errcode = 'P0002';
  end if;

  return result;
end;
$$;

-- -----------------------------------------------------------------------------
-- Grants — `authenticated` only; each function checks the caller itself.
-- -----------------------------------------------------------------------------
revoke execute on function public.enroll_candidate(uuid, uuid) from public;
revoke execute on function public.school_update_candidate(
  uuid, text, text, text, date, text
) from public;
revoke execute on function public.book_slot(uuid, uuid) from public;
revoke execute on function public.release_slot(uuid) from public;

grant execute on function public.enroll_candidate(uuid, uuid) to authenticated;
grant execute on function public.school_update_candidate(
  uuid, text, text, text, date, text
) to authenticated;
grant execute on function public.book_slot(uuid, uuid) to authenticated;
grant execute on function public.release_slot(uuid) to authenticated;
