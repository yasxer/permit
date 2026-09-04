-- =============================================================================
-- Permix — the whole planning is drawn by hand
--
-- The weekly template is gone. It described availability that nobody consumed:
-- the school does not publish free hours for candidates to pick from, it writes
-- the week itself. So both grids now work the same way — click an empty half
-- hour, name the candidate, the session exists. Code included.
--
-- That leaves exactly two kinds of row in `slots`:
--
--   booked    — a session, with the candidate it belongs to
--   cancelled — a half hour the school closed: no lesson goes in it
--
-- `available` is no longer produced by anything. It stays in the enum: an old
-- row may still carry it, and it reads as "free", which is what an untouched
-- cell means anyway.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Gone with the template
-- -----------------------------------------------------------------------------

-- `book_slot` and `release_slot` moved a candidate on and off a slot that
-- already existed. Nothing creates a free slot any more, so they have nothing
-- left to act on — a session is created booked, and freeing it means deleting
-- it. Keeping them would leave two `security definer` entry points guarding a
-- state the app never reaches.
drop function if exists public.book_slot(uuid, uuid);
drop function if exists public.release_slot(uuid);
drop function if exists public.generate_week_slots(date, integer);

drop table if exists public.planning_templates;

-- -----------------------------------------------------------------------------
-- Sessions and closed hours
-- -----------------------------------------------------------------------------

-- Is that stretch of the day already taken on that resource? One question,
-- asked the same way whether a session or a closed half hour is going in — and
-- the only place the overlap rule is written down.
--
-- A leftover `available` row is not in the way: it was the old template's word
-- for "free", which is what an empty cell means now.
create or replace function public.resource_busy(
  p_school_id   uuid,
  p_slot_date   date,
  p_start_time  time,
  p_end_time    time,
  p_lesson_type public.lesson_type
)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.slots s
    where s.school_id = p_school_id
      and s.slot_date = p_slot_date
      and s.status <> 'available'
      and public.lesson_family(s.lesson_type) = public.lesson_family(p_lesson_type)
      and s.start_time < p_end_time
      and s.end_time > p_start_time
  )
$$;

revoke execute on function public.resource_busy(
  uuid, date, time, time, public.lesson_type
) from public;

-- Creates a session and books it in one call, code lessons included.
--
-- Duration and price follow from the type rather than from the caller:
-- perfectionnement is a full hour at the school's rate, everything else is the
-- half hour the package already pays for.
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

  -- Anything already on that resource stands in the way, a closed half hour
  -- included — that is what closing one is for. The unique index on
  -- (date, start_time, type) would not have caught either the hour of
  -- perfectionnement overlapping the next half hour, or a créneau landing on a
  -- conduite.
  if public.resource_busy(
    caller_school, p_slot_date, p_start_time, ends_at, p_lesson_type
  ) then
    raise exception 'the school already has something then' using errcode = '23P01';
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

-- Closes one half hour: a repair, a break, a day off. The row carries the type
-- of the grid it was closed from, which is what decides the resource it blocks
-- — closing the car does not close the classroom.
create or replace function public.block_slot(
  p_slot_date   date,
  p_start_time  time,
  p_lesson_type public.lesson_type
)
returns public.slots
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_school uuid := public.current_school_id();
  ends_at       time;
  result        public.slots;
begin
  if caller_school is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  ends_at := (p_start_time + make_interval(mins => 30))::time;

  if public.resource_busy(
    caller_school, p_slot_date, p_start_time, ends_at, p_lesson_type
  ) then
    raise exception 'the school already has something then' using errcode = '23P01';
  end if;

  insert into public.slots (
    school_id, slot_date, start_time, end_time, lesson_type, status
  )
  values (
    caller_school, p_slot_date, p_start_time, ends_at, p_lesson_type, 'cancelled'
  )
  returning * into result;

  return result;
end;
$$;

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------
revoke execute on function public.block_slot(date, time, public.lesson_type)
  from public;
grant execute on function public.block_slot(date, time, public.lesson_type)
  to authenticated;
