# Permix — feuille de route

Plateforme de gestion d'auto-écoles (Algérie).
**Stack réel** : Next.js 16.3.4 (App Router, Turbopack) · React 19.2 · TypeScript ·
Tailwind v4 · shadcn/ui (`radix-nova`, RTL) · Supabase (Auth + Postgres + RLS) ·
next-intl (AR/FR/EN) · React Query · Zustand · RHF + Zod · Cloudinary · sonner

> ⚠️ La spec d'origine visait Next 14 + Laravel + next-i18next. Écarts assumés,
> voir « Décisions » en bas.

---

## Avancement

| Phase | Sujet | État |
|-------|-------|------|
| 0 | Fondations (deps, shadcn, thème, fonts, i18n) | ✅ terminé |
| 1 | Supabase (schéma, RLS, clients, proxy, auth helpers) | ✅ terminé |
| 2 | Authentification (login / register / forgot / pending) | ✅ terminé |
| 3 | Composants partagés (nav, table, modals, upload…) | ✅ terminé |
| 4 | Panel Super Admin | ✅ terminé |
| 5 | Panel Auto-école (profil, dashboard, candidats) | ✅ terminé |
| 6 | Planning + Examens | ✅ terminé |
| 7 | Finition (skeletons, a11y, README, QA) | ✅ terminé |

---

## ✅ Phase 0 — Fondations

- [x] Dépendances installées (Supabase, next-intl, React Query, Zustand, RHF, Zod, recharts, sonner, lucide)
- [x] shadcn/ui initialisé — preset `radix-nova`, `rtl: true`, 36 composants dans `components/ui/`
- [x] `app/globals.css` — base slate, accent indigo, tokens `success`/`warning`, palette charts, `.rtl-flip`
- [x] Fonts : Inter (latin), Noto Sans Arabic (`html[lang="ar"]`), JetBrains Mono
- [x] next-intl : `i18n/config.ts`, `i18n/request.ts`, `i18n/locale.ts` (locale en cookie)
- [x] `messages/{fr,ar,en}.json` — 324 clés, catalogues synchronisés
- [x] `components/providers.tsx` — Theme + React Query + Toaster + Tooltip
- [x] `app/layout.tsx` — `lang` + `dir` dynamiques
- [x] `next.config.ts` — plugin next-intl, `remotePatterns` Cloudinary

## ✅ Phase 1 — Supabase

- [x] `supabase/migrations/…_schema.sql` — 13 tables, 10 enums, triggers dérivés
- [x] `supabase/migrations/…_rls.sql` — helpers `SECURITY DEFINER` + policies par rôle
- [x] `supabase/migrations/…_seed_reference.sql` — 58 wilayas, 7 catégories
- [x] `types/database.ts` — miroir TS du schéma
- [x] `lib/supabase/{client,server,admin,proxy}.ts`
- [x] `proxy.ts` (ex-middleware) — refresh session + garde anonyme
- [x] `lib/auth.ts` — `requireRole`, `requireApprovedSchool`, `getOwnedSchool`
- [x] `.env.example` + `lib/env.ts`

### ⚠️ Bloquant côté utilisateur

