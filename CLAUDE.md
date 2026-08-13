# CLAUDE.md — Cahier de charge · **Gremah Anatomy**

> Ce fichier est la source de vérité pour toute session Claude Code sur ce dépôt.
> Lis-le en entier avant d'écrire du code. En cas de conflit entre une habitude
> générique et une règle ici, **cette règle gagne**.

---

## 1. Le projet en une phrase

**Gremah Anatomy** est un atlas d'anatomie humaine 3D interactif et bilingue
(FR/EN), **conçu et développé au Niger pour le monde entier** : une référence
internationale qui se trouve être nigérienne, et non un outil local.

### Le positionnement, en une distinction

Le Niger est l'**origine et l'identité** du projet, pas son plafond. La nuance
gouverne chaque décision :

| Ce que le Niger apporte                                              | Ce qu'il ne limite pas                                            |
| -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| L'exigence d'un smartphone d'entrée de gamme sur réseau intermittent | L'ambition visuelle : la 3D doit tenir la comparaison mondiale    |
| Le français comme langue de travail — mais l'anglais à parité        | L'audience : un étudiant à Lagos, Lyon ou Manille est un usager   |
| La palette du drapeau, traitée en surfaces satinées                  | Le contenu : anatomie universelle, pas une anatomie « régionale » |
| L'ancrage clinique local, en **complément** et jamais en substitut   | La rigueur : nomenclature internationale, sources de référence    |

La contrainte nigérienne est un **avantage d'ingénierie** : un atlas qui tient
30 fps sur un Android à 150 000 FCFA est fluide partout ailleurs. C'est ce qui
rend le projet meilleur que ses concurrents, pas ce qui le rend plus petit.

### Non-négociables

| #   | Exigence                                     | Traduction technique                                                                                                                                                                                                      |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **3D extrêmement renforcée et moderne**      | WebGPU/TSL en cible, WebGL2 en repli. Matériaux PBR + SSS, post-processing, coupes anatomiques, animations physiologiques. La 3D est le produit, pas une décoration.                                                      |
| 2   | **Frontend only, à une exception près**      | Le contenu, la 3D et la révision restent 100 % client (`localStorage` + IndexedDB). **Seuls les comptes** passent par 4 routes `app/api/` vers MongoDB Atlas — voir l'amendement §2 bis.                                  |
| 3   | **Bilingue FR/EN à parité**                  | Aucune des deux langues n'est un sous-produit de l'autre : même contenu, même soin, même complétude. Le glossaire **haoussa / zarma** est un apport culturel en plus, jamais un substitut.                                |
| 4   | **Origine nigérienne, exigence mondiale**    | La cible technique reste l'Android d'entrée de gamme sur réseau intermittent — c'est ce qui rend l'atlas fluide partout. L'ambition visuelle et scientifique, elle, se compare à l'international.                         |
| 5   | **Thème drapeau du Niger, huilé et moderne** | Palette orange / blanc / vert + disque solaire, traitée en surfaces satinées, dégradés profonds, verre dépoli — jamais en aplats « drapeau ». **Le mode clair est un thème à part entière, pas une inversion du sombre.** |
| 6   | **Couverture anatomique de référence**       | Un atlas de référence ne se juge pas sur son moteur mais sur ce qu'il couvre. Objectif : **tous les grands systèmes**, structures nommées en FR / latin TA / EN, sourcées.                                                |
| 7   | **Marque Gremah**                            | Contacts (§7) présents dans le footer, la page À propos et les métadonnées.                                                                                                                                               |

### §2 bis — Amendement : les comptes étudiants

Décidé au Sprint 11, en connaissance de cause. L'accès à l'atlas passe par un
compte (email + mot de passe) stocké dans **MongoDB Atlas**.

**Pourquoi ce n'est pas faisable sans serveur du tout.** Le driver MongoDB parle
un protocole binaire sur TCP : un navigateur ne sait ouvrir que HTTP et
WebSocket. La façade HTTPS d'Atlas (Data API / App Services) a été retirée en
septembre 2025. Et une clé d'API dans un bundle statique est publique, donc toute
la base serait lisible et modifiable par n'importe quel visiteur.

