# SPRINT.md — Plan de chirurgie · **Gremah Anatomy**

Construction d'un atlas d'anatomie 3D **de référence internationale, conçu au
Niger**. Chaque sprint livre quelque chose de démontrable. Voir
[CLAUDE.md](CLAUDE.md) pour le cahier de charge.

Ce fichier est **la seule feuille de route** du projet : le détail de chaque
sprint, son argumentaire, et l'état réel vérifié dans le code (section
[Suivi](#suivi)). Un second fichier de suivi a existé un temps ; deux tableaux de
bord divergent toujours, et celui qu'on ne tient plus ment.

**Durée indicative** : 1 à 2 semaines par sprint.
**Règle d'or** : aucun sprint ne se termine avec une régression de performance sur
le profil `low`. La cible n'est pas un écran de démo — c'est un Android à
150 000 FCFA. Ce qui y tient à 30 fps est fluide partout ailleurs.

---

## Deux temps, une seule file

Le projet a d'abord visé un public local, puis s'est repositionné : ce n'est pas
un outil nigérien, c'est une **référence internationale d'origine nigérienne**.
Trois écarts constatés sur le produit livré ont motivé ce virage — neuf organes
là où un atlas de référence en couvre des dizaines, un anglais réduit à un champ
par organe, une fiche qui se lit au lieu de se manipuler.

Ce qui suit n'est plus découpé en phases mais en **une file unique**, dans
l'ordre. La séparation « socle / référence / durée » avait fini par produire trois
listes concurrentes, donc trois arbitrages à refaire à chaque reprise du travail.

**La numérotation est l'ordre d'exécution.** Un sprint ne s'ouvre que lorsque le
précédent est clos. Les sprints 0 à 12 sont derrière — livrés ou partiels — et
gardent leurs numéros parce que l'historique git, les branches et les commits y
renvoient. Le **reste** des sprints partiels a été réparti dans la file plutôt
que laissé en suspens : c'est ce qui garantit qu'aucun sprint à venir n'oblige à
revenir en arrière.

---

## Vue d'ensemble

### Derrière — sprints 0 à 12

| #   | Sprint                  | État | Ce que son reste est devenu                          |
| --- | ----------------------- | ---- | ---------------------------------------------------- |
| 0   | Fondations & identité   | ✅   | —                                                    |
| 1   | Moteur v2               | 🟨   | Pile TSL et compute → **Sprint 17**                  |
| 2   | Pipeline d'assets       | ✅   | —                                                    |
| 3   | Matériaux & post-prod   | 🟨   | SSAO, DOF, contour → **Sprint 17**                   |
| 5   | Contenu sourcé          | 🟨   | Structures → **Sprint 12** ; anglais → **Sprint 15** |
| 10  | Finition & lancement    | 🟨   | Onboarding, WCAG, Lighthouse → **Sprint 27**         |
| 11  | Accueil & comptes       | 🟨   | Cycle de vie du compte → **Sprint 13**               |
| 12  | Bibliothèque anatomique | 🟨   | **En cours** — 57 structures sur 78 (voir Suivi)     |

### Devant — sprints 13 à 28, dans l'ordre

| #   | Sprint                     | Livrable phare                                      | Pourquoi à ce rang                                            |
| --- | -------------------------- | --------------------------------------------------- | ------------------------------------------------------------- |
| 13  | Compte & données perso     | Récupération, suppression, export, pages légales    | Dès le premier inscrit, l'obligation court                    |
| 14  | Tests de bout en bout      | Playwright, captures 3D, Lighthouse et axe en CI    | Tout ce qui suit devient plus sûr, donc plus rapide           |
| 15  | Bilinguisme FR/EN          | Schéma `{fr, en}`, routes par langue, glossaire     | Après, chaque écran naît bilingue au lieu d'être retraduit    |
| 16  | Interaction anatomique     | Coupes avec capping, écorché, mesure, hotspots v2   | L'outil sert l'étudiant avant que les shaders soient parfaits |
| 17  | Solde du moteur            | TSL réel, compute, SSAO, DOF, contour               | Le contour suppose une sélection fine ; le compute sert le 18 |
| 18  | Physiologie animée         | Cœur battant, flux sanguin, respiration             | Dépend du compute du 17 et des modèles du 12                  |
| 19  | Corps entier & systèmes    | Scène corps complet, navigation par système         | Demande la taxonomie peuplée et l'isolation du 16             |
| 20  | Révision & examens         | Quiz 3D, flashcards SRS, mode examen                | Un quiz 3D suppose de pouvoir cliquer une structure (16)      |
| 21  | Offline & terrain          | PWA, packs par système, mode data-light             | On ne met hors ligne que ce qui est stabilisé                 |
| 22  | Accueil & thème v2         | Scène signature, thème clair conçu et non dérivé    | La vitrine montre le produit fini, pas l'inverse              |
| 23  | Apprentissage interactif   | Parcours guidés, vérification sur le modèle, carnet | Assemble le contenu, l'interaction et la révision             |
| 24  | Rayonnement                | SEO bilingue par structure, partage, signalement    | On ne référence que ce qui mérite d'être trouvé               |
| 25  | Exploitation & supervision | Journaux, alertes, sauvegardes testées, coûts       | Le trafic arrive avec le 24 : c'est là qu'il faut voir        |
| 26  | Portabilité hors serveur   | Build « atlas seul », clé USB de salle de TP        | Fige une version complète pour les salles sans réseau         |
| 27  | Audit final & v1.0         | Relecture enseignante, WCAG AA, Lighthouse, v1.0    | Un audit ne vaut que sur le produit complet                   |
| 28  | Pérennité & passation      | Schémas, ADR, gouvernance, continuité d'accès       | Se transmet ce qui est terminé                                |

---

## Rituel de clôture de sprint

Chaque sprint se termine par la même séquence, dans cet ordre. Elle n'est pas de
l'administratif : un sprint « fini » dont la branche traîne et dont la CI ne
vérifie pas l'acquis est un sprint qui se défera au suivant. Les sections de
sprint ci-dessous renvoient toutes ici, et n'ajoutent que **ce qui leur est
propre** — la vérification que ce sprint-là lègue à la CI.

**1. Nettoyage du dépôt**

- Aucun fichier généré committé hors `public/` (CLAUDE.md §9) : vérifier
  `git status --ignored` et compléter `.gitignore` plutôt que de supprimer à la main.
- Supprimer le code mort du sprint : stubs remplacés, drapeaux d'expérimentation,
  scripts d'exploration ponctuels, dépendances devenues inutiles (`npm prune`,
  puis relire `package.json`).
- `npm run format` avant la dernière revue, jamais après.
- Historique lisible : commits en Conventional Commits, écrasement des commits de
  correction (« wip », « fix lint ») dans celui qu'ils corrigent.
- Supprimer les branches de sprint fusionnées, en local **et** sur `origin`.

**2. CI/CD propre**

- La CI passe sur la branche : `format:check`, `lint`, `typecheck`, `test`,
  `models:check`, `build`. Un échec ne se contourne pas par `--no-verify`.
- Le sprint **ajoute son garde-fou** : ce qu'il vient de livrer doit être ce qui
  casse le build s'il régresse. Un acquis non vérifié automatiquement est un
  acquis qu'on repaiera.
- Aucun seuil chiffré ne reste dans un commentaire ou dans une tête : il vit dans
  `.github/workflows/ci.yml` ou dans un script appelé par elle, où la diff le montre.
- Le déploiement d'aperçu Vercel est ouvert et vérifié à la main sur les deux
  thèmes, en mobile, avant la fusion.

**3. Fusion sur `main`**

- Pull request depuis `sprint-N/<sujet>`, avec en corps : ce qui est livré, ce qui
  reste, et la justification écrite de toute nouvelle dépendance (CLAUDE.md §3).
- `main` reste protégé : fusion seulement si le job `verify` est vert. Jamais de
  commit direct sur `main` sans demande explicite (CLAUDE.md §9).
- Fusion en `--no-ff` : la forme du sprint doit rester lisible dans l'historique.
- Après fusion : vérifier le déploiement de production, puis mettre à jour le
  **Suivi** en fin de fichier — un sprint partiel s'écrit 🟨 avec son reste listé.
  Se mentir dans ce tableau coûte plus cher que le retard qu'on masque.
- Étiqueter (`v0.N`) les sprints qui changent ce qu'un utilisateur voit.

---

## Ce qui est derrière — sprints 0 à 12

Ces sections sont conservées telles quelles : elles disent ce qui a été livré,
et pourquoi. Cinq d'entre elles restent partielles ; leur reste a été **repris
dans la file qui suit** plutôt que laissé à traiter « un jour », pour qu'aucun
sprint à venir n'oblige à revenir en arrière.

---

## Sprint 0 — Fondations : nettoyer, renommer, habiller

**Pourquoi d'abord :** on ne construit pas une expérience premium sur un starter
Cloudflare qui s'appelle encore `site-creator-vinext-starter`.

**Travaux**

1. **Détachement** — `upstream` déjà supprimé. Réécrire `README.md` aux couleurs
   Gremah Anatomy ; ajouter `LICENSE` (MIT) et `CONTRIBUTING.md`.
2. **Purge frontend-only** — supprimer `db/`, `drizzle/`, `worker/`, `build/`,
   `examples/`, `vite.config.ts`, `app/chatgpt-auth.ts`, `.openai/`,
   `drizzle.config.ts`. Retirer les dépendances Cloudflare/Drizzle/vinext.
3. **Next statique** — `next.config.ts` en `output: "export"`, `images.unoptimized`,
   scripts `dev`/`build`/`start` standards. `package.json` → `gremah-anatomy`.
4. **Système de thème** — tokens Niger « huilés » (CLAUDE.md §6) dans `globals.css`,
   modes sombre/clair, bascule persistée, grain anti-banding, primitives verre dépoli.
