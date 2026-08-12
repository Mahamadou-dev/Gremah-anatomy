# SPRINT.md — Plan de chirurgie · **Gremah Anatomy**

Refonte d'un socle hérité en atlas d'anatomie 3D de référence pour les étudiants
en médecine du Niger. **10 sprints complémentaires**, chacun livrant quelque chose
de démontrable. Voir [CLAUDE.md](CLAUDE.md) pour le cahier de charge.

**Durée indicative** : 1 à 2 semaines par sprint.
**Règle d'or** : aucun sprint ne se termine avec une régression de performance sur
le profil `low`. La cible n'est pas un écran de démo — c'est un Android à 150 000 FCFA.

---

## Vue d'ensemble

| #   | Sprint                  | Livrable phare                                  | Dépend de |
| --- | ----------------------- | ----------------------------------------------- | --------- |
| 0   | Nettoyage & identité    | Dépôt propre, marque Gremah, thème Niger        | —         |
| 1   | Moteur v2               | WebGPU + TSL, repli WebGL2, profils de qualité  | 0         |
| 2   | Pipeline d'assets       | Draco + KTX2, LOD, 29 Mo → < 8 Mo               | 0         |
| 3   | Matériaux signature     | SSS, rayon-X, écorché, post-processing          | 1, 2      |
| 4   | Interaction anatomique  | Coupes avec capping, mesure, hotspots v2        | 1, 3      |
| 5   | Contenu FR sourcé       | 20+ structures, i18n FR/EN, terminologie locale | 0         |
| 6   | Physiologie animée      | Cœur battant, flux sanguin, respiration         | 3, 5      |
| 7   | Corps entier & systèmes | Scène corps complet, navigation par système     | 2, 4      |
| 8   | Révision & examens      | Quiz 3D, flashcards SRS, mode examen            | 5         |
| 9   | Offline & terrain       | PWA, mode data-light, robustesse Niger          | 2, 8      |
| 10  | Finition & lancement    | Onboarding cinématique, a11y, perf, déploiement | tous      |

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

---

## Sprint 4 — Interaction anatomique sérieuse

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

---

## Sprint 6 — Physiologie animée

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

---

## Sprint 7 — Corps entier & navigation par système

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

---

## Sprint 8 — Révision, quiz et mode examen

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

---

## Sprint 9 — Offline & terrain nigérien

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

---

## Suivi

| Sprint | État        | Branche                 | Notes                                                                                                         |
| ------ | ----------- | ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| 0      | ✅ terminé  | `sprint-0/fondations`   | Purge, export statique, thème Niger, marque + og/icônes, CI, CONTRIBUTING, Prettier, dépôt détaché du fork.   |
| 1      | ✅ terminé  | `sprint-1/moteur-v2`    | `app/engine/` découpé, WebGPU + repli WebGL2, 3 profils commutables, CameraRig, overlay `?debug=1`, 18 tests. |
| 2      | ✅ terminé  | `sprint-2/assets`       | 28,6 Mo → 7,9 Mo par niveau (3 LOD), décodeurs câblés, budget mémoire en octets, streaming progressif.        |
| 3      | 🟨 en cours | fusionné dans `main`    | Tissus translucides, rayon X, fantôme, bloom + grain/vignette, halo solaire. Reste : SSAO, DOF, pile WebGPU.  |
| 4      | ⬜ à faire  | `sprint-4/interaction`  |                                                                                                               |
| 5      | 🟨 en cours | fusionné dans `main`    | FR langue source, 28 champs/organe, 16 sources, ancrage Niger, vernaculaire. Reste : 20+ structures, i18n EN. |
| 6      | ⬜ à faire  | `sprint-6/physiologie`  |                                                                                                               |
| 7      | ⬜ à faire  | `sprint-7/corps-entier` |                                                                                                               |
| 8      | ⬜ à faire  | `sprint-8/revision`     |                                                                                                               |
| 9      | ⬜ à faire  | `sprint-9/offline`      |                                                                                                               |
| 10     | ⬜ à faire  | `sprint-10/lancement`   |                                                                                                               |
| 11     | ✅ terminé  | fusionné dans `main`    | Vitrine 3D, `/atlas/`, contact, à propos, comptes Atlas (scrypt + HMAC), limitation de débit. 61 tests.       |

---

**Gremah Anatomy** — par Mahamadou Amadou Habou Gremah
[mahamadou8877@gmail.com](mailto:mahamadou8877@gmail.com) ·
[LinkedIn](https://linkedin.com/in/mahamadou-amadou-habou-gremah-54766632b) ·
[gremah.vercel.app](https://gremah.vercel.app) ·
[WhatsApp +216 55 299 368](https://wa.me/21655299368)