**Ce qui a été fait.** Quatre routes `app/api/` — `inscription`, `connexion`,
`deconnexion`, `moi` — exécutées par Vercel à la demande. Pas de serveur à
administrer, pas de service séparé. `output: "export"` a dû être retiré.

**Ce qui n'a pas changé.** Toutes les pages restent prérendues en statique ;
les modèles, images et contenus restent des fichiers ; la 3D, la progression et
la révision ne touchent jamais le réseau. Seules l'inscription, la connexion et
la lecture du profil sortent.

**Ce qu'on a perdu.** Le déploiement sur un hôte purement statique (GitHub
Pages, clé USB pour une salle de TP) ne porterait plus les comptes — le reste du
site y fonctionnerait toujours. Vercel devient l'hôte de référence.

**Règles qui en découlent, non négociables :**

- `app/lib/server/` ne doit **jamais** être importé depuis un fichier
  `"use client"` — un test l'interdit (`tests/comptes.test.mts`).
- Aucun secret sous un préfixe `NEXT_PUBLIC_` : ce préfixe inline la valeur dans
  le bundle du navigateur. Test également.
- Les mots de passe sont hachés par `scrypt` (`node:crypto`), jamais stockés
  ni journalisés en clair.
- La validation vit dans `app/lib/compte.ts`, module pur partagé par le
  formulaire et la route. Le serveur revalide **toujours** : la validation
  client est un confort, elle ne prouve rien.
- Le contenu anatomique reste consultable hors ligne une fois la session ouverte
  (Sprint 9). Un compte ne doit jamais devenir une condition d'accès au contenu
  déjà téléchargé.

---

## 2. État actuel du dépôt (point de départ)

Le dépôt est un fork **détaché de sa source** (remote `upstream` supprimé ; seul
`origin` = `github.com/Mahamadou-dev/Gremah-anatomy.git` subsiste). Il contient
un socle fonctionnel à refondre, pas à jeter.

### Ce qui existe et qu'on garde

```
app/
  components/AnatomyApp.tsx     # ~334 l. — shell UI : sélection d'organe, panneaux, modales
  components/OrganViewer.tsx    # ~188 l. — pont React ↔ moteur Three impératif
  lib/anatomy-data.ts           # ~311 l. — 9 organes typés + hotspots 3D
  lib/three/viewer.ts           # ~642 l. — moteur : scène, OrbitControls, depth-prepass,
                                #            plan de coupe, render-on-demand, isolation
  lib/three/loaders.ts          # ~213 l. — GLTFLoader + Meshopt, cache LRU (3), prefetch
  lib/three/hotspots.ts         # ~371 l. — points d'intérêt projetés en espace écran
  lib/three/dispose.ts          # libération GPU récursive
  lib/three/tsl-materials.ts    # stub (8 l.) — point d'entrée prévu pour TSL
  globals.css                   # ~562 l. — design tokens + layout
public/
  models/*.glb                  # 9 organes, ~29 Mo au total  ← à optimiser (Sprint 2)
  anatomy/<organe>/*.webp       # thumb / organ / microscopic / compare / location
  draco/, basis/                # décodeurs déjà en place mais non câblés
```

**Bonnes pratiques déjà présentes — à préserver :**

- **Render-on-demand** : la boucle ne dessine que si `dirty`. Toute nouveauté doit
  marquer la scène sale explicitement, jamais forcer un `requestAnimationFrame` continu.
- **Depth-prepass** : un pré-passage `colorWrite:false` résout les organes translucides
  en une seule surface pendant les fondus.
- **Normalisation `FIT_SIZE = 3.8`** : chaque modèle est recadré dans le même cube, ce
  qui rend les coordonnées de hotspots comparables entre organes. **Ne pas casser ce contrat.**
