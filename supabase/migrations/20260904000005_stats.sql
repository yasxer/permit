-- =============================================================================
-- Permix — dashboard aggregates
--
-- Sums and group-bys belong in the database. Pulling every payment row into
-- the browser to add them up would grow without bound and leak rows the
-- reader has no reason to see.
-- Each function returns one jsonb document so a dashboard is one round trip.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Super admin dashboard
-- -----------------------------------------------------------------------------
create or replace function public.admin_dashboard_stats(p_months integer default 12)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
  window_start date := date_trunc('month', now())::date
                       - make_interval(months => greatest(p_months, 1) - 1);
begin
  if not public.is_super_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'schools_total',    (select count(*) from public.schools),
    'schools_approved', (select count(*) from public.schools where status = 'approved'),
    'schools_pending',  (select count(*) from public.schools where status = 'pending'),
    'schools_rejected', (select count(*) from public.schools where status = 'rejected'),
    'candidates_total', (select count(*) from public.profiles where role = 'candidat'),
    'drivers_total',    (select count(*) from public.profiles where has_license),
    'revenue_total',    (select coalesce(sum(amount), 0) from public.payments),

    -- One point per month across the whole window, including empty months:
    -- a line chart with holes in it reads as missing data, not as zero.
    'enrollments_by_month', (
      select coalesce(jsonb_agg(point order by point ->> 'month'), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'month', to_char(month_start, 'YYYY-MM'),
          'value', (
            select count(*)
            from public.enrollments e
            where date_trunc('month', e.requested_at)::date = month_start
          )
        ) as point
        from generate_series(window_start, date_trunc('month', now())::date, interval '1 month')
          as month_start
      ) months
    ),

    'schools_by_wilaya', (
      select coalesce(jsonb_agg(row order by (row ->> 'value')::int desc), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'code',    w.code,
          'name_ar', w.name_ar,
          'name_fr', w.name_fr,
          'name_en', w.name_en,
          'value',   count(s.id)
        ) as row
        from public.wilayas w
        join public.schools s on s.wilaya_code = w.code
        group by w.code, w.name_ar, w.name_fr, w.name_en
      ) by_wilaya
    )
  ) into result;

  return result;
end;
$$;

-- -----------------------------------------------------------------------------
-- Driving school dashboard
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
      select jsonb_build_object('date', x.exam_date, 'type', x.exam_type)
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

revoke execute on function public.admin_dashboard_stats(integer) from public;
revoke execute on function public.school_dashboard_stats(integer) from public;
grant execute on function public.admin_dashboard_stats(integer) to authenticated;
grant execute on function public.school_dashboard_stats(integer) to authenticated;
