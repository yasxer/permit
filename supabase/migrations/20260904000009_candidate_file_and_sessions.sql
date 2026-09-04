-- =============================================================================
-- Permix — the full candidate file, and driving sessions booked on the spot
--
-- Two changes the counter asked for:
--
--   * a candidate file that matches the paper one — name in both scripts, place
--     of birth, nationality, blood group;
--   * driving sessions created at the moment they are booked. The code side
--     keeps its weekly template (a classroom has fixed hours); a car does not,
--     so the school clicks an empty cell, picks créneau / conduite /
--     perfectionnement, and the session is created and booked in one go.
--
-- Requires `…000008_lesson_types.sql` to have been applied first, in its own
-- transaction: this file *uses* the enum values that one adds.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- The candidate file
-- -----------------------------------------------------------------------------
create type public.blood_group as enum (
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
);

alter table public.profiles
  -- `full_name` carries the Arabic name — the one on the ID card and the one
  -- always filled in. The Latin spelling is what goes on printed forms, and
  -- schools that never print do not have to type it twice.
  add column full_name_fr text,
  add column birth_place   text,
  add column nationality   text,
  add column blood_group   public.blood_group;

-- -----------------------------------------------------------------------------
-- Sessions
-- -----------------------------------------------------------------------------

-- Perfectionnement is sold by the hour on top of the package, so the session
-- carries what it cost. Snapshot, like `enrollments.total_price`: raising the
-- hourly rate must not reprice hours already driven.
alter table public.slots
  add column price numeric(12, 2) check (price >= 0);

-- A classroom and a car are two different resources: a code lesson and a
-- driving lesson at the same hour is normal, two driving lessons is not.
create or replace function public.lesson_family(p_type public.lesson_type)
returns text
language sql
immutable
as $$
  select case when p_type = 'code' then 'code' else 'driving' end
$$;

grant execute on function public.lesson_family(public.lesson_type) to authenticated;

-- The weekly template now describes the classroom only — the driving grid is
-- filled session by session, so template rows for a car mean nothing.
delete from public.planning_templates where lesson_type <> 'code';

