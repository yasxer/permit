# Handoff : Permix — plateforme de gestion d'auto-écoles (Algérie)

## Vue d'ensemble

Permix est une application web de gestion d'auto-écoles pour l'Algérie, avec deux
espaces dans la même application :

1. **Auto-école** — suit ses candidats, l'argent encaissé, le planning des séances
   et les séances d'examen.
2. **Super administrateur** — modère les auto-écoles, gère les comptes, les
   catégories de permis et la banque de questions du code.

Il n'y a **pas de vitrine marketing** et **pas d'écran candidat** : personne ne
s'inscrit seul, l'auto-école saisit le dossier au comptoir. Le candidat utilisera
une application mobile (hors périmètre de ces maquettes).

## À propos des fichiers de design

Les fichiers de ce dossier sont des **références de design réalisées en HTML** :
des prototypes qui montrent l'apparence et le comportement attendus, **pas du
code de production à copier tel quel**.

Le travail attendu est de **recréer ces maquettes dans l'environnement du
codebase cible** (React/Next.js, Vue, Laravel + Blade, etc.) avec ses patterns et
ses bibliothèques existants. Si aucun environnement n'existe encore, choisir la
stack la plus adaptée (une SPA React + Tailwind + shadcn/ui correspond bien aux
tokens ci-dessous) et y implémenter les écrans.

`Permix.dc.html` est un unique document qui contient **tous les artboards côte à
côte** sur un canvas : chaque artboard porte une étiquette avec son identifiant
(`1a`, `2a`, …), son titre et sa route. Ce n'est pas l'architecture de
l'application, c'est une planche de maquettes.

## Fidélité

**Haute fidélité (hifi).** Couleurs, typographie, espacements, rayons, états et
copie sont définitifs. La reproduction doit être fidèle au pixel, en utilisant
les composants du codebase cible.

Deux réserves :
- Les données sont plausibles mais fictives (noms, montants, numéros).
- Les interactions sont représentées par des **états dessinés** (focus, erreur,
  vide, chargement) et non par du JS fonctionnel.

## État d'avancement des maquettes

Livrés dans ce bundle :

| id | Écran | Route | Format |
|---|---|---|---|
| 1a | Planche de style | — | 1440 |
| 1b | Tableau de bord auto-école | `/ecole/dashboard` | 1440 |
| 1c | Tableau de bord mobile | `/ecole/dashboard` | 390 |
| 1d | Tableau de bord arabe RTL | `/ecole/dashboard` | 960, `dir="rtl"` |
| 2a | Planning — semaine | `/ecole/planning` | 1440 |
| 2b | Modales de cellule (vide / occupée) | `/ecole/planning` | 520 |
| 2c | Demandes d'inscription | `/ecole/requests` | 1440 |
| 2d | Modale de refus (motif) | `/ecole/requests` | 520 |
| 2e | Candidats actifs (table) | `/ecole/students` | 1440 |
| 2f | Modales « Ajouter un candidat » + « Identifiants » | `/ecole/students` | 760 / 520 |
| 2g | Planning mobile (un jour) | `/ecole/planning` | 390 |
| 2h | Candidats mobile (cartes) | `/ecole/students` | 390 |

Pas encore dessinés (à ne pas inventer sans validation) : fiche candidat
`/ecole/students/[id]`, diplômés `/ecole/completed`, examens `/ecole/exams` et
`/ecole/exams/[id]`, profil à compléter `/ecole/complete-profile`, les 5 écrans
d'authentification, les 5 écrans admin, 404 / erreur, et la variante thème sombre
du planning. Les tokens et les patterns ci-dessous suffisent pour les construire
dans le même langage visuel.

---

## Design tokens

### Couleurs — proportion 60 / 30 / 10

