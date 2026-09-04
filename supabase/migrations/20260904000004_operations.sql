-- =============================================================================
-- Permix — business transitions
--
-- Each of these does several dependent writes, or derives a value the client
-- must not be trusted with (the price snapshot, the approver's id). Doing them
-- in the database keeps them atomic and keeps the rule in one place.
-- Every function re-checks the caller: SECURITY DEFINER bypasses RLS.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- School moderation
-- -----------------------------------------------------------------------------
create or replace function public.approve_school(p_school_id uuid)
returns public.schools
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.schools;
begin
  if not public.is_super_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.schools
     set status           = 'approved',
         approved_at      = now(),
         approved_by      = (select auth.uid()),
         rejected_at      = null,
         rejection_reason = null
   where id = p_school_id
  returning * into result;

  if result is null then
    raise exception 'school not found' using errcode = 'P0002';
  end if;

  return result;
end;
$$;

create or replace function public.reject_school(
  p_school_id uuid,
  p_reason text default null
)
returns public.schools
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.schools;
begin
  if not public.is_super_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.schools
     set status           = 'rejected',
         rejected_at      = now(),
         rejection_reason = nullif(trim(coalesce(p_reason, '')), ''),
         approved_at      = null,
         approved_by      = null
   where id = p_school_id
  returning * into result;

  if result is null then
    raise exception 'school not found' using errcode = 'P0002';
  end if;

  return result;
end;
$$;

-- -----------------------------------------------------------------------------
-- Enrollment decisions
-- -----------------------------------------------------------------------------

-- Accepting snapshots the current catalogue price onto the file. A later price
-- change must not silently rewrite what an existing candidate owes.
create or replace function public.accept_enrollment(p_enrollment_id uuid)
returns public.enrollments
language plpgsql
security definer
set search_path = public
as $$
declare
  target   public.enrollments;
  caller_school uuid := public.current_school_id();
  snapshot numeric(12, 2);
begin
  select * into target from public.enrollments where id = p_enrollment_id;
  if target is null then
    raise exception 'enrollment not found' using errcode = 'P0002';
  end if;
  if target.school_id is distinct from caller_school and not public.is_super_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if target.status <> 'pending' then
    raise exception 'enrollment is not pending' using errcode = '22023';
  end if;

  select price into snapshot
  from public.school_categories
  where school_id = target.school_id
    and category_id = target.category_id;

  update public.enrollments
     set status      = 'active',
         total_price = coalesce(snapshot, 0),
         decided_at  = now()
   where id = p_enrollment_id
  returning * into target;

  return target;
end;
$$;

create or replace function public.reject_enrollment(p_enrollment_id uuid)
returns public.enrollments
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.enrollments;
  caller_school uuid := public.current_school_id();
begin
  select * into target from public.enrollments where id = p_enrollment_id;
  if target is null then
    raise exception 'enrollment not found' using errcode = 'P0002';
  end if;
  if target.school_id is distinct from caller_school and not public.is_super_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.enrollments
     set status = 'rejected', decided_at = now()
   where id = p_enrollment_id
  returning * into target;

  return target;
end;
$$;

-- -----------------------------------------------------------------------------
-- Slot generation
-- -----------------------------------------------------------------------------

-- Materialises one week of slots from the school's weekly template. Re-running
-- it is safe: existing rows are left alone, so already-booked slots survive.
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
      -- Template rows carry a Postgres `dow`; walk the seven days from the
      -- requested start and keep the ones whose dow matches.
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
  )
  insert into public.slots (school_id, slot_date, start_time, end_time, lesson_type)
  select school_id, slot_date, start_time, end_time, lesson_type
  from generated
  on conflict (school_id, slot_date, start_time, lesson_type) do nothing;

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

-- -----------------------------------------------------------------------------
-- Grants — `authenticated` only; each function checks the caller itself.
-- -----------------------------------------------------------------------------
revoke execute on function public.approve_school(uuid) from public;
revoke execute on function public.reject_school(uuid, text) from public;
revoke execute on function public.accept_enrollment(uuid) from public;
revoke execute on function public.reject_enrollment(uuid) from public;
revoke execute on function public.generate_week_slots(date, integer) from public;

grant execute on function public.approve_school(uuid) to authenticated;
grant execute on function public.reject_school(uuid, text) to authenticated;
grant execute on function public.accept_enrollment(uuid) to authenticated;
grant execute on function public.reject_enrollment(uuid) to authenticated;
grant execute on function public.generate_week_slots(date, integer) to authenticated;

-- -----------------------------------------------------------------------------
-- Question bank
-- -----------------------------------------------------------------------------

-- A question and its answers are one editorial unit. Writing them separately
-- from the client would leave orphaned options behind whenever the second
-- request failed, so the whole edit happens in one statement block.
create or replace function public.upsert_question(
  p_type      public.question_type,
  p_lang      public.content_lang,
  p_body      text,
  p_options   jsonb,
  p_id        uuid default null,
  p_image_url text default null
)
returns public.questions
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.questions;
begin
  if not public.is_super_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if jsonb_array_length(coalesce(p_options, '[]'::jsonb)) < 2 then
    raise exception 'a question needs at least two options' using errcode = '22023';
  end if;

  if not exists (
    select 1 from jsonb_array_elements(p_options) as opt
    where (opt ->> 'is_correct')::boolean
  ) then
    raise exception 'one option must be marked correct' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.questions (type, lang, body, image_url, source, created_by)
    values (p_type, p_lang, p_body, p_image_url, 'manual', (select auth.uid()))
    returning * into result;
  else
    update public.questions
       set type = p_type,
           lang = p_lang,
           body = p_body,
           image_url = p_image_url
     where id = p_id
    returning * into result;

    if result is null then
      raise exception 'question not found' using errcode = 'P0002';
    end if;

    delete from public.question_options where question_id = result.id;
  end if;

  insert into public.question_options (question_id, label, image_url, is_correct, sort_order)
  select
    result.id,
    opt ->> 'label',
    nullif(opt ->> 'image_url', ''),
    coalesce((opt ->> 'is_correct')::boolean, false),
    (ordinality - 1)::smallint
  from jsonb_array_elements(p_options) with ordinality as t(opt, ordinality);

  return result;
end;
$$;

revoke execute on function public.upsert_question(
  public.question_type, public.content_lang, text, jsonb, uuid, text
) from public;
grant execute on function public.upsert_question(
  public.question_type, public.content_lang, text, jsonb, uuid, text
) to authenticated;