- **`IntersectionObserver` + `visibilitychange`** : rendu suspendu hors écran.
- **Pixel ratio décidé une fois** au démarrage (voir le commentaire dans `viewer.ts` :
  l'adaptation dynamique a déjà été essayée et retirée — ne pas la réintroduire).
- **Cache LRU 3 modèles + prefetch `priority:"low"`** au survol.

### Ce qu'on supprime (héritage starter, hors périmètre frontend-only)

`db/`, `drizzle/`, `drizzle.config.ts`, `worker/`, `build/`, `examples/`,
`vite.config.ts` (variante Cloudflare), `app/chatgpt-auth.ts`, `.openai/`,
les scripts `vinext`/`wrangler`/`db:generate` et leurs dépendances
(`drizzle-orm`, `drizzle-kit`, `wrangler`, `vinext`, `@cloudflare/*`,
`react-server-dom-webpack`, `@vitejs/plugin-rsc`).

### Dettes connues à traiter

- 29 Mo de `.glb` non compressés — inacceptable pour le Niger. Draco/KTX2 présents mais inutilisés.
- Contenu **en anglais** et non sourcé, ~15 champs par organe seulement.
- Aucune persistance, aucun quiz réel, aucun offline.
- `tsl-materials.ts` vide : la promesse « moderne » n'est pas tenue côté shaders.
- `package.json` s'appelle encore `site-creator-vinext-starter`.

---

## 3. Stack cible

| Couche    | Choix                                                            | Raison                                             |
| --------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| Framework | **Next.js 16** en `output: "export"` (statique pur)              | Déjà en place, App Router, zéro serveur au runtime |
| Langage   | TypeScript strict                                                | `strict: true`, pas de `any` implicite             |
| 3D        | **three.js** — `WebGPURenderer` + **TSL**, repli `WebGLRenderer` | Node materials, compute, post-processing moderne   |
| Animation | **GSAP** (déjà présent)                                          | Timelines caméra et transitions d'organes          |
| Style     | **Tailwind CSS 4** + variables CSS dans `globals.css`            | Tokens de thème centralisés                        |
| Icônes    | `lucide-react`                                                   | Déjà présent                                       |
| État      | React state + `zustand` si le shell le justifie                  | Pas de Redux                                       |
| Offline   | Service Worker + Cache API + IndexedDB                           | Modèles et contenu consultables hors ligne         |
| Tests     | `node --test` + Playwright (smoke + captures WebGL)              | Léger, sans infra                                  |

**Règle de dépendance :** toute nouvelle dépendance doit être justifiée par écrit
dans la PR. Budget bundle JS initial : **< 250 Ko gzip hors three.js**.

---

## 4. Architecture visée

```
app/
  (routes)/
    page.tsx              # Atlas — l'expérience 3D principale
    systemes/[slug]/      # Parcours par système (cardio, neuro, …)
    dissection/           # Table de dissection par couches
    reviser/              # Quiz, flashcards, mode examen
    a-propos/             # Marque Gremah + contacts
  engine/                 # ← ex app/lib/three, moteur 3D pur, zéro import React
    core/                 # renderer, scène, boucle, capacités GPU
    materials/            # TSL : SSS, fresnel, rayon-X, écorché, surbrillance
    passes/               # post-processing : bloom sélectif, SSAO, DOF, contour
    interaction/          # raycast, hotspots, plans de coupe, mesure
    loaders/              # GLTF + Draco + KTX2, LOD, budget mémoire
  content/                # données anatomiques (FR/EN), quiz, sources
  ui/                     # composants React, aucun accès direct à three
  state/
```

**Frontière stricte :** `engine/` ne connaît **jamais** React. `ui/` ne touche
**jamais** un objet `THREE.*` directement. Le seul pont autorisé est
`OrganViewer.tsx`, qui possède le cycle de vie du moteur (create → update → dispose).

---

## 5. Charte 3D — le niveau d'exigence

Une contribution 3D est acceptable seulement si elle coche ces cases :

1. **Deux chemins de rendu** : WebGPU si disponible, WebGL2 sinon, avec _parité
   visuelle raisonnable_ — pas d'écran noir, pas de fonctionnalité qui disparaît sans message.
2. **Trois profils de qualité** — `low` / `medium` / `high` — détectés au premier
   lancement et **surchargeables par l'utilisateur**. `low` doit tenir **30 fps sur un
   Android à 150 000 FCFA**. C'est le critère d'acceptation, pas une aspiration.
3. **Budget par frame** : ≤ 8 ms CPU en `medium`. Mesuré, pas supposé.
4. **Dispose complet** : tout ce qui est alloué est libéré. `renderer.info.memory`
   doit revenir à son niveau initial après changement d'organe.
5. **Render-on-demand respecté** : les animations continues (cœur qui bat, flux
   sanguin) déclarent une durée d'activité, jamais une boucle infinie non bornée.
6. **Accessibilité** : navigation clavier des hotspots, `prefers-reduced-motion`
   honoré (auto-rotation et parallaxe coupées), texte alternatif sur le canvas.

**Techniques attendues au fil des sprints :** SSS pour les tissus, matériau rayon-X
fresnel, plans de coupe multiples avec capping (surface de coupe pleine, pas creuse),
écorché par couches, bloom sélectif sur hotspot actif, SSAO, contour de sélection,
instancing pour les structures répétées (alvéoles, néphrons, villosités), animation
par squelette pour le cœur, particules GPU pour le flux sanguin et l'air.

---

## 6. Thème « drapeau du Niger, huilé »

Le drapeau : bande orange, bande blanche avec disque solaire orange, bande verte.
On en tire une palette, **pas une décoration**. Interdit : bandes tricolores en
en-tête, drapeau en filigrane, aplats saturés côte à côte.

```css
/* Tokens de référence — app/globals.css */
--ng-orange: #e05206; /* orange officiel du drapeau */
--ng-orange-warm: #ff7a2f; /* éclat, hover, accent */
--ng-orange-deep: #8a2f02; /* ombre chaude, dégradés */
--ng-green: #0db02b; /* vert officiel */
--ng-green-deep: #05451a; /* fonds profonds, cartes */
--ng-sun: #f4a31c; /* disque solaire — réservé à l'accent focal */
--ink-950: #0a0d0b; /* fond principal, vert-noir et non gris neutre */
--bone: #f7f4ee; /* le « blanc » : os, jamais #FFF pur */
```

**« Huilé » se traduit par :** dégradés à trois arrêts plutôt que couleurs plates ;
reflets spéculaires étroits sur les surfaces ; verre dépoli (`backdrop-filter`) sur
les panneaux ; grain subtil pour tuer le banding ; ombres chaudes (teintées orange)
et non noires. La 3D reprend cette logique : éclairage 3 points où la key est
solaire chaude, la fill vert-froid, la rim orange.

**Mode clair obligatoire** — beaucoup d'étudiants révisent en plein jour. Chaque
token a une contrepartie claire. Contraste **AA minimum** sur tout texte.

---

## 7. Marque & contacts (à inclure partout où la marque apparaît)

```
Gremah Anatomy — par Mahamadou Amadou Habou Gremah
Email      : mahamadou8877@gmail.com
LinkedIn   : https://linkedin.com/in/mahamadou-amadou-habou-gremah-54766632b
Site       : https://gremah.vercel.app
WhatsApp   : +216 55 299 368
```

Emplacements requis : footer global, page `/a-propos`, `app/layout.tsx`
(métadonnées `author`/`creator`), JSON-LD `Person`, `README.md`.
WhatsApp en lien `https://wa.me/21655299368`.

---

## 8. Contenu anatomique — règles

- **FR et EN à parité.** Le français reste la langue de rédaction — c'est celle de
  l'auteur et du cursus d'origine — mais l'anglais n'est pas un sous-produit :
  même complétude, même relecture. Un champ traduit à moitié est un champ absent.
  Un test de contenu vérifie qu'aucune structure publiée n'a de trou de traduction.
- **Nomenclature Terminologia Anatomica** pour les termes latins. C'est ce qui rend
  l'atlas lisible par un étudiant de n'importe quel pays.
- **Chaque affirmation clinique porte une source** (champ `source` dans le contenu).
  Pas de fait médical inventé. En cas de doute, on omet.
- **L'ancrage clinique nigérien est un enrichissement, jamais un filtre.** Le
  paludisme ou la drépanocytose figurent parce qu'ils sont cliniquement majeurs —
  au Niger comme ailleurs. L'anatomie décrite, elle, est universelle.
- **Glossaire haoussa / zarma** : un apport culturel réel et différenciant, posé
  à côté du contenu international, jamais à sa place.
- **Bandeau de non-responsabilité** : outil pédagogique, ne remplace ni un cours
  ni un avis médical.
- Toute erreur médicale est un **bug bloquant**, au même titre qu'un crash.

---

## 9. Conventions de travail

- **Commits** : Conventional Commits (`feat:`, `fix:`, `perf:`, `refactor:`, `docs:`).
- **Branches** : `sprint-N/<sujet>`. Jamais de commit direct sur `main` sans demande explicite.
- **Avant de dire « terminé »** : `npm run lint && npm run build` doivent passer.
- **Commentaires** : expliquer _pourquoi_, pas _quoi_. Le code existant suit déjà
  cette règle (voir le commentaire sur le pixel ratio dans `viewer.ts`) — l'imiter.
- **Pas de fichier généré committé** hors `public/`.
- **Assets 3D** : tout `.glb` ajouté doit être Draco + KTX2, **< 2 Mo** par organe.
- **Provenance des modèles.** Aucun modèle anatomique n'est inventé : ils viennent
  de sources ouvertes vérifiables — **BodyParts3D** (Database Center for Life
  Science, CC BY-SA 2.1 JP) et sa réorganisation **Z-Anatomy** (CC BY-SA 4.0).
  Trois conséquences non négociables :
  1. La licence est **share-alike** : les `.glb` dérivés restent CC BY-SA, même si
     le code du dépôt est MIT. Les deux licences doivent être distinguées dans le
     `README` et sur la page crédits.
  2. **L'attribution est obligatoire** et visible, pas enterrée dans un fichier.
  3. Chaque modèle porte sa provenance dans `public/models/manifest.json` :
     source, identifiant d'origine, licence. Un modèle sans provenance ne se
     déploie pas — un test le vérifie.

---

## 10. Feuille de route

Les sprints sont détaillés dans **[SPRINT.md](SPRINT.md)**. Consulte-le avant de
proposer un plan : un travail hors sprint courant doit être justifié ou reporté.

Deux règles y sont structurantes. **La numérotation est l'ordre d'exécution** :
un sprint ne s'ouvre que lorsque le précédent est clos, et le reste d'un sprint
partiel est reversé dans un sprint de la file plutôt que laissé en suspens — on
ne revient jamais en arrière. Et chaque sprint se termine par le **rituel de
clôture** : dépôt nettoyé, CI verte, fusion sur `main` par pull request, Suivi
mis à jour, en léguant à la CI le garde-fou de ce qu'il vient de livrer.

---

## 11. Définition de « terminé » pour le projet

**Couverture et contenu**

- [ ] **60+ structures** couvrant les onze grands systèmes, pas neuf organes isolés
- [ ] Contenu **complet en FR et en EN**, sans trou de traduction (vérifié par test)
- [ ] Chaque affirmation clinique sourcée ; provenance et licence de chaque modèle
- [ ] Glossaire haoussa / zarma en place

**Expérience**

- [ ] Une page d'accueil dont la 3D soutient la comparaison avec les meilleures
      vitrines du web — c'est la première preuve de sérieux que voit un visiteur
- [ ] Modes clair **et** sombre traités chacun comme un thème à part entière
- [ ] Un parcours d'apprentissage réellement interactif : on manipule, on teste,
      on se corrige — pas une fiche qu'on fait défiler

**Technique**

- [ ] 60 fps en `high` sur desktop, 30 fps en `low` sur Android d'entrée de gamme
- [ ] Lighthouse ≥ 95 en Performance et Accessibilité, WCAG AA
- [ ] Fonctionnel hors ligne après première visite
- [ ] Chargement initial < 5 s en 3G simulée
- [ ] Aucun appel réseau hors des quatre routes de compte (§2 bis)

**Marque**

- [ ] Marque et contacts Gremah présents et corrects
- [ ] Origine nigérienne assumée et visible, sans jamais restreindre l'audience