| Rôle | Clair | Sombre | Usage |
|---|---|---|---|
| Page | `#F9FAFB` | `#0F1420` | 60 % |
| Carte | `#FFFFFF` | `#151B29` | la hiérarchie vient du décalage page/carte |
| Bordure carte | `#EBEDF1` | `#232B3B` | hairline 1 px |
| Séparateur interne | `#F3F4F6` / `#F4F5F7` | `#1E2636` | |
| Encre (`primary`) | `#1C2333` | texte `#F3F4F6` | 30 % — texte, titres, icônes, barre de nav |
| Texte secondaire | `#374151` | `#C9CFDB` | |
| Texte sourd | `#6B7280` | `#9AA3B2` | |
| Texte très sourd | `#9CA3AF` | `#6E788C` | axes de graphique, aides |
| Accent (`brand`) | `#F5A623` | `#F5A623` (inchangé) | 10 % — CTA, onglet actif, focus ring |
| Accent survolé | `#E39A1D` | `#E39A1D` | |
| Accent en texte | `#C97F0A` | `#F5A623` | `#F5A623` ne passe pas 3:1 sur blanc |
| Accent en texte foncé | `#8A5A06` | — | badges ambre sur fond clair |
| Bordure de champ | `#D1D5DB` | `#33405C` | |
| Nav — fond | `#1C2333` | `#1C2333` | **reste bleu nuit dans les deux thèmes** |
| Nav — piste des items | `rgba(255,255,255,0.05)` | idem | |
| Nav — bordure de contrôle | `#33405C` | idem | |
| Nav — avatar | `#33405C` | idem | |

Règles dures :
- L'ambre ne couvre **jamais** une grande surface : un CTA, un onglet actif, un
  focus ring, un badge de compteur. Rien d'autre.
- Sur `#1C2333`, `#F5A623` donne 7,75:1 — c'est la combinaison CTA de référence
  (texte `#1C2333` sur fond ambre).
- **Aucune ombre portée** pour séparer les cartes : décalage de fond + hairline.

Sémantique :

| Rôle | Valeur | Fond de badge |
|---|---|---|
| Succès | `#16A34A`, texte `#15803D` | `rgba(22,163,74,0.13)` |
| Destructif | `oklch(0.637 0.208 25.3)`, texte `oklch(0.5 0.19 25.3)` | `oklch(0.637 0.208 25.3 / 0.13)` |
| Avertissement | `#C97F0A`, texte `#8A5A06` | `rgba(245,166,35,0.12)` bordure `rgba(245,166,35,0.4)` |

Graphiques :
- Série unique → **une seule teinte**, `#C97F0A` en clair / `#F5A623` en sombre,
  aire en dégradé de `opacity 0.20` vers `0`, ligne 2,2 px, **pas de légende**.
- Rampe ordonnée (répartition par étape) : `#F8D28C` → `#E0A032` → `#9A6008`,
  valeur écrite sur/au-dessus de chaque barre.
- Grille horizontale seule : `#EEF0F3`, ligne de base `#DDE1E7`.

Pastilles du planning :
- Code / Conduite : `rgba(28,35,51,0.15)`, texte `#1C2333`
- Créneau : `rgba(245,166,35,0.20)`, texte `#6B4405`
- Perfectionnement : `rgba(22,163,74,0.20)`, texte `#145F32`
- Demi-heure fermée : `repeating-linear-gradient(45deg, oklch(0.637 0.208 25.3 / 0.10) 0 4px, transparent 4px 9px)` + libellé « Fermé » en `oklch(0.5 0.19 25.3)`

### Typographie