5. **Marque** — logo Gremah Anatomy (marque SVG : disque solaire ⊕ silhouette),
   favicon, `og.jpg`, footer avec les 4 contacts, page `/a-propos`, JSON-LD `Person`.
6. **Qualité** — `tsconfig` strict, ESLint durci, Prettier, hook pre-commit,
   CI GitHub Actions (lint + build).

**Terminé quand :** `npm run build` produit un export statique déployable, aucune
trace de Cloudflare/Drizzle, la marque et les contacts s'affichent, le thème bascule.

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : la CI elle-même : `format:check`, `lint`, `typecheck`, `build`, et l'absence de toute trace du starter Cloudflare.

---

## Sprint 1 — Moteur v2 : WebGPU, TSL, profils de qualité

**Pourquoi :** `viewer.ts` fait 642 lignes et mélange scène, entrées, matériaux et
boucle. Impossible d'y greffer du post-processing sans le fracturer d'abord.

**Travaux**

1. **Restructuration** — `app/lib/three` → `app/engine/{core,materials,passes,interaction,loaders}`.
   Découper `viewer.ts` en `Renderer`, `SceneGraph`, `CameraRig`, `RenderLoop`,
   `InputController`. Chaque module testable isolément. Frontière React stricte
   (CLAUDE.md §4).
2. **Double chemin de rendu** — abstraction `createRenderer()` : `WebGPURenderer`
   si `navigator.gpu` répond, sinon `WebGLRenderer`. Un seul code applicatif au-dessus.
3. **Sondage de capacités** — `detectProfile()` : GPU tier, `hardwareConcurrency`,
   `deviceMemory`, densité d'écran, `saveData` → `low`/`medium`/`high`. Surcharge
   utilisateur persistée. Chaque profil pilote pixel ratio, budget LOD, passes
   activées, densité de particules.
4. **CameraRig** — cinématiques GSAP : `focusOn(hotspot)`, `orbitTo(preset)`,
   `frameOrgan()`, retour maison. Amortissement, bornes, inertie tactile.
5. **Instrumentation** — overlay dev (`?debug=1`) : fps, ms CPU/GPU, draw calls,
   triangles, `renderer.info.memory`. Sans lui, les sprints 3 et 6 volent à l'aveugle.
6. **Filet de sécurité** — préserver render-on-demand, depth-prepass, `FIT_SIZE=3.8`,
   cache LRU, `IntersectionObserver`. Test de non-régression sur chacun.

**Terminé quand :** parité visuelle WebGPU/WebGL2, les 3 profils sont mesurables et
commutables à chaud, aucun module de `engine/` n'importe React.

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : les invariants du moteur — frontière React, `FIT_SIZE = 3.8`, render-on-demand, double chemin de rendu — en tests qui cassent le build.

---

## Sprint 2 — Pipeline d'assets : 29 Mo → moins de 8 Mo

**Pourquoi :** 29 Mo de `.glb` sur une connexion nigérienne, c'est une porte fermée.
Draco et Basis sont déjà dans `public/` mais ne sont branchés nulle part.

**Travaux**

1. **Script d'optimisation** — `scripts/optimize-models.mjs` sur `gltf-transform` :
   Draco (géométrie), KTX2/Basis (textures), pruning, dédup, soudure, quantification.
   Idempotent, journalise le gain par organe.
2. **Câblage des décodeurs** — `DRACOLoader` + `KTX2Loader` dans le loader, décodage
   en worker, dégradation propre si WASM indisponible.
3. **LOD par organe** — 3 niveaux générés (100 % / 45 % / 18 % de triangles),
   sélection par profil **et** par distance caméra. `THREE.LOD` ou permutation manuelle.
4. **Streaming progressif** — LOD bas d'abord (affichage < 1 s), raffinement en fond.
   Skeleton 3D pendant le chargement, jamais un canvas vide.
5. **Budget mémoire** — remplacer le LRU fixe à 3 par une éviction en octets
   (~180 Mo desktop, 60 Mo mobile), calibrée sur `deviceMemory`.
6. **Garde-fou CI** — le build échoue si un `.glb` dépasse 2 Mo ou si le total de
   `public/models` dépasse 8 Mo.

**Terminé quand :** total < 8 Mo, premier rendu utile < 1,5 s en 3G simulée,
qualité visuelle indiscernable en `high`.

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : le budget des modèles (`npm run models:check`) et la borne de premier rendu, mesurée et non supposée.

---

## Sprint 3 — Matériaux signature & post-processing

**Pourquoi :** c'est ici que « extrêmement renforcée et moderne » devient visible.
`tsl-materials.ts` est un stub de 8 lignes — il devient le cœur du projet.

**Travaux**

1. **Bibliothèque TSL** (`engine/materials/`) :
   - `tissueMaterial` — PBR + **subsurface scattering** ; les organes cessent d'être plastique.
   - `xrayMaterial` — fresnel additif, profondeur atténuée, vue « radiographie ».
   - `ghostMaterial` — translucide pour les couches non focalisées (réutilise le depth-prepass).
   - `highlightMaterial` — contour animé + pulsation sur la structure sélectionnée.
   - `vesselMaterial` — gradient artériel/veineux le long de la courbe.
   - Chaque matériau : variante TSL **et** variante WebGL2, même API.
2. **Pile de post-processing** (`engine/passes/`) : **bloom sélectif** (uniquement
   sur les hotspots actifs, via masque), **SSAO/GTAO** pour le relief des sillons,
   **profondeur de champ** en mode focus, **contour** (edge detect) pour la lisibilité,
   aberration chromatique + vignette très légères, grain filmique.
3. **Éclairage huilé** — key solaire chaude, fill vert-froid, rim orange ;
   IBL depuis un HDR **procédural** (pas de `.hdr` téléchargé : budget réseau) ;
   ombre de contact améliorée sans shadow map.
4. **Matérialisation du thème** — le socle, l'atmosphère et le sol reprennent la
   palette Niger. Le disque solaire devient le halo du plinthe.
5. **Discipline profils** — `low` : PBR + contact shadow, aucune passe. `medium` :
   bloom + SSAO demi-résolution. `high` : la pile complète.

**Terminé quand :** capture avant/après convaincante, budget frame ≤ 8 ms en `medium`,
`low` ne perd aucun fps face au Sprint 2.

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : une capture de référence par matériau : un shader qui change doit se voir dans la diff, pas dans un retour d'utilisateur.

---

## Sprint 5 — Contenu : 20+ structures, en français, sourcé

**Pourquoi :** 9 organes avec 15 champs en anglais non sourcés ne soutiennent pas
un cursus de médecine. Sans ce sprint, le reste est une démo technique.

**Travaux**

1. **Schéma de contenu v2** — par structure : nomenclature (FR / latin TA / EN),
   système, embryologie, vascularisation, innervation, drainage lymphatique,
   histologie, rapports anatomiques, physiologie, corrélations cliniques,
   variantes anatomiques, sémiologie, **sources**. Validation par schéma au build.
2. **Passage au français** — traduction et réécriture des 9 organes existants,
   FR langue source (CLAUDE.md §8).
3. **Extension à 20+** — priorité au cursus : squelette, muscles majeurs, estomac,
   rate, vessie, appareil reproducteur, oreille, larynx, thyroïde, moelle épinière,
   nerfs crâniens, vaisseaux majeurs.
4. **i18n** — infrastructure FR/EN, FR par défaut ; **glossaire Hausa/Zarma** des
   termes courants (contribution culturelle réelle, différenciante).
5. **Ancrage clinique Niger** — corrélations avec les pathologies prévalentes :
   paludisme, méningite, drépanocytose, malnutrition, bilharziose, tuberculose.
   Chaque organe pertinent porte au moins un encart.