- [ ] Créer le projet Supabase et remplir `.env.local`
- [ ] Appliquer les 3 migrations (dans l'ordre) via le SQL editor ou `supabase db push`
- [ ] Promouvoir le premier compte : `update public.profiles set role = 'super_admin' where id = '<uuid>';`
- [ ] **Le SQL n'a jamais été exécuté** (ni Postgres ni Docker sur la machine) — à valider au premier `db push`

---

## ✅ Phase 2 — Authentification

- [x] `lib/validation/auth.ts` — schémas Zod (mot de passe fort : 8+, majuscule, chiffre, spécial)
- [x] `app/(auth)/layout.tsx` — carte centrée + ThemeToggle + LangSwitcher
- [x] `app/(auth)/login/page.tsx` + formulaire client (redirection `?next=`)
- [x] `app/(auth)/register/page.tsx` — rôle `auto_ecole` uniquement, message d'attente d'approbation
- [x] `app/(auth)/forgot-password/page.tsx`
- [x] `app/(auth)/reset-password/page.tsx`
- [x] `app/auth/callback/route.ts` — échange du code (confirmation e-mail, reset)
- [x] `app/ecole/pending/page.tsx` — page verrouillée « En attente d'approbation » / « Refusé »
- [x] `app/api/auth/signout/route.ts` (POST uniquement)
- [x] `lib/supabase/errors.ts` — messages Supabase → clés i18n

**Note structure :** les groupes `(admin)` / `(ecole)` de la spec ne produisent pas
les URLs `/admin/*` et `/ecole/*` (un groupe n'ajoute rien au chemin). Dossiers
réels : `app/(auth)/` pour l'auth, puis `app/admin/` et `app/ecole/` en clair.

## ✅ Phase 3 — Composants partagés

Nommage réel en kebab-case (convention du reste du dossier `components/`) :

- [x] `theme-toggle.tsx` · `lang-switcher.tsx` · `logo.tsx` · `password-input.tsx`
- [x] `user-menu.tsx` (avatar + déconnexion par form POST)
- [x] `navbar.tsx` — barre supérieure desktop ≥ lg
- [x] `sidebar-rail.tsx` — rail d'icônes mobile, expand au hamburger, fermeture Échap
- [x] `app-shell.tsx` — assemble navbar + rail
- [x] `confirm-modal.tsx` · `stats-card.tsx` · `progress-bar.tsx` · `empty-state.tsx` · `page-header.tsx`
- [x] `data-table.tsx` — colonnes, pagination 15/page, recherche, filtres, skeletons, état vide
- [x] `upload-input.tsx` — drag & drop + preview + upload Cloudinary signé
- [x] `nav-config.ts` — liens par rôle
- [x] `app/api/cloudinary/sign/route.ts` — signature (auth requise, type + taille validés)
- [x] `store/ui-store.ts` — Zustand (sidebar uniquement)
- [x] `lib/format.ts` — DZD, dates, libellés de mois, semaine de travail Sam→Jeu
- [x] `hooks/use-mounted.ts` · `hooks/use-debounced-value.ts` · `hooks/use-mobile.ts` réécrit
- [x] `types/index.ts` — formes de domaine (jointures)

## ✅ Phase 4 — Panel Super Admin `/admin`

- [x] `app/(admin)/layout.tsx` — garde `requireRole('super_admin')`
- [x] `/admin/dashboard` — 4 stats + courbe inscriptions/mois + barres par wilaya
- [x] `/admin/auto-ecoles` — table, filtre statut, recherche, approuver/refuser
- [x] `/admin/auto-ecoles/[id]` — fiche complète + actions
- [x] `/admin/users` — table, filtre rôle, recherche
- [x] `/admin/categories` — CRUD (code, label ar/fr/en)
- [x] `/admin/questions` — onglets Questions / Plaques / Carrefours, CRUD + options + image

Ajouté en cours de route :
- [x] `supabase/migrations/…_operations.sql` — RPC `approve_school`, `reject_school`,
      `accept_enrollment` (snapshot du prix), `reject_enrollment`, `generate_week_slots`,
      `upsert_question` (question + options en une transaction)
- [x] `supabase/migrations/…_stats.sql` — RPC `admin_dashboard_stats` / `school_dashboard_stats`
      (les sommes et group-by restent en base, un seul aller-retour par dashboard)
- [x] Colonne `profiles.email` miroir de `auth.users` (le client ne peut pas lire le schéma `auth`)
- [x] `components/charts/` — courbe mensuelle + barres catégorielles
- [x] Palette de charts **validée** par `validate_palette.js` : teinte unique `#4f46e5`
      (clair) / `#6366f1` (sombre), toutes vérifications au vert ; rampe ordinale
      indigo pour les étapes, avec valeurs affichées (l'extrémité claire est à 2,9:1)
- [x] `hooks/` — `use-schools`, `use-users`, `use-categories`, `use-questions`, `use-stats`
- [x] `components/shared/status-badge.tsx`

## ✅ Phase 5 — Panel Auto-école `/ecole`

- [x] `app/(ecole)/layout.tsx` — garde `requireApprovedSchool()`
- [x] `/ecole/complete-profile` — formulaire forcé (prix par catégorie dynamiques, photo, jour d'examen)
- [x] `/ecole/dashboard` — 4 stats + paiements/mois + répartition par étape
- [x] `/ecole/requests` — cartes, accepter/refuser, filtre statut
- [x] `/ecole/students` — table (progression, payé, restant), recherche
- [x] `/ecole/students/[id]` — fiche, progression, historique versements, ajout versement
- [x] `/ecole/completed` — diplômés, lecture seule, recherche

## ✅ Phase 6 — Planning + Examens

- [x] `/ecole/planning` onglet Modèle — grille 08:00→18:00 par 30 min × Sam→Jeu, toggle par type
- [x] `/ecole/planning` onglet Créneaux — sélecteur de semaine, génération depuis le modèle, annulation
- [x] `/ecole/exams` — cartes + modale de création (dates suggérées depuis `exam_day`)
- [x] `/ecole/exams/[id]` — candidats éligibles, assignation, saisie des résultats
- [ ] ~~Notification 24 h avant l'examen~~ — **hors périmètre front**. La colonne
      `exam_candidates.notified_at` est prête ; le déclencheur (pg_cron ou Edge
      Function) reste à écrire côté Supabase.

Ajouté en cours de route :
- [x] `…000006_views.sql` — vues `student_files` et `exam_roster` en `security_invoker`
- [x] `lib/week.ts` — semaine Sam→Jeu, dates en `YYYY-MM-DD` local (pas d'UTC, pas de décalage d'un jour)
- [x] `hooks/use-school-profile`, `use-enrollments`, `use-payments`, `use-planning`, `use-exams`
- [x] `app/not-found.tsx` + `app/error.tsx`
- [x] `scripts/check-i18n.mjs` → `npm run check:i18n`

## ✅ Phase 7 — Finition

- [x] Skeletons de chargement sur tous les fetchs
- [x] États vides (icône + message) partout
- [x] Accessibilité : `aria-label`, navigation clavier, focus visible
- [x] Vérification RTL page par page en AR
- [x] `README.md` — installation + documentation des pages
- [x] Passe finale `npm run build` + `npm run lint`

---

## ▶ État final — 2026-09-04

**Les 7 phases sont terminées.** 21 routes construites.
`npm run build`, `npx tsc --noEmit`, `npx eslint .` et `npm run check:i18n`
passent tous au vert.

### Vérifié

- Build de production : 21 routes + proxy, zéro erreur
- TypeScript strict : zéro erreur
- ESLint (règles React Compiler comprises) : zéro erreur, zéro avertissement
- Catalogues i18n : 367 clés × 3 langues, alignées
- Palette de graphiques : validée par script (bande de luminosité, chroma, contraste)
- RTL : aucune classe de direction physique (`pl-`, `text-left`…) dans le code applicatif

### Migrations appliquées — deux correctifs

Les 6 migrations ont été appliquées sur un vrai projet Supabase. Deux défauts
sont apparus à ce moment-là et sont corrigés dans les fichiers :

1. **Virgule finale dans `create table public.enrollments`** — reliquat d'une
   contrainte retirée en cours de route. `ERROR 42601: syntax error at or near ")"`.
2. **`guard_profile_update` bloquait la promotion du premier administrateur.**
   Un trigger se déclenche pour tous les rôles, superutilisateur compris ; seule
   la RLS est court-circuitée. Le garde-fou avait une échappatoire
   (`permix.system_update`) pour `email` et `has_license`, mais pas pour `role` —
   il n'existait donc aucun chemin pour créer le premier compte admin. L'exemption
   couvre désormais le rôle aussi ; voir la procédure dans le README.

### Encore non vérifié

- Aucun parcours utilisateur complet n'a été joué de bout en bout (inscription
  d'une école → approbation → candidats → paiements → examens).
- Le rendu RTL n'a pas été observé dans un navigateur, seulement audité au code.

### À faire pour un premier essai

```bash
# 1. Remplir .env.local depuis .env.example
# 2. Appliquer les migrations 000001 → 000006 dans l'ordre
#    (SQL editor du dashboard, ou npx supabase db push)
# 3. S'inscrire, puis promouvoir le compte :
#    update public.profiles set role = 'super_admin' where id = '<uuid>';
# 4. npm run dev
```

Voir [README.md](README.md) pour l'installation détaillée et la documentation
des pages.

---

## Décisions (écarts assumés vs la spec)

| Spec | Réalité | Pourquoi |
|------|---------|----------|
| Next.js 14 | **Next.js 16.3.4** | Version réellement installée ; `middleware` → `proxy`, `params` async, Tailwind v4 |
| `next/middleware.ts` | `proxy.ts` | Renommage Next 16, runtime `nodejs` imposé |
| `next-i18next` | **next-intl** | `next-i18next` ne fonctionne pas avec l'App Router |
| `public/locales/*/common.json` | `messages/{fr,ar,en}.json` | Convention next-intl |
| Laravel + axios + JWT cookie | **Supabase + supabase-js + RLS** | Backend changé en cours de cadrage |
| `lib/axios.ts` | `lib/supabase/*` | Plus d'API REST externe |
| `store/authStore.ts` (Zustand) | `lib/auth.ts` côté serveur | L'auth vient des Server Components ; la dupliquer côté client crée des désyncs |
| Cloudinary via API Laravel | `app/api/cloudinary/sign` | Signature générée par un route handler Next |

### Invariants du schéma (ne jamais contourner)

- `schools.profile_completed` et `profiles.has_license` sont **dérivés par trigger**, jamais écrits par le client.
- `enrollments.total_price` est un **snapshot** du prix à l'acceptation : un changement de tarif ne réécrit pas les dossiers ouverts.
- `payments` est **append-only** pour les écoles (insert seul) ; les corrections passent par un admin.
- Le trigger `handle_new_user` n'accorde jamais `super_admin` — promotion manuelle en SQL uniquement.