| Usage | Famille | Détail |
|---|---|---|
| Titres h1/h2/h3 | **Poppins** 500–800 | `letter-spacing:-0.02em` à `-0.03em` |
| Corps, tableaux, formulaires | **Inter** 400–700 | |
| Chiffres (montants, heures, téléphones) | Inter + `font-variant-numeric: tabular-nums` | |
| Code / identifiants | **JetBrains Mono** 400–500 | badges de catégorie, routes, identifiants |
| Arabe | **Noto Sans Arabic** 400–700 | titre **et** corps (Poppins n'a pas de glyphes arabes) |

Jamais plus de deux familles par écran (le mono compte comme accessoire de
libellé).

Échelle utilisée :

| Rôle | Taille / poids |
|---|---|
| h1 de page (desktop) | Poppins 34 / 700, `-0.03em` |
| h1 mobile | Poppins 24 / 700 (19 dans l'en-tête compact) |
| Titre de carte | Poppins 17 / 600 |
| Titre de modale | Poppins 20–22 / 600 |
| Grand nombre (stat) | Poppins 36 / 700, `tabular-nums` |
| Grand nombre monétaire | Poppins 27 / 700 (montants longs) |
| Micro-libellé | Inter 11 / 600, `uppercase`, `letter-spacing:0.09em`, `#6B7280` |
| Kicker de bandeau | JetBrains Mono 11, `letter-spacing:0.12em`, `uppercase`, `#F5A623` |
| Corps | Inter 14 / 400–500 |
| Corps secondaire | Inter 13 / 400 |
| Aide de champ | Inter 11–12, `#9CA3AF` |
| Ligne de tableau | Inter 14 / 600 (nom), 14 / 400 (reste) |
| En-tête de tableau | Inter 11 / 600, `uppercase`, `0.08em` |

### Rayons

`--radius: 0.75rem` (12 px). Variantes utilisées : 6 px (badge d'étiquette),
8–9 px (badge mono, pastille de planning), 10–11 px (icône en aplat, contrôle),
**12 px** (bouton, champ), **16 px** (carte, modale, artboard), 20 px (coin
supérieur du contenu mobile), 28 px (cadre du téléphone), 999 px (pastille de
statut, avatar).

### Espacements

Échelle de 4 : 2 · 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 24 · 32 · 40 · 48 · 56.
- Gouttières de page : 32 px desktop, 16 px mobile.
- Contenu centré, `max-width: 90rem`.
- Grille de stats : 4 colonnes, `gap: 20px`.
- Padding de carte : 20–24 px desktop, 14–16 px mobile.

---

## Shell applicatif

### ≥ `lg` — barre supérieure + bandeau de page

Deux blocs bleu nuit contigus qui se lisent comme un seul en-tête :

1. **Barre supérieure**, hauteur 64 px, `padding: 0 32px`, fond `#1C2333` :
   - début : logo — carré 28 px, rayon 8, fond `#F5A623`, lettre « P » Poppins 800
     15 px `#1C2333`, puis « Permix » Poppins 17 / 700 `#F9FAFB`.
   - centre : les items de navigation posés sur une **piste creusée**
     (`background: rgba(255,255,255,0.05)`, `padding: 4px`, rayon 14). Chaque item :
     icône Lucide 16 px + libellé Inter 14, `padding: 8px 14px`, rayon 10.
     Item inactif `#C9CFDB` / poids 500 ; **item actif** fond `#F5A623`, texte et
     icône `#1C2333`, poids 600. « Demandes » porte un compteur : pastille 999 px,
     fond `#F5A623`, texte `#1C2333` 11 / 700 (inversé quand l'item est actif).
   - fin : sélecteur de langue (`FR`, bordure `#33405C`, rayon 10), bascule de
     thème (carré 33 px, icône lune), puis, après un séparateur
     `border-inline-start: 1px solid #33405C`, l'avatar 34 px `#33405C` + nom
     `#F9FAFB` 13 / 600 + rôle `#9AA3B2` 11.
2. **Bandeau de page**, même fond, `padding: 8px 32px 56px` :
   kicker mono ambre (nom de l'auto-école · wilaya), h1 Poppins 34 / 700
   `#F9FAFB`, sous-titre `#9AA3B2` 14, et les actions en fin de ligne
   (bouton fantôme bordure `#33405C` + CTA ambre).

Le contenu de page remonte sur le bandeau avec `margin-top: -40px`, ce qui fait
chevaucher la première rangée de cartes.

### < `lg` — en-tête nuit + barre d'onglets en bas

Pas de rail latéral et pas de sidebar : la navigation mobile est une **barre
d'onglets en bas**.
- En-tête `#1C2333`, `padding: 12px 18px 18px` : ligne de statut système,
  ligne d'identité (logo ou bouton retour, nom de l'école / titre, avatar), puis
  le titre h1 Poppins 19–24 / 700 en blanc.
- Contenu `#F9FAFB` avec `border-radius: 20px 20px 0 0` et `margin-top: -10px`.
- **Barre d'onglets** : fond `#1C2333`, `border-radius: 20px 20px 0 0`,
  `padding: 10px 8px 14px`, grille de 5 colonnes. Item : icône 20 px + libellé
  10 / 500 `#9AA3B2`, hauteur min 48 px. **Actif** : icône et libellé `#F5A623`,
  fond `rgba(245,166,35,0.14)`, rayon 12. Badge de compteur ambre en position
  absolue (`top: 5px; inset-inline-end: 16px`).
- Les 5 onglets mobiles : Bord · Demandes · Candidats · Planning · Examens
  (Diplômés passe dans le menu utilisateur).

### Navigation — libellés et icônes Lucide

- **Auto-école** : Tableau de bord `LayoutDashboard` · Demandes `Inbox` ·
  Candidats `GraduationCap` · Diplômés `Award` · Planning `CalendarDays` ·
  Examens `ClipboardCheck`.
- **Admin** : Tableau de bord `LayoutDashboard` · Auto-écoles `Building2` ·
  Utilisateurs `Users` · Catégories `Tags` · Questions `CircleHelp`.

---

## Écrans

### 1a — Planche de style

Référence des composants, à traiter comme la source de vérité pour les états :
palette clair et sombre, échelle typographique (dont une ligne en arabe),
boutons (repos / focus ambre / secondaire / destructif contour / chargement /
désactivé), champs (repos / focus ambre / erreur), badges de statut, badges de
catégorie mono, onglets, carte de statistique, squelettes, ligne de tableau
(dont sa version squelette), état vide, bandeaux d'erreur et d'avertissement,
toast.

### 1b — `/ecole/dashboard` (1440)

Bandeau nuit (kicker « Auto-école El Amel · Alger », h1 « Tableau de bord »,
sous-titre « Activité de la semaine du 5 septembre 2026. », boutons « Voir le
planning » fantôme + « Ajouter un candidat » ambre), puis :

1. **4 cartes de statistiques** (`repeat(4, 1fr)`, gap 20) : Candidats actifs 87 ·
   Demandes en attente 12 · Revenus encaissés 1 284 000,00 DA · Candidats
   diplômés 143. Structure de carte : micro-libellé, grand nombre Poppins 36 / 700
   (27 pour le montant), icône Lucide dans un carré 38 px `rgba(28,35,51,0.06)`
   rayon 11 au coin de fin, puis une ligne de contexte séparée par
   `border-top: 1px solid #F3F4F6` (« +6 dossiers ce mois », « 3 arrivées
   aujourd'hui » en `#8A5A06`, « +184 000,00 DA ce mois » en `#15803D`,
   « +11 ce trimestre »).
2. **Carte « Prochain examen »** : pastille de date 62 px fond `#1C2333`
   (mois mono ambre 10 px + jour Poppins 24 / 700 blanc), micro-libellé, date en
   toutes lettres Poppins 22 / 600, ligne de détail « 18 candidats inscrits ·
   6 code · 7 créneau · 5 conduite », badge ambre « Dans 10 jours » et CTA
   « Ouvrir la séance ». État vide à prévoir : « Aucun examen programmé —
   programmez une séance depuis la page Examens. »
3. **Graphique en aire « Paiements par mois »** (12 derniers mois) : `viewBox
   0 0 1020 236`, série unique `#C97F0A`, courbe lissée en cubiques
   (points de contrôle à mi-distance horizontale), aire en dégradé 0,20 → 0,
   repère pointillé vertical sur le mois courant, point terminal blanc cerclé
   d'ambre 2,4 px, mois courant en gras `#1C2333` dans l'axe. Valeur du mois
   affichée en fin d'en-tête (« 184 000,00 DA · septembre 2026 »). Pas de légende.
4. **Graphique en barres « Répartition par étape »** : Code 41 · Créneau 26 ·
   Conduite 20, rampe `#F8D28C` → `#E0A032` → `#9A6008`, valeur au-dessus de
   chaque barre, ligne de base `#DDE1E7`, libellés sous la ligne, note de bas de
   carte expliquant la rampe.

### 1c — `/ecole/dashboard` mobile (390)

Mêmes données, en-tête nuit porteur du titre, stats en 2 × 2 (icône + libellé sur
la même ligne, nombre Poppins 28), carte « Prochain examen » avec badge « Dans
10 jours » et répartition en trois compteurs, aire compacte (`viewBox 0 0 320 120`),
répartition par étape en barres horizontales (valeur en fin de barre, texte blanc
sur `#9A6008`), CTA pleine largeur 13 px de padding, barre d'onglets en bas.

### 1d — `/ecole/dashboard` arabe RTL (960)

Le document entier passe en `dir="rtl"`, famille `Noto Sans Arabic` pour les
titres **et** le corps. À vérifier dans l'implémentation :
- propriétés logiques partout (`inset-inline-*`, `padding-inline-*`,
  `border-inline-*`, `margin-inline-*`) — aucun `left` / `right` figé ;
- **les nombres, heures, montants et téléphones restent `dir="ltr"`** (y compris
  le SVG du graphique, mis en `dir="ltr"`) ;
- icônes directionnelles (chevrons de semaine) en miroir ;
- vocabulaire : لوحة التحكم · الطلبات · المترشحون · المتخرجون · البرنامج ·
  الامتحانات ; étapes القانون / المناورة / السياقة.

### 2a — `/ecole/planning` (1440) — l'écran central

Sous le bandeau (« Une case libre se remplit en un clic. Rien n'est réservé
d'avance. ») :

1. **Barre de contrôle** : onglets segmentés **Conduite / Code** (deux ressources
   distinctes : la voiture et la salle ; piste `#F3F4F6`, onglet actif carte
   blanche bordée), puis navigation de semaine — chevron `‹`, « Cette semaine »,
   sélecteur de date « 5 – 10 septembre 2026 », chevron `›`. Défilement illimité
   dans les deux sens.
2. **Grille** : `grid-template-columns: 76px repeat(6, 1fr)`.
   - Colonnes = **samedi → jeudi** (6 jours ouvrés algériens), en-tête avec le
     nom du jour 13 / 600 et la date 12 `#9CA3AF`.
   - Lignes = **demi-heures de 08:00 à 17:30**, soit 20 lignes de **42 px**
     (`grid-template-rows: repeat(20, 42px)` — cette hauteur est nécessaire pour
     que la pastille de 30 min affiche ses deux lignes de texte sans rognage).
   - Colonne d'heures figée au bord de début, libellés mono 11 px.
   - Chaque cellule vide est un div placé explicitement (`grid-row: N`), curseur
     pointeur, `:hover` → `background: rgba(245,166,35,0.10)` (le `+` discret
     apparaît au survol).
   - Une séance est un div placé en `grid-row: N / span S` (S = 1 pour 30 min,
     **2 pour le perfectionnement d'1 h**), `margin: 2px 3px`, rayon 9,
     `padding: 5px 8px`, type en 11 / 700 dans la teinte du type + nom du
     candidat en 11 `#374151` tronqué par ellipse.
   - Demi-heure fermée : hachures rouges très légères + « Fermé ».
3. **Légende** sous la grille (4 entrées, pastilles 14 px) + phrase d'aide
   « Cliquez sur une case vide pour créer une séance ou fermer la demi-heure. »

Règle métier : rien n'est déclaré disponible à l'avance ; une case vide est
libre.

### 2b — Modales de cellule

**Cellule vide → « Nouvelle séance »** : titre + « Lundi 7 septembre · 10:30 ».
Choix du type en 4 tuiles (Code 30 min · Créneau 30 min · Conduite 30 min ·
Perfectionnement 1 h), la tuile sélectionnée bordée `#F5A623` sur
`rgba(245,166,35,0.10)`. Puis **combobox de recherche de candidat** (état focus
ambre), liste avec en-tête explicatif « Candidats au stade créneau. » — **la liste
ne propose que les candidats arrivés à cette étape** ; pour le perfectionnement,
tout dossier actif avec le prix facturé affiché (« Facturé 1 500,00 DA »).
Bouton secondaire « Fermer cette demi-heure » à l'opposé des actions.
Erreurs à prévoir : « Une séance occupe déjà ce moment. », « Ce candidat a déjà un
créneau à cette heure. »

**Cellule occupée** : détail de la séance (candidat avec avatar, nom arabe et
latin, badge de catégorie ; type, ressource, montant facturé, créée par / le) et
« Supprimer la séance » en destructif contour.

Habillage de modale : fond `rgba(28,35,51,0.45)`, carte blanche rayon 16,
padding 24, actions séparées par `border-top: 1px solid #F3F4F6`.

### 2c / 2d — `/ecole/requests`

**Grille de cartes** (3 colonnes, gap 20), pas un tableau : avatar initiales,
nom latin + nom arabe, badge de catégorie en fin de ligne, puis bloc séparé avec
téléphone (icône + `dir="ltr"`) et « Demandé le … », puis deux boutons pleine
largeur — « Accepter » ambre / « Refuser » contour rouge.
Au-dessus : **segments de filtre avec compteur** (Toutes 31 / En attente 12 /
Acceptées 15 / Refusées 4) + recherche « Nom ou téléphone… ».
État vide : icône ronde en aplat sourd + « Aucune demande pour le moment ».

**Modale de refus** : icône ronde rouge, question « Refuser la demande de … ? »,
textarea de motif facultatif, bouton plein rouge `oklch(0.637 0.208 25.3)` texte
blanc.

### 2e / 2h — `/ecole/students`

Table dans une carte : en-tête `#FBFCFD`, colonnes
`1.5fr 1.1fr 0.6fr 1.2fr 1fr 1fr 36px` = Nom (avatar + latin/arabe) · Téléphone
(`dir="ltr"`, masqué < `md`) · Catégorie (badge mono, plein `#1C2333` pour B) ·
Progression (barre 6 px `#1C2333` sur `#EDEFF2` + pourcentage) · Payé (masqué
< `sm`) · Restant · chevron. Ligne cliquable, `:hover` `#F9FAFB`.
**« Soldé » en `#15803D`** quand le restant vaut 0. Pagination en pied
(« 1 – 8 sur 87 candidats », page active pastille nuit).
Recherche et CTA « Ajouter un candidat » vivent **dans le bandeau nuit**.

Sous `md` (artboard 2h) : liste de cartes — nom + badge de catégorie en tête, nom
arabe, barre de progression, et le **restant en gros au coin de fin**.

### 2f — Modales candidat

**« Ajouter un candidat »** (760 px) : aide en tête « Vous saisissez le dossier :
le candidat n'a rien à faire de son côté. » Champs sur deux colonnes — nom complet
(arabe, champ en `dir="rtl"` et Noto Sans Arabic), nom en latin, téléphone,
catégorie (select), date et lieu de naissance, nationalité (« Algérienne » par
défaut), groupe sanguin ; puis adresse pleine largeur ; puis e-mail (aide
« Laissez vide : un identifiant sera créé à partir du téléphone. ») et mot de
passe (aide « Laissez vide pour en générer un. ») ; puis zone de dépôt de photo
en bordure pointillée (« JPG, PNG ou WebP — 5 Mo maximum »).

**« Identifiants de l'application »** (520 px), affichée après création : icône
ronde verte, deux lignes en **JetBrains Mono** (identifiant, mot de passe) avec
bouton « Copier », et avertissement ambre « Remettez-les au candidat : il s'en
servira dans l'application mobile. **Le mot de passe n'est affiché qu'une fois.** »

### 2g — `/ecole/planning` mobile (390)

La grille hebdomadaire devient **un jour à la fois** : onglets Conduite / Code,
sélecteur de jour horizontal (6 puces, jour actif en pastille nuit avec le nom du
jour en ambre), puis une colonne d'heures pleine largeur
(`grid-template-columns: 58px 1fr`, 38 px par demi-heure, 76 px pour le
perfectionnement d'1 h). Barre d'onglets en bas, onglet Planning actif.

---

## Interactions et comportements

- **Planning** : clic sur cellule vide → modale « Nouvelle séance » (ou « Fermer
  cette demi-heure ») ; clic sur séance → modale de détail avec suppression ;
  chevrons de semaine → navigation illimitée ; onglets Conduite / Code changent
  de ressource sans changer de vue.
- **Demandes** : Accepter / Refuser passent par une **modale de confirmation** ;
  le refus demande un motif libre.
- **Candidats** : ligne cliquable → fiche candidat ; création → modale de saisie
  puis **modale d'identifiants affichée une seule fois**.
- **Versements** (fiche candidat, à dessiner) : **inscriptibles seulement** — ni
  modification ni suppression, donc **aucune icône crayon** sur un versement.
  Erreur à gérer : « Le montant dépasse le solde restant. »
- **Étape du candidat** : elle **avance toute seule** quand un examen est réussi
  (code réussi → créneau, créneau réussi → conduite, conduite réussie → permis
  obtenu et dossier clos). **Aucun interrupteur de progression manuelle** dans
  l'UI.
- **Résultats d'examen** (à dessiner) : chaque clic Réussi / Échoué / Absent
  s'enregistre seul — **pas de bouton « Enregistrer »** en bas de page. Le statut
  de la séance suit sa liste : `Programmé` tant qu'un résultat manque, `Terminé`
  quand ils y sont tous.
- **Vocabulaire d'états**, à implémenter partout :
  *chargement* → squelettes qui reprennent la forme réelle (lignes de tableau,
  cartes de stats), jamais de spinner plein écran ; *vide* → icône ronde en aplat
  sourd + titre + une phrase + éventuellement le bouton d'action ; *erreur* →
  bandeau discret + bouton « Réessayer » ; *toast* en bas, coin de fin, fond
  `#1C2333` ; confirmations destructives → modale avec bouton rouge.
- **Focus** : anneau ambre `box-shadow: 0 0 0 3px rgba(245,166,35,0.28)` +
  bordure `#F5A623` sur les champs, `0 0 0 3px rgba(245,166,35,0.35)` sur les
  boutons.
- **Hover** : CTA ambre → `#E39A1D` ; bouton secondaire → `#F3F4F6` ; bouton
  fantôme sur nuit → `#242E44` ; ligne de tableau → `#F9FAFB` ; cellule de
  planning → `rgba(245,166,35,0.10)`.

## Badges de statut — une seule échelle dans toute l'app

`en attente` ambre · `approuvé` / `actif` / `réussi` vert · `refusé` / `échoué`
rouge · `terminé` bleu nuit · `absent` / `annulé` gris.

## Contraintes transversales

- **Trilingue AR / FR / EN**, l'arabe bascule tout le document en RTL (voir 1d).
- **Monnaie** : dinar algérien, format `12 000,00 DA` (espace insécable comme
  séparateur de milliers, virgule décimale), toujours en `tabular-nums`.
- **Téléphones** : format `05 55 xx xx xx`, toujours `dir="ltr"`.
- **Wilayas** : select de 58 entrées.
- **Jour d'examen** : select samedi → jeudi.
- **Semaine ouvrée** : samedi → jeudi (6 colonnes de planning).
- Contenu centré, `max-width: 90rem`, gouttières 16 / 24 / 32 px.

## État à gérer (indicatif)

- Session : rôle (`super_admin` | `ecole` | `candidat`), langue (`ar` | `fr` | `en`),
  thème (`clair` | `sombre`), état de l'auto-école (`en_attente` | `approuvee` |
  `refusee`, profil complété ou non — condition d'accès aux pages).
- Planning : ressource active (`conduite` | `code`), semaine affichée, séances de
  la semaine, demi-heures fermées, cellule sélectionnée (pour la modale).
- Candidats : recherche, page, tri, dossier ouvert, historique des versements.
- Demandes : filtre de statut, demande en cours de confirmation.
- Examens : séance ouverte, pas courant de l'assistant, sélection par pas,
  résultats (enregistrement optimiste par clic).

## Assets

Aucune image ni police locale n'est embarquée.
- Polices : **Poppins**, **Inter**, **JetBrains Mono**, **Noto Sans Arabic** via
  Google Fonts (à self-hoster en production).
- Icônes : **Lucide**, dessinées en SVG inline dans les maquettes (`stroke-width`
  1,8–2, `stroke-linecap: round`). Utiliser le paquet Lucide du codebase.
- Photos de candidat et d'auto-école : emplacements prévus (avatars en initiales
  en attendant), à brancher sur l'upload réel.

## Fichiers du bundle

| Fichier | Rôle |
|---|---|
| `Permix.dc.html` | tous les artboards ; à ouvrir dans un navigateur |
| `support.js` | runtime nécessaire à l'affichage du fichier de maquettes (aucun intérêt pour l'implémentation) |

Dans `Permix.dc.html`, chaque artboard est un bloc `<div id="1a">`, `<div id="2a">`…
précédé de son étiquette (identifiant, titre, route) : chercher l'identifiant pour
retrouver l'écran. La grille du planning et ses données sont générées par la
classe `Component` en bas du fichier (`times`, `days`, sessions par jour) —
c'est un échafaudage de maquette, pas un modèle de données à reprendre.