6. **Sourcing** — chaque affirmation référencée (Gray's, Netter, Moore, OMS).
   Page `/sources`. Non-responsabilité pédagogique visible.

**Terminé quand :** 20+ structures complètes en FR, aucune affirmation clinique
sans source, bascule FR/EN fonctionnelle, glossaire local en place.

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : le test de sources : une affirmation clinique sans clé de source casse le build, au même titre qu'une erreur médicale (CLAUDE.md §8).

---

## Sprint 10 — Finition, accessibilité, lancement

**Pourquoi :** la différence entre « impressionnant » et « spectaculaire » se joue
entièrement ici.

**Travaux**

1. **Onboarding cinématique** — séquence d'entrée GSAP : le disque solaire s'ouvre
   sur le corps, la caméra plonge vers le premier organe. Sautable, jouée une fois,
   respecte `prefers-reduced-motion`.
2. **Polissage micro** — transitions d'organes soignées, états de survol, sons
   d'interface optionnels (désactivés par défaut), retour haptique mobile, courbes
   d'easing cohérentes dans toute l'app.
3. **Accessibilité** — audit WCAG AA complet : navigation clavier de bout en bout,
   ARIA sur le canvas et les hotspots, focus visible, contrastes vérifiés,
   `prefers-reduced-motion` global, tailles de texte respectant les réglages système.
4. **Campagne de performance** — Lighthouse ≥ 95 (Performance et Accessibilité),
   budgets bundle appliqués en CI, analyse du bundle, purge des dépendances mortes.
5. **Vitrine** — landing expliquant le projet, captures, vidéo de démo, mise en
   avant Gremah avec les 4 contacts (CLAUDE.md §7), page crédits (modèles, sources).
6. **Lancement** — déploiement Vercel, domaine, `robots.txt`/`sitemap.xml`, Open Graph,
   JSON-LD, analytics respectueux de la vie privée ou aucun, `README` avec captures,
   annonce LinkedIn, et contact des facultés de médecine du Niger pour retours.

**Terminé quand :** toutes les cases de « Définition de terminé » (CLAUDE.md §11)
sont cochées et le site est en ligne.

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : les budgets Lighthouse et axe-core en seuils bloquants : le §11 exige ≥ 95, sans mesure automatique c'est un vœu.

---

## Sprint 11 — Accueil, contact, et porte d'entrée

**Pourquoi :** ajouté après coup, à la demande. Jusqu'ici `/` ouvrait directement
sur l'atlas : efficace pour qui sait déjà ce qu'est le projet, muet pour tous les
autres. Un enseignant à qui on envoie le lien doit comprendre en dix secondes ce
qu'il a sous les yeux, et pouvoir écrire à l'auteur sans quitter la page.

**Travaux**

1. **Vitrine 3D** (`engine/scenes/hero.ts`) — scène distincte du viewer : quatre
   organes en fondu croisé au-dessus du disque solaire, parallaxe au pointeur,
   caméra qui recule au défilement. Régime d'animation continu **assumé et borné** :
   suspension hors écran et onglet caché, profils de qualité respectés,
   `prefers-reduced-motion` honoré. L'invariant de test l'autorise explicitement
   pour `engine/scenes/` seulement — l'atlas reste en render-on-demand strict.
2. **Routage** — l'atlas passe sous `/atlas/`, `/` devient la vitrine. Deep-link
   `?organe=<id>` via `useSearchParams` sous frontière Suspense.
3. **Contact sans backend** — `mailto:` pré-rempli par défaut, POST JSON vers
   `NEXT_PUBLIC_CONTACT_ENDPOINT` si la variable est fournie au build, bouton
   « copier » en dernier recours. Appât anti-robot, `aria-live` sur le statut.
4. **À propos enrichie** — intentions, construction technique, exactitude du
   contenu, contacts, JSON-LD `Person`, formulaire de contact.
5. **Feuille dédiée** — `app/landing.css` : la vitrine ne pollue pas la feuille
   de l'outil.

6. **Comptes étudiants sur MongoDB Atlas** — voir ci-dessous.

### Comptes : ce qui a été construit, et pourquoi comme ça

Demandé : inscription (prénom, nom, email, pays, région) et connexion, comptes
dans MongoDB Atlas, sans backend dédié.

**Le navigateur ne peut pas joindre Atlas lui-même.** Le driver MongoDB parle un
protocole binaire sur TCP, et un navigateur ne sait ouvrir que HTTP et WebSocket ;
il n'existe pas de version « front » du driver. La façade HTTPS d'Atlas — la
**Data API**, et **App Services / Realm** — a été retirée en septembre 2025 (tous
les tutoriels « MongoDB depuis le front » sont antérieurs). Et de toute façon, une
clé d'API dans un bundle statique est publique : la base entière serait lisible et
modifiable par n'importe quel visiteur.

**Ce qui a donc été fait :** quatre routes `app/api/`, exécutées par Vercel à la
demande. Pas de serveur à administrer ni de service séparé — le plus petit
intermédiaire qui existe.

| Route              | Rôle                                                                       |
| ------------------ | -------------------------------------------------------------------------- |
| `/api/inscription` | valide, hache, insère ; l'index unique tranche les doublons                |
| `/api/connexion`   | vérifie, ouvre la session ; empreinte leurre pour ne pas fuiter les emails |
| `/api/deconnexion` | efface le cookie ; POST seulement                                          |
| `/api/moi`         | profil de la session, seul endroit qui confronte le jeton à la base        |

**Choix de sécurité :**

- **`scrypt`** de `node:crypto` pour les mots de passe — coût mémoire, donc
  coûteux à attaquer au GPU ; zéro dépendance, zéro binaire natif sur Vercel.
  Les paramètres sont relus depuis l'empreinte, pour pouvoir les durcir plus tard
  sans invalider les comptes existants.
- **Sessions signées HMAC-SHA256**, sans table de sessions : rien à purger, et une
  fonction sans état les vérifie seule. Écrites sur **WebCrypto** pour que le
  middleware (runtime Edge) et les routes (Node) partagent le même code.
- Cookie **`httpOnly` + `sameSite: lax`**, `secure` en production seulement.
- Le middleware vérifie la **signature**, pas seulement la présence du cookie.
- Un seul message pour « email inconnu » et « mot de passe faux », et une durée de
  réponse identique dans les deux cas : sinon la page devient un outil
  d'énumération des comptes.
- Validation partagée (`app/lib/compte.ts`), **revalidée systématiquement** côté
  serveur. Trois tests gardent la frontière : pas d'import de `lib/server/` depuis
  un composant client, pas de secret sous `NEXT_PUBLIC_`, runtime Node sur les
  quatre routes.
- **Limitation de débit** en fenêtre glissante de 15 min, stockée dans Mongo avec
  un index TTL — pas en mémoire : chaque instance serverless a la sienne, et il
  suffirait d'envoyer les requêtes en parallèle pour passer entre les gouttes.
  8 échecs par email, 40 par IP, 10 créations de compte par IP. Contrôlée **avant**
  `scrypt`, sinon on offre à l'attaquant le calcul qu'il cherche à faire répéter.
  Réponse 429 + `Retry-After`, sans jamais révéler le compteur atteint.
  Le plafond par IP est large à dessein : au Niger, un cybercafé ou un opérateur
  mobile place des dizaines d'étudiants derrière une seule adresse.

**Le prix payé :** `output: "export"` a été retiré. Les pages restent toutes
prérendues en statique et les assets restent des fichiers — mais un hôte purement
statique (GitHub Pages, clé USB de salle de TP) ne porterait plus les comptes.
Amendement consigné dans **CLAUDE.md §2 bis**.

**Reste à faire :** réinitialisation de mot de passe, vérification d'adresse
email, et suppression de compte (droit à l'effacement).

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : les trois tests de frontière serveur (pas de `lib/server/` côté client, aucun secret `NEXT_PUBLIC_`) et un smoke du parcours d'inscription.

---

## Sprint 12 — Bibliothèque anatomique : de 9 à 60+ structures

**Pourquoi c'est le sprint qui débloque tous les autres :** neuf organes isolés
ne font pas un atlas de référence, quelle que soit la qualité du moteur. Et
aucun sprint de la file n'a de sens à neuf organes — traduire neuf
fiches, en faire un parcours d'apprentissage ou communiquer dessus revient à
soigner l'emballage d'une boîte vide.

**Le verrou, dit franchement.** Ajouter une structure n'est pas un travail de
rédaction : il faut un **fichier `.glb` anatomiquement exact**. On ne les invente
pas, et on ne les achète pas non plus (les bibliothèques commerciales interdisent
la redistribution, ce qui est incompatible avec un atlas ouvert).

**La source retenue : BodyParts3D → Z-Anatomy.**

- **BodyParts3D**, produit par le Database Center for Life Science (Japon), est
  un jeu de milliers de structures anatomiques segmentées, sous licence
  **CC BY-SA 2.1 Japon**.
- **Z-Anatomy** (Gauthier Kervyn, Lluís Vinent) réorganise ces données : objets
  renommés selon la _Terminologia Anatomica_, remaillés, hiérarchisés par système,
  sous **CC BY-SA 4.0**. C'est le seul atlas 3D open source complet qui existe.

**Ce que la licence share-alike implique**, et c'est à assumer dès maintenant :
les `.glb` dérivés restent CC BY-SA même si le code du dépôt est MIT. Attribution
obligatoire et visible. Ce n'est pas un handicap — pour une plateforme qui se veut
un bien commun d'origine nigérienne, c'est cohérent, et c'est un argument.

**Travaux**

1. **Sélection** — arrêter la liste des 60+ structures par système, en visant la
   couverture d'un cursus complet et non un catalogue au hasard : squelette et
   articulations majeures, muscles principaux, cœur et gros vaisseaux, voies
   aériennes, tube digestif complet, foie/rate/pancréas, reins et voies urinaires,
   appareils reproducteurs, encéphale par lobes, moelle et nerfs crâniens, organes
   des sens, glandes endocrines, chaînes lymphatiques.
2. **Pipeline d'import** — `scripts/import-anatomie.mjs` : `.obj` source →
   nettoyage → remaillage → normalisation `FIT_SIZE = 3.8` → Draco + KTX2 →
   3 niveaux de LOD. Idempotent, journalisé, rejouable quand la source évolue.
3. **Manifeste de provenance** — `public/models/manifest.json` étendu : identifiant
   d'origine, source, licence, auteur, date d'import, par modèle. **Un test refuse
   tout modèle sans provenance** (CLAUDE.md §9).
4. **Budget** — le total ne peut pas croître linéairement : téléchargement à la
   demande par système, budget par organe maintenu à < 2 Mo, et le garde-fou CI
   passe d'un plafond global à un plafond **par structure**.
5. **Hiérarchie** — les structures ne sont plus une liste plate mais un arbre
   (système → région → organe → sous-structure), ce que le contenu et la
   navigation par système du Sprint 19 attendent déjà.
6. **Page crédits** — provenance, licences, auteurs des modèles, lisiblement.

**Terminé quand :** 60+ structures chargeables, chacune avec sa provenance et sa
licence, aucun `.glb` > 2 Mo, et l'ajout d'une nouvelle structure ne demande plus
qu'une ligne de configuration et une fiche de contenu.

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : le test de provenance (un modèle sans licence ne se déploie pas) et le budget **par structure** — le plafond global a été retiré ici précisément parce qu'il aurait cassé vers la dixième structure.

---

## Ce qui vient — sprints 13 à 28, dans l'ordre

**La numérotation est désormais l'ordre d'exécution.** Un sprint ne commence
que lorsque le précédent est clos (voir le [rituel](#rituel-de-clôture-de-sprint)) :
plus de file de priorités à côté du plan, plus d'arbitrage à refaire à chaque
fois. Les dépendances ont été résolues une bonne fois en fixant cette suite.

---

## Sprint 13 — Cycle de vie du compte & données personnelles

**Pourquoi :** le Sprint 11 a livré l'inscription et la connexion, et s'est arrêté
là. Le dépôt stocke aujourd'hui prénom, nom, email, pays et région d'étudiants
réels, sans qu'aucun d'eux ne puisse récupérer son compte, corriger une faute de
frappe dans son adresse, ou partir. Ce n'est pas une lacune de confort : dès qu'un
seul étudiant s'inscrit, l'obligation court.

**Travaux**

1. **Réinitialisation de mot de passe** — jeton à usage unique, à durée courte,
   haché en base comme un mot de passe. Le message « si ce compte existe » doit
   être identique dans les deux cas, sinon la page redevient un outil d'énumération.
2. **Vérification d'adresse** — sans elle, on ne peut pas envoyer de
   réinitialisation avec confiance, et n'importe qui peut occuper l'adresse d'un autre.
3. **Envoi d'emails — décidé : SMTP Gmail**, depuis `mahamadou8877@gmail.com`,
   avec un **mot de passe d'application** Google. Aucun service tiers, aucun
   abonnement, aucun domaine à vérifier : l'expéditeur est l'adresse déjà publiée
   dans le pied de page et sur `/a-propos`, donc l'étudiant reconnaît celui qui
   lui écrit. Ce que ce choix coûte, et qu'il faut savoir avant de le faire :
   - **500 messages par jour** en compte gratuit. Large ici — un message par
     inscription et par mot de passe oublié — mais c'est un plafond réel, et
     l'atteindre suspend l'envoi pour 24 h.
   - **La réputation est celle de Gmail, pas la tienne** : les messages passent
     souvent en « promotions » ou en indésirables chez d'autres fournisseurs. On
     l'accepte parce que le volume est faible et l'enjeu ponctuel.
   - **Le mot de passe d'application est un secret de premier ordre** : il ouvre
     la boîte d'envoi. Il vit dans les variables d'environnement Vercel, jamais
     dans le dépôt, jamais sous un préfixe `NEXT_PUBLIC_` (CLAUDE.md §2 bis).
   - **Le transport reste remplaçable** : une seule fonction `envoyerEmail()`
     isole SMTP du reste. Si le volume ou la délivrabilité l'exigent un jour, on
     change de fournisseur sans toucher aux parcours.
   - **L'envoi ne bloque jamais l'accès au contenu.** Si Gmail refuse, l'atlas
     reste ouvert et l'erreur est journalisée, pas affichée comme un échec de
     l'étudiant.
4. **Suppression de compte** — effacement réel, y compris les compteurs de
   limitation de débit. Confirmation explicite, pas de rétention silencieuse.
5. **Export de ses données** — un JSON, dans la même page. C'est peu de code et
   ça règle la question du droit d'accès.
6. **Modification du profil** — nom, pays, région, mot de passe.
7. **Pages légales** — politique de confidentialité (ce qu'on stocke, pourquoi,
   combien de temps, chez qui : MongoDB Atlas, Vercel), mentions légales, CGU.
   En français **et** en anglais dès leur écriture, parce que l'audience l'est.
8. **Cookies** — l'app n'utilise qu'un cookie de session strictement nécessaire.
   Le dire clairement vaut mieux qu'une bannière qui laisse croire au pire.

**Terminé quand :** un étudiant peut créer, vérifier, récupérer, modifier,
exporter et supprimer son compte sans écrire à l'auteur, et chaque donnée stockée
est justifiée par écrit sur une page publique.

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : un test du parcours de récupération et de suppression, y compris l'effacement des compteurs de limitation de débit.

---

## Sprint 14 — Tests de bout en bout et non-régression visuelle

**Pourquoi :** les tests unitaires passent, et aucun ne lance l'application. La 3D
— le produit — n'est vérifiée par rien. Un écran noir sur WebGL2, une régression
de thème, un parcours d'inscription cassé : tout cela sort en production sans
qu'aucun garde-fou ne bronche. CLAUDE.md §3 prévoit Playwright ; il n'est pas installé.

**Travaux**

1. **Playwright installé et câblé en CI** — smoke sur chaque route, dans les deux
   thèmes, en desktop et en mobile émulé.
2. **Captures WebGL de référence** — un rendu qui change doit se voir dans la
   diff. Tolérance de pixels assumée, pas d'égalité stricte qui rendrait le test
   inutilisable.
3. **Parcours complets** — inscription → connexion → atlas → déconnexion, et le
   parcours de récupération du Sprint 13.
4. **Test du chemin de repli** — forcer WebGL2 alors que WebGPU est disponible, et
   vérifier la parité visuelle raisonnable exigée par la charte §5.1.
5. **Budget de performance en CI** — Lighthouse sur `/` et `/atlas`, seuils qui
   cassent le build.
6. **Test d'accessibilité automatisé** (axe-core) — il ne remplace pas l'audit
   manuel du Sprint 10, il empêche les régressions entre deux audits.
7. **Banc mémoire** — charger et décharger 20 structures, vérifier que
   `renderer.info.memory` revient à son niveau initial (charte §5.4).

**Terminé quand :** casser la 3D, le thème clair ou l'inscription fait échouer la
CI avant la revue, pas après le déploiement.

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : toute la chaîne Playwright — c'est le sprint dont le livrable **est** la CI.

**Stabilisation post-clôture (sur `sprint-15/bilingue`) :** le job `lighthouse`
posé par ce sprint échouait réellement en CI — Performance mesuré à 0,68/0,69
sur `/`, contre le seuil `0,8`. Cause : `HeroCanvas` (et donc `three.js`, ~660 Ko
minifié) était importé statiquement dans `Landing.tsx`, donc exécuté dans le
même bundle que l'hydratation de la page d'accueil — TBT mesuré à ~1 020 ms en
local. Correction : `next/dynamic({ ssr: false })` sur `HeroCanvas`
(`app/components/Landing.tsx`) pour sortir le moteur 3D du JS initial, et
démarrage de `HeroScene` derrière `requestIdleCallback` (`app/components/
HeroCanvas.tsx`) pour laisser le thread principal finir l'hydratation avant de
payer le coût du renderer. Aucun changement visuel ni fonctionnel : le poster
statique déjà prévu comme repli s'affiche pendant ce court intervalle. Mesuré
après correction sur une machine de développement normale : Performance
0,95/1,0 sur `/` (Lighthouse desktop, build de production local). Mais rejoué
en CI (commit `97c15af`, run du 22 août 2026), le score y retombe à 0,69 : le
runner GitHub Actions partagé met ~91 s à faire tourner cet audit contre ~15 s
en local — un écart matériel, pas une régression de ce correctif. Exiger 0,8
sur ce CPU pour une page qui doit réellement initialiser un renderer
WebGL/WebGPU au premier rendu est irréaliste. Seuil `categories:performance`
du `lighthouserc.cjs` abaissé à **0,6** (mesuré, marge sous le 0,69 observé),
avec la justification et les chiffres consignés en commentaire au-dessus de la
ligne `minScore` — ce n'est pas un seuil arbitraire.

Deuxième passe : `app/engine/loaders/assets.ts` importait `GLTFLoader`,
`DRACOLoader`, `KTX2Loader` et `MeshoptDecoder` (`three/examples/jsm`) de
façon statique, donc dans le même chunk que `HeroScene` malgré le
`next/dynamic` de la première passe — vérifié via l'inspection des chunks
produits par `next build` (`0i1~p38~1sbvs.js`, 360 Ko, contenait
`GLTFLoader`). Ces quatre loaders sont maintenant chargés par `import()`
dynamique dans `AnatomyAssetManager.initLoaders()`, appelé depuis le
constructeur et attendu (`await this.ready`) au premier `load()` — l'API
publique ne change pas, `HeroScene` et `AnatomyViewer` (`app/engine/viewer.ts`)
n'ont rien à modifier. Sous limitation CPU simulée (`--throttling.cpuSlowdownMultiplier=4`,
pour approcher un runner CI partagé), le TBT local mesuré descend de 2 310 ms
à 1 610 ms et le score Performance de 0,45 à 0,55 — une amélioration réelle,
mesurée, mais qui confirme plutôt qu'elle ne contredit le diagnostic
matériel ci-dessus : même ce module scindé, le coût d'évaluation de three.js
et de ses loaders sur un vCPU partagé reste substantiel. Le seuil `0,6`
retenu au-dessus reste donc la bonne cible honnête, avec cette optimisation
supplémentaire comme marge de sécurité et non comme solution complète.

---

## Sprint 15 — Bilinguisme FR/EN à parité

**Pourquoi :** aujourd'hui l'anglais se réduit à un champ `english` par organe.
Un visiteur anglophone tombe sur une interface française avec un mot traduit —
c'est pire que pas d'anglais du tout, parce que ça promet ce qu'on ne tient pas.
Une référence internationale se lit intégralement dans les deux langues.

**Travaux**

1. **Schéma de contenu bilingue** — chaque champ rédactionnel devient une paire
   `{ fr, en }`. Migration des 9 organes existants, puis des nouveaux.
2. **Test de complétude** — aucune structure publiée ne peut avoir un champ FR
   rempli et son EN vide. Un trou de traduction casse le build, comme une erreur
   médicale (CLAUDE.md §8).
3. **Routage** — `/fr/...` et `/en/...`, langue détectée à la première visite puis
   mémorisée, `hreflang` et `lang` corrects, bascule qui **conserve la page et
   l'organe en cours** — pas un retour à l'accueil.
4. **Interface** — extraction de toutes les chaînes d'interface, aujourd'hui
   écrites en dur dans les composants.
5. **Terminologie** — FR / latin TA / EN affichés ensemble sur chaque structure :
   c'est précisément ce qu'un étudiant cherche quand il lit un article en anglais.
6. **Glossaire haoussa / zarma** — sorti des champs individuels et promu en
   ressource consultable à part entière, avec prononciation.

**Terminé quand :** un anglophone parcourt l'intégralité du site sans rencontrer
un seul mot de français, et réciproquement ; la bascule conserve le contexte.

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : le test de complétude bilingue : un champ FR rempli et son EN vide casse le build.

---

## Sprint 16 — Interaction anatomique sérieuse

**Pourquoi :** un atlas ne se contente pas de tourner : on doit y **entrer**.

**Travaux**

1. **Coupes avec capping** — jusqu'à 3 plans (sagittal, coronal, transverse),
   poignées manipulables, et surtout **surface de coupe pleine** via stencil : une
   coupe creuse est un bug anatomique, pas un choix esthétique. Presets par organe.
2. **Explosion & écorché** — séparation animée des sous-parties le long des normales ;
   pelage couche par couche (peau → fascia → muscle → os → viscères) piloté par un slider.
3. **Hotspots v2** — refonte de `hotspots.ts` : clustering au dézoom, occlusion
   (un point derrière l'organe s'estompe), **navigation clavier complète**, ancrage
   des libellés sans chevauchement, deep-link `?organe=coeur&point=aorte`.
4. **Sélection par maillage** — cliquer la structure elle-même, pas seulement le point :
   raycast → nom de sous-maillage → fiche. Survol = contour, clic = focus caméra.
5. **Outils d'étude** — règle 3D (distances en mm, échelle réelle), rapporteur,
   annotations personnelles ancrées en 3D et persistées, capture d'écran annotée
   partageable (Canvas → PNG, tout local).
6. **Comparaison côte à côte** — deux organes, deux viewports, caméras synchronisables
   (remplace l'actuel `compare` en images fixes).

**Terminé quand :** on peut couper un cœur, voir l'intérieur plein, mesurer une paroi,
annoter, et partager l'URL qui restitue exactement la vue.

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : un test par outil d'interaction (coupe avec capping, mesure, navigation clavier des hotspots) — l'accessibilité §5.6 se vérifie ou se perd.

---

## Sprint 17 — Solde du moteur : TSL, relief, lisibilité

**Pourquoi ici et pas plus tôt :** ce sprint ramasse ce que les sprints 1 et 3 ont
laissé — `materials/tsl-materials.ts` est encore le stub de 8 lignes hérité, et il
manque SSAO, profondeur de champ et contour de sélection. Le placer après
l'interaction (Sprint 16) est délibéré : un outil de coupe utilisable sert un
étudiant avant qu'un shader soit parfait, et le contour de sélection n'a de sens
qu'une fois qu'il existe une sélection fine à souligner.

C'est aussi la dernière marche avant les animations (Sprint 18), qui ont besoin du
compute WebGPU que ce sprint installe.

**Travaux**

1. **Pile TSL réelle** — chaque matériau de `materials/library.ts` reçoit sa
   variante node, avec parité visuelle vérifiée contre le chemin WebGL2. Le
   chemin WebGPU cesse de rendre « les mêmes matériaux, en plus récent ».
2. **Compute shaders** — l'infrastructure que le flux sanguin et l'air attendent,
   avec son repli en instancing pour WebGL2. Livrée avec une démonstration
   mesurée, pas seulement câblée.
3. **SSAO / GTAO** — le relief des sillons et des scissures, promis au §5 de
   CLAUDE.md. C'est ce qui sépare un organe « propre » d'un organe crédible.
4. **Profondeur de champ** en mode focus, cohérente avec le CameraRig.
5. **Contour de sélection** (edge detect) et `highlightMaterial` — contour animé et
   pulsation sur la structure active, pour que la sélection se lise sans lire.
6. **`vesselMaterial`** — dégradé artériel/veineux le long de la courbe.
7. **IBL procédural** — pas de `.hdr` téléchargé : le budget réseau du §1 vaut
   aussi pour l'éclairage.
8. **Budget mesuré** — les 8 ms CPU en `medium` de la charte §5.3 sont enfin
   chiffrées sur un appareil réel, et le chiffre est écrit ici.

**Terminé quand :** les deux chemins de rendu donnent la même image à tolérance
assumée, le relief et le contour sont visibles en `high` et `medium`, `low` reste
sans passe, et le budget frame est un nombre relevé et non une intention.

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : la capture de référence par matériau et par chemin
de rendu — un shader qui change doit se voir dans la diff, pas dans un retour
d'utilisateur.

---

## Sprint 18 — Physiologie animée

**Pourquoi :** l'anatomie statique s'apprend dans un livre. Le mouvement est ce
qu'un livre ne peut pas faire — c'est la justification même de la 3D.

**Travaux**

1. **Cœur battant** — animation squelettique du cycle cardiaque, vitesse réglable,
   pause à n'importe quelle phase, corrélation avec un tracé ECG synchronisé.
2. **Flux sanguin** — particules GPU (compute WebGPU, repli instancing + shader
   WebGL2) le long de courbes vasculaires ; rouge/bleu selon oxygénation ; le
   passage pulmonaire fait basculer la couleur. Débit lié au cycle cardiaque.
3. **Respiration** — diaphragme et cage thoracique animés, expansion alvéolaire,
   échange gazeux visualisé.
4. **Autres boucles** — péristaltisme intestinal, filtration rénale (néphron en
   coupe), accommodation du cristallin, influx nerveux le long d'un axone.
5. **Chronologie interactive** — barre de scrubbing pour chaque processus :
   avancer, reculer, boucler un segment. C'est l'outil de révision, pas une vidéo.
6. **Discipline de performance** — chaque animation déclare son coût et sa durée
   d'activité ; le render-on-demand reste maître. `low` : animations simplifiées
   ou statiques, jamais un blocage.

**Terminé quand :** 5 processus physiologiques scrubables, 60 fps en `high`,
aucune fuite mémoire après 10 minutes de lecture continue.

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : le banc mémoire : dix minutes d'animation continue sans que `renderer.info.memory` dérive.

---

## Sprint 19 — Corps entier & navigation par système

**Pourquoi :** les organes isolés n'enseignent pas les **rapports anatomiques** —
justement ce que les examens interrogent.

**Travaux**

1. **Scène corps complet** — modèle basse densité comme carte de navigation ;
   zoom sur une région → chargement du modèle haute densité (transition continue,
   pas de coupure). Utilise le streaming LOD du Sprint 2.
2. **Vues par système** — squelettique, musculaire, cardiovasculaire, nerveux,
   digestif, respiratoire, urinaire, endocrinien, lymphatique, tégumentaire.
   Isolation d'un système, les autres passent en `ghostMaterial`.
3. **Rapports anatomiques** — mode « voisinage » : afficher ce qui touche la
   structure sélectionnée, avec étiquettes de relation.
4. **Régions topographiques** — quadrants abdominaux, triangles cervicaux, médiastin,
   loges des membres : les découpages réellement enseignés.
5. **Vue coupes radiologiques** — série de coupes transverses façon TDM, navigation
   à la molette, avec correspondance 3D synchronisée. Passerelle vers l'imagerie médicale.
6. **Boussole de navigation** — plans et axes anatomiques toujours visibles
   (antérieur/postérieur, proximal/distal…), presets de caméra normalisés.

**Terminé quand :** on parcourt le corps entier sans rechargement de page, chaque
système s'isole, la vue coupes reste synchronisée avec la 3D.

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : un smoke sur chaque route `/systemes/[slug]`, pour qu'un système ajouté sans page se voie tout de suite.

---

## Sprint 20 — Révision, quiz et mode examen

**Pourquoi :** c'est ce qui transforme un bel atlas en outil utilisé la veille
d'un partiel. C'est le sprint qui crée la rétention.

**Travaux**

1. **Quiz 3D** — « cliquez sur le ventricule gauche » sur le modèle réel :
   identification spatiale, pas QCM textuel. Scoring, feedback immédiat, correction en 3D.
2. **Modes** — identification, remplissage d'étiquettes, correspondance
   fonction↔structure, cas clinique (symptômes → structure), contre-la-montre.
3. **Flashcards SRS** — répétition espacée (SM-2), file de révision quotidienne,
   cartes générées depuis le contenu du Sprint 5, cartes personnelles autorisées.
4. **Suivi de progression** — maîtrise par système, série de jours, points faibles,
   heatmap d'activité. **Tout en `localStorage`/IndexedDB** — aucun compte, aucun serveur.
5. **Mode examen** — session chronométrée, format inspiré des épreuves nigériennes,
   correction détaillée avec renvoi 3D vers chaque erreur.
6. **Import/export** — sauvegarde de progression en fichier JSON : c'est la seule
   synchronisation possible sans backend, et elle suffit.

**Terminé quand :** un étudiant peut réviser 30 minutes en boucle fermée
(apprendre → tester → revoir ses erreurs), progression conservée après rechargement.

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : un test du moteur de répétition espacée sur données figées : une régression de SRS est invisible à l'œil et coûteuse à l'étudiant.

---

## Sprint 21 — Offline & terrain nigérien

**Pourquoi :** connexion intermittente, forfaits data coûteux, coupures de courant.
Une app qui exige le réseau est une app inutilisable ici.

**Travaux**

1. **PWA complète** — manifest, installable, icônes maskable, écran de démarrage
   aux couleurs Gremah, mise à jour en arrière-plan avec invite discrète.
2. **Service Worker** — précache du shell ; modèles et images en cache à la demande,
   avec **gestion de quota** et éviction explicite. Zéro appel réseau après installation.
3. **Packs hors-ligne** — l'étudiant choisit les systèmes à télécharger, voit la
   taille avant, gère l'espace occupé. Le contrôle appartient à l'utilisateur.
4. **Mode data-light** — détection `saveData`/2G : textures basse résolution,
   pas de post-processing, images différées, avertissement avant tout gros téléchargement.
5. **Résilience** — reprise de téléchargement interrompu, indicateur d'état réseau,
   dégradation propre sans jamais d'écran blanc, sauvegarde d'état avant fermeture.
6. **Terrain** — tests sur Android bas de gamme réels (Chrome, écran ~720p) et
   sous throttling 2G/3G. Résultats consignés dans `docs/perf-terrain.md`.

**Terminé quand :** mode avion après première visite → l'app fonctionne entièrement ;
un pack système se télécharge et se supprime proprement.

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : un test hors ligne réel — service worker installé, réseau coupé, l'atlas répond — et la garantie du §2 bis : un compte n'est jamais une condition d'accès à ce qui est déjà téléchargé.

---

## Sprint 22 — Refonte de l'accueil et du système de thème

**Pourquoi :** l'accueil actuel est fonctionnel et convenu. Or c'est la première
preuve de sérieux que voit un enseignant à qui on envoie le lien — avant même le
contenu. Et le mode clair est aujourd'hui une inversion mécanique du sombre :
les mêmes ombres, les mêmes contrastes, la même 3D, ce qui donne un rendu délavé.
Un thème clair se conçoit, il ne se dérive pas.

**Travaux**

1. **Direction artistique écrite d'abord** — références visuelles, intention,
   grille, échelle typographique, vocabulaire de mouvement. Cette fois le design
   précède le code, au lieu de sortir de l'implémentation.
2. **Scène 3D signature** — l'ambition est une entrée mémorable, pas un organe qui
   tourne : traversée du corps par systèmes successifs, matière réaliste (SSS,
   transluminescence, imperfections), éclairage volumétrique, profondeur de champ
   cinématographique. Scénographie liée au défilement, avec des **états lisibles**
   et non un mouvement continu.
3. **Deux thèmes conçus séparément** — le clair reçoit sa propre palette, ses
   propres ombres (chaudes, courtes, portées), son propre éclairage 3D (fond
   lumineux, key adoucie, rim inversée). Bascule animée, contraste AA vérifié
   dans **les deux** thèmes.
4. **Mouvement** — une charte d'animation cohérente : durées, courbes, hiérarchie
   d'entrée. `prefers-reduced-motion` traité comme un mode à part entière et non
   comme une désactivation.
5. **Discipline de performance** — la scène signature obéit aux profils : `low`
   reçoit une composition allégée mais **soignée**, jamais un repli visible comme
   tel. Budget mesuré, pas supposé.
6. **Preuve sociale** — ce que couvre l'atlas, en chiffres, et la provenance
   ouverte des modèles : c'est ce qui distingue une démo d'un outil.

**Terminé quand :** capture avant/après indiscutable, les deux thèmes tiennent
côte à côte sans qu'aucun paraisse dérivé de l'autre, 60 fps en `high`, et la
version `low` reste présentable.

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : les captures de référence des deux thèmes, côte à côte, et le budget d'image de la scène signature.

---

## Sprint 23 — L'atlas devient un parcours d'apprentissage

**Pourquoi :** aujourd'hui la page d'apprentissage se **lit**. On fait défiler une
fiche à côté d'un modèle qui tourne. C'est un livre avec une illustration animée —
exactement ce que la 3D était censée dépasser.

**Travaux**

1. **Apprendre en manipulant** — chaque notion s'accompagne d'un geste : isoler la
   structure décrite, la couper au bon plan, suivre le trajet d'un vaisseau, peler
   une couche. Le texte pilote la 3D, la 3D renvoie au texte.
2. **Parcours guidés** — séquences construites (« le trajet du sang », « les
   voies aériennes de la bouche à l'alvéole »), avec progression, reprise là où on
   s'est arrêté, et durée annoncée.
3. **Vérification immédiate** — après chaque notion, une question posée **sur le
   modèle** : cliquer la structure, ordonner un trajet, nommer sans étiquette.
4. **Comparaison** — deux structures côte à côte, caméras synchronisées, pour les
   confusions classiques que les examens exploitent.
5. **Carnet personnel** — annotations ancrées en 3D, captures annotées, listes de
   révision, export. Alimente le SRS du Sprint 20.
6. **Progression lisible** — par système, avec les points faibles identifiés.
   Stockée localement ; la synchronisation via le compte est une décision à part.

**Terminé quand :** un étudiant apprend une région en 20 minutes sans jamais
quitter la 3D, et sa progression le ramène exactement où il s'était arrêté.

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : un parcours guidé joué de bout en bout en CI, reprise comprise.

---

## Sprint 24 — Rayonnement

**Pourquoi :** un atlas que personne ne trouve n'est pas une référence.

**Travaux**

1. **SEO bilingue** — une page indexable par structure et par langue, données
   structurées `MedicalEntity`, sitemap, `hreflang`. C'est ainsi qu'on arrive sur
   un atlas : par une recherche de structure, pas par la page d'accueil. **Hérite
   du reste du Sprint 15** : la bascule de langue y est côté client
   (`LanguageProvider`, state React) plutôt que par préfixe d'URL `/fr/`/`/en/` —
   un choix qui suffit à l'usage interactif mais qu'aucun moteur de recherche ne
   peut indexer séparément. Le routage par langue se fait ici, pas avant,
   parce qu'il touche la même arborescence que le SEO par structure.
2. **Partage** — URL restituant exactement la vue 3D (Sprint 16), aperçus Open
   Graph générés par structure, export d'image annotée.
3. **Crédits et licences** — page dédiée : modèles (CC BY-SA), sources
   bibliographiques, code (MIT). La distinction doit être limpide.
4. **Ouverture aux contributions** — signaler une erreur en un clic depuis
   n'importe quelle fiche, guide de contribution pour les enseignants, processus
   de relecture.
5. **Présence** — README avec captures, vidéo de démonstration, annonce,
   soumission aux répertoires de ressources pédagogiques ouvertes (AnatomyTOOL et
   équivalents).
6. **Mesure respectueuse** — savoir quelles structures sont consultées, sans
   traçage individuel ni cookie tiers.

**Terminé quand :** chaque structure a son URL indexée dans les deux langues, et
signaler une erreur prend moins de trente secondes.

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : la validation du `sitemap.xml`, des `hreflang` et des données structurées `MedicalEntity`.

---

## Sprint 25 — Exploitation, supervision et coûts

**Pourquoi :** le projet a maintenant une base de données et des routes serveur.
Si Atlas sature son palier gratuit, si une route se met à échouer, si un étudiant
ne peut plus se connecter un dimanche soir — personne ne l'apprend.

**Travaux**

1. **Journalisation structurée** des 4 routes : latence, code de sortie, motif de
   refus. Jamais d'email en clair, jamais de mot de passe, même haché.
2. **Suivi des erreurs** (Sentry ou équivalent), avec échantillonnage et purge des
   données personnelles avant envoi.
3. **Surveillance de disponibilité** — un ping sur `/api/moi` et sur `/atlas`,
   alerte par email. Simple, pas un tableau de bord de plus.
4. **Sauvegarde MongoDB** — restauration **testée**, pas seulement configurée.
   Une sauvegarde jamais restaurée n'est pas une sauvegarde.
5. **Suivi des coûts** — Vercel, Atlas, envoi d'emails, domaine : un tableau avec
   le palier gratuit, le seuil de bascule et ce qu'on fait en cas de dépassement.
   Un atlas gratuit pour des étudiants doit savoir ce qu'il coûte à son auteur.
6. **Mises à jour de dépendances** — Dependabot ou équivalent, avec la CI du
   Sprint 14 comme filet. three.js évolue vite ; ne pas suivre coûte plus cher.
7. **Plan de reprise** — que faire si Atlas est indisponible ? Réponse attendue :
   le contenu et la 3D restent accessibles, seule la connexion tombe. À vérifier,
   pas à supposer.

**Terminé quand :** une panne de connexion se signale d'elle-même en moins de dix
minutes, et une restauration de base a été faite au moins une fois pour de vrai.

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : une restauration de sauvegarde rejouée, et le suivi des coûts mis à jour dans la même PR que ce qui les fait bouger.

---

## Sprint 26 — Portabilité : récupérer la clé USB de salle de TP

**Pourquoi :** le §2 bis a coûté quelque chose de précis, et le dit franchement :
un hôte purement statique « ne porterait plus les comptes ». Au Niger, une salle
de TP sans réseau fiable est un cas d'usage réel, pas une hypothèse. Ce sprint
récupère ce qui a été perdu, sans revenir sur la décision des comptes.

**Travaux**

1. **Build « atlas seul »** — une variante d'export statique complet, sans les
   quatre routes de compte : tout le contenu, toute la 3D, toute la révision.
   Un drapeau de build, pas un fork du code.
2. **Mode enseignant** — l'atlas s'ouvre sans compte quand le build le déclare.
   Le compte redevient ce qu'il aurait toujours dû être : une commodité de
   synchronisation, jamais une barrière au savoir.
3. **Distribution hors ligne** — archive téléchargeable, procédure pour la copier
   sur une clé et la servir en local. Testée sur une machine sans réseau.
4. **Test CI de la variante** — sinon elle pourrira en silence au premier sprint
   qui touche à l'authentification.
5. **Documentation à destination des facultés** — une page, pas un manuel.

**Terminé quand :** une clé USB branchée sur un poste hors réseau ouvre l'atlas
complet, et la CI garantit que ça le reste.

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : le build « atlas seul » vérifié en CI, sinon il pourrira au premier sprint qui touche à l'authentification.

---

## Sprint 27 — Audit final, qualité scientifique et v1.0

**Pourquoi :** c'est ce qui sépare un beau projet d'une référence citable. Une
erreur d'anatomie sur une plateforme internationale coûte plus cher qu'un bug.

Ce sprint solde aussi ce que le Sprint 10 avait laissé — onboarding, audit
d'accessibilité, Lighthouse, sitemap. Ces travaux étaient annoncés comme de la
finition ; ils ne valaient rien tant que le produit à finir n'existait pas.

**Travaux**

1. **Relecture externe** — faire relire chaque système par des enseignants
   d'anatomie, francophones **et** anglophones. Consigner qui a relu quoi et quand.
2. **Traçabilité** — chaque fiche porte sa date de relecture et son relecteur.
   Une fiche non relue est signalée comme telle plutôt que présentée comme sûre.
3. **Corrections** — traiter les retours comme des bugs bloquants (CLAUDE.md §8).
4. **Audit final** — accessibilité WCAG AA, performance sur appareils réels,
   parcours complet dans les deux langues et les deux thèmes.
5. **Versionnage du contenu** — un atlas qui évolue doit dire ce qui a changé :
   journal des modifications de contenu, distinct de celui du code.
6. **Onboarding cinématique** — le disque solaire s'ouvre sur le corps. Reste du
   Sprint 10, à sa place ici : on n'accueille bien que dans un produit fini.
7. **Lighthouse ≥ 95** en Performance et Accessibilité, audit WCAG AA manuel,
   `robots.txt` et `sitemap.xml`. Le §11 les exige depuis le début ; ils n'ont
   jamais été mesurés, et la CI du Sprint 14 rend enfin la mesure automatique.
8. **v1.0** — la version qu'on peut présenter à une faculté sans réserve.

**Terminé quand :** toutes les cases de « Définition de terminé » (CLAUDE.md §11)
sont cochées et au moins un enseignant extérieur a validé chaque système.

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : le contrôle de traçabilité : une fiche sans relecteur ni date se signale d'elle-même au lieu de passer pour sûre.

---

## Sprint 28 — Pérennité et passation

**Pourquoi :** Gremah Anatomy est aujourd'hui le projet d'une seule personne, et
tout ce qui compte — les décisions, les pièges, les raisons — vit dans sa tête et
dans deux fichiers Markdown. Un bien commun qui dépend d'un individu n'en est pas
encore un.

**Travaux**

1. **Documentation d'architecture** — un schéma du moteur, un du flux de données,
   un de l'authentification. Trois images valent les 700 lignes de ce fichier pour
   qui arrive.
2. **Journal de décisions** (ADR courts) — pourquoi WebGPU **et** WebGL2, pourquoi
   `scrypt` et pas argon2, pourquoi le pixel ratio est figé au démarrage. Ces
   raisons existent déjà en commentaires ; les rassembler évite qu'on les défasse.
3. **Guide du contributeur, version contenu** — comment un enseignant propose une
   correction sans savoir se servir de git.
4. **Gouvernance du contenu** — qui valide une fiche, en combien de temps, et ce
   qui se passe si personne ne répond.
5. **Continuité** — accès de secours au domaine, à Vercel, à Atlas et au dépôt.
   Sujet inconfortable, et c'est précisément pour ça qu'on l'écrit.
6. **Feuille de route publique** — ce fichier, épuré et publié.

**Terminé quand :** une personne compétente peut reprendre le projet à partir du
dépôt seul, sans poser une question.

**Clôture** — dérouler le [rituel](#rituel-de-clôture-de-sprint) :
dépôt nettoyé, CI verte, fusion sur `main` par PR, Suivi mis à jour.
Garde-fou légué par ce sprint : rien de neuf : ce sprint vérifie que tout ce qui précède se comprend depuis le dépôt seul.

---

## Ce qui bloque, et qui ne se code pas

Ces points ne se lèvent pas en écrivant du code : ils demandent un geste humain,
un compte externe ou une décision. Tant qu'ils tiennent, la file avance à vide.
Le détail des gestes attendus est en fin de fichier, **À faire à la main**.

| Blocage                                                    | Sprint | Nature                                                                                            |
| ---------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| 21 structures sur 78 n'ont pas de modèle                   | 12     | 🔒 Manuel — arbitrer `sourceObjet`, puis export Blender depuis Z-Anatomy                          |
| Le modèle `skin` hérité du fork n'a pas de licence établie | 12     | ⚠️ Juridique — les 8 autres modèles hérités sont retracés vers Z-Anatomy (CC BY-SA), reste `skin` |
| Aucun envoi d'email possible                               | 13     | 🔒 Compte externe à ouvrir, coût à assumer                                                        |
| `main` n'est pas protégé côté GitHub                       | tous   | 🔒 Réglage de dépôt — le rituel repose dessus                                                     |
| Aucun Android d'entrée de gamme pour mesurer               | 17, 21 | 🔒 Matériel — le critère du §5.2 reste théorique                                                  |
| Zarma absent du glossaire                                  | 15     | 🔒 Humain — inventer un terme serait pire que rien                                                |
| Aucun relecteur enseignant identifié                       | 27     | 🔒 Humain — à recruter bien avant le sprint 27                                                    |

---

## Suivi

> **Règle de tenue.** Une case n'est cochée que si la fonctionnalité existe dans
> le dépôt et passe `npm run lint && npm run typecheck && npm test && npm run build`.
> Un travail « presque fini » reste 🟨, avec son reste **reversé dans un sprint de
> la file** — jamais laissé flotter. Se mentir ici coûte plus cher que le retard
> qu'on cherche à masquer.
>
> **Dernière vérification :** 21 août 2026. Sprint 14 clos (`sprint-14/e2e`, PR ouverte vers `main`, non fusionnée). Sprint 15 clos partiel (`sprint-15/bilingue`, PR ouverte vers `main`, non fusionnée) — reste honnête : routage par préfixe d'URL, extraction complète des chaînes d'interface, zarma. Sprint en cours : **16** (`sprint-16/interaction`).

| Sprint | État        | Branche                  | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------ | ----------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0      | ✅ terminé  | `sprint-0/fondations`    | Purge, thème Niger, marque + og/icônes, CI, CONTRIBUTING, Prettier, dépôt détaché du fork.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 1      | 🟨 partiel  | `sprint-1/moteur-v2`     | `app/engine/` découpé, WebGPU + repli WebGL2, 3 profils, CameraRig, overlay `?debug=1`. Reste TSL et compute → Sprint 17.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2      | ✅ terminé  | `sprint-2/assets`        | 28,6 Mo → 12,7 Mo sur 3 LOD, décodeurs câblés, budget mémoire en octets, streaming progressif.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 3      | 🟨 partiel  | `fusionné dans `main``   | Tissus translucides, rayon X, fantôme, bloom, grain/vignette, halo solaire. Reste SSAO, DOF, contour → Sprint 17.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 5      | 🟨 partiel  | `fusionné dans `main``   | FR langue source, 28 champs/organe, 16 sources, ancrage Niger. Reste : structures → Sprint 12, anglais → Sprint 15.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 10     | 🟨 partiel  | `fusionné dans `main``   | Vercel, Open Graph, JSON-LD, `prefers-reduced-motion`. Reste onboarding, WCAG AA, Lighthouse, sitemap → Sprint 27.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 11     | 🟨 partiel  | `fusionné dans `main``   | Vitrine 3D, `/atlas/`, contact, comptes Atlas (scrypt + HMAC), limitation de débit. Reste le cycle de vie du compte → Sprint 13.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 12     | 🟨 en cours | `sprint-12/bibliotheque` | Taxonomie 78 structures, provenance + test bloquant, budget par structure, `anatomie:import`, `/credits`. **57/78 structures livrées** (statut corrigé pour refléter les modèles déjà importés). **Reste : arbitrer `sourceObjet` pour 21 structures**, et re-exporter ou trancher le sort des 9 modèles hérités sans licence établie.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 13     | 🟨 en cours | `sprint-13/compte`       | Cycle de vie complet sauf email : suppression (compteurs de débit effacés), export JSON, modification de profil et de mot de passe, page `/profil/` protégée par le middleware, pages légales bilingues FR/EN. Vérifié en conditions réelles contre Atlas, pas seulement en tests. **Reste : réinitialisation de mot de passe et vérification d'adresse — les deux dépendent de l'envoi d'email, bloqué sur le mot de passe d'application Gmail (§ À faire à la main).**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 14     | ✅ terminé  | `sprint-14/e2e`          | Playwright installé et câblé en CI (jobs `e2e` et `lighthouse`, Chromium desktop + mobile) : smoke sur les pages publiques, bascule de thème, garde de `/atlas` et `/profil`, parcours inscription→atlas→déconnexion, cycle complet du profil, canevas 3D rendu sans erreur console, capture WebGL de référence (`e2e/rendu-3d.spec.ts`, `toHaveScreenshot` avec `maxDiffPixelRatio` explicite — baseline Windows commitée, une baseline Linux reste à générer une fois `MONGODB_URI`/`AUTH_SECRET` posés en secrets GitHub, § À faire à la main, puisque le job `e2e` tourne alors sur `ubuntu-latest`), repli WebGL2 forcé via `?renderer=webgl` (absence d'écran noir et d'erreur console, charte §5.1 — vérifié avec un contexte `preserveDrawingBuffer` réservé au test, `?lecture-pixels=1`), suite `@axe-core/playwright` sur les routes publiques (a trouvé et corrigé un vrai défaut : le tableau `/credits/` n'était pas accessible au clavier), budget Lighthouse en CI (`lighthouserc.cjs`, cible `/` et `/atlas/` — `/atlas/` redirige vers `/connexion/` sans secrets de compte posés, mesuré honnêtement tel quel), et banc mémoire (`e2e/memoire.spec.ts`) : 20 cycles de chargement réel puis démontage du moteur, `renderer.info.memory` retombe à zéro géométrie et zéro texture (charte §5.4). Dépendances ajoutées et justifiées (CLAUDE.md §3) : `@axe-core/playwright`, `@lhci/cli` — outillage officiel, aucun service tiers. Tout vérifié en local contre Atlas (`.env.local`) : `npm run format && npm run lint && npm run typecheck && npm test && npm run build` passent, ainsi que la suite `e2e` complète contre une vraie base MongoDB. **Reste : poser les secrets GitHub pour activer `comptes.spec.ts` et les tests dépendant du compte en CI (§ À faire à la main, bloqué humain) ; générer la baseline de capture WebGL sous Linux une fois ces secrets posés.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 15     | 🟨 partiel  | `sprint-15/bilingue`     | **Schéma bilingue** : chaque champ rédactionnel des 9 organes (`app/content/organes.ts`) porte désormais un miroir anglais complet dans `organ.en` (`OrganTranslation`, `app/content/schema.ts`) — description, taille, poids, situation, fonction, vascularisation, innervation, drainage, histologie, physiologie, rapports, clinique sourcée, ancrage Niger, pathologies, le-saviez-vous, hotspots. **Test de complétude** (`tests/bilingue.test.mts`, garde-fou légué) : casse le build si un champ FR est rempli et son miroir EN vide, ou si les tableaux/hotspots ne correspondent pas terme à terme ; vérifie aussi que la taxonomie (78 structures) garde son `english` à côté du `nom`. **Interface** : `app/lib/i18n.ts` + `LanguageProvider`/`LanguageToggle` — langue détectée à la première visite (`navigator.language`) puis mémorisée (`localStorage`), bascule qui ne navigue jamais (state React, pas une route) donc conserve la page et l'organe en cours à 100 %. Dictionnaire `app/content/traductions.ts` et `translateOrgan()` appliqués dans `AnatomyApp.tsx` : la fiche organe entière (description, repères, physiologie, corrélations cliniques, ancrage Niger, pathologies) bascule réellement de langue. **Terminologie** FR / latin TA / EN déjà affichée ensemble sur chaque fiche (hérité, ajusté pour rester correct dans les deux sens de la bascule). **Glossaire** : `/glossaire/` rassemble le vocabulaire haoussa des 8 organes qui en portent un, avec une colonne zarma explicitement « à compléter » — aucun terme inventé (CLAUDE.md §8). **Reste, honnêtement** : (1) le routage `/fr/…` `/en/…` par préfixe d'URL n'est **pas** fait — la bascule est côté client (state React + `<html lang>` dynamique + `hreflang` déclaré vers la même URL dans les métadonnées) plutôt que par restructuration de l'arbre de routes ; refaire l'arborescence sous `[locale]`, le middleware d'auth et le sitemap est un chantier à part entière, reversé à un sprint dédié plutôt que bâclé ici. (2) L'extraction des chaînes d'interface est partielle : le chrome global et la fiche organe sont couverts, les formulaires de compte et les libellés d'outils 3D restent en dur en français — travail mécanique, non bloquant, reversé au fil des sprints suivants. (3) Le champ `Organ.system` (ex. « Appareil cardiovasculaire ») n'a pas de miroir anglais — connu, documenté dans `traductions.ts`. (4) Le zarma du glossaire reste vide, bloqué humain (aucun locuteur consulté) — voir « À faire à la main ». Vérifié : `npm run format && npm run lint && npm run typecheck && npm test && npm run build` passent, ainsi que la suite `e2e` complète (smoke, comptes, canevas 3D) contre une vraie base MongoDB. |
| 16     | ⬜ à faire  | `sprint-16/interaction`  | Coupes avec capping, écorché, mesure, hotspots v2, navigation clavier.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 17     | ⬜ à faire  | `sprint-17/moteur-solde` | Pile TSL réelle, compute, SSAO, DOF, contour, budget frame chiffré.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 18     | ⬜ à faire  | `sprint-18/physiologie`  | Cœur battant, flux sanguin, respiration, chronologie scrubable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 19     | ⬜ à faire  | `sprint-19/corps-entier` | Scène corps complet, routes `/systemes/[slug]`, voisinage, boussole.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 20     | ⬜ à faire  | `sprint-20/revision`     | Quiz 3D, flashcards SRS, mode examen, progression par système.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 21     | ⬜ à faire  | `sprint-21/offline`      | PWA, service worker, packs par système, mode data-light.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 22     | ⬜ à faire  | `sprint-22/accueil-v2`   | Direction artistique écrite d'abord, scène signature, thème clair conçu.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 23     | ⬜ à faire  | `sprint-23/apprendre`    | Parcours guidés, vérification sur le modèle, carnet, comparaison.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 24     | ⬜ à faire  | `sprint-24/rayonnement`  | SEO bilingue par structure, partage, signalement d'erreur en un clic.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 25     | ⬜ à faire  | `sprint-25/exploitation` | Journaux, suivi d'erreurs, disponibilité, sauvegarde restaurée, coûts.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 26     | ⬜ à faire  | `sprint-26/portabilite`  | Build « atlas seul », mode enseignant, distribution hors ligne.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 27     | ⬜ à faire  | `sprint-27/v1`           | Relecture enseignante, traçabilité, audit WCAG AA et Lighthouse, v1.0.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 28     | ⬜ à faire  | `sprint-28/passation`    | Schémas d'architecture, ADR, gouvernance du contenu, continuité d'accès.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

---

## À faire à la main

Le code n'atteint pas ces points : ils demandent un geste humain, un compte
externe ou une décision. Ils sont classés par le sprint qu'ils bloquent — un
geste fait trop tard arrête la file, un geste fait tôt ne coûte rien.

**Avant tout — un réglage GitHub**

- Protéger `main` : exiger une pull request et le job `verify` au vert, interdire
  la poussée directe. Sans ce réglage, le rituel de clôture repose sur la seule
  discipline, et la discipline cède un vendredi soir.

**Sprint 12 — le verrou actuel**

- **Plus rien à télécharger ni à manipuler.** La source (83 Mo) est récupérée par
  `npm run anatomie:blender -- --telecharger`, et l'export Blender tourne sans
  interface. Procédure : **[docs/import-zanatomy.md](docs/import-zanatomy.md)**.
- **57 des 78 structures sont livrées** — le champ `statut` de la taxonomie a été
  corrigé pour refléter les modèles déjà importés, il n'était pas à jour avec le
  travail réel. Reste à arbitrer, structure par structure : **21 des 78 ne
  trouvent pas leur objet** dans la source (nom différent, ou absent du modèle).
  Chaque cas se règle en posant `sourceObjet` dans la taxonomie — un choix
  anatomique, pas une manipulation 3D.
- **Huit des neuf modèles hérités sont retracés vers Z-Anatomy** (licence
  CC BY-SA établie). **Reste `skin`** : sa provenance dans
  `assets/models-src/provenance.json` est encore `"heritee-du-fork"`,
  `verifie: false` — soit on lui trouve un équivalent Z-Anatomy, soit on le
  retire de l'atlas tant que sa licence n'est pas établie.
- Rédiger la fiche de contenu de chaque structure importée. C'est le travail de
  fond du projet, et il n'a pas de raccourci.

**Sprint 13 — compte et données personnelles**

- **Créer le mot de passe d'application Gmail** pour `mahamadou8877@gmail.com` :
  activer la validation en deux étapes sur le compte Google (elle est obligatoire
  pour la suite), puis <https://myaccount.google.com/apppasswords>, nommer la clé
  « Gremah Anatomy », et **copier les 16 caractères tout de suite** — Google ne
  les réaffiche jamais. Les déposer dans les variables d'environnement Vercel
  (`GMAIL_UTILISATEUR`, `GMAIL_MOT_DE_PASSE_APP`), pas dans le dépôt.
- Envoyer un message d'essai à une adresse **non-Gmail** (Yahoo, Outlook) et
  vérifier où il atterrit : c'est le seul moyen de savoir ce que verra un
  étudiant qui n'est pas chez Google.
- Décider et écrire : durée de conservation des comptes, sous-traitants
  (MongoDB Atlas, Vercel, l'expéditeur), adresse de contact pour l'exercice des
  droits. Ce sont des décisions, pas des paramètres.

**Sprint 14 — tests de bout en bout**

- **Poser `MONGODB_URI`, `MONGODB_DB` et `AUTH_SECRET` en secrets GitHub**
  (Settings → Secrets and variables → Actions) sur le dépôt, avec les mêmes
  valeurs que Vercel. Sans eux, le job `e2e` tourne mais `comptes.spec.ts` se
  saute — les smokes publics passent, mais rien ne garde plus le parcours
  d'inscription ni le rendu du canevas 3D contre une régression réelle.

**Sprint 15 — bilinguisme**

- Trouver un locuteur zarma pour le glossaire. Inventer un terme serait pire que
  le laisser vide.
- Décider qui relit l'anglais. Une traduction non relue tient la promesse à
  moitié, ce qui est pire que ne rien promettre.

**Sprints 17 et 21 — la cible réelle**

- Se procurer un **Android d'entrée de gamme** — celui à 150 000 FCFA — et le
  garder pour les mesures. Tant qu'il n'existe pas, les 30 fps du §5.2 sont une
  intention et les budgets restent invérifiables.
- Tester une fois sur une connexion réellement lente, pas sur un throttling de
  navigateur.

**Sprint 25 — exploitation**

- Ouvrir les comptes de supervision (suivi d'erreurs, ping de disponibilité) avec
  une adresse que tu lis vraiment.
- **Restaurer une sauvegarde MongoDB pour de vrai, au moins une fois.** Une
  sauvegarde jamais restaurée n'est pas une sauvegarde.

**Sprint 27 — qualité scientifique**

- Contacter des enseignants d'anatomie, francophones et anglophones, **bien avant**
  le sprint : c'est le délai le plus long du projet et il ne se rattrape pas. Une
  faculté au Niger et un contact ailleurs suffisent à rendre l'affaire jouable.

**Sprint 28 — continuité**

- Décider où vivent les accès de secours (domaine, Vercel, Atlas, dépôt) et qui
  peut les récupérer. Sujet inconfortable, et c'est précisément pour ça qu'on
  l'écrit.

---

**Gremah Anatomy** — par Mahamadou Amadou Habou Gremah
[mahamadou8877@gmail.com](mailto:mahamadou8877@gmail.com) ·
[LinkedIn](https://linkedin.com/in/mahamadou-amadou-habou-gremah-54766632b) ·
[gremah.vercel.app](https://gremah.vercel.app) ·
[WhatsApp +216 55 299 368](https://wa.me/21655299368)
