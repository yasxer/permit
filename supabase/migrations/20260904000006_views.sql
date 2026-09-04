-- =============================================================================
-- Permix — reporting views
--
-- `security_invoker = on` is not optional: without it a view runs with the
-- privileges of its owner and quietly bypasses every RLS policy underneath.
-- With it on, the same policies that guard the base tables guard the view.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- student_files — an enrollment with its candidate, category and balance.
--
-- The "paid" and "remaining" columns need a sum per file. Doing that in the
-- browser would mean shipping every payment row to it; PostgREST's inline
-- aggregates depend on a server flag that may be off. A view is neither.
-- -----------------------------------------------------------------------------
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

  p.full_name   as candidate_name,
  p.phone       as candidate_phone,
  p.address     as candidate_address,
  p.birthdate   as candidate_birthdate,
  p.photo_url   as candidate_photo_url,
  p.email       as candidate_email,
  p.has_license as candidate_has_license,

  c.code     as category_code,
  c.label_ar as category_label_ar,
  c.label_fr as category_label_fr,
  c.label_en as category_label_en,

  coalesce(paid.total, 0)::numeric(12, 2) as amount_paid,
  -- Never report a negative balance: an overpayment reads as zero owed.
  greatest(e.total_price - coalesce(paid.total, 0), 0)::numeric(12, 2)
    as amount_remaining,
  coalesce(paid.count, 0)::integer as payment_count
from public.enrollments e
join public.profiles p on p.id = e.candidate_id
join public.categories c on c.id = e.category_id
left join lateral (
  select sum(amount) as total, count(*) as count
  from public.payments
  where enrollment_id = e.id
) paid on true;

grant select on public.student_files to authenticated;

-- -----------------------------------------------------------------------------
-- exam_roster — an exam assignment with the candidate it belongs to.
-- Saves the exam detail page a second round trip per candidate.
-- -----------------------------------------------------------------------------
create view public.exam_roster
with (security_invoker = on)
as
select
  ec.exam_id,
  ec.enrollment_id,
  ec.result,
  ec.notified_at,
  ec.created_at,
  x.school_id,
  x.exam_date,
  x.exam_type,
  p.full_name as candidate_name,
  p.phone     as candidate_phone,
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
