# CLAUDE.md — Cahier de charge · **Gremah Anatomy**

> Ce fichier est la source de vérité pour toute session Claude Code sur ce dépôt.
> Lis-le en entier avant d'écrire du code. En cas de conflit entre une habitude
> générique et une règle ici, **cette règle gagne**.

---

## 1. Le projet en une phrase

**Gremah Anatomy** est un atlas d'anatomie humaine 3D interactif, **100 % frontend**,
conçu pour les **étudiants en médecine du Niger** : utilisable sur un smartphone
d'entrée de gamme, en connexion faible, et hors-ligne après la première visite.

### Non-négociables

| #   | Exigence                                          | Traduction technique                                                                                                                                                                      |
| --- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **3D extrêmement renforcée et moderne**           | WebGPU/TSL en cible, WebGL2 en repli. Matériaux PBR + SSS, post-processing, coupes anatomiques, animations physiologiques. La 3D est le produit, pas une décoration.                      |
| 2   | **Frontend only, à une exception près**           | Le contenu, la 3D et la révision restent 100 % client (`localStorage` + IndexedDB). **Seuls les comptes** passent par 4 routes `app/api/` vers MongoDB Atlas — voir l'amendement §2 bis.  |
| 3   | **Public cible : étudiants en médecine du Niger** | Interface **française d'abord** (FR par défaut, EN secondaire, vocabulaire **Hausa/Zarma** en bonus terminologique). Contenu aligné sur le cursus PCEM/DCEM. Mode data-light obligatoire. |
| 4   | **Thème drapeau du Niger, huilé et moderne**      | Palette orange / blanc / vert + disque solaire, traitée en surfaces satinées, dégradés profonds, verre dépoli — jamais en aplats « drapeau ».                                             |
| 5   | **Marque Gremah**                                 | Contacts (§7) présents dans le footer, la page À propos et les métadonnées.                                                                                                               |

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

- **FR = langue source.** L'anglais est une traduction, jamais l'inverse.
- **Nomenclature Terminologia Anatomica** pour les termes latins.
- **Chaque affirmation clinique porte une source** (champ `source` dans le contenu).
  Pas de fait médical inventé. En cas de doute, on omet.
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

---

## 10. Feuille de route

Les 10 sprints sont détaillés dans **[SPRINT.md](SPRINT.md)**. Consulte-le avant
de proposer un plan : un travail hors sprint courant doit être justifié ou reporté.

---

## 11. Définition de « terminé » pour le projet

- [ ] 20+ organes/structures, contenu FR sourcé
- [ ] 60 fps en `high` sur desktop, 30 fps en `low` sur Android d'entrée de gamme
- [ ] Lighthouse ≥ 95 en Performance et Accessibilité
- [ ] Fonctionnel hors ligne après première visite
- [ ] Chargement initial < 5 s en 3G simulée
- [ ] Zéro appel réseau vers un backend
- [ ] Marque et contacts Gremah présents et corrects