-- Same function as before, minus the driving rows it would now generate for
-- nobody.
create or replace function public.generate_week_slots(
  p_week_start date,
  p_duration_minutes integer default 30
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_school uuid := public.current_school_id();
  inserted integer;
begin
  if caller_school is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_duration_minutes not between 15 and 240 then
    raise exception 'invalid slot duration' using errcode = '22023';
  end if;

  with generated as (
    select
      caller_school as school_id,
      day.date as slot_date,
      tpl.start_time,
      (tpl.start_time + make_interval(mins => p_duration_minutes))::time as end_time,
      tpl.lesson_type
    from public.planning_templates tpl
    join lateral (
      select (p_week_start + offset_days)::date as date
      from generate_series(0, 6) as offset_days
    ) day on extract(dow from day.date)::smallint = tpl.day_of_week
    where tpl.school_id = caller_school
      and tpl.is_available
      and tpl.lesson_type = 'code'
  )
  insert into public.slots (school_id, slot_date, start_time, end_time, lesson_type)
  select school_id, slot_date, start_time, end_time, lesson_type
  from generated
  on conflict (school_id, slot_date, start_time, lesson_type) do nothing;

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

-- Creates a driving session and books it in one call.
--
-- Nothing is declared available beforehand: the school clicks an empty half
-- hour and the session comes into being already assigned. Duration and price
-- follow from the type rather than from the caller — perfectionnement is a full
-- hour at the school's hourly rate, everything else is half an hour included in
-- the package.
create or replace function public.create_and_book_slot(
  p_slot_date     date,
  p_start_time    time,
  p_lesson_type   public.lesson_type,
  p_enrollment_id uuid
)
returns public.slots
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_school uuid := public.current_school_id();
  target_file   public.enrollments;
  minutes       integer;
  ends_at       time;
  session_price numeric(12, 2);
  result        public.slots;
begin
  if caller_school is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  -- Code lessons are classroom hours: they come from the weekly template, and
  -- letting them in here would be a second, unaccounted way to create them.
  if p_lesson_type = 'code' then
    raise exception 'code sessions come from the weekly template'
      using errcode = '22023';
  end if;

  select * into target_file from public.enrollments where id = p_enrollment_id;
  if target_file is null
     or target_file.school_id is distinct from caller_school
     or target_file.status <> 'active' then
    raise exception 'enrollment is not an active file of this school'
      using errcode = '22023';
  end if;

  minutes := case when p_lesson_type = 'perfectionnement' then 60 else 30 end;
  ends_at := (p_start_time + make_interval(mins => minutes))::time;

  if p_lesson_type = 'perfectionnement' then
    select perf_price_per_hour into session_price
    from public.schools where id = caller_school;

    if session_price is null then
      raise exception 'perfectionnement rate is not set' using errcode = '22023';
    end if;
  end if;

  -- One car, one hour: a perfectionnement hour also blocks the half hour that
  -- the unique index on (date, start_time, type) would happily let through.
  if exists (
    select 1 from public.slots s
    where s.school_id = caller_school
      and s.slot_date = p_slot_date
      and s.status <> 'cancelled'
      and public.lesson_family(s.lesson_type) = public.lesson_family(p_lesson_type)
      and s.start_time < ends_at
      and s.end_time > p_start_time
  ) then
    raise exception 'the school already has a session then' using errcode = '23P01';
  end if;

  if exists (
    select 1 from public.slots s
    where s.enrollment_id = p_enrollment_id
      and s.slot_date = p_slot_date
      and s.status = 'booked'
      and s.start_time < ends_at
      and s.end_time > p_start_time
  ) then
    raise exception 'candidate is already booked then' using errcode = '23505';
  end if;

  insert into public.slots (
    school_id, slot_date, start_time, end_time, lesson_type, status,
    enrollment_id, price
  )
  values (
    caller_school, p_slot_date, p_start_time, ends_at, p_lesson_type, 'booked',
    p_enrollment_id, session_price
  )
  returning * into result;

  return result;
end;
$$;

-- -----------------------------------------------------------------------------
-- The school keeps the candidate's file
-- -----------------------------------------------------------------------------
drop function if exists public.school_update_candidate(
  uuid, text, text, text, date, text
);

create or replace function public.school_update_candidate(
  p_candidate_id uuid,
  p_full_name    text,
  p_full_name_fr text default null,
  p_phone        text default null,
  p_address      text default null,
  p_birthdate    date default null,
  p_birth_place  text default null,
  p_nationality  text default null,
  p_blood_group  public.blood_group default null,
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
     set full_name    = nullif(trim(coalesce(p_full_name, '')), ''),
         full_name_fr = nullif(trim(coalesce(p_full_name_fr, '')), ''),
         phone        = nullif(trim(coalesce(p_phone, '')), ''),
         address      = nullif(trim(coalesce(p_address, '')), ''),
         birthdate    = p_birthdate,
         birth_place  = nullif(trim(coalesce(p_birth_place, '')), ''),
         nationality  = nullif(trim(coalesce(p_nationality, '')), ''),
         blood_group  = p_blood_group,
         photo_url    = nullif(trim(coalesce(p_photo_url, '')), '')
   where id = p_candidate_id
  returning * into result;

  return result;
end;
$$;

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------
revoke execute on function public.create_and_book_slot(
  date, time, public.lesson_type, uuid
) from public;
revoke execute on function public.school_update_candidate(
  uuid, text, text, text, text, date, text, text, public.blood_group, text
) from public;

grant execute on function public.create_and_book_slot(
  date, time, public.lesson_type, uuid
) to authenticated;
grant execute on function public.school_update_candidate(
  uuid, text, text, text, text, date, text, text, public.blood_group, text
) to authenticated;

-- -----------------------------------------------------------------------------
-- student_files — rebuilt for the wider file and for what perfectionnement adds
--
-- Dropped rather than replaced: the new columns belong next to the ones they
-- relate to, and `create or replace view` can only append.
-- -----------------------------------------------------------------------------
drop view if exists public.student_files;

create view public.student_files
with (security_invoker = on)
as
select
  e.id,
  e.school_id,
  e.candidate_id,
  e.category_id,
  e.status,
  e.total_price,
  e.code_progress,
  e.creneau_unlocked,
  e.conduite_unlocked,
  e.requested_at,
  e.decided_at,
  e.completed_at,
  e.license_obtained_at,
  e.created_at,
  e.updated_at,

  p.full_name    as candidate_name,
  p.full_name_fr as candidate_name_fr,
  p.phone        as candidate_phone,
  p.address      as candidate_address,
  p.birthdate    as candidate_birthdate,
  p.birth_place  as candidate_birth_place,
  p.nationality  as candidate_nationality,
  p.blood_group  as candidate_blood_group,
  p.photo_url    as candidate_photo_url,
  p.email        as candidate_email,
  p.has_license  as candidate_has_license,

  c.code     as category_code,
  c.label_ar as category_label_ar,
  c.label_fr as category_label_fr,
  c.label_en as category_label_en,

  coalesce(paid.total, 0)::numeric(12, 2) as amount_paid,
  coalesce(perf.total, 0)::numeric(12, 2) as perf_total,
  coalesce(perf.count, 0)::integer        as perf_session_count,
  -- What the candidate owes: the package, plus every perfectionnement hour
  -- actually booked. Cancelled and freed sessions drop out on their own — a
  -- freed slot no longer names an enrollment.
  (e.total_price + coalesce(perf.total, 0))::numeric(12, 2) as amount_due,
  greatest(
    e.total_price + coalesce(perf.total, 0) - coalesce(paid.total, 0), 0
  )::numeric(12, 2) as amount_remaining,
  coalesce(paid.count, 0)::integer as payment_count
from public.enrollments e
join public.profiles p on p.id = e.candidate_id
join public.categories c on c.id = e.category_id
left join lateral (
  select sum(amount) as total, count(*) as count
  from public.payments
  where enrollment_id = e.id
) paid on true
left join lateral (
  select sum(price) as total, count(*) as count
  from public.slots
  where enrollment_id = e.id
    and status = 'booked'
    and price is not null
) perf on true;

grant select on public.student_files to authenticated;
