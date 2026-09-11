-- =============================================================================
-- Permix — la seconde lecture de chaque carte du tableau de bord
--
-- Une carte de statistique porte deux choses : le chiffre, et ce qui a bougé.
-- Le chiffre seul ne dit pas si 87 dossiers actifs est une bonne ou une
-- mauvaise semaine — c'est « +6 ce mois » qui le dit. L'agrégat ne remontait
-- que la première moitié, et l'écran affichait donc des cartes amputées.
--
-- S'y ajoute la répartition du prochain examen : « 18 inscrits » ne dit pas
-- combien de salles il faut ouvrir, « 6 code · 7 créneau · 5 conduite » si.
-- La coupe se lit sur `exam_candidates.stage`, qui la porte depuis que la
-- session a cessé d'avoir un type.
--
-- Réécrit en entier : `create or replace function` ne sait pas retoucher une
-- clé d'un `jsonb_build_object`. Rejouable du haut, comme les précédents.
-- =============================================================================
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
  month_start date := date_trunc('month', now())::date;
  quarter_start date := date_trunc('quarter', now())::date;
begin
  if school is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'students_active', (
      select count(*) from public.enrollments
      where school_id = school and status = 'active'
    ),
    -- Les dossiers ouverts ce mois-ci : la demande est datée de `requested_at`,
    -- mais c'est l'acceptation qui ouvre le dossier, d'où `decided_at`.
    'students_active_this_month', (
      select count(*) from public.enrollments
      where school_id = school
        and status = 'active'
        and coalesce(decided_at, created_at) >= month_start
    ),
    'requests_pending', (
      select count(*) from public.enrollments
      where school_id = school and status = 'pending'
    ),
    -- Ce qui est arrivé au comptoir aujourd'hui, et qui attend encore.
    'requests_today', (
      select count(*) from public.enrollments
      where school_id = school
        and status = 'pending'
        and requested_at >= current_date
    ),
    'students_completed', (
      select count(*) from public.enrollments
      where school_id = school and status = 'completed'
    ),
    'students_completed_this_quarter', (
      select count(*) from public.enrollments
      where school_id = school
        and status = 'completed'
        and coalesce(completed_at, license_obtained_at) >= quarter_start
    ),
    'revenue_total', (
      select coalesce(sum(p.amount), 0)
      from public.payments p
      join public.enrollments e on e.id = p.enrollment_id
      where e.school_id = school
    ),
    'revenue_this_month', (
      select coalesce(sum(p.amount), 0)
      from public.payments p
      join public.enrollments e on e.id = p.enrollment_id
      where e.school_id = school and p.paid_at >= month_start
    ),

    'next_exam', (
      select jsonb_build_object(
        'date', x.exam_date,
        'candidates', (
          select count(*) from public.exam_candidates ec where ec.exam_id = x.id
        ),
        -- Combien de chaque stade y siège : c'est ce qui décide du nombre de
        -- salles et de véhicules à mobiliser ce matin-là.
        'stages', jsonb_build_object(
          'code', (
            select count(*) from public.exam_candidates ec
            where ec.exam_id = x.id and ec.stage = 'code'
          ),
          'creneau', (
            select count(*) from public.exam_candidates ec
            where ec.exam_id = x.id and ec.stage = 'creneau'
          ),
          'conduite', (
            select count(*) from public.exam_candidates ec
            where ec.exam_id = x.id and ec.stage = 'conduite'
          )
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
          'month', to_char(m, 'YYYY-MM'),
          'value', (
            select coalesce(sum(p.amount), 0)
            from public.payments p
            join public.enrollments e on e.id = p.enrollment_id
            where e.school_id = school
              and date_trunc('month', p.paid_at)::date = m
          )
        ) as point
        from generate_series(window_start, month_start, interval '1 month') as m
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

revoke execute on function public.school_dashboard_stats(integer) from public;
grant execute on function public.school_dashboard_stats(integer) to authenticated;
