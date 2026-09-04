-- =============================================================================
-- Permix — the driving side gets its own lesson types
--
-- `lesson_type` held only the two exam subjects (code, conduite). The planning
-- needs the three things a school actually books a car for: the créneau
-- (manoeuvres), the conduite itself, and paid perfectionnement hours.
--
-- Alone in its own migration on purpose: Postgres refuses to *use* an enum
-- value added in the same transaction, and every following migration wants to.
-- =============================================================================

alter type public.lesson_type add value if not exists 'creneau' after 'code';
alter type public.lesson_type add value if not exists 'perfectionnement';
