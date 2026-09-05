-- =============================================================================
-- Permix — undoing what the counter got wrong
--
-- Everything a school types in was, until now, permanent: a file opened in the
-- wrong category and a session put on the wrong date both stayed on screen for
-- good. Both become removable here, by the school that owns them.
--
-- Both go through a function rather than a bare `delete` under RLS, for one
-- reason: a policy that refuses a delete does not *fail*, it matches nothing.
-- The caller gets back "0 rows" and cannot tell "you may not" apart from "it
-- was already gone" — and a destructive action that quietly does nothing is
-- worse than one that refuses out loud. These raise, with a code the UI reads.
--
-- Re-runnable from the top, like every migration in this folder.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A session the school should never have opened
--
-- The roster lines go with it (`on delete cascade`). What it does not undo is
-- a result already entered: `apply_exam_result` moved that candidate on when
-- it was recorded, and taking the session away does not take the stage back.
-- -----------------------------------------------------------------------------
create or replace function public.school_delete_exam(p_exam_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  school uuid := public.current_school_id();
  owner  uuid;
begin
  select x.school_id into owner from public.exams x where x.id = p_exam_id;

  if owner is null then
    raise exception 'exam not found' using errcode = 'P0002';
  end if;
  if not (public.is_super_admin() or owner = school) then
    raise exception 'not your exam' using errcode = '42501';
  end if;

  delete from public.exams where id = p_exam_id;
end;
$$;

revoke execute on function public.school_delete_exam(uuid) from public;
grant execute on function public.school_delete_exam(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- A file that should never have been opened
--
-- Takes its payments and its exam roster lines with it (both `on delete
-- cascade`) and releases the slots booked for it (`slots.enrollment_id` is
-- `on delete set null`). The candidate's account is left alone: someone
-- enrolled at two schools keeps the other file, and only the service role can
-- reach `auth.users` — clearing an account with nothing left behind it is the
-- API route's job.
--
-- Returns the candidate so the route knows whose account to look at.
-- -----------------------------------------------------------------------------
create or replace function public.school_delete_enrollment(p_enrollment_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  school    uuid := public.current_school_id();
  owner     uuid;
  candidate uuid;
begin
  select e.school_id, e.candidate_id
    into owner, candidate
  from public.enrollments e
  where e.id = p_enrollment_id;

  if owner is null then
    raise exception 'enrollment not found' using errcode = 'P0002';
  end if;
  if not (public.is_super_admin() or owner = school) then
    raise exception 'not your candidate' using errcode = '42501';
  end if;

  delete from public.enrollments where id = p_enrollment_id;
  return candidate;
end;
$$;

revoke execute on function public.school_delete_enrollment(uuid) from public;
grant execute on function public.school_delete_enrollment(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- The policy behind the function
--
-- `school_delete_exam` needs none — "exams write by owner" is `for all`. This
-- one `enrollments` had no delete policy at all, and the function is
-- `security definer`, so strictly it would work without this too. It is here
-- so that the table's own rules still say who may remove a file, rather than
-- leaving that written only inside a function body.
-- -----------------------------------------------------------------------------
drop policy if exists "enrollments delete as school" on public.enrollments;

create policy "enrollments delete as school"
  on public.enrollments for delete
  to authenticated
  using (school_id = public.current_school_id());
