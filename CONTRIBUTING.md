# Contribuer à Gremah Anatomy

Merci de l'intérêt porté au projet. **Gremah Anatomy** est un atlas d'anatomie 3D
destiné aux étudiants en médecine du Niger : chaque contribution est évaluée à
l'aune de cet usage — un smartphone d'entrée de gamme, une connexion faible, et
souvent aucune connexion du tout.

Le cahier de charge est [CLAUDE.md](CLAUDE.md), la feuille de route [SPRINT.md](SPRINT.md).
Lis-les avant d'ouvrir une PR : un travail hors du sprint courant doit être justifié.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # export statique dans out/
npm run preview    # sert out/ tel qu'il sera déployé
```

Node ≥ 22.13.

## Avant d'ouvrir une PR

```bash
npm run format:check
npm run lint
npm run build
```

Les trois doivent passer. `npm run format` corrige le formatage.

## Conventions

- **Commits** : [Conventional Commits](https://www.conventionalcommits.org/fr/) —
  `feat:`, `fix:`, `perf:`, `refactor:`, `docs:`, `chore:`.
- **Branches** : `sprint-N/<sujet>`. Pas de commit direct sur `main`.
- **TypeScript strict** : aucun `any` implicite.
- **Commentaires** : expliquer _pourquoi_, jamais _quoi_.
- **Français** : langue source du code métier, du contenu et des commits.

## Règles spécifiques

### 3D (`app/lib/three`, futur `app/engine`)

- `engine/` n'importe **jamais** React ; `ui/` ne touche **jamais** un objet `THREE.*`.
  Le seul pont est `OrganViewer.tsx`.
- **Render-on-demand** : marquer la scène sale explicitement, jamais de boucle
  `requestAnimationFrame` continue non bornée.
- Ne pas casser `FIT_SIZE = 3.8` : les coordonnées de hotspots en dépendent.
- Tout ce qui est alloué est libéré — `renderer.info.memory` doit revenir à son
  niveau initial après un changement d'organe.
- Le profil `low` doit tenir 30 fps sur un Android d'entrée de gamme. C'est un
  critère d'acceptation, pas une aspiration.

### Assets 3D

`assets/models-src/` contient les modèles bruts — **jamais servis au navigateur**.
`public/models/` est **généré** :

```bash
npm run models:inspect   # où partent les octets : géométrie ou textures ?
npm run models:build     # régénère public/models/ (incrémental)
npm run models:build -- --force
```

Chaque organe produit trois niveaux : `heart.glb`, `heart-lod1.glb`, `heart-lod2.glb`.
Le moteur choisit le niveau selon le profil de qualité et la distance caméra, et
affiche toujours `-lod2` en premier pendant que le niveau visé se charge.

- Ajoute la source dans `assets/models-src/`, lance `npm run models:build`, commite
  les deux. Le manifeste `public/models/manifest.json` rend le pipeline idempotent :
  **ne le supprime pas** — sans lui, une relance re-décime des modèles déjà décimés.
- Tout `.glb` livré pèse **< 2 Mo** et chaque niveau complet tient sous **8 Mo**
  (vérifié par `tests/lod.test.mts` et par la CI).
- Aucun fichier généré committé hors `public/`.

### Contenu anatomique

- **Chaque affirmation clinique porte une source.** Pas de fait médical inventé ;
  en cas de doute, on omet.
- Nomenclature latine selon la _Terminologia Anatomica_.
- Une erreur médicale est un **bug bloquant**, au même titre qu'un crash.

### Dépendances

Toute nouvelle dépendance doit être justifiée par écrit dans la PR.
Budget bundle JS initial : **< 250 Ko gzip hors three.js**.

## Signaler un problème

Ouvre une issue en précisant l'appareil, le navigateur et, pour un bug 3D, la
sortie de `?debug=1`. Pour une erreur de contenu médical, cite ta source.

---

**Gremah Anatomy** — par Mahamadou Amadou Habou Gremah
[mahamadou8877@gmail.com](mailto:mahamadou8877@gmail.com) ·
[LinkedIn](https://linkedin.com/in/mahamadou-amadou-habou-gremah-54766632b) ·
[gremah.vercel.app](https://gremah.vercel.app) ·
[WhatsApp +216 55 299 368](https://wa.me/21655299368)
