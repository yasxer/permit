-- =============================================================================
-- Permix — three exams, and the stage each one settles
--
-- A candidate sits three exams, not two: the code, the créneau, the conduite.
-- They are the same object — a date, a roster, one result per candidate — so
-- `exams` already holds all three; the type only says which step is being
-- settled. All this file adds is that `perfectionnement` is not one of them.
--
-- The second half is who moves the candidate along. Until now the school flipped
-- `creneau_unlocked` / `conduite_unlocked` by hand, next to an exam result that
-- said the same thing. Now the result *is* the move: a passed code opens the
-- créneau, a passed créneau opens the conduite, a passed conduite closes the
-- file. The two flags become derived columns, guarded like `has_license`.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- An exam is one of the three stages
-- -----------------------------------------------------------------------------
-- `exam_type` is a `lesson_type`, which also carries `perfectionnement`: paid
-- hours on top of the package, and nothing anyone is examined on.
alter table public.exams drop constraint if exists exams_type_is_a_stage;
alter table public.exams
  add constraint exams_type_is_a_stage
  check (exam_type <> 'perfectionnement');

-- -----------------------------------------------------------------------------
-- The result moves the candidate
-- -----------------------------------------------------------------------------
create or replace function public.apply_exam_result()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  stage     public.lesson_type;
  candidate uuid;
begin
  if new.result is distinct from 'passed' then
    return new;
  end if;

  select e.exam_type into stage from public.exams e where e.id = new.exam_id;

  -- The stage columns are guarded against hand edits, and this is the one
  -- writer allowed through.
  perform set_config('permix.system_update', 'on', true);

  if stage = 'code' then
    update public.enrollments
       set creneau_unlocked = true,
           -- The exam is the last word on the theory: the percentage the school
           -- was keeping by hand has nothing left to add.
           code_progress = 100
     where id = new.enrollment_id;

  elsif stage = 'creneau' then
    -- Both flags: a créneau result can only exist on a file the code already
    -- opened, but stating it keeps the pair consistent whatever happened before.
    update public.enrollments
       set creneau_unlocked = true,
           conduite_unlocked = true
     where id = new.enrollment_id;

  elsif stage = 'conduite' then
    -- Passing the conduite closes the file and flags the licence. Keeping this
    -- here means the admin "total drivers" stat can never disagree with the
    -- results the school entered.
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

-- Replaces the conduite-only version: the same trigger now answers for all
-- three stages.
drop trigger if exists exam_candidates_apply_conduite_result on public.exam_candidates;
drop function if exists public.apply_conduite_result();

drop trigger if exists exam_candidates_apply_result on public.exam_candidates;

create trigger exam_candidates_apply_result
  after insert or update of result on public.exam_candidates
  for each row execute function public.apply_exam_result();

-- -----------------------------------------------------------------------------
-- The stages are no longer the school's to set
--
-- Same shape as the `has_license` guard on profiles: a derived column, one
-- writer, and the transaction-local escape hatch that writer raises.
--
-- Nothing takes a stage back. A result corrected from `passed` to `failed`
-- leaves the candidate where they stand: sessions already booked on the new
-- stage, and any later exam already sat, would otherwise be left behind a
-- closed door. Re-locking a file is an admin's job.
-- -----------------------------------------------------------------------------
create or replace function public.guard_enrollment_update()
returns trigger
language plpgsql
as $$
declare
  system_update boolean :=
    coalesce(current_setting('permix.system_update', true), 'off') = 'on';
begin
  if public.is_super_admin() then
    return new;
  end if;
  if new.school_id is distinct from old.school_id
     or new.candidate_id is distinct from old.candidate_id then
    raise exception 'enrollment cannot be reassigned' using errcode = '42501';
  end if;
  if not system_update
     and (new.creneau_unlocked is distinct from old.creneau_unlocked
          or new.conduite_unlocked is distinct from old.conduite_unlocked) then
    raise exception 'stages are derived from exam results' using errcode = '42501';
  end if;
  return new;
end;
$$;
