# Importer les structures depuis Z-Anatomy

Le Sprint 12 demande 78 structures. Les sortir une à une dans l'interface de
Blender — trouver l'objet, démasquer l'objet **et** ses collections parentes,
sélectionner, régler sept cases d'export — c'est huit gestes répétés 78 fois.
Une manipulation répétée 78 fois n'est pas un travail, c'est une source
d'erreurs : un œil oublié dans l'_Outliner_ produit un `.glb` vide, et ça ne se
voit qu'au chargement, trois étapes plus loin.

**Blender embarque Python et s'exécute sans interface.** Tout est donc
automatisé, **téléchargement de la source compris**. Aucun geste manuel ne
subsiste.

---

## La source, en clair

| Quoi                | Combien                                       |
| ------------------- | --------------------------------------------- |
| Archive téléchargée | **83 Mo** — `Z-Anatomy.zip`                   |
| Une fois extraite   | 377 Mo, dont `Startup.blend` de **307 Mo**    |
| Ce qu'elle contient | **4 569 objets maillés**, ~4,1 M de triangles |
| Licence             | **CC BY-SA 4.0** — le dérivé le reste (§9)    |

Elle vient du dépôt GitHub de Z-Anatomy
(<https://github.com/Z-Anatomy/Models-of-human-anatomy>), par une URL HTTPS
ordinaire : le script la récupère lui-même, une seule fois, dans `../z-anatomy`
hors du dépôt.

**Un point qui compte pour l'appariement :** contrairement à ce qu'on pourrait
attendre d'un atlas en _Terminologia Anatomica_, Z-Anatomy nomme ses objets **en
anglais**, suffixés par la latéralité — `Lung.l`, `Kidney.r`, `Cranium.j`. C'est
donc l'anglais de la taxonomie qui sert de clé, pas le latin.

---

## Les trois commandes

### 1. L'inventaire — une fois, avant tout le reste

```bash
npm run anatomie:blender -- --telecharger --inventaire
```

Elle relève les noms réels des objets de la source et les compare à ceux que la
taxonomie cherche. Sa sortie dit combien de structures sur 78 trouvent un objet
de même nom, et **nomme celles qui n'en trouvent pas**.

C'est délibérément la première commande : une correspondance devinée qui échoue
coûte une passe d'export entière. Pour chaque structure signalée, ouvrir
[`app/content/taxonomie.ts`](../app/content/taxonomie.ts) et poser le nom réel
dans son champ `sourceObjet`. C'est du copier-coller depuis
`assets/models-src/zanatomy-objets.json`, pas de la manipulation 3D.

### 2. L'export

```bash
# tout ce qui n'est pas encore livré
npm run anatomie:blender

# ou une seule structure, pour vérifier avant de lancer la vague
npm run anatomie:blender -- --structure=crane-entier
```

Blender tourne en arrière-plan. Pour chaque structure, le script démasque l'objet
et toutes ses collections parentes, sélectionne — plusieurs objets s'il le faut,
« Costae » ramène les côtes une à une — puis exporte avec les réglages voulus :
glTF binaire, objets sélectionnés uniquement, sans caméra ni lumière, `+Y up`,
modificateurs appliqués, **sans compression Draco** (elle est faite ensuite, une
seule fois et mieux, par `models:build`).

Le rapport final compte les structures exportées, **vides** (moins de 10 Ko : le
signe qu'un objet n'a pas été trouvé sous ce nom) et introuvables.

Les fichiers vont dans `../z-anatomy-export`, hors du dépôt, sauf si tu passes
`--sortie=`.

### 3. La reprise dans le dépôt

```bash
npm run anatomie:import -- --dossier=../z-anatomy-export   # nettoyage + provenance
npm run models:build                                       # décimation, LOD, textures
npm run models:check && npm test                           # budgets et provenance
```

---

## Ce qui reste à ta main, et qui n'est pas de la manipulation

1. **Compléter `sourceObjet`** pour les structures que l'inventaire signale.
2. Passer chaque structure importée en `"livree"` dans la taxonomie.
3. **Rédiger sa fiche** dans `app/content/organes.ts`. C'est le travail de fond
   du projet : un modèle sans fiche donne une visionneuse, pas un atlas.

---

## Ce qui coince, et la réponse

| Symptôme                                  | Cause                                                            |
| ----------------------------------------- | ---------------------------------------------------------------- |
| `Blender introuvable`                     | Renseigner `BLENDER_EXE` avec le chemin de `blender.exe`         |
| `Source Z-Anatomy absente`                | Ajouter `--telecharger` une fois, ou `--blend=<chemin>`          |
| `✗ <id> — aucun objet pour […]`           | Le nom cherché n'existe pas : relever le vrai dans l'inventaire  |
| `⚠ <id> … 2 Ko` (vide)                    | Objet trouvé mais sans maillage — vérifier le nom dans la source |
| `budget dépassé (max 2 Mo par structure)` | Ajouter une dérogation dans `OVERRIDES` de `optimize-models.mjs` |
| Blender consomme beaucoup de mémoire      | Prendre la variante par système plutôt que le fichier complet    |

---

## Les neuf modèles hérités

Les neuf organes actuels viennent du starter d'origine, **sans licence
établie** : ils sont marqués « non vérifié » et signalés sur `/credits`. Tant que
c'est le cas, l'atlas n'est pas rediffusable.

Ils sont donc à ré-exporter comme les autres — `brain`, `eyeball`, `heart`,
`intestine`, `kidneys`, `liver`, `lungs`, `pancreas`, `skin` :

```bash
npm run anatomie:blender -- --structure=heart
```

Le script écrit alors une provenance Z-Anatomy vérifiée à la place de la mention
héritée. La question juridique disparaît au lieu d'être documentée.

---

## Si tu veux quand même le faire à la main

Blender ▸ ouvrir le `.blend` ▸ chercher le **nom latin** dans l'_Outliner_ ▸
activer l'œil **et** l'icône écran sur l'objet et **toutes** ses collections
parentes ▸ sélectionner ▸ `Fichier ▸ Exporter ▸ glTF 2.0` avec _Selected
Objects_, sans caméras ni lumières, `+Y up`, Draco désactivé ▸ enregistrer sous
**l'identifiant** de la taxonomie (`crane-entier.glb`), pas sous le nom latin.

C'est exactement ce que fait la commande, en une seule fois.
