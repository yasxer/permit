-- =============================================================================
-- Permix — one exam session, three stages inside it
--
-- A school does not hold a "code exam" and a "conduite exam" on separate days:
-- it holds *the* exam, one morning, and the candidates it sends sit whichever
-- stage they have reached. The type therefore moves off the session and onto
-- the roster line — `exam_candidates.stage` — which is also where it belonged
-- all along: a result is a result *of a stage*, for one candidate.
--
-- What that buys the counter: one session per date, filled category by
-- category, code then créneau then conduite, and afterwards a single table of
-- everyone who sat it with their result to enter.
--
-- Every statement here is written to be re-runnable. The Supabase SQL editor
-- runs a script statement by statement and stops on the first error, so a file
-- that cannot be replayed from the top leaves you finishing it by hand.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- The stage moves onto the roster line
-- -----------------------------------------------------------------------------
alter table public.exam_candidates add column if not exists stage public.lesson_type;

-- Existing lines take the stage from the session they were on — while there is
-- still a session type to take it from.
do $migrate$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'exams'
      and column_name = 'exam_type'
  ) then
    update public.exam_candidates ec
       set stage = x.exam_type
      from public.exams x
     where x.id = ec.exam_id
       and ec.stage is null;
  end if;

  -- Only reachable on a replay after the column below was already dropped: the
  -- line has no session type left to inherit, and code is where a file starts.
  update public.exam_candidates set stage = 'code' where stage is null;
end
$migrate$;

alter table public.exam_candidates alter column stage set not null;

alter table public.exam_candidates
  drop constraint if exists exam_candidates_stage_is_a_stage;
alter table public.exam_candidates
  add constraint exam_candidates_stage_is_a_stage
    check (stage <> 'perfectionnement');

create index if not exists exam_candidates_stage_idx
  on public.exam_candidates (exam_id, stage);

-- -----------------------------------------------------------------------------
-- The session is a date
--
-- Two typed sessions could share one date. They are one session now, so the
-- roster lines move onto the older row and the emptied duplicate goes. A
-- candidate who somehow sat both types that day keeps the one line the primary
-- key allows — the other is dropped before the move, or the update would
-- collide with it.
-- -----------------------------------------------------------------------------
-- The keeper of a date is the oldest session on it; the window has to live in
-- a CTE, since a window function cannot be written in a `where`. Each statement
-- carries its own — a temporary table would not survive between them here.
with ranked as (
  select
    id,
    first_value(id) over (
      partition by school_id, exam_date order by created_at, id
    ) as keeper
  from public.exams
)
delete from public.exam_candidates ec
 using ranked r, public.exam_candidates kept
 where ec.exam_id = r.id
   and r.keeper <> r.id
   and kept.exam_id = r.keeper
   and kept.enrollment_id = ec.enrollment_id;

with ranked as (
  select
    id,
    first_value(id) over (
      partition by school_id, exam_date order by created_at, id
    ) as keeper
  from public.exams
)
update public.exam_candidates ec
   set exam_id = r.keeper
  from ranked r
 where ec.exam_id = r.id
   and r.keeper <> r.id;

with ranked as (
  select
    id,
    first_value(id) over (
      partition by school_id, exam_date order by created_at, id
    ) as keeper
  from public.exams
)
delete from public.exams x
 using ranked r
 where x.id = r.id
   and r.keeper <> r.id;

-- The view reads `exams.exam_type`, so it goes first and comes back below.
drop view if exists public.exam_roster;

-- Takes the unique index on (school_id, exam_date, exam_type) and the
-- `exams_type_is_a_stage` check with it.
alter table public.exams drop column if exists exam_type;

alter table public.exams drop constraint if exists exams_one_session_per_day;
alter table public.exams
  add constraint exams_one_session_per_day unique (school_id, exam_date);

-- -----------------------------------------------------------------------------
-- exam_roster — same view, the stage now coming from the roster line
-- -----------------------------------------------------------------------------
create view public.exam_roster
with (security_invoker = on)
as
select
  ec.exam_id,
  ec.enrollment_id,
  ec.stage,
  ec.result,
  ec.notified_at,
  ec.created_at,
  x.school_id,
  x.exam_date,
  p.full_name as candidate_name,
  p.phone     as candidate_phone,
  c.id        as category_id,
  c.code      as category_code,
  e.code_progress,
  e.creneau_unlocked,
  e.conduite_unlocked
from public.exam_candidates ec
join public.exams x on x.id = ec.exam_id
join public.enrollments e on e.id = ec.enrollment_id
join public.profiles p on p.id = e.candidate_id
join public.categories c on c.id = e.category_id;

grant select on public.exam_roster to authenticated;

