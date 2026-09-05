-- =============================================================================
-- Permix — `sync_exam_status` could not write the status it computed
--
-- The function from `…000012` sets the session's status from a `case` whose
-- two branches are bare string literals:
--
--     set status = case when … then 'completed' else 'scheduled' end
--
-- Postgres resolves a `case` before it looks at the assignment target. With
-- nothing but unknown-type literals to go on it settles on `text`, and there
-- is no implicit cast from `text` to an enum — so every write raised
--
--     42804: column "status" is of type exam_status but expression is of
--            type text
--
-- A single literal assigned straight to the column is fine, which is why
-- `apply_exam_result` never showed the problem: an unknown literal takes the
-- column's type. Only the `case` forced the premature resolution.
--
-- The trigger fires after insert, update *and* delete on `exam_candidates`,
-- so the whole roster was frozen: no candidate could be added to a session, no
-- result recorded, and no session or candidate file deleted — deleting either
-- one cascades onto the roster lines and trips the same trigger.
--
-- The fix is the cast the `case` was missing.
-- =============================================================================

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
     set status = (
           case
             when total > 0 and pending = 0 then 'completed'
             else 'scheduled'
           end
         )::public.exam_status
   where id = target
     and status <> 'cancelled';

  return null;
end;
$$;
