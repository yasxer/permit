# Prompt de design — Permix

> Copiez tout ce qui suit dans Claude (skill `design`) pour obtenir le canvas de
> maquettes. Le dossier `design_handoff_permix/` doit être accessible : il porte
> le langage visuel déjà validé, et **rien ne s'en écarte**.

---

## 0. Mission

**Permix** est une application web de gestion d'auto-écoles pour l'Algérie. Deux
espaces dans la même application :

1. **Auto-école** — suit ses candidats, l'argent encaissé, le planning des
   séances et les séances d'examen.
2. **Super administrateur** — modère les auto-écoles, gère les comptes, les
   catégories de permis et la banque de questions du code.

Pas de vitrine marketing, pas d'écran candidat : personne ne s'inscrit seul,
l'auto-école saisit le dossier au comptoir. Le candidat passera par une
application mobile, hors périmètre.

**Un premier lot de maquettes existe déjà** (`design_handoff_permix/`, 12
artboards, haute fidélité, tokens définitifs). Ta mission :

1. **Lire `design_handoff_permix/Permix.dc.html` et `README.md` avant de
   dessiner quoi que ce soit.** Le HTML contient tous les artboards livrés côte
   à côte, chacun dans un bloc `<div id="1a">`, `<div id="2a">`… C'est la source
   de vérité pour les couleurs, les tailles, les espacements et la copie.
2. **Reprendre les 12 artboards livrés à l'identique** dans le nouveau canvas
   (mêmes ids, mêmes valeurs) — ils servent d'ancrage visuel.
3. **Dessiner les 22 écrans manquants** listés en §5, dans **exactement** ce
   langage : mêmes tokens, mêmes gabarits de shell, mêmes composants, même ton
   de copie. Aucune invention de style.

---

## 1. Design tokens — valeurs définitives

### Couleurs — proportion 60 / 30 / 10

| Rôle | Clair | Sombre | Usage |
|---|---|---|---|
| Page | `#F9FAFB` | `#0F1420` | 60 % |
| Carte | `#FFFFFF` | `#151B29` | la hiérarchie vient du décalage page/carte |
| Bordure carte | `#EBEDF1` | `#232B3B` | hairline 1 px |
| Séparateur interne | `#F3F4F6` / `#F4F5F7` | `#1E2636` | |
| Encre (`primary`) | `#1C2333` | texte `#F3F4F6` | 30 % — texte, titres, icônes, nav |
| Texte secondaire | `#374151` | `#C9CFDB` | |
| Texte sourd | `#6B7280` | `#9AA3B2` | |
| Texte très sourd | `#9CA3AF` | `#6E788C` | axes de graphique, aides |
| Accent (`brand`) | `#F5A623` | `#F5A623` (inchangé) | 10 % — CTA, onglet actif, focus |
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
- Sur `#1C2333`, `#F5A623` donne 7,75:1 — combinaison CTA de référence (texte
  `#1C2333` sur fond ambre).
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
  valeur écrite sur ou au-dessus de chaque barre.
- Grille horizontale seule : `#EEF0F3`, ligne de base `#DDE1E7`.

Pastilles du planning :
- Code / Conduite : `rgba(28,35,51,0.15)`, texte `#1C2333`
- Créneau : `rgba(245,166,35,0.20)`, texte `#6B4405`
- Perfectionnement : `rgba(22,163,74,0.20)`, texte `#145F32`
- Demi-heure fermée : `repeating-linear-gradient(45deg, oklch(0.637 0.208 25.3 / 0.10) 0 4px, transparent 4px 9px)` + libellé « Fermé » en `oklch(0.5 0.19 25.3)`

### Typographie

| Usage | Famille | Détail |
|---|---|---|
| Titres h1/h2/h3 | **Poppins** 500–800 | `letter-spacing: -0.02em` à `-0.03em` |
| Corps, tableaux, formulaires | **Inter** 400–700 | |
| Chiffres | Inter + `font-variant-numeric: tabular-nums` | montants, heures, téléphones |
| Code / identifiants | **JetBrains Mono** 400–500 | badges de catégorie, routes, identifiants |
| Arabe | **Noto Sans Arabic** 400–700 | titre **et** corps (Poppins n'a pas d'arabe) |