-- -----------------------------------------------------------------------------
-- The result still moves the candidate — it just reads the stage next to it
-- -----------------------------------------------------------------------------
create or replace function public.apply_exam_result()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate uuid;
begin
  if new.result is distinct from 'passed' then
    return new;
  end if;

  -- The stage columns are guarded against hand edits, and this is the one
  -- writer allowed through.
  perform set_config('permix.system_update', 'on', true);

  if new.stage = 'code' then
    update public.enrollments
       set creneau_unlocked = true,
           -- The exam is the last word on the theory.
           code_progress = 100
     where id = new.enrollment_id;

  elsif new.stage = 'creneau' then
    update public.enrollments
       set creneau_unlocked = true,
           conduite_unlocked = true
     where id = new.enrollment_id;

  elsif new.stage = 'conduite' then
    update public.enrollments
       set status = 'completed',
           completed_at = coalesce(completed_at, now()),
           license_obtained_at = coalesce(license_obtained_at, now())
     where id = new.enrollment_id
    returning candidate_id into candidate;

    if candidate is not null then
      update public.profiles set has_license = true where id = candidate;
    end if;
  end if;

  perform set_config('permix.system_update', 'off', true);

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- The session closes itself
--
-- Results are entered one button at a time now — there is no "save" that could
-- also mark the session done. So the session follows its roster: still waiting
-- on a result, still `scheduled`; every result in, `completed`. A cancelled
-- session stays cancelled, and an empty one stays scheduled.
-- -----------------------------------------------------------------------------
create or replace function public.sync_exam_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target  uuid := coalesce(new.exam_id, old.exam_id);
  total   integer;
  pending integer;
begin
  select count(*), count(*) filter (where result is null)
    into total, pending
  from public.exam_candidates
  where exam_id = target;

  update public.exams
     set status = case
                    when total > 0 and pending = 0 then 'completed'
                    else 'scheduled'
                  end
   where id = target
     and status <> 'cancelled';

  return null;
end;
$$;

drop trigger if exists exam_candidates_sync_exam_status on public.exam_candidates;

create trigger exam_candidates_sync_exam_status
  after insert or update or delete on public.exam_candidates
  for each row execute function public.sync_exam_status();

-- -----------------------------------------------------------------------------
-- Dashboard — the next session no longer has a type to name
--
-- Rewritten whole: `create or replace function` cannot patch one key out of a
-- `jsonb_build_object`. Only the `next_exam` branch differs from `…000005`.
-- -----------------------------------------------------------------------------
create or replace function public.school_dashboard_stats(p_months integer default 12)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
  school uuid := public.current_school_id();
  window_start date := date_trunc('month', now())::date
                       - make_interval(months => greatest(p_months, 1) - 1);
begin
  if school is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'students_active', (
      select count(*) from public.enrollments
      where school_id = school and status = 'active'
    ),
    'requests_pending', (
      select count(*) from public.enrollments
      where school_id = school and status = 'pending'
    ),
    'students_completed', (
      select count(*) from public.enrollments
      where school_id = school and status = 'completed'
    ),
    'revenue_total', (
      select coalesce(sum(p.amount), 0)
      from public.payments p
      join public.enrollments e on e.id = p.enrollment_id
      where e.school_id = school
    ),
    'next_exam', (
      select jsonb_build_object(
        'date', x.exam_date,
        'candidates', (
          select count(*) from public.exam_candidates ec where ec.exam_id = x.id
        )
      )
      from public.exams x
      where x.school_id = school
        and x.status = 'scheduled'
        and x.exam_date >= current_date
      order by x.exam_date
      limit 1
    ),

    'payments_by_month', (
      select coalesce(jsonb_agg(point order by point ->> 'month'), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'month', to_char(month_start, 'YYYY-MM'),
          'value', (
            select coalesce(sum(p.amount), 0)
            from public.payments p
            join public.enrollments e on e.id = p.enrollment_id
            where e.school_id = school
              and date_trunc('month', p.paid_at)::date = month_start
          )
        ) as point
        from generate_series(window_start, date_trunc('month', now())::date, interval '1 month')
          as month_start
      ) months
    ),

    -- Active students bucketed by how far they have got. The buckets are
    -- ordered, so the chart draws them with a one-hue ramp.
    'stage_breakdown', jsonb_build_object(
      'code', (
        select count(*) from public.enrollments
        where school_id = school and status = 'active' and not creneau_unlocked
      ),
      'creneau', (
        select count(*) from public.enrollments
        where school_id = school and status = 'active'
          and creneau_unlocked and not conduite_unlocked
      ),
      'conduite', (
        select count(*) from public.enrollments
        where school_id = school and status = 'active' and conduite_unlocked
      )
    )
  ) into result;

  return result;
end;
$$;
