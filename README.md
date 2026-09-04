# Permix

Plateforme de gestion d'auto-écoles pour l'Algérie. Deux espaces : un panneau
super-administrateur qui modère les auto-écoles et la banque de questions, et un
espace auto-école qui suit les candidats, les paiements, le planning et les examens.

Trilingue **AR / FR / EN**, avec passage automatique en RTL en arabe, thème clair
et sombre.

---

## Stack

| Rôle | Choix |
|---|---|
| Framework | Next.js 16.3 (App Router, Turbopack) · React 19.2 · TypeScript |
| Styles | Tailwind CSS v4 · shadcn/ui (preset `radix-nova`, RTL activé) |
| Backend | Supabase — Auth + Postgres + Row Level Security |
| Données serveur | TanStack React Query |
| État client | Zustand (interface uniquement) |
| Formulaires | React Hook Form + Zod |
| i18n | next-intl, locale en cookie |
| Graphiques | Recharts |
| Images | Cloudinary (upload signé) |
| Notifications | sonner |

> La spécification d'origine visait Next 14 + Laravel + `next-i18next`. Les écarts
> sont documentés dans [TODO.md](TODO.md).

---

## Installation

### 1. Dépendances

```bash
npm install
```

### 2. Projet Supabase

Créez un projet sur [supabase.com](https://supabase.com), puis copiez le modèle
d'environnement et remplissez-le :

```bash
cp .env.example .env.local
```

| Variable | Où la trouver |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → clé `anon` / publishable |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → clé `service_role` — **serveur uniquement** |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary → Settings → API Keys |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | idem |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` en développement |

### 3. Migrations

Appliquez les fichiers de `supabase/migrations/` **dans l'ordre**, soit par le SQL
editor du dashboard, soit avec la CLI :

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

| Fichier | Contenu |
|---|---|
| `…000001_schema.sql` | 13 tables, 10 enums, triggers dérivés |
| `…000002_rls.sql` | Helpers `SECURITY DEFINER` + policies par rôle |
| `…000003_seed_reference.sql` | 58 wilayas, 7 catégories de permis |
| `…000004_operations.sql` | Transitions métier (approbation, inscription, créneaux, questions) |
| `…000005_stats.sql` | Agrégats des tableaux de bord |
| `…000006_views.sql` | Vues `student_files` et `exam_roster` |
| `…000007_manual_operations.sql` | Inscription et réservation faites par l'auto-école |
| `…000008_lesson_types.sql` | `creneau` et `perfectionnement` ajoutés à `lesson_type` — **seul dans sa transaction** |
| `…000009_candidate_file_and_sessions.sql` | Dossier candidat complet, séances de conduite créées à la volée |
| `…000010_direct_planning.sql` | Le modèle hebdomadaire disparaît : les deux grilles se remplissent à la main |

> ⚠️ `000008` doit être exécuté **seul**, avant `000009`. Postgres refuse
> d'utiliser une valeur d'enum ajoutée dans la même transaction : les deux
> fichiers collés dans un même onglet du SQL editor échouent.

### 4. Premier super-administrateur

Le trigger `handle_new_user` n'accorde **jamais** le rôle `super_admin` — sinon
n'importe qui se l'attribuerait à l'inscription. Il faut donc l'accorder à la main.

**N'utilisez pas `/register`** : cette page inscrit toujours en `auto_ecole` et crée
une école vide au passage. Créez le compte depuis le dashboard :

1. **Authentication → Users → Add user → Create new user**
2. Renseignez e-mail et mot de passe, et **cochez « Auto Confirm User »** — sans
   cela Supabase attend une confirmation par e-mail et la connexion échoue.
3. Dans le SQL editor :

```sql
do $$
begin
  perform set_config('permix.system_update', 'on', true);
  update public.profiles
     set role = 'super_admin'
   where email = 'vous@exemple.com';
end;
$$;
```

Le `do` block n'est pas décoratif : `guard_profile_update` refuse tout changement
de rôle, et il se déclenche pour **tous** les rôles de la base, superutilisateur
compris — seule la RLS est court-circuitée par un superutilisateur, pas les
triggers. Le drapeau `permix.system_update` est l'échappatoire prévue ; il est
local à la transaction, d'où le bloc qui tient le `set_config` et l'`update`
ensemble. `set_config` n'étant pas exposé par PostgREST, un client navigateur ne
peut pas le lever.

Vérification :

```sql
select email, role from public.profiles where role = 'super_admin';
```

### 5. Lancer

```bash
npm run dev
```

---

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement (Turbopack) |
| `npm run build` | Build de production + vérification TypeScript |
| `npm run start` | Sert le build |
| `npm run lint` | ESLint, règles React Compiler comprises |
| `npm run check:i18n` | Vérifie que les trois catalogues ont les mêmes clés |

---

## Pages

### Authentification

| Route | Description |
|---|---|
| `/login` | Connexion. `?next=` renvoie vers la page demandée, `?error=link_expired` signale un lien mort |
| `/register` | Inscription auto-école uniquement ; mot de passe fort exigé, puis attente d'approbation |
| `/forgot-password` | Envoi du lien de réinitialisation |
| `/reset-password` | Nouveau mot de passe (accessible seulement via le lien de récupération) |
| `/auth/callback` | Échange du code des liens e-mail (PKCE et `token_hash`) |

### Super administrateur — `/admin`

| Route | Description |
|---|---|
| `/admin/dashboard` | 4 indicateurs, inscriptions par mois, auto-écoles par wilaya |
| `/admin/auto-ecoles` | Table filtrable par statut, recherche, approuver / refuser |
| `/admin/auto-ecoles/[id]` | Fiche complète, tarifs, statistiques de réussite, actions |
| `/admin/users` | Tous les comptes, filtre par rôle, recherche |
| `/admin/categories` | CRUD des catégories de permis (code + libellés ar/fr/en) |
| `/admin/questions` | Onglets Questions / Plaques / Carrefours, réponses dynamiques, image |

### Auto-école — `/ecole`

| Route | Description |
|---|---|
| `/ecole/pending` | Écran verrouillé tant que l'administration n'a pas tranché |
| `/ecole/complete-profile` | Formulaire obligatoire : coordonnées, jour d'examen, photo, tarifs par catégorie |
| `/ecole/dashboard` | 4 indicateurs, paiements par mois, répartition des candidats par étape |
| `/ecole/requests` | Cartes de demandes, accepter / refuser, filtre par statut |
| `/ecole/students` | Table des candidats actifs : progression, payé, restant. **Ajouter un candidat** crée son compte et son dossier |
| `/ecole/students/[id]` | Dossier complet (nom ar + latin, naissance, nationalité, groupe sanguin), identifiants de l'app, progression, versements |
| `/ecole/completed` | Candidats ayant obtenu le permis, en lecture seule |
| `/ecole/planning` | Deux grilles identiques, **Conduite** et **Code** : clic sur une case vide → séance créée et attribuée, ou demi-heure fermée. Navigation semaine par semaine |
| `/ecole/exams` | Sessions d'examen, création avec dates suggérées |
| `/ecole/exams/[id]` | Candidats éligibles, assignation, saisie des résultats |

---

## Architecture

### Tout se fait depuis le web

L'application mobile du candidat n'existe pas encore, donc **personne ne s'inscrit
tout seul** : l'auto-école saisit le dossier, choisit la catégorie et place le
candidat sur ses créneaux. Le candidat n'a aucun écran à ouvrir.

Le compte est quand même créé — c'est celui avec lequel le candidat se connectera
à l'APK le jour venu. Les deux chemins convergent donc sur la même ligne plutôt
que de produire deux sortes de candidats :

| Geste | Chemin candidat (APK, plus tard) | Chemin auto-école (web, aujourd'hui) |
|---|---|---|
| Ouvrir un dossier | `enrollments` en `pending`, puis `accept_enrollment` par l'école | `enroll_candidate` — accepté d'emblée, même snapshot de prix |
| Prendre un créneau | consultation seule : le planning est écrit par l'école | `create_and_book_slot` |
| Corriger ses coordonnées | policy `profiles update own` | `school_update_candidate`, limité à ses propres candidats |

Rien de ce qui précède n'est à défaire quand l'APK sortira : les policies du
candidat sont déjà en place, la colonne de plus n'existe pas. Les deux entrées
mèneront aux mêmes tables.

Une seule opération ne passe pas par Postgres directement : créer le compte du
candidat demande la clé `service_role`, donc elle vit dans le route handler
`app/api/ecole/candidates`. L'inscription elle-même y est faite **avec la session
de l'école**, pas avec la clé de service — c'est la base qui revérifie le droit,
pas le handler.

Sans e-mail — le cas courant au comptoir — l'identifiant est dérivé du numéro de
téléphone (`0555…@candidat.permix.dz`) et le mot de passe est généré puis affiché
**une seule fois** : il n'est stocké nulle part en clair. Le candidat qui revient
avec une vraie adresse, ou qui a perdu le papier, passe par
`/api/ecole/candidates/[id]/credentials` — la réinitialisation par e-mail ne sert
à rien quand l'identifiant est un numéro inventé par l'école.

### Le planning : une salle, une voiture

Deux ressources, une seule façon de les remplir. L'école clique sur une demi-heure
vide, choisit le type, désigne le candidat, et la séance est créée et attribuée en
un appel (`create_and_book_slot`). Rien n'est déclaré disponible à l'avance : une
case vide est libre, un point c'est tout.

Le modèle hebdomadaire a été retiré (`…000010`). Il décrivait une disponibilité
que personne ne consommait : l'école ne publie pas ses heures libres pour que les
candidats s'y inscrivent, elle écrit la semaine elle-même. `slots` ne contient donc
plus que deux sortes de lignes — une séance réservée, ou une demi-heure **fermée**
(travaux, pause, jour off) sur laquelle plus rien ne peut être posé.

Les flèches font défiler les semaines sans limite : réserver un mois à l'avance,
c'est quatre pages.

| | Durée | Candidats proposés | Facturation |
|---|---|---|---|
| Code | 30 min | ceux qui n'ont pas encore débloqué le créneau | comprise dans le forfait |
| Créneau | 30 min | `creneau_unlocked` sans `conduite_unlocked` | comprise dans le forfait |
| Conduite | 30 min | `conduite_unlocked` | comprise dans le forfait |
| Perfectionnement | **1 h** | tout dossier actif | `perf_price_per_hour`, figé sur la séance |

Le perfectionnement se paie à l'heure en plus du forfait, donc la séance porte
son prix (`slots.price`) et `student_files.amount_due` additionne le forfait et
les heures réellement réservées. Une séance supprimée disparaît du calcul d'elle-même.

Une heure de perfectionnement occupe la demi-heure suivante, et un créneau peut
tomber sur une conduite : l'index unique `(school_id, slot_date, start_time,
lesson_type)` n'aurait vu ni l'un ni l'autre. D'où `resource_busy()`, seul endroit
où la règle de chevauchement est écrite — par ressource, donc la salle et la
voiture ne se gênent pas mutuellement, et une demi-heure fermée bloque comme une
séance.

### Le navigateur parle directement à Postgres

Il n'y a pas d'API REST intermédiaire. `supabase-js` interroge la base depuis le
client et **les policies RLS *sont* la couche d'autorisation**. Trois acteurs :

- `super_admin` — voit et modère tout
- `auto_ecole` — ne voit que son école et les candidats de son école
- `candidat` — ne voit que son propre dossier

Les fonctions d'aide (`is_super_admin()`, `current_school_id()`) sont en
`SECURITY DEFINER` : sans cela, une policy sur `profiles` qui lit `profiles`
récurserait dans sa propre policy.

### Ce que le client n'a pas le droit d'écrire

Certaines valeurs sont **dérivées par trigger** et refusées si elles viennent du
client — le contraire ouvrirait un contournement par simple requête directe :

- `schools.profile_completed` — sinon une école saute l'étape de profil
- `profiles.has_license` — sinon un candidat s'accorde son propre permis
- `profiles.email` — miroir de `auth.users`
- `schools.status` / `approved_at` — seul un administrateur approuve

### Ce qui vit en base plutôt que dans le client

| Opération | Pourquoi |
|---|---|
| `accept_enrollment` | Fige le tarif au moment de l'acceptation : un changement de prix ne doit pas réécrire les dossiers ouverts |
| `upsert_question` | Question et réponses forment une unité ; deux requêtes laisseraient des options orphelines |
| `enroll_candidate` | Même règle de snapshot que `accept_enrollment`, en une étape : l'école qui inscrit n'a rien à décider ensuite |
| `create_and_book_slot` | Durée et tarif déduits du type, chevauchements vérifiés, création et réservation dans la même transaction ; la policy `slots`, elle, ne regarde que l'école |
| `block_slot` | Ferme une demi-heure — même contrôle de chevauchement, sans candidat |
| `admin_dashboard_stats` | Les sommes et group-by restent en base : un seul aller-retour, aucune ligne superflue transmise |
| Vue `student_files` | Le solde par dossier demande une somme ; la calculer côté client signifierait télécharger tous les paiements |

`payments` est **append-only** pour les écoles : insertion seule, pas de
modification ni de suppression. Un registre financier réinscriptible ne vaut rien ;
les corrections passent par un administrateur.

### Authentification

`proxy.ts` (l'ancien `middleware.ts`, renommé en Next 16) ne fait que deux choses :
rafraîchir la session Supabase et refouler les visiteurs anonymes. Le contrôle du
rôle et de l'approbation vit dans les layouts `/admin` et `/ecole`, qui peuvent
lire `profiles` et `schools` dans la même requête — plutôt que de faire taper le
proxy dans la base à chaque ressource.

### Internationalisation

La locale est stockée en cookie, pas dans l'URL : les chemins restent propres et
la structure de dossiers suit la spécification. `app/layout.tsx` calcule `lang` et
`dir` à partir de cette locale ; l'arabe bascule tout le document en RTL. Les
composants utilisent exclusivement des propriétés logiques (`ps-`, `me-`, `start-`,
`text-end`), jamais `pl-` ou `text-left`.

Les trois catalogues de `messages/` doivent rester alignés — `npm run check:i18n`
échoue sinon.

### Graphiques

La palette n'est pas choisie à l'œil : elle est validée (bande de luminosité,
plancher de chroma, contraste ≥ 3:1 sur la surface). Les séries uniques prennent
une teinte unique (`#4f46e5` en clair, `#6366f1` en sombre) et se passent de
légende — le titre de la carte nomme déjà ce qui est tracé. Les étapes ordonnées
(code → créneau → conduite) utilisent une rampe indigo monotone, avec la valeur
affichée sur chaque barre puisque l'extrémité claire descend à 2,9:1.

---

## Structure

```
app/
  (auth)/          login · register · forgot-password · reset-password
  admin/           layout gardé par requireRole('super_admin')
  ecole/
    pending/       écran d'attente d'approbation
    complete-profile/
    (app)/         layout gardé par requireApprovedSchool()
  api/             cloudinary/sign · auth/signout · ecole/candidates[/id/credentials]
  auth/callback/
components/
  ui/              shadcn/ui
  shared/          navbar, rail mobile, DataTable, modales, upload…
  charts/          courbe mensuelle, barres catégorielles
hooks/             un fichier par domaine (schools, enrollments, exams…)
lib/               supabase/*, auth, format, week, validation
i18n/              config, request, actions de locale
messages/          fr.json · ar.json · en.json
supabase/migrations/
types/             database.ts (miroir du schéma) + index.ts (domaine)
```

---

## Hors périmètre

La notification 24 h avant un examen est décrite comme un job côté backend. La
colonne `exam_candidates.notified_at` l'attend ; le déclencheur (pg_cron ou Edge
Function) reste à écrire.