Jamais plus de deux familles par écran (le mono compte comme accessoire de
libellé).

| Rôle | Taille / poids |
|---|---|
| h1 de page (desktop) | Poppins 34 / 700, `-0.03em` |
| h1 mobile | Poppins 24 / 700 (19 dans l'en-tête compact) |
| Titre de carte | Poppins 17 / 600 |
| Titre de modale | Poppins 20–22 / 600 |
| Grand nombre (stat) | Poppins 36 / 700, `tabular-nums` |
| Grand nombre monétaire | Poppins 27 / 700 |
| Micro-libellé | Inter 11 / 600, `uppercase`, `0.09em`, `#6B7280` |
| Kicker de bandeau | JetBrains Mono 11, `0.12em`, `uppercase`, `#F5A623` |
| Corps | Inter 14 / 400–500 |
| Corps secondaire | Inter 13 / 400 |
| Aide de champ | Inter 11–12, `#9CA3AF` |
| Ligne de tableau | Inter 14 / 600 (nom), 14 / 400 (reste) |
| En-tête de tableau | Inter 11 / 600, `uppercase`, `0.08em` |

### Rayons

`--radius: 0.75rem` (12 px). Variantes : 6 px (étiquette), 8–9 px (badge mono,
pastille de planning), 10–11 px (icône en aplat, contrôle), **12 px** (bouton,
champ), **16 px** (carte, modale, artboard), 20 px (coin supérieur du contenu
mobile), 28 px (cadre du téléphone), 999 px (pastille de statut, avatar).

### Espacements

Échelle de 4 : 2 · 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 24 · 32 · 40 · 48 · 56.
Gouttières de page 32 px desktop / 16 px mobile · contenu centré `max-width: 90rem`
· grille de stats 4 colonnes `gap: 20px` · padding de carte 20–24 px desktop,
14–16 px mobile.

### États

- **Focus** : anneau ambre `box-shadow: 0 0 0 3px rgba(245,166,35,0.28)` +
  bordure `#F5A623` sur les champs ; `0 0 0 3px rgba(245,166,35,0.35)` sur les
  boutons.
- **Hover** : CTA ambre → `#E39A1D` · bouton secondaire → `#F3F4F6` · bouton
  fantôme sur nuit → `#242E44` · ligne de tableau → `#F9FAFB` · cellule de
  planning → `rgba(245,166,35,0.10)`.
- **Chargement** → squelettes qui reprennent la forme réelle (lignes de tableau,
  cartes de stats), **jamais de spinner plein écran**.
- **Vide** → icône ronde en aplat sourd + titre + une phrase + éventuellement le
  bouton d'action.
- **Erreur** → bandeau discret + bouton « Réessayer ».
- **Toast** en bas, coin de fin, fond `#1C2333`.
- Confirmation destructive → modale avec bouton plein rouge.
- Habillage de modale : fond `rgba(28,35,51,0.45)`, carte blanche rayon 16,
  padding 24, actions séparées par `border-top: 1px solid #F3F4F6`.

### Badges de statut — une seule échelle dans toute l'app

`en attente` ambre · `approuvé` / `actif` / `réussi` vert · `refusé` / `échoué`
rouge · `terminé` bleu nuit · `absent` / `annulé` gris.

---

## 2. Shell applicatif — le gabarit de toutes les pages connectées

### ≥ `lg` — barre supérieure + bandeau de page

Deux blocs bleu nuit contigus qui se lisent comme un seul en-tête :

1. **Barre supérieure**, hauteur 64 px, `padding: 0 32px`, fond `#1C2333` :
   - début : logo — carré 28 px, rayon 8, fond `#F5A623`, « P » Poppins 800 15 px
     `#1C2333`, puis « Permix » Poppins 17 / 700 `#F9FAFB`.
   - centre : items de navigation posés sur une **piste creusée**
     (`rgba(255,255,255,0.05)`, `padding: 4px`, rayon 14). Item : icône Lucide
     16 px + libellé Inter 14, `padding: 8px 14px`, rayon 10. Inactif `#C9CFDB`
     poids 500 ; **actif** fond `#F5A623`, texte et icône `#1C2333`, poids 600.
     « Demandes » porte un compteur : pastille 999 px, fond `#F5A623`, texte
     `#1C2333` 11 / 700 (inversé quand l'item est actif).
   - fin : sélecteur de langue (`FR`, bordure `#33405C`, rayon 10), bascule de
     thème (carré 33 px, icône lune), puis, après un séparateur
     `border-inline-start: 1px solid #33405C`, avatar 34 px `#33405C` + nom
     `#F9FAFB` 13 / 600 + rôle `#9AA3B2` 11.
2. **Bandeau de page**, même fond, `padding: 8px 32px 56px` : kicker mono ambre
   (nom de l'auto-école · wilaya, ou « Super administration » côté admin), h1
   Poppins 34 / 700 `#F9FAFB`, sous-titre `#9AA3B2` 14, actions en fin de ligne
   (bouton fantôme bordure `#33405C` + CTA ambre). **La recherche et le CTA
   principal d'une page vivent dans ce bandeau**, pas au-dessus du tableau.

Le contenu de page remonte sur le bandeau avec `margin-top: -40px` : la première
rangée de cartes chevauche le nuit.

### < `lg` — en-tête nuit + barre d'onglets en bas

**Pas de rail latéral, pas de sidebar.**
- En-tête `#1C2333`, `padding: 12px 18px 18px` : ligne de statut système, ligne
  d'identité (logo ou bouton retour, nom de l'école / titre, avatar), puis le
  titre h1 Poppins 19–24 / 700 en blanc.
- Contenu `#F9FAFB`, `border-radius: 20px 20px 0 0`, `margin-top: -10px`.
- **Barre d'onglets** en bas : fond `#1C2333`, `border-radius: 20px 20px 0 0`,
  `padding: 10px 8px 14px`, grille de 5 colonnes. Item : icône 20 px + libellé
  10 / 500 `#9AA3B2`, hauteur min 48 px. **Actif** : icône et libellé `#F5A623`,
  fond `rgba(245,166,35,0.14)`, rayon 12. Compteur ambre en position absolue
  (`top: 5px; inset-inline-end: 16px`).
- 5 onglets auto-école : Bord · Demandes · Candidats · Planning · Examens
  (Diplômés passe dans le menu utilisateur).
- 5 onglets admin : Bord · Auto-écoles · Utilisateurs · Catégories · Questions.

### Navigation — libellés et icônes Lucide

- **Auto-école** : Tableau de bord `LayoutDashboard` · Demandes `Inbox` ·
  Candidats `GraduationCap` · Diplômés `Award` · Planning `CalendarDays` ·
  Examens `ClipboardCheck`.
- **Admin** : Tableau de bord `LayoutDashboard` · Auto-écoles `Building2` ·
  Utilisateurs `Users` · Catégories `Tags` · Questions `CircleHelp`.

### Écrans hors shell

Auth, `/ecole/pending` et `/ecole/complete-profile` n'ont **ni barre de
navigation ni barre d'onglets** : page `#F9FAFB`, logo Permix seul en tête,
sélecteur de langue et bascule de thème au coin de fin.

---

## 3. Contraintes transversales

- **Trilingue AR / FR / EN**, l'arabe bascule tout le document en RTL :
  propriétés logiques partout (`inset-inline-*`, `padding-inline-*`,
  `border-inline-*`, `margin-inline-*`), **aucun `left` / `right` figé** ;
  chevrons directionnels en miroir ; **nombres, heures, montants, téléphones et
  SVG de graphique restent `dir="ltr"`**.
  Vocabulaire : لوحة التحكم · الطلبات · المترشحون · المتخرجون · البرنامج ·
  الامتحانات ; étapes القانون / المناورة / السياقة.
- **Monnaie** : `12 000,00 DA` — espace insécable en séparateur de milliers,
  virgule décimale, `tabular-nums`.
- **Téléphones** : `05 55 xx xx xx`, toujours `dir="ltr"`.
- **Wilayas** : select de 58 entrées. **Jour d'examen** : samedi → jeudi.
- **Semaine ouvrée** : samedi → jeudi (6 colonnes de planning).
- Données plausibles et algériennes : noms arabes **et** latins (Benali Karim /
  كريم بن علي), wilayas réelles (Alger, Oran, Constantine, Sétif, Blida),
  montants cohérents (forfait B ≈ 45 000 DA, perfectionnement ≈ 1 200–1 500 DA/h).
  **Pas de lorem ipsum.**

---

## 4. Artboards déjà livrés — à reprendre tels quels

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

Rappels de gabarit tirés de ces écrans, à réutiliser dans les nouveaux :

- **Carte de statistique** : micro-libellé, grand nombre Poppins 36 / 700 (27 pour
  un montant), icône Lucide dans un carré 38 px `rgba(28,35,51,0.06)` rayon 11 au
  coin de fin, puis une ligne de contexte séparée par
  `border-top: 1px solid #F3F4F6` (« +6 dossiers ce mois »).
- **Table** : en-tête `#FBFCFD`, colonnes en `fr` + une colonne de 36 px pour le
  chevron, ligne cliquable `:hover #F9FAFB`, pagination en pied
  (« 1 – 8 sur 87 candidats », page active en pastille nuit).
- **Grille de planning** : `grid-template-columns: 76px repeat(6, 1fr)`,
  `grid-template-rows: repeat(20, 42px)` (08:00 → 17:30 par demi-heures), colonne
  d'heures en mono 11 px figée au bord de début, séance placée en
  `grid-row: N / span S` (S = 2 pour le perfectionnement d'1 h), `margin: 2px 3px`,
  rayon 9, `padding: 5px 8px`.
- **Aire mensuelle** : `viewBox 0 0 1020 236`, cubiques lissées, repère pointillé
  vertical sur le mois courant, point terminal blanc cerclé d'ambre 2,4 px, mois
  courant en gras `#1C2333` dans l'axe, valeur du mois en fin d'en-tête de carte.
- **Grille de cartes** (demandes) : 3 colonnes, `gap: 20`, segments de filtre avec
  compteur au-dessus.

---

## 5. Artboards à dessiner — 22 écrans

Numérote-les dans la continuité (`3a`, `3b`, …) et étiquette chaque artboard avec
son **identifiant + titre + route**.

### Série 3 — Espace auto-école, le reste (7 artboards)

**3a — `/ecole/students/[id]` — Fiche candidat (1440).**
Bandeau nuit : kicker « Candidats · Dossier », h1 = nom latin, sous-titre = nom
arabe ; en fin de ligne, boutons fantôme « Identifiants » et « Modifier », menu
`…` contenant « Supprimer le dossier » (destructif).
Contenu, deux colonnes `1.15fr 1fr` :
- **En-tête de dossier** (carte pleine largeur) : photo 64 px, nom arabe Poppins
  22, nom latin dessous, badge de catégorie mono, **badge d'étape** (pastille
  nuit « Créneau ») et badge de statut.
- **Informations personnelles** : liste clé/valeur (jamais un tableau) —
  téléphone `ltr`, e-mail, date et lieu de naissance, nationalité, groupe
  sanguin, adresse.
- **Inscription** : prix de la formation · perfectionnement (« 3 séances ·
  4 500,00 DA ») · **Total dû** · Payé · **Restant** mis en avant en Poppins 27.
  Sous le badge d'étape, la note `#6B7280` : « L'étape avance toute seule : un
  examen réussi fait passer le candidat à la suivante. » — **aucun interrupteur
  de progression manuelle.**
- **Historique des versements** : liste de lignes (montant `tabular-nums`, date,
  note, « Enregistré par Amine K. »), CTA ambre « Ajouter un versement ».
  **Aucune icône crayon ni corbeille sur un versement** : le registre est
  inscriptible seulement.

**3b — Modale « Ajouter un versement » (520).**
Montant (suffixe DA), note (« Ex. deuxième tranche »), rappel du solde restant.
Dessine **la variante en erreur** : « Le montant dépasse le solde restant. »

**3c — `/ecole/completed` — Diplômés (1440).**
Même table qu'en `2e`, **en lecture seule** : Nom · Téléphone · Catégorie ·
« Permis obtenu le » · pas de chevron, pas d'action. Bandeau sans CTA.
Prévoir l'état vide : « Aucun candidat diplômé pour le moment ».

**3d — `/ecole/exams` — Séances d'examen (1440).**
Liste de cartes, la plus proche en tête : pastille de date 62 px `#1C2333` (mois
mono ambre + jour Poppins 24 / 700 blanc) reprise de la carte « Prochain examen »
du dashboard, date en toutes lettres Poppins 22 / 600, badge de statut
(`Programmé` ambre / `Terminé` nuit), ligne de détail « 18 candidats · 6 code ·
7 créneau · 5 conduite », chevron. CTA de bandeau « Créer un examen ».

**3e — Modale « Créer un examen » (520).**
La date proposée en **puces de dates suggérées** (les prochaines occurrences du
jour d'examen de l'école), la puce choisie bordée ambre sur
`rgba(245,166,35,0.10)`. Note `#6B7280` : « Votre jour d'examen est mercredi. »
Variante en erreur : « Un examen est déjà programmé à cette date. »

**3f — `/ecole/exams/[id]` — Moment 1 : remplir la liste (1440).**
*Une auto-école ne tient pas « un examen de code » et « un examen de conduite »
des jours différents : elle tient **la** séance d'un matin, et chaque candidat y
passe l'étape à laquelle il est arrivé.*
Assistant : un pas **par catégorie et par étape** — toute la catégorie A (code,
puis créneau, puis conduite), et seulement ensuite la catégorie B. En-tête de
pas : « Étape 2 sur 5 » + barre de progression ambre + titre du pas
« Catégorie A — Créneau ». Corps : liste de candidats à cocher (avatar, nom
latin + arabe, téléphone), « Tout sélectionner », compteur « 4 sélectionné(s) ».
Actions : « Valider et continuer », puis « Terminer la liste » au dernier pas.
Un pas sans personne n'est pas affiché.

**3g — `/ecole/exams/[id]` — Moment 2 : saisir les résultats (1440).**
La même page devient la table des inscrits : Candidat · Catégorie · **Étape** ·
et trois boutons segmentés devant chacun — **Réussi** (vert) / **Échoué**
(rouge) / **Absent** (gris), avec la valeur choisie en plein et les deux autres
en contour sourd. **Chaque clic s'enregistre seul : aucun bouton « Enregistrer »
en bas de page.** Le statut de la séance suit sa liste — `Programmé` tant qu'un
résultat manque, `Terminé` quand ils y sont tous : montre une ligne encore vide
et le badge `Programmé`. Boutons de bandeau « Modifier les candidats » et
« Supprimer l'examen ». Ajoute une note de bas de carte qui dit que le résultat
fait avancer l'étape (code → créneau → conduite → permis obtenu, dossier clos).

### Série 4 — Onboarding auto-école (3 artboards)

**4a — `/ecole/complete-profile` (1440, hors shell).**
Bandeau d'avertissement ambre en tête (`rgba(245,166,35,0.12)`, bordure
`rgba(245,166,35,0.4)`, texte `#8A5A06`) : « Complétez votre profil pour accéder
aux autres pages. » Puis trois cartes empilées, largeur 760 centrée :
- **Identité** : nom de l'auto-école, nom du directeur, téléphone
  (`0X XX XX XX XX`), adresse, wilaya (select 58), véhicule d'apprentissage,
  jour d'examen (select samedi → jeudi).
- **Photo de l'auto-école** : zone de dépôt en bordure pointillée, aperçu,
  boutons Remplacer / Retirer, mention « JPG, PNG ou WebP — 5 Mo maximum ».
- **Tarifs** : une ligne par catégorie (A, A1, B, C, D, E, F) avec champ « Prix
  en DA » ; aide « Laissez vide une catégorie que vous ne proposez pas. » Puis,
  séparé, **tarif perfectionnement par heure** (obligatoire). Enfin
  **Statistiques de réussite** : réussites / échecs + « Chiffres affichés aux
  candidats sur votre fiche publique. »
Barre d'action collante en bas : « Enregistrer ».

**4b — `/ecole/complete-profile` mobile (390).** Cartes empilées pleine largeur,
tarifs en lignes à deux colonnes, CTA fixé en bas.

**4c — `/ecole/pending` (1440, hors shell).** Deux variantes côte à côte sur le
même artboard :
- *en attente* : carte centrée 520, icône ronde ambre (horloge) 56 px, « Votre
  demande est en cours d'examen », phrase d'attente, coordonnées de contact,
  bouton fantôme « Se déconnecter ».
- *refusée* : même carte, icône ronde rouge, motif du refus dans un encadré
  `oklch(0.637 0.208 25.3 / 0.13)`.

### Série 5 — Authentification (4 artboards)

Gabarit commun : page `#F9FAFB`, carte blanche unique 420 px centrée, rayon 16,
bordure `#EBEDF1`, logo Permix (carré ambre + mot) au-dessus, sélecteur de langue
et bascule de thème au coin de fin de la page. **Aucune illustration décorative** :
la marque tient dans le logo et le bouton ambre.

**5a — `/login` (1440 + 390 sur le même artboard).**
« Connexion » Poppins 22, sous-titre sourd. E-mail, mot de passe (icône œil),
lien « Mot de passe oublié ? » en fin de ligne, CTA ambre pleine largeur « Se
connecter », pied « Pas de compte ? S'inscrire ». Dessine aussi le **bandeau
d'erreur** « Identifiants invalides » et le bandeau ambre « Ce lien a expiré ».

**5b — `/register` (1440).** Inscription **auto-école uniquement** : nom de
l'auto-école, nom complet du responsable, téléphone, e-mail, mot de passe,
confirmation. Sous le mot de passe, **liste de règles qui se cochent en direct**
(8 caractères, une majuscule, un chiffre, un caractère spécial) — coche verte
`#16A34A` / point sourd. À droite du même artboard : l'écran de suite « Vérifiez
votre boîte mail » (icône ronde ambre, adresse rappelée, « Renvoyer le lien »).

**5c — `/forgot-password` + `/reset-password` (deux cartes sur un artboard).**
Oubli : un champ e-mail, CTA « Envoyer le lien », état de succès « Lien envoyé »
avec icône verte et retour à la connexion. Réinitialisation : nouveau mot de
passe + confirmation, mêmes règles en direct.

**5d — États système : 404 et Erreur (1440).**
Deux blocs : `404` en Poppins 96 / 800 dans un aplat sourd `rgba(28,35,51,0.06)`,
une phrase, bouton « Retour au tableau de bord » ; et l'écran d'erreur, icône
ronde rouge, « Une erreur est survenue. Réessayez. », bouton « Réessayer ».

### Série 6 — Super administrateur (6 artboards)

Même shell, kicker de bandeau « Super administration », nav admin.

**6a — `/admin/dashboard` (1440).**
- **4 cartes de statistiques** au gabarit `1b` : Auto-écoles au total (ligne de
  contexte « 38 approuvées · 9 en attente · 4 refusées ») · Candidats ·
  Titulaires du permis · Revenus de la plateforme.
- **Aire mensuelle « Inscriptions par mois »** (12 mois, série unique, sans
  légende) — spécification `viewBox`/lissage/repère identique à `1b`.
- **Barres horizontales « Auto-écoles par wilaya »** : les noms sont longs et il
  y en a 58 → barres horizontales triées, **top 10** seulement, valeur en fin de
  barre, lien « Voir les 58 wilayas » en pied de carte.

**6b — `/admin/auto-ecoles` (1440).**
Segments de filtre **avec compteur** (Toutes 51 / En attente 9 / Approuvées 38 /
Refusées 4) au gabarit de `2c`, recherche dans le bandeau. Table : Nom (avec
photo/initiales) · Directeur · Wilaya · Téléphone `ltr` · Statut (badge) · Créée
le · actions. Les lignes **en attente** portent directement « Approuver » (ambre,
compact) et « Refuser » (contour rouge). Pagination en pied.

**6c — `/admin/auto-ecoles/[id]` — Fiche école (1440).**
Bandeau nuit portant le nom de l'école, le badge de statut et la wilaya ; actions
« Approuver » / « Refuser » en fin de ligne. Contenu en deux colonnes :
- **Coordonnées** : directeur, téléphone, adresse, wilaya, véhicule
  d'apprentissage, jour d'examen, propriétaire du compte (nom + e-mail).
- **Tarifs** : une ligne par catégorie proposée + tarif perfectionnement.
- **Réussite** : réussites / échecs et le taux — anneau ou barre unique, teinte
  unique, pas de camembert multicolore.
- **Volume** : candidats actifs, diplômés (deux mini-cartes de stat).
- Variante à montrer : bandeau vert « Approuvée le 12 mars 2026 » ou bandeau
  rouge « Refusée le … — motif : … ».

**6d — `/admin/users` (1440).**
Table : avatar + nom (latin/arabe) · E-mail · Rôle (badge — Super administrateur
nuit / Auto-école ambre / Candidat gris) · Permis obtenu (✓ vert / —) · Inscrit
le. Recherche dans le bandeau, segments de filtre par rôle avec compteur.

**6e — `/admin/categories` (1440) + modale (520 sur le même artboard).**
Table courte : Code (badge mono plein `#1C2333`) · Libellé AR (en `dir="rtl"`,
Noto Sans Arabic) · Libellé FR · Libellé EN · Ordre · actions (modifier /
supprimer). CTA de bandeau « Ajouter une catégorie ».
Modale : code, les trois libellés (le champ arabe en RTL), ordre d'affichage.
Deuxième modale : suppression, icône ronde rouge, bouton plein rouge.

**6f — `/admin/questions` (1440) + modale d'édition (760).**
Trois onglets segmentés **Questions · Plaques · Carrefours** au gabarit des
onglets de `2a`. Sous les onglets : filtre de langue (AR / FR / EN), filtre de
source (API / Manuelle), recherche.
**Grille de cartes** 4 colonnes : l'image en tête (les plaques et carrefours sont
d'abord des images, ratio 4:3, fond `#F3F4F6`), l'énoncé 14 / 500 sur deux lignes
tronquées, badges de langue et de source en pied, actions au survol.
**Modale d'édition** : type, langue, énoncé (textarea), image (zone de dépôt),
puis **les réponses en liste dynamique** — chaque ligne = champ de libellé +
image facultative + **radio « Bonne réponse »** + croix pour retirer ; bouton
« Ajouter une option ». Montre les validations : « Au moins deux options »,
« Indiquez la bonne réponse ».

### Série 7 — Thème sombre (2 artboards)

**7a — `/ecole/planning` en thème sombre (1440).** Le même écran que `2a`, page
`#0F1420`, cartes `#151B29`, bordures `#232B3B`, texte `#F3F4F6`, **barre de
navigation inchangée** (`#1C2333`) et **ambre inchangé**. Les pastilles du
planning gardent leur teinte, remontées en opacité pour rester lisibles sur
sombre.

**7b — `/ecole/dashboard` en thème sombre (1440).** Même écran que `1b` :
graphique en série unique `#F5A623`, grille et axes remontés
(`#232B3B` / `#6E788C`), rampe des étapes inversée si nécessaire pour garder le
contraste.

---

## 6. Livraison attendue

- Un canvas unique, artboards étiquetés **`id` + titre + route**, groupés par
  série (1 → 7) et rangés en lignes.
- Les 12 artboards livrés repris à l'identique, puis les 22 nouveaux.
- Fidélité : couleurs, typographie, espacements, rayons, états et copie **au
  pixel**, avec les valeurs de §1. Les interactions sont rendues par des **états
  dessinés** (repos / focus / erreur / vide / chargement), pas par du JS.
- Chaque écran de liste porte **son état plein**, et l'artboard correspondant
  montre au moins une fois l'état vide ou un squelette de chargement.

---

## 7. Anti-patterns — refus immédiat

- ❌ Une grande surface ambre (bandeau, en-tête, carte pleine).
- ❌ Une ombre portée pour séparer des cartes — décalage de fond + hairline.
- ❌ Une sidebar ou un rail latéral : desktop = barre supérieure + bandeau nuit,
  mobile = barre d'onglets en bas.
- ❌ Un CTA ou une recherche posés au-dessus du tableau plutôt que dans le
  bandeau nuit.
- ❌ Une troisième famille typographique.
- ❌ Une légende sur un graphique à série unique ; un camembert multicolore.
- ❌ Des couleurs de graphique choisies « à l'œil » : contraste ≥ 3:1 sur la
  surface, toujours.
- ❌ Un bouton « Enregistrer » sur la page de résultats d'examen.
- ❌ Un interrupteur de progression manuelle sur la fiche candidat.
- ❌ Une icône « modifier » ou « supprimer » sur un versement.
- ❌ `left` / `right` figés, ou un montant / téléphone qui se retourne en arabe.
- ❌ Du lorem ipsum, ou des données non algériennes.
